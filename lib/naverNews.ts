// lib/naverNews.ts
import { unstable_cache } from "next/cache";
import type { News } from "@/data/news";
import { summarizeArticlesWithAI, type ArticleSummary } from "./claudeSummarize";

type NaverNewsItem = {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
};

type NaverNewsResponse = {
  items: NaverNewsItem[];
};

function decodeEntities(text: string): string {
  return text
    .replace(/<b>|<\/b>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function sourceFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "출처 미상";
  }
}

// "국제 뉴스"라는 검색어에 우연히 걸리지만 실제 해외/국제정세 소식은 아닌 기사를 걸러내기 위한 필터
const NOISE_PATTERNS = [
  /국제업무지구/,
  /멸종위기종/,
  /국제(운전면허|결혼|전화|택배|학교|공인|인증)/,
];
const NOISE_HOSTNAMES = ["gukjenews.com"]; // 언론사명 자체가 "국제뉴스"라 키워드 매칭에 항상 걸리는 매체

function isNoise(headline: string, hostname: string): boolean {
  if (NOISE_HOSTNAMES.includes(hostname)) return true;
  return NOISE_PATTERNS.some((p) => p.test(headline));
}

// 제목에 "계속 진행 중인 이슈"임을 암시하는 단어가 있으면 진행중 배지를 붙임 (완벽하지 않은 휴리스틱)
const ONGOING_PATTERNS = [
  /속보/,
  /긴급/,
  /계속/,
  /이어지/,
  /잇따라/,
  /격화/,
  /확산/,
  /재개/,
];

function isOngoing(headline: string): boolean {
  return ONGOING_PATTERNS.some((p) => p.test(headline));
}

function matchMetaContent(html: string, key: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, "i"),
  ];
  for (const p of patterns) {
    const match = html.match(p);
    if (match) return match[1];
  }
  return undefined;
}

type ArticleMeta = { image?: string; description?: string };

// 네이버 뉴스 검색 API는 썸네일·제대로 된 요약을 안 주기 때문에, 기사 원문 페이지의
// og:image / og:description(또는 description) 메타태그를 대신 긁어옴
async function fetchArticleMeta(articleUrl: string): Promise<ArticleMeta> {
  try {
    const res = await fetch(articleUrl, {
      signal: AbortSignal.timeout(3000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MorningBriefBot/1.0)",
      },
    });
    if (!res.ok) return {};

    const html = await res.text();
    const image = matchMetaContent(html, "og:image");
    const description =
      matchMetaContent(html, "og:description") ?? matchMetaContent(html, "description");

    return {
      image: image ? new URL(image, articleUrl).toString() : undefined,
      description,
    };
  } catch {
    return {}; // 스크래핑 실패 시 이미지/요약 없이 진행 (치명적이지 않음)
  }
}

