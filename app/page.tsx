// app/page.tsx
import NewsCard from "@/components/NewsCard";
import { todayNews } from "@/data/news";

export default function Home() {
  const now = new Date();
  const dateTag = now
    .toLocaleDateString("en-CA")   // 2026-07-19 형태
    .replace(/-/g, ".");           // 2026.07.19
  const weekday = now
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();                // SUN

  return (
    <div className="board">
      <header>
        <div>
          <div className="date-tag">{dateTag} {weekday}</div>
          <h1>모닝 브리프</h1>
        </div>
        <div className="count">
          오늘의 헤드라인<b>{String(todayNews.length).padStart(2, "0")}</b>
        </div>
      </header>

      <p className="sub">
        출근길 3분, 이 세 가지만 알아도 충분해요. 오늘 꼭 알아야 할 사회·국제·날씨 소식만 골랐습니다.
      </p>

      {todayNews.map((news, i) => (
        <NewsCard key={news.id} news={news} index={i + 1} />
      ))}

      <footer>
        <span>업데이트: {dateTag} 기준</span>
        <span>내용은 요약이며, 자세한 내용은 각 언론사 원문을 참고하세요.</span>
      </footer>
    </div>
  );
}