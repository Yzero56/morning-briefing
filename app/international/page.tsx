// app/international/page.tsx
import Link from "next/link";
import NewsCard from "@/components/NewsCard";
import { internationalNews as fallbackNews } from "@/data/international";
import { fetchInternationalNews } from "@/lib/naverNews";

export default async function InternationalPage() {
  const now = new Date();
  const dateTag = now
    .toLocaleDateString("en-CA")   // 2026-07-26 형태
    .replace(/-/g, ".");           // 2026.07.26
  const weekday = now
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();                // SUN

  let news = fallbackNews;
  let isLive = false;
  try {
    news = await fetchInternationalNews(3);
    isLive = true;
  } catch (err) {
    console.error("[international] live fetch failed, using fallback data:", err);
  }

  return (
    <div className="board">
      <Link href="/" className="back-link">← 홈으로</Link>
      <header>
        <div>
          <div className="date-tag">{dateTag} {weekday}</div>
          <h1>국제 브리프</h1>
        </div>
        <div className="count">
          국제 헤드라인<b>{String(news.length).padStart(2, "0")}</b>
        </div>
      </header>

      <p className="sub">
        오늘 세계는 이렇게 돌아가고 있어요. 출근길 3분, 꼭 알아야 할 국제 소식만 골랐습니다.
      </p>

      {!isLive && (
        <p style={{ fontSize: 12, color: "var(--paper-dim)", marginBottom: 20 }}>
          ⚠ 실시간 뉴스를 불러오지 못해 예시 데이터를 표시하고 있어요. (.env.local에 NAVER_CLIENT_ID/SECRET을 설정하면 실제 뉴스로 채워집니다)
        </p>
      )}

      {news.map((item, i) => (
        <NewsCard key={item.id} news={item} index={i + 1} />
      ))}

      <footer>
        <span>업데이트: {dateTag} 기준</span>
        <span>내용은 요약이며, 자세한 내용은 각 언론사 원문을 참고하세요.</span>
      </footer>
    </div>
  );
}
