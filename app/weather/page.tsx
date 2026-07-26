import { currentWeather, dayNightForecast, getWindDirection, weatherTranslation } from "@/data/weather";

export default function WeatherPage() {
    // null 방지
    if (!currentWeather) {
        return(
            <div className="board">
                <p>날씨 정보를 불러올 수 없습니다.</p>
            </div>
        );
    }
        // 날씨 카드 확장 버전
        return(
            <div className="board">

                <div className="item weather-expanded" data-cat="weather">
                    <div className="item-body">
                        <div className="tag-row">
                            <span className="tag">날씨</span>
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
                    </div>
                </div>
            </div>
        );
    };