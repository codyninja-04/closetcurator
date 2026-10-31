import { describe, expect, it } from 'vitest'
import { BadInput } from './validate'
import { parseWearDate, parseWearOccasion } from './wear'
import { describeWeather, manualWeather, parseOpenWeather, parseWeatherInput, weatherForPrompt } from './weather'

describe('parseOpenWeather', () => {
  it('reads the fields that matter', () => {
    const w = parseOpenWeather({ name: 'Singapore', main: { temp: 29.4, feels_like: 34.1 }, weather: [{ main: 'Rain', description: 'Light rain' }], wind: { speed: 4 }, rain: { '1h': 0.3 } })
    expect(w).toEqual({ tempC: 29.4, feelsC: 34.1, description: 'light rain', wet: true, windKph: 14, city: 'Singapore', source: 'live' })
  })

  it('returns null without a temperature', () => {
    expect(parseOpenWeather({ main: {} })).toBeNull()
    expect(parseOpenWeather(null)).toBeNull()
  })
})

describe('weather text', () => {
  const live = { tempC: 9, feelsC: 5, description: 'drizzle', wet: true, windKph: 35, city: 'London', source: 'live' as const }

  it('shows feels like only when it differs', () => {
    expect(describeWeather(live, 'C')).toBe('9°C, feels 5° · drizzle · London')
    expect(describeWeather({ ...live, feelsC: 9.5 }, 'F')).toBe('48°F · drizzle · London')
    expect(describeWeather(manualWeather('hot', false), 'C')).toBe('Hot and sunny, around 31°C')
  })

  it('gives Claude a dressing hint', () => {
    const text = weatherForPrompt(live)
    expect(text).toContain('cold: warm outerwear')
    expect(text).toContain('wet: avoid suede')
    expect(text).toContain('windy')
  })
})

describe('parseWeatherInput', () => {
  it('keeps a sane object and strips odd characters', () => {
    const w = parseWeatherInput({ tempC: 20, description: 'clear <script>', city: 'Kuala Lumpur', source: 'live', wet: 'yes' })
    expect(w).toMatchObject({ tempC: 20, feelsC: 20, description: 'clear script', city: 'Kuala Lumpur', wet: false })
  })

  it('rejects nonsense', () => {
    expect(parseWeatherInput({ tempC: 400 })).toBeNull()
    expect(parseWeatherInput('hot')).toBeNull()
  })
})

describe('wear input', () => {
  const today = '2026-10-31'

  it('defaults to today and allows a day of time zone slack', () => {
    expect(parseWearDate(undefined, today)).toBe(today)
    expect(parseWearDate('2026-11-01', today)).toBe('2026-11-01')
    expect(parseWearDate('2026-09-15', today)).toBe('2026-09-15')
  })

  it('refuses the future, the distant past and junk', () => {
    expect(() => parseWearDate('2026-11-05', today)).toThrow(BadInput)
    expect(() => parseWearDate('2026-01-01', today)).toThrow(BadInput)
    expect(() => parseWearDate('yesterday', today)).toThrow(BadInput)
  })

  it('checks the occasion', () => {
    expect(parseWearOccasion('gym')).toBe('gym')
    expect(parseWearOccasion('')).toBeNull()
    expect(() => parseWearOccasion('party')).toThrow(BadInput)
  })
})
