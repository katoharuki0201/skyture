// fetchWeather.ts

export interface WeatherResponse {
    current: {
    weather_code: number;
    time: string;
    is_day: number;
};
    daily: {
    sunrise: string[];
    sunset: string[];
    };
}

/**
 * 緯度・経度を受け取り、Open-Meteoから天気・日の出・日の入り情報を取得する
 */
export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherResponse> {
  // Open-MeteoのAPIエンドポイント（currentとdailyに必要パラメーターを指定）　
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code,time,is_day&daily=sunrise,sunset&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
    throw new Error(`天気の取得に失敗しました: ${response.statusText}`);
    }

    const data = await response.json();

    return {
    current: {
        weather_code: data.current.weather_code,
        time: data.current.time,
        is_day: data.current.is_day,
    },
    daily: {
        sunrise: data.daily.sunrise,
    sunset: data.daily.sunset,
    },
};
}
