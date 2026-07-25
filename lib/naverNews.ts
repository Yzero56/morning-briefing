// lib/naverNews.ts
import type { News } from "@/data/news";

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

// 네이버 뉴스 검색 API로 국제 뉴스를 가져와 공통 News 타입으로 변환
export async function fetchInternationalNews(count = 3): Promise<News[]> {
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

  const res = await fetch(
    `https://openapi.naver.com/v1/search/news.json?${params.toString()}`,
    {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      next: { revalidate: 600 }, // 10분마다 갱신
    }
  );

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

  return filtered.map(({ item, link }, i) => ({
    id: 100 + i,
    category: "world",
    label: "국제",
    headline: decodeEntities(item.title),
    body: decodeEntities(item.description),
    source: sourceFromUrl(link),
    live: isOngoing(item.title),
    link,
  }));
}

// 홈 화면에 띄울 대표 기사 하나를 고름: 진행중(live) 표시가 붙은 기사 중 가장 앞선 것 우선, 없으면 최상위(가장 관련도 높은) 기사
export function pickMostUrgent(newsList: News[]): News {
  return newsList.find((n) => n.live) ?? newsList[0];
}
