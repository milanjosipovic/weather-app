import { useEffect, useMemo, useState } from 'react'
import './App.css'

type WeatherLocation = {
  name: string
  admin1?: string
  country: string
  latitude: number
  longitude: number
}

type ForecastResponse = {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    precipitation: number
    wind_speed_10m: number
    weather_code: number
    is_day: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
    precipitation_sum: number[]
  }
}

const WEATHER_CODE_MAP: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky', icon: 'sunny' },
  1: { label: 'Mostly clear', icon: 'partly-cloudy' },
  2: { label: 'Partly cloudy', icon: 'partly-cloudy' },
  3: { label: 'Overcast', icon: 'cloudy' },
  45: { label: 'Foggy', icon: 'fog' },
  48: { label: 'Rime fog', icon: 'fog' },
  51: { label: 'Light drizzle', icon: 'rain' },
  53: { label: 'Drizzle', icon: 'rain' },
  55: { label: 'Dense drizzle', icon: 'rain' },
  56: { label: 'Freezing drizzle', icon: 'rain' },
  57: { label: 'Heavy freezing drizzle', icon: 'rain' },
  61: { label: 'Light rain', icon: 'rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  66: { label: 'Freezing rain', icon: 'rain' },
  67: { label: 'Heavy freezing rain', icon: 'rain' },
  71: { label: 'Light snow', icon: 'snow' },
  73: { label: 'Snow', icon: 'snow' },
  75: { label: 'Heavy snow', icon: 'snow' },
  77: { label: 'Snow grains', icon: 'snow' },
  80: { label: 'Rain showers', icon: 'rain' },
  81: { label: 'Heavy rain showers', icon: 'rain' },
  82: { label: 'Violent rain showers', icon: 'storm' },
  85: { label: 'Snow showers', icon: 'snow' },
  86: { label: 'Heavy snow showers', icon: 'snow' },
  95: { label: 'Thunderstorm', icon: 'storm' },
  96: { label: 'Thunderstorm with hail', icon: 'storm' },
  99: { label: 'Strong thunderstorm with hail', icon: 'storm' },
}

const defaultCity = 'Užice'
const defaultState = 'Srbija'

function CelsiusToFahrenheit(value: number) {
  return (value * 9) / 5 + 32
}

