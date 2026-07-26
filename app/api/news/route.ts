import { NextResponse } from "next/server";

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

export async function GET() {
  const requests = queries.map((query) =>
    fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
        query
      )}&display=25&sort=date`,
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID!,
          "X-Naver-Client-Secret":
            process.env.NAVER_CLIENT_SECRET!,
        },
        cache: "no-store",
      }
    )
  );

  const responses = await Promise.all(requests);

  const results = await Promise.all(
    responses.map((r) => r.json())
  );

  // 기사 합치기
  const allNews = results.flatMap((r) => r.items);

  const clean = (text: string) =>
    text.replace(/<[^>]*>/g, "");

  // 중복 제거(originallink 기준)
  const uniqueNews = allNews.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (n) => n.originallink === item.originallink
      )
  );

  // 필터링
  const filteredNews = uniqueNews.filter((item: any) => {
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
  filteredNews.sort((a: any, b: any) => {
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

  const result =
    filteredNews[0] ??
    uniqueNews[0];

  return NextResponse.json(result);
}