import getLocation from './getLocation'

type WeatherResponse = {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    weather_code: number
    wind_speed_10m: number
  }
}

export type CurrentWeather = {
  temperature: number
  feelsLike: number
  humidity: number
  weatherCode: number
  windSpeed: number
}

export function getWeatherText(code: number): string {
  if (code === 0) return '快晴'
  if (code <= 3) return '晴れ・曇り'
  if (code <= 48) return '霧'
  if (code <= 57) return '霧雨'
  if (code <= 67) return '雨'
  if (code <= 77) return '雪'
  if (code <= 82) return 'にわか雨'
  if (code <= 86) return 'にわか雪'
  if (code <= 99) return '雷雨'
  return '不明'
}

export default async function fetchWeather(): Promise<CurrentWeather> {
  const { latitude, longitude } = await getLocation()
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)

  if (!response.ok) {
    throw new Error(`天気情報を取得できませんでした (HTTP ${response.status})`)
  }

  const data: WeatherResponse = await response.json()
  if (!data.current || typeof data.current.weather_code !== 'number') {
    throw new Error('天気情報の形式が正しくありません')
  }

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    weatherCode: data.current.weather_code,
    windSpeed: data.current.wind_speed_10m,
  }
}
