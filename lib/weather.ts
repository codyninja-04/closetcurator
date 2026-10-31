import type { TempUnit } from './types'

export interface Weather {
  tempC: number
  feelsC: number
  // Short lowercase description, e.g. "light rain", "broken clouds".
  description: string
  wet: boolean
  windKph: number
  city: string | null
  source: 'live' | 'manual'
}

// Hand picked conditions for when there's no API key, no location, or the
// person just knows better than the forecast.
export const MANUAL_WEATHER = [
  { key: 'hot', label: 'Hot', tempC: 31, description: 'hot and sunny' },
  { key: 'warm', label: 'Warm', tempC: 25, description: 'warm' },
  { key: 'mild', label: 'Mild', tempC: 18, description: 'mild' },
  { key: 'cool', label: 'Cool', tempC: 11, description: 'cool' },
  { key: 'cold', label: 'Cold', tempC: 3, description: 'cold' },
] as const

export type ManualKey = (typeof MANUAL_WEATHER)[number]['key']

export function manualWeather(key: ManualKey, wet: boolean): Weather {
  const preset = MANUAL_WEATHER.find((m) => m.key === key) ?? MANUAL_WEATHER[2]
  return { tempC: preset.tempC, feelsC: preset.tempC, description: wet ? `${preset.description}, rainy` : preset.description, wet, windKph: 0, city: null, source: 'manual' }
}

export function toUnit(c: number, unit: TempUnit): number {
  return Math.round(unit === 'F' ? (c * 9) / 5 + 32 : c)
}

// What the person sees, e.g. "24°C, feels 27°C · light rain · Singapore".
export function describeWeather(w: Weather, unit: TempUnit): string {
  if (w.source === 'manual') return `${w.description.charAt(0).toUpperCase()}${w.description.slice(1)}, around ${toUnit(w.tempC, unit)}°${unit}`
  const feels = Math.abs(w.feelsC - w.tempC) >= 2 ? `, feels ${toUnit(w.feelsC, unit)}°` : ''
  return [`${toUnit(w.tempC, unit)}°${unit}${feels}`, w.description, w.city].filter(Boolean).join(' · ')
}

// What Claude sees. Always Celsius plus a plain dressing hint, so the model
// doesn't have to guess what 9 degrees means for a coat.
export function weatherForPrompt(w: Weather): string {
  const t = w.feelsC
  const band =
    t >= 28 ? 'hot: lightest fabrics, no layers' : t >= 22 ? 'warm: light layers at most' : t >= 15 ? 'mild: a light layer helps' : t >= 8 ? 'cool: needs a proper outer layer' : 'cold: warm outerwear and closed shoes'
  const parts = [`${Math.round(w.tempC)}°C (feels ${Math.round(w.feelsC)}°C), ${w.description}`, band]
  if (w.wet) parts.push('wet: avoid suede and delicate shoes, a water resistant layer helps')
  if (w.windKph >= 30) parts.push('windy')
  return parts.join('; ')
}

interface OpenWeatherCurrent {
  name?: string
  main?: { temp?: number; feels_like?: number }
  weather?: { main?: string; description?: string }[]
  wind?: { speed?: number }
  rain?: unknown
  snow?: unknown
}

// Reads an OpenWeather "current weather" response (metric units). Returns null
// if the fields we need aren't there.
export function parseOpenWeather(json: unknown): Weather | null {
  const r = json as OpenWeatherCurrent
  const temp = r?.main?.temp
  if (typeof temp !== 'number' || !Number.isFinite(temp)) return null
  const feels = typeof r.main?.feels_like === 'number' ? r.main.feels_like : temp
  const main = (r.weather?.[0]?.main ?? '').toLowerCase()
  const description = (r.weather?.[0]?.description ?? main ?? '').toLowerCase().slice(0, 60) || 'clear'
  const wet = !!r.rain || !!r.snow || ['rain', 'drizzle', 'thunderstorm', 'snow'].includes(main)
  return {
    tempC: Math.round(temp * 10) / 10,
    feelsC: Math.round(feels * 10) / 10,
    description,
    wet,
    windKph: Math.round((r.wind?.speed ?? 0) * 3.6),
    city: r.name ? r.name.slice(0, 60) : null,
    source: 'live',
  }
}

// The outfit request carries the weather the client is showing. Check it is a
// sane shape before it goes anywhere near a prompt.
export function parseWeatherInput(v: unknown): Weather | null {
  if (!v || typeof v !== 'object') return null
  const r = v as Record<string, unknown>
  const num = (x: unknown, lo: number, hi: number) => (typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi ? x : null)
  const tempC = num(r.tempC, -60, 60)
  if (tempC == null) return null
  const clean = (x: unknown, max: number) => (typeof x === 'string' ? x.replace(/[^\p{L}\p{N} ,.'-]/gu, '').trim().slice(0, max) : '')
  return {
    tempC,
    feelsC: num(r.feelsC, -70, 70) ?? tempC,
    description: clean(r.description, 60) || 'clear',
    wet: r.wet === true,
    windKph: num(r.windKph, 0, 300) ?? 0,
    city: clean(r.city, 60) || null,
    source: r.source === 'live' ? 'live' : 'manual',
  }
}

export function weatherAvailable(): boolean {
  return !!process.env.OPENWEATHER_API_KEY
}

export async function fetchWeather(where: { lat: number; lon: number } | { city: string }): Promise<Weather | null> {
  const params = new URLSearchParams({ units: 'metric', appid: process.env.OPENWEATHER_API_KEY ?? '' })
  if ('city' in where) params.set('q', where.city)
  else {
    params.set('lat', where.lat.toFixed(3))
    params.set('lon', where.lon.toFixed(3))
  }
  // Rounded coordinates and a 10 minute cache keep repeat visits cheap.
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?${params}`, { next: { revalidate: 600 } })
  if (!res.ok) return null
  return parseOpenWeather(await res.json())
}
