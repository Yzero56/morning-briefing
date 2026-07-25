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
};


// 각 카테고리 데이터를 불러와서
import { internationalNews } from "./international";
import { socialNews } from "./social";
import { weatherNews } from "./weather";
import { fetchInternationalNews, pickMostUrgent } from "@/lib/naverNews";

// 홈용: 각 카테고리에서 대표 1건씩 모음
// 국제 파트는 실시간 뉴스 중 "진행중" 표시가 붙은(=가장 긴급한) 기사를 우선 노출하고,
// API 호출이 실패하면 예시 데이터의 첫 번째 기사로 대체함
export async function getTodayNews(): Promise<News[]> {
  let internationalPick = internationalNews[0];
  try {
    const liveInternational = await fetchInternationalNews(3);
    internationalPick = pickMostUrgent(liveInternational);
  } catch (err) {
    console.error("[home] international live fetch failed, using fallback:", err);
  }

  return [socialNews[0], internationalPick, weatherNews[0]];
}