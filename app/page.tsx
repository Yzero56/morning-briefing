// app/page.tsx
import NewsCard from "@/components/NewsCard";
import { todayNews } from "@/data/news";
import { currentWeather, dayNightForecast, getWindDirection, weatherTranslation } from "@/data/weather";
import Link from "next/link";

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

      {todayNews.map((news, i) =>
        news.category === "weather" && currentWeather ? (
          // 날씨 카드 확장 버전
          <Link href={news.link} key={news.id} className="item weather-expanded" data-cat={news.category}>
            <div className="idx">{String(i + 1).padStart(2, "0")}</div>
            <div className="item-body">
              <div className="tag-row">
                <span className="tag">{news.label}</span>
              </div>

              <h2>{currentWeather.name} | {weatherTranslation[currentWeather.weather[0].main]} | {Math.round(currentWeather.main.temp)}°C</h2>

              <div style={{ marginBottom: "16px" }}></div>

              <div className="weather-detail-info">
                체감 {Math.round(currentWeather.main.feels_like)}°C | 습도 {currentWeather.main.humidity}% | 바람 {getWindDirection(currentWeather.wind.deg)} {currentWeather.wind.speed}m/s
              </div>

              <div style={{ marginBottom: "12px" }}></div>

              <div className="weather-forecast-inline">
                {dayNightForecast.day && (
                  <div className="forecast-row">
                    <span>🌞 낮  {dayNightForecast.day.temp}°C | {dayNightForecast.day.weather}</span>
                  </div>
                )}
                {dayNightForecast.night && (
                  <div className="forecast-row">
                    <span>🌙 밤  {dayNightForecast.night.temp}°C | {dayNightForecast.night.weather}</span>
                  </div>
                )}
              </div>

              <div className="meta">SOURCE: {news.source}</div>
            </div>
          </Link>
        ) : (
          // 기본 카드
          <NewsCard key={news.id} news={news} index={i + 1} />
        )
      )}

      <footer>
        <span>업데이트: {dateTag} 기준</span>
        <span>내용은 요약이며, 자세한 내용은 각 언론사 원문을 참고하세요.</span>
      </footer>
    </div>
  );
}