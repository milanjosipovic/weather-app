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
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mostly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅️' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌧️' },
  56: { label: 'Freezing drizzle', icon: '🌧️' },
  57: { label: 'Heavy freezing drizzle', icon: '🌧️' },
  61: { label: 'Light rain', icon: '🌦️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Freezing rain', icon: '🌧️' },
  67: { label: 'Heavy freezing rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '❄️' },
  80: { label: 'Rain showers', icon: '🌦️' },
  81: { label: 'Heavy rain showers', icon: '🌧️' },
  82: { label: 'Violent rain showers', icon: '⛈️' },
  85: { label: 'Snow showers', icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '🌨️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with hail', icon: '⛈️' },
  99: { label: 'Strong thunderstorm with hail', icon: '⛈️' },
}

const defaultCity = 'Užice'
const defaultState = 'Srbija'

function CelsiusToFahrenheit(value: number) {
  return (value * 9) / 5 + 32
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
                  {currentSummary.icon}
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
                    <strong>{WEATHER_CODE_MAP[hour.code]?.icon ?? '🌤️'}</strong>
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
                      {WEATHER_CODE_MAP[day.code]?.icon ?? '🌤️'}
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
