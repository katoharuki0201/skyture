import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import fetchWeather, { getWeatherText } from '../lib/fetchWeather'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const weather = useQuery({
    queryKey: ['current-weather'],
    queryFn: fetchWeather,
    retry: false,
  })

  return (
    <main className="weather-page">
      <section className="weather-card" aria-labelledby="weather-title">
        <p className="weather-eyebrow">SKYTURE · LOCAL WEATHER</p>
        <h1 id="weather-title">現在地の天気</h1>
        <p className="weather-intro">位置情報を使って、現在の空模様をお知らせします。</p>

        {weather.isPending && <p role="status" className="weather-message">位置情報と天気を取得しています…</p>}

        {weather.isError && (
          <div className="weather-error" role="alert">
            <p>{weather.error instanceof Error ? weather.error.message : '天気情報を取得できませんでした。'}</p>
            <button type="button" onClick={() => void weather.refetch()}>もう一度試す</button>
          </div>
        )}

        {weather.data && (
          <div className="weather-result" aria-live="polite">
            <p className="weather-condition">{getWeatherText(weather.data.weatherCode)}</p>
            <p className="weather-temperature">{Math.round(weather.data.temperature)}<span>°C</span></p>
            <dl className="weather-details">
              <div><dt>体感温度</dt><dd>{Math.round(weather.data.feelsLike)}°C</dd></div>
              <div><dt>湿度</dt><dd>{weather.data.humidity}%</dd></div>
              <div><dt>風速</dt><dd>{weather.data.windSpeed} km/h</dd></div>
            </dl>
            <button type="button" className="refresh-button" onClick={() => void weather.refetch()}>更新する</button>
          </div>
        )}
        <p className="weather-credit">天気データ: Open-Meteo</p>
      </section>
    </main>
  )
}
