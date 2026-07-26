import { News } from "./news";


// 홈 화면용 기본 데이터 유지
// data/news.ts에서 필요로 함
export const socialNews: News[] = [
  {
    id: 201,
    category: "society",
    label: "사회",
    headline: "사회 뉴스 불러오는 중",
    body: "네이버 뉴스 API에서 최신 사회 뉴스를 가져옵니다.",
    source: "네이버 뉴스",
    live: false,
    link: "/social",
  },
];


// 실제 API 연결 함수
export async function getSocialNews(): Promise<News[]> {

  const response = await fetch(
    "http://localhost:3000/api/news",
    {
      cache: "no-store",
    }
  );


  const item = await response.json();


  const social: News = {

    id: 201,

    category: "society",

    label: "사회",

    headline:
      item.title?.replace(/<[^>]*>/g, "")
      ?? "제목 없음",


    body:
      item.description?.replace(/<[^>]*>/g, "")
      ?? "내용 없음",


    source:
      "네이버 뉴스",


    live:
      true,


    link:
      item.originallink
      ?? item.link
      ?? "#",

  };


  return [social];

}