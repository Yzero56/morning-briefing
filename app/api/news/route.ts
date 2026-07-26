import { NextResponse } from "next/server";
import { fetchSocialNewsItem } from "@/lib/socialNews";

// 네이버 뉴스 검색 + 필터링 로직은 lib/socialNews.ts 의 fetchSocialNewsItem() 에 있다.
// 이 라우트는 직접 /api/news 를 부르는 호출자가 있을 경우를 대비해 남겨둠.
export async function GET() {
  const item = await fetchSocialNewsItem();
  return NextResponse.json(item);
}
