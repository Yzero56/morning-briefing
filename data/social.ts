import { News } from "./news";
import { fetchSocialNewsItem } from "@/lib/socialNews";


// 홈 화면용 기본 데이터(placeholder). getTodayNews()에서 실시간 fetch가 실패했을 때 fallback으로 사용.
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


// 실시간 사회 뉴스 1건을 가져온다.
// 이전에는 http://localhost:3000/api/news 로 자기 서버에 HTTP 요청을 보냈으나,
// Vercel 등 배포 환경에서 localhost 가 존재하지 않아 실패하므로 lib/socialNews.ts 의 함수를 직접 호출한다.
export async function getSocialNews(): Promise<News[]> {
  const social = await fetchSocialNewsItem();
  return [social];
}