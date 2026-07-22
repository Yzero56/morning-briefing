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

// 홈용: 각 카테고리에서 "맨 앞 1개씩"만 뽑아 모음
export const todayNews: News[] = [
  socialNews[0],
  internationalNews[0],
  weatherNews[0],
];