function WeatherIcon({ iconName }: { iconName: string }) {
  if (iconName === 'sunny') {
    return (
      <svg className="weather-svg-icon" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="11" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M32 8v8M32 48v8M8 32h8M48 32h8M15.5 15.5l5.5 5.5M43 43l5.5 5.5M15.5 48.5l5.5-5.5M43 21l5.5-5.5" />
        </g>
      </svg>
    )
  }

  if (iconName === 'cloudy') {
    return (
      <svg className="weather-svg-icon" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M18 44h23c8.5 0 14.6-6.1 14.6-14.1 0-7.6-5.8-13.6-13.2-14.1-.9-8.5-8.1-15-16.7-15-7.7 0-14.2 5.2-16.2 12.3C4.2 18.4 0 23.6 0 30.7c0 8.3 6.7 15 15 15Z" fill="currentColor" />
      </svg>
    )
  }

  if (iconName === 'partly-cloudy') {
    return (
      <svg className="weather-svg-icon" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="22" cy="22" r="9" fill="currentColor" opacity="0.9" />
        <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.9">
          <path d="M22 8v6M22 32v6M8 22h6M32 22h6M13 13l4 4M27 27l4 4M13 31l4-4M27 17l4-4" />
        </g>
        <path d="M19 48h23c8.5 0 14.6-6.1 14.6-14.1 0-7.6-5.8-13.6-13.2-14.1-.9-8.5-8.1-15-16.7-15-7.7 0-14.2 5.2-16.2 12.3C5.2 22.4 2 27.6 2 34.7c0 8.3 6.7 15 15 15Z" fill="currentColor" opacity="0.38" />
      </svg>
    )
  }

  if (iconName === 'fog') {
    return (
      <svg className="weather-svg-icon" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M18 44h23c8.5 0 14.6-6.1 14.6-14.1 0-7.6-5.8-13.6-13.2-14.1-.9-8.5-8.1-15-16.7-15-7.7 0-14.2 5.2-16.2 12.3C4.2 18.4 0 23.6 0 30.7c0 8.3 6.7 15 15 15Z" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M14 21h26M10 29h40M18 37h22M20 45h16" />
        </g>
      </svg>
    )
  }

  if (iconName === 'rain') {
    return (
      <svg className="weather-svg-icon" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M17 44h23c8.5 0 14.6-6.1 14.6-14.1 0-7.6-5.8-13.6-13.2-14.1-.9-8.5-8.1-15-16.7-15-7.7 0-14.2 5.2-16.2 12.3C3.2 18.4 0 23.6 0 30.7c0 8.3 6.7 15 15 15Z" fill="currentColor" />
        <g fill="currentColor">
          <circle cx="20" cy="48" r="2.5" />
          <circle cx="30" cy="53" r="2.5" />
          <circle cx="40" cy="48" r="2.5" />
        </g>
      </svg>
    )
  }

  if (iconName === 'storm') {
    return (
      <svg className="weather-svg-icon" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M17 44h23c8.5 0 14.6-6.1 14.6-14.1 0-7.6-5.8-13.6-13.2-14.1-.9-8.5-8.1-15-16.7-15-7.7 0-14.2 5.2-16.2 12.3C3.2 18.4 0 23.6 0 30.7c0 8.3 6.7 15 15 15Z" fill="currentColor" />
        <path d="M33 38 24 51h9l-4 13 14-16h-8l4-10Z" fill="currentColor" />
      </svg>
    )
  }

  if (iconName === 'snow') {
    return (
      <svg className="weather-svg-icon" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M17 44h23c8.5 0 14.6-6.1 14.6-14.1 0-7.6-5.8-13.6-13.2-14.1-.9-8.5-8.1-15-16.7-15-7.7 0-14.2 5.2-16.2 12.3C3.2 18.4 0 23.6 0 30.7c0 8.3 6.7 15 15 15Z" fill="currentColor" />
        <g fill="currentColor">
          <circle cx="24" cy="49" r="2.5" />
          <circle cx="32" cy="49" r="2.5" />
          <circle cx="40" cy="49" r="2.5" />
        </g>
      </svg>
    )
  }

  return (
    <svg className="weather-svg-icon" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="22" cy="24" r="9" fill="currentColor" opacity="0.9" />
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M22 8v6M22 38v6M8 24h6M36 24h6M13 13l4 4M31 31l4 4M13 35l4-4M31 17l4-4" />
      </g>
      <path d="M23 44h17c8.9 0 13.8-5.8 13.8-13.3 0-6.9-4.9-12.7-11.5-13.1-.5-7.6-6.7-13.6-14.4-13.6-7.8 0-14.1 6.1-14.5 13.8C4.7 19.6 0 24.7 0 31.4c0 7.4 6.2 13.4 13.8 13.4Z" fill="currentColor" opacity="0.35" />
    </svg>
  )
}

