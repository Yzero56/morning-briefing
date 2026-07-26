// lib/socialNews.ts
// app/api/news/route.ts 에 있던 네이버 fetch + 필터링 로직을 함수로 추출.
// getSocialNews()와 API 라우트 모두 이 함수를 직접 호출한다.
// (이전에는 getSocialNews()가 http://localhost:3000/api/news 로 자기 서버에 HTTP 요청을 보냈기 때문에
//  Vercel 등 배포 환경에서 localhost 가 존재하지 않아 사회 뉴스가 뜨지 않았다.)
import type { News } from "@/data/news";

const priorityDomains = [
  "yna.co.kr",      // 연합뉴스
  "newsis.com",     // 뉴시스
  "news1.kr",       // 뉴스1
  "kbs.co.kr",      // KBS
  "imbc.com",       // MBC
  "sbs.co.kr",      // SBS
  "ytn.co.kr",      // YTN
  "jtbc.co.kr",     // JTBC
  "joongang.co.kr", // 중앙일보
  "chosun.com",     // 조선일보
  "donga.com",      // 동아일보
  "hani.co.kr",     // 한겨레
  "khan.co.kr",     // 경향신문
];

// 검색할 분야
const queries = [
  "정치",
  "사회",
  "경제",
  "국제",
];

// 제외할 기사
const excludeKeywords = [
  // 기업 홍보
  "출시",
  "론칭",
  "브랜드",
  "신제품",
  "업무협약",
  "협약",
  "MOU",
  "출범",
  "준공",
  "개관",
  "창립",
  "오픈",
  "투자 유치",
  "IR",

  // 행사
  "행사",
  "축제",
  "박람회",
  "포럼",
  "세미나",
  "전시",
  "공연",
  "콘서트",
  "시상식",

  // 지역 소식
  "구청",
  "군청",
  "시청",
  "주민센터",
  "마을",

  // 학교
  "대학교",
  "대학원",

  // 홍보
  "후원",
  "기부",
  "캠페인",
  "봉사",

  // 채용
  "채용",
  "모집",
];

// 포함할 키워드
const includeKeywords = [
  "대통령",
  "정부",
  "국회",
  "장관",
  "선거",
  "법안",

  "사고",
  "화재",
  "경찰",
  "검찰",
  "법원",
  "재판",
  "수사",
  "구속",
  "실종",
  "사망",
  "범죄",
  "폭행",
  "살인",
  "산불",
  "폭우",
  "태풍",

  "물가",
  "금리",
  "환율",
  "주가",
  "증시",
  "코스피",
  "한국은행",
  "수출",
  "관세",

  "미국",
  "중국",
  "일본",
  "러시아",
  "우크라이나",
  "이스라엘",
  "가자",
  "EU",
  "UN",
  "정상회담",
];

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

const clean = (text: string) => text.replace(/<[^>]*>/g, "");

// 네이버 뉴스 검색으로 사회 대표 기사 1건을 가져와 News 타입으로 변환
export async function fetchSocialNewsItem(): Promise<News> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다. .env.example을 참고해 .env.local을 만들어주세요."
    );
  }

  const requests = queries.map((query) =>
    fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
        query
      )}&display=25&sort=date`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
        cache: "no-store",
      }
    )
  );

  const responses = await Promise.all(requests);

  const results = await Promise.all(
    responses.map((r) => r.json() as Promise<NaverNewsResponse>)
  );

  // 기사 합치기
  const allNews: NaverNewsItem[] = results.flatMap((r) => r.items);

  // 중복 제거(originallink 기준)
  const uniqueNews = allNews.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (n) => n.originallink === item.originallink
      )
  );

  // 필터링
  const filteredNews = uniqueNews.filter((item) => {
    const text =
      clean(item.title) +
      " " +
      clean(item.description);

    // 제외 키워드
    if (
      excludeKeywords.some((keyword) =>
        text.includes(keyword)
      )
    ) {
      return false;
    }

    // 포함 키워드
    return includeKeywords.some((keyword) =>
      text.includes(keyword)
    );
  });

  // 언론사 우선순위
  filteredNews.sort((a, b) => {
    const aScore = priorityDomains.findIndex((domain) =>
      a.originallink.includes(domain)
    );

    const bScore = priorityDomains.findIndex((domain) =>
      b.originallink.includes(domain)
    );

    return (
      (aScore === -1 ? 999 : aScore) -
      (bScore === -1 ? 999 : bScore)
    );
  });

  const item = filteredNews[0] ?? uniqueNews[0];

  if (!item) {
    throw new Error("네이버 뉴스 API에서 가져온 기사가 없습니다.");
  }

  return {
    id: 201,
    category: "society",
    label: "사회",
    headline: clean(item.title) || "제목 없음",
    body: clean(item.description) || "내용 없음",
    source: "네이버 뉴스",
    live: true,
    link: item.originallink ?? item.link ?? "#",
  };
}
