'use client'

import { useCallback, useEffect, useState } from 'react'
import type { TempUnit } from '@/lib/types'
import { MANUAL_WEATHER, describeWeather, manualWeather, toUnit, type ManualKey, type Weather } from '@/lib/weather'

type Mode = 'auto' | 'manual'

// Live weather when there's an API key and a location (from the browser, or the
// home city in settings), with a manual override that is always one tap away.
export function WeatherPicker({
  value,
  onChange,
  unit,
  homeCity,
  liveAvailable,
}: {
  value: Weather | null
  onChange: (w: Weather | null) => void
  unit: TempUnit
  homeCity: string | null
  liveAvailable: boolean
}) {
  const [mode, setMode] = useState<Mode>(liveAvailable ? 'auto' : 'manual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preset, setPreset] = useState<ManualKey | null>(null)
  const [wet, setWet] = useState(false)

  const fetchLive = useCallback(
    async (query: string) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/weather?${query}`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Couldn't get the weather.")
        onChange(data.weather as Weather)
      } catch (e) {
        setError((e as Error).message)
        setMode('manual')
      } finally {
        setLoading(false)
      }
    },
    [onChange],
  )

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      if (homeCity) void fetchLive(`city=${encodeURIComponent(homeCity)}`)
      else setError("This browser can't share a location. Set a home city in settings, or pick by hand.")
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => void fetchLive(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
      () => {
        setLoading(false)
        if (homeCity) void fetchLive(`city=${encodeURIComponent(homeCity)}`)
        else {
          setError('Location is blocked. Set a home city in settings, or pick by hand.')
          setMode('manual')
        }
      },
      { timeout: 8000, maximumAge: 30 * 60 * 1000 },
    )
  }, [fetchLive, homeCity])

  // On load, only use what doesn't need a permission prompt: a location that
  // was already allowed, or the home city.
  useEffect(() => {
    if (!liveAvailable || value) return
    let cancelled = false
    ;(async () => {
      try {
        const perm = await navigator.permissions?.query({ name: 'geolocation' as PermissionName })
        if (cancelled) return
        if (perm?.state === 'granted') return locate()
      } catch {
        // Older Safari has no permissions API. Fall back to the home city.
      }
      if (homeCity && !cancelled) void fetchLive(`city=${encodeURIComponent(homeCity)}`)
    })()
    return () => {
      cancelled = true
    }
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function choose(key: ManualKey, rain = wet) {
    setPreset(key)
    setWet(rain)
    onChange(manualWeather(key, rain))
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="label">Weather</p>
          <p className="mt-1 truncate text-sm font-medium">{loading ? 'Checking the weather…' : value ? describeWeather(value, unit) : 'Not set, assumes mild and indoors'}</p>
        </div>
        <div className="flex gap-1.5">
          {liveAvailable && (
            <button type="button" onClick={() => (setMode('auto'), locate())} className={mode === 'auto' ? 'toggle-chip-on' : 'toggle-chip-off'} disabled={loading}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <circle cx="12" cy="12" r="6" />
              </svg>
              Use my location
            </button>
          )}
          <button type="button" onClick={() => setMode('manual')} className={mode === 'manual' ? 'toggle-chip-on' : 'toggle-chip-off'}>
            Set it myself
          </button>
        </div>
      </div>

      {mode === 'manual' && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-4">
          {MANUAL_WEATHER.map((m) => (
            <button key={m.key} type="button" onClick={() => choose(m.key)} className={preset === m.key && value?.source === 'manual' ? 'toggle-chip-on' : 'toggle-chip-off'}>
              {m.label}
              <span className="figure text-[0.7rem] opacity-60">
                {toUnit(m.tempC, unit)}°{unit}
              </span>
            </button>
          ))}
          <label className="ml-1 inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" className="h-4 w-4 accent-ink" checked={wet} onChange={(e) => (preset ? choose(preset, e.target.checked) : setWet(e.target.checked))} />
            Rain
          </label>
          {value && (
            <button type="button" className="ml-auto text-xs text-faint underline-offset-4 hover:text-ink hover:underline" onClick={() => (setPreset(null), onChange(null))}>
              Clear
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-xs text-unused-ink">{error}</p>}
    </div>
  )
}
