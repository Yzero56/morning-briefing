// data/news.ts
export type Category = "society" | "world" | "weather";

export type News = {
  id: number;
  category: Category;
  label: string;      // 화면에 보일 한글 태그 (사회·국제·날씨)
  headline: string;
  body: string;
  source: string;
  live: boolean;      // 진행중 여부
  link: string;       // 클릭 시 이동할 주소
  image?: string;     // 썸네일 이미지 URL (없을 수 있음)
};


// 각 카테고리 데이터를 불러와서
import { internationalNews } from "./international";
import { socialNews, getSocialNews } from "./social";
import { weatherNews } from "./weather";
import { fetchInternationalNews, pickMostUrgent } from "@/lib/naverNews";

// 홈용: 각 카테고리에서 대표 1건씩 모음
// 국제 파트는 실시간 뉴스 중 "진행중" 표시가 붙은(=가장 긴급한) 기사를 우선 노출하고,
// API 호출이 실패하면 예시 데이터의 첫 번째 기사로 대체함
export async function getTodayNews(): Promise<News[]> {
  let socialPick = socialNews[0];
  try {
    const liveSocial = await getSocialNews();
    if (liveSocial[0]) {
      // 홈 카드는 상세 페이지(/social)로 연결. 원문 링크는 /social 안에서만 사용.
      socialPick = { ...liveSocial[0], link: "/social" };
    }
  } catch (err) {
    console.error("[home] social live fetch failed, using fallback:", err);
  }
  
  let internationalPick = internationalNews[0];
  try {
    const liveInternational = await fetchInternationalNews(3);
    // 홈 카드는 (사회·날씨와 동일하게) 항상 국제 상세 페이지로 연결되어야 함.
    // 기사 원문 링크는 /international 안에서만 쓰고, 홈에서는 라우트로 덮어씀.
    internationalPick = { ...pickMostUrgent(liveInternational), link: "/international" };
  } catch (err) {
    console.error("[home] international live fetch failed, using fallback:", err);
  }

  return [socialPick, internationalPick, weatherNews[0]];
}