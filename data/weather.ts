import { News } from "./news";

// OpenWeatherMap API 설정
const API_KEY = process.env.WEATHER_API_KEY || '';
const CITY = 'Busan';
const CURRENT_API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric&lang=kr`;
const FORECAST_API_URL = `https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric&lang=kr`;

// 현재 날씨 정보를 가져오는 함수
async function fetchWeatherData(): Promise<WeatherData> {
  const response = await fetch(CURRENT_API_URL, { next: { revalidate: 1800 } });

  if (!response.ok) {
    throw new Error('날씨 정보를 가져오지 못했습니다.');
  }

  return response.json();
}

// 초단기 예보를 가져오는 함수
async function fetchHourlyForecast(): Promise<HourlyForecastData> {
  const response = await fetch(FORECAST_API_URL, { next: { revalidate: 1800 } });

  if (!response.ok) {
    throw new Error('예보 정보를 가져오지 못했습니다.');
  }

  return response.json();
}

// OpenWeatherMap 현재 날씨 API 응답 타입
type WeatherData = {
  weather: Array<{
    main: string;
    description: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  name: string;
};

// OpenWeatherMap 예보 API 응답 타입
type HourlyForecastData = {
  list: Array<{
    dt: number;
    main: {
      temp: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
    dt_txt: string;
  }>;
};

// 날씨 한글 변환 맵
const weatherTranslation: Record<string, string> = {
  Clear: '맑음',
  Clouds: '흐림',
  Rain: '비',
  Drizzle: '이슬비',
  Thunderstorm: '뇌우',
  Snow: '눈',
  Mist: '안개',
  Fog: '짙은 안개',
  Haze: '연무',
};

// 풍향 한글 변환
const getWindDirection = (deg: number): string => {
  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  return directions[Math.round(deg / 45) % 8];
};

// 날씨 데이터를 News 형식으로 변환
async function weatherDataToNews(): Promise<News[]> {
  try {
    const data = await fetchWeatherData();

    const weatherDesc = data.weather[0].main;
    const weatherKorean = weatherTranslation[weatherDesc] || weatherDesc;
    const detailDesc = data.weather[0].description;

    const headline = `${data.name} | ${weatherKorean} | ${Math.round(data.main.temp)}°C`;

    const body = `체감 : ${Math.round(data.main.feels_like)}°C | 습도 : ${data.main.humidity}% | 바람 ${getWindDirection(data.wind.deg)} ${data.wind.speed}m/s`;

    return [
      {
        id: 301,
        category: "weather",
        label: "날씨",
        headline,
        body,
        source: "OpenWeatherMap",
        live: false,
        link: "/weather",
      },
    ];
  } catch (error) {
    return [
      {
        id: 301,
        category: "weather",
        label: "날씨",
        headline: "날씨 정보를 불러올 수 없습니다",
        body: "날씨 API 연결에 실패했습니다. 잠시 후 다시 시도해주세요.",
        source: "OpenWeatherMap",
        live: false,
        link: "/weather",
      },
    ];
  }
}

// 현재 날씨 내보내기 (홈용)
export const weatherNews = await weatherDataToNews();

// ========== 날씨 페이지용 데이터 ==========

// 현재 날씨 전체 정보
export const currentWeather = await fetchWeatherData().catch(() => null);

// 오늘 초단기 예보 (오늘 00시~23시만 필터링, 3시간 간격)
export const todayForecast = await fetchHourlyForecast()
  .then((data) => {
    const today = new Date().toISOString().split('T')[0];

    return data.list
      .filter((item) => item.dt_txt.startsWith(today))
      .map((item) => ({
        time: item.dt_txt.split(' ')[1].substring(0, 5), // HH:MM
        temp: Math.round(item.main.temp),
        weather: weatherTranslation[item.weather[0].main] || item.weather[0].main,
        icon: item.weather[0].main,
      }));
  })
  .catch(() => []);

// 오늘 낮/밤 날씨만 (낮: 12시, 밤: 21시)
export const dayNightForecast = await fetchHourlyForecast()
  .then((data) => {
    const today = new Date().toISOString().split('T')[0];

    const forecastList = data.list
      .filter((item) => item.dt_txt.startsWith(today))
      .map((item) => ({
        time: item.dt_txt.split(' ')[1].substring(0, 5),
        temp: Math.round(item.main.temp),
        weather: weatherTranslation[item.weather[0].main] || item.weather[0].main,
      }));

    // 낮(12시) 찾기, 없으면 가장 가까운 낮 시간
    const day = forecastList.find(f => f.time === '12:00') ||
                 forecastList.find(f => f.time.startsWith('1')) ||
                 forecastList.find(f => f.time.startsWith('0') && parseInt(f.time) < 12);

    // 밤(21시) 찾기, 없으면 가장 가까운 밤 시간
    const night = forecastList.find(f => f.time === '21:00') ||
                  forecastList.find(f => parseInt(f.time) >= 18);

    return { day: day || null, night: night || null };
  })
  .catch(() => ({ day: null, night: null }));

// 풍향 함수도 내보내기 (페이지에서 사용)
export { getWindDirection, weatherTranslation };