// 크레딧([사진 출처: ...], [영상취재 ...])이나 해시태그처럼 요약에 불필요한 군더더기 제거
function cleanText(text: string): string {
  return decodeEntities(text)
    .replace(/\[[^\]]*\]/g, "")
    .replace(/#\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 헤드라인에서 조사·기호를 뺀 핵심 단어 후보를 뽑음 (형태소 분석기 없이 간단하게)
function extractKeywords(headline: string): string[] {
  return headline
    .replace(/[“”"'‘’…·,.\[\]()]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

// 문장이 헤드라인과 얼마나 관련 있는지, 정보 밀도가 높은지(숫자 포함, 적당한 길이) 점수로 매김
function scoreSentence(sentence: string, keywords: string[], position: number): number {
  let score = 0;
  for (const kw of keywords) {
    if (sentence.includes(kw)) score += 2;
  }
  if (/\d/.test(sentence)) score += 1; // 날짜·수치 등 구체적 정보 포함 시 가산점
  if (sentence.length >= 20 && sentence.length <= 90) score += 1; // 너무 짧은 파편/너무 긴 문장 배제
  if (position === 0) score += 1; // 리드 문단(첫 문장) 약간 우대
  return score;
}

// 문장 단위로 쪼갠 뒤 헤드라인과 가장 관련 있는 1~2문장만 골라 핵심 위주로 재구성
// (AI 요약은 아니지만, 단순히 앞에서부터 자르는 것보다 실제 핵심에 가까운 문장을 고름)
function summarize(raw: string, headline: string, maxSentences = 2, maxLength = 170): string {
  const cleaned = cleanText(raw);
  const allSentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (allSentences.length === 0) return cleaned.slice(0, maxLength);

  // 원문(og:description 등)이 마침표 없이 중간에 잘려서 끝나는 경우가 있어서,
  // 마침표로 제대로 끝나지 않는 문장 조각은 후보에서 제외 (전부 그렇다면 안전망으로 원본 사용)
  const properSentences = allSentences.filter((s) => /[.!?]$/.test(s.trim()) && s.trim().length >= 10);
  const sentences = properSentences.length > 0 ? properSentences : allSentences;

  const keywords = extractKeywords(headline);
  const ranked = sentences
    .map((sentence, position) => ({ sentence, position, score: scoreSentence(sentence, keywords, position) }))
    .sort((a, b) => b.score - a.score);

  // 가장 중요한 문장은 길이와 상관없이 무조건 포함하고, 추가 문장은 글자수 한도 안에 들어갈 때만 붙임
  // (안 그러면 점수만 보고 고른 두 번째 문장이 길어서 어색하게 중간에 잘릴 수 있음)
  const chosen: typeof ranked = [];
  let length = 0;
  for (const candidate of ranked) {
    if (chosen.length >= maxSentences) break;
    const extra = candidate.sentence.length + (chosen.length > 0 ? 1 : 0);
    if (chosen.length > 0 && length + extra > maxLength) continue;
    chosen.push(candidate);
    length += extra;
  }

  const result = chosen
    .sort((a, b) => a.position - b.position) // 원문 순서로 되돌려 자연스럽게 읽히도록
    .map((s) => s.sentence)
    .join(" ")
    .trim();

  if (result.length <= maxLength) return result;
  return result.slice(0, maxLength).trim() + "…"; // 문장 하나조차 한도를 넘는 경우의 안전망
}

// 네이버 뉴스 검색 API로 국제 뉴스를 가져와 공통 News 타입으로 변환
async function fetchInternationalNewsUncached(count = 3): Promise<News[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다. .env.example을 참고해 .env.local을 만들어주세요."
    );
  }

  // 관련도(sim) 정렬 + 여유 있게 더 가져온 뒤 노이즈를 걸러내 count개만 사용
  const fetchCount = count * 4;
  const params = new URLSearchParams({
    query: "국제 뉴스",
    display: String(fetchCount),
    sort: "sim",
  });

  let res: Response;
  try {
    res = await fetch(
      `https://openapi.naver.com/v1/search/news.json?${params.toString()}`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
        next: { revalidate: 600 }, // 10분마다 갱신
        signal: AbortSignal.timeout(5000), // 5초 안에 응답 없으면 포기하고 폴백
      }
    );
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error("네이버 뉴스 API 응답이 5초 내에 오지 않아 요청을 중단했습니다.");
    }
    throw err;
  }

  if (!res.ok) {
    throw new Error(`네이버 뉴스 API 요청 실패 (status ${res.status})`);
  }

  const data: NaverNewsResponse = await res.json();

  const filtered = data.items
    .map((item) => ({ item, link: item.originallink || item.link }))
    .filter(
      ({ item, link }) => !isNoise(item.title, sourceFromUrl(link))
    )
    .slice(0, count);

  const metas = await Promise.all(filtered.map(({ link }) => fetchArticleMeta(link)));

  const articleInputs = filtered.map(({ item }, i) => {
    const meta = metas[i];
    const headline = decodeEntities(item.title);
    // 언론사가 직접 쓴 요약(og:description)이 있으면 그걸, 없으면 네이버 스니펫을 정리해서 사용
    const bodySource = meta.description && meta.description.length > 15
      ? meta.description
      : item.description;
    return { headline, bodySource };
  });

  // 기사 전체를 한 번의 API 호출로 묶어서 제목·요약을 함께 AI로 재작성 (비용 절감). 실패 시 원문 제목 + 무료 추출 요약으로 대체
  let aiResults: ArticleSummary[] | null = null;
  try {
    aiResults = await summarizeArticlesWithAI(
      articleInputs.map((a) => ({ headline: a.headline, body: cleanText(a.bodySource) }))
    );
  } catch (err) {
    console.error("[international] AI 요약 실패, 추출 요약으로 대체:", err);
  }

  return filtered.map(({ item, link }, i) => {
    const meta = metas[i];
    const { headline: originalHeadline, bodySource } = articleInputs[i];
    const headline = aiResults?.[i]?.headline ?? originalHeadline;
    const body = aiResults?.[i]?.summary ?? summarize(bodySource, originalHeadline);

    return {
      id: 100 + i,
      category: "world",
      label: "국제",
      headline,
      body,
      source: sourceFromUrl(link),
      live: isOngoing(item.title), // 진행중 판단은 항상 원문 제목 기준
      image: meta.image,
      link,
    };
  });
}

// 10분 캐시로 감싸서, 방문자가 아무리 많아도 네이버 조회·AI 요약 호출은 10분에 한 번만 실행되도록 함
export const fetchInternationalNews = unstable_cache(
  fetchInternationalNewsUncached,
  ["international-news"],
  { revalidate: 600 }
);

// 홈 화면에 띄울 대표 기사 하나를 고름: 진행중(live) 표시가 붙은 기사 중 가장 앞선 것 우선, 없으면 최상위(가장 관련도 높은) 기사
export function pickMostUrgent(newsList: News[]): News {
  return newsList.find((n) => n.live) ?? newsList[0];
}
