import getLocation from "./getLocation";

interface WeatherResponse {
  current_weather: {
    weathercode: number;
  };
}

// WMO天候コードを日本語に変換する関数
function getWeatherText(code: number): string {
  if (code === 0) return "快晴";
  if (code <= 3) return "晴れ・薄曇り";
  if (code <= 49) return "霧";
  if (code <= 69) return "雨";
  if (code <= 79) return "雪";
  if (code <= 99) return "雷雨";
  return "不明";
}

/**
 * 現在地の天候を取得して出力する
 */
async function fetchWeather(): Promise<void> {
  try {
    const { latitude, longitude } = await getLocation();

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }

    const data: WeatherResponse = await response.json();
    const code = data.current_weather.weathercode;

    console.log(`現在の天候: ${getWeatherText(code)} (コード: ${code})`);
  } catch (error) {
    console.error("取得エラー:", error);
  }
}

export default fetchWeather;