function App() {
  const [city, setCity] = useState(defaultCity)
  const [stateInput, setStateInput] = useState(defaultState)
  const [unit] = useState<'c' | 'f'>('c')
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [location, setLocation] = useState<WeatherLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchWeatherForLocation(nextCity: string, nextState: string) {
    setLoading(true)
    setError('')

    try {
      const geocodeResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nextCity)}&count=5&language=en&format=json`,
      )

      if (!geocodeResponse.ok) {
        throw new Error('Unable to look up that location right now.')
      }

      const geocodeData = (await geocodeResponse.json()) as {
        results?: WeatherLocation[]
      }

      const matches = geocodeData.results ?? []
      const normalizedState = nextState.trim().toLowerCase()
      const selectedLocation =
        matches.find((item) => item.admin1?.toLowerCase().includes(normalizedState)) ??
        matches.find((item) => item.country.toLowerCase().includes(normalizedState)) ??
        matches[0]

      if (!selectedLocation) {
        throw new Error('We could not find a matching city. Try a more specific location.')
      }

      setLocation(selectedLocation)

      const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast')
      forecastUrl.searchParams.set('latitude', String(selectedLocation.latitude))
      forecastUrl.searchParams.set('longitude', String(selectedLocation.longitude))
      forecastUrl.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,weather_code,is_day')
      forecastUrl.searchParams.set('hourly', 'temperature_2m,weather_code')
      forecastUrl.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum')
      forecastUrl.searchParams.set('forecast_days', '7')
      forecastUrl.searchParams.set('timezone', 'auto')

      const weatherResponse = await fetch(forecastUrl)

      if (!weatherResponse.ok) {
        throw new Error('Weather details could not be loaded.')
      }

      const weatherData = (await weatherResponse.json()) as ForecastResponse
      setForecast(weatherData)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Something went wrong while fetching the weather.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchWeatherForLocation(defaultCity, defaultState)
  }, [])

  const nextHours = useMemo(() => {
    if (!forecast) return []

    return forecast.hourly.time.slice(0, 8).map((time, index) => ({
      time,
      temp: forecast.hourly.temperature_2m[index],
      code: forecast.hourly.weather_code[index],
    }))
  }, [forecast])

  const nextDays = useMemo(() => {
    if (!forecast) return []

    return forecast.daily.time.map((time, index) => ({
      time,
      max: forecast.daily.temperature_2m_max[index],
      min: forecast.daily.temperature_2m_min[index],
      code: forecast.daily.weather_code[index],
      precipitation: forecast.daily.precipitation_sum[index],
    }))
  }, [forecast])

  const displayTemperature = (value: number) =>
    unit === 'f' ? `${Math.round(CelsiusToFahrenheit(value))}°F` : `${Math.round(value)}°C`

  const locationLabel =
    location?.country === 'Serbia' ? 'Srbija' : location?.country ?? 'Srbija'

  const currentWeather = forecast?.current
  const currentCode = currentWeather?.weather_code ?? 0
  const currentSummary = WEATHER_CODE_MAP[currentCode] ?? WEATHER_CODE_MAP[0]

  return (
    <main className="weather-shell">
      <section className="weather-card">
        <div className="top-bar">
          <div className="header-copy">
            <p className="greeting">
              <span className="greeting-icon" aria-hidden="true">
                ✨
              </span>
              Zdravo Acika
            </p>
            <p className="eyebrow">Vremenska Prognoza</p>
            <h1>{location?.name ?? city}</h1>
            <p className="subtle">{locationLabel}</p>
          </div>
          <div className="unit-pill" aria-label="Temperature unit">
            <span>°C</span>
          </div>
        </div>

        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault()
            void fetchWeatherForLocation(city, stateInput)
          }}
        >
          <label>
            <span>GRAD</span>
            <input
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="GRAD"
            />
          </label>
          <label>
            <span>Država</span>
            <input
              type="text"
              value={stateInput}
              onChange={(event) => setStateInput(event.target.value)}
              placeholder="Srbija"
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Pretraga…' : 'Prognoza'}
          </button>
        </form>

        {error ? <p className="error-message">{error}</p> : null}

        {forecast && currentWeather ? (
          <>
            <section className="hero-panel">
              <div>
                <div className="weather-icon" aria-hidden="true">
                  <WeatherIcon iconName={currentSummary.icon} />
                </div>
                <p className="weather-label">{currentSummary.label}</p>
              </div>
              <div>
                <p className="temperature">{displayTemperature(currentWeather.temperature_2m)}</p>
                <p className="feels-like">
                  Feels like {displayTemperature(currentWeather.apparent_temperature)}
                </p>
              </div>
            </section>

            <section className="stats-grid">
              <article className="stat-card">
                <span>Humidity</span>
                <strong>{currentWeather.relative_humidity_2m}%</strong>
              </article>
              <article className="stat-card">
                <span>Wind</span>
                <strong>{Math.round(currentWeather.wind_speed_10m)} km/h</strong>
              </article>
              <article className="stat-card">
                <span>Precipitation</span>
                <strong>{currentWeather.precipitation.toFixed(1)} mm</strong>
              </article>
            </section>

            <section className="forecast-section">
              <div className="section-heading">
                <h2>Next 8 hours</h2>
              </div>
              <div className="hourly-row">
                {nextHours.map((hour) => (
                  <article key={hour.time} className="hour-card">
                    <span>{new Date(hour.time).toLocaleTimeString([], { hour: 'numeric' })}</span>
                    <strong>
                      <WeatherIcon iconName={WEATHER_CODE_MAP[hour.code]?.icon ?? 'partly-cloudy'} />
                    </strong>
                    <small>{displayTemperature(hour.temp)}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="forecast-section">
              <div className="section-heading">
                <h2>7-day outlook</h2>
              </div>
              <div className="daily-list">
                {nextDays.map((day) => (
                  <article key={day.time} className="daily-row">
                    <span>{new Date(day.time).toLocaleDateString([], { weekday: 'short' })}</span>
                    <span className="daily-icon-badge" aria-hidden="true">
                      <WeatherIcon iconName={WEATHER_CODE_MAP[day.code]?.icon ?? 'partly-cloudy'} />
                    </span>
                    <small>
                      {displayTemperature(day.max)} / {displayTemperature(day.min)}
                    </small>
                    <em>{day.precipitation.toFixed(1)} mm</em>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  )
}

export default App
