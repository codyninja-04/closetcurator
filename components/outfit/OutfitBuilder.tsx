'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { postJson } from '@/lib/api'
import { OCCASION_LABELS } from '@/lib/closet'
import { prettyDate } from '@/lib/dates'
import type { OutfitPiece } from '@/lib/outfits'
import type { Occasion, OutfitSuggestion as Suggestion, TempUnit } from '@/lib/types'
import type { Weather } from '@/lib/weather'
import { AnchorPicker, type PickerItem } from './AnchorPicker'
import { OccasionPicker } from './OccasionPicker'
import { OutfitSuggestion } from './OutfitSuggestion'
import { WeatherPicker } from './WeatherPicker'

// A sensible first guess at the occasion from the day and time.
function guessOccasion(): Occasion {
  const now = new Date()
  const weekend = now.getDay() === 0 || now.getDay() === 6
  if (now.getHours() >= 17) return 'date'
  return weekend ? 'casual' : 'work'
}

export function OutfitBuilder({
  items,
  history: initialHistory,
  pieces: initialPieces,
  anchor: initialAnchor,
  today,
  unit,
  homeCity,
  liveWeather,
  allowed,
}: {
  items: PickerItem[]
  history: Suggestion[]
  pieces: Record<string, OutfitPiece>
  anchor: string | null
  today: string
  unit: TempUnit
  homeCity: string | null
  liveWeather: boolean
  allowed: boolean
}) {
  const [occasion, setOccasion] = useState<Occasion>('casual')
  const [weather, setWeather] = useState<Weather | null>(null)
  const [anchor, setAnchor] = useState<string | null>(initialAnchor)
  const [request, setRequest] = useState('')
  const [history, setHistory] = useState(initialHistory)
  const [pieces, setPieces] = useState(initialPieces)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  // Guessed after mount so the server and browser render the same thing first.
  useEffect(() => setOccasion(guessOccasion()), [])

  const current = history.find((h) => h.id === currentId) ?? null

  async function suggest(avoid: string[] = []) {
    setLoading(true)
    setError(null)
    try {
      const res = await postJson<{ suggestion: Suggestion; pieces: Record<string, OutfitPiece> }>('/api/outfit/suggest', {
        occasion,
        weather,
        anchor_item_id: anchor,
        avoid_item_ids: avoid,
        request: request.trim() || null,
      })
      setPieces((p) => ({ ...p, ...res.pieces }))
      setHistory((h) => [res.suggestion, ...h.filter((x) => x.id !== res.suggestion.id)].slice(0, 12))
      setCurrentId(res.suggestion.id)
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function markWorn(id: string, day: string) {
    setHistory((h) => h.map((s) => (s.id === id ? { ...s, worn_on: day } : s)))
  }

  if (!allowed) {
    return (
      <div className="card p-6 sm:p-8">
        <p className="heading text-3xl">Outfit suggestions are part of Pro</p>
        <p className="mt-2 max-w-lg text-sm text-muted">Pro builds outfits from your closet for any occasion and the day&rsquo;s weather, and can build around a single piece. $5 a month.</p>
        <Link href="/settings#plan" className="btn-primary mt-5">
          See plans
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <section className="space-y-5">
          <OccasionPicker value={occasion} onChange={setOccasion} />
          <div className="grid gap-3 lg:grid-cols-2">
            <WeatherPicker value={weather} onChange={setWeather} unit={unit} homeCity={homeCity} liveAvailable={liveWeather} />
            <AnchorPicker items={items} value={anchor} onChange={setAnchor} />
          </div>
          <div>
            <label htmlFor="outfit-request" className="sr-only">
              Anything else
            </label>
            <input
              id="outfit-request"
              className="input rounded-full px-5 py-3"
              maxLength={200}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Anything else? Lots of walking, outdoor venue, no black…"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary px-7 py-3 text-base" disabled={loading} onClick={() => suggest()}>
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Going through your closet…
                </>
              ) : (
                'Get outfit suggestion'
              )}
            </button>
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
          </div>
        </section>

        <div ref={resultRef} className="mt-10 scroll-mt-24">
          {loading && !current && <ResultSkeleton />}
          {current && (
            <div className={loading ? 'pointer-events-none opacity-50 transition' : 'transition'}>
              <OutfitSuggestion
                suggestion={current}
                pieces={pieces}
                today={today}
                onWorn={markWorn}
                onTryAnother={() => suggest(current.picks.map((p) => p.item_id))}
                busy={loading}
              />
            </div>
          )}
        </div>
      </div>

      <aside>
        <p className="label">Recent suggestions</p>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Your outfits will show up here.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentId(s.id)
                    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
                  }}
                  className={`w-full rounded-2xl border p-2.5 text-left transition ${s.id === currentId ? 'border-ink bg-surface' : 'border-line bg-surface/60 hover:border-strong'}`}
                >
                  <div className="flex gap-1">
                    {s.picks.slice(0, 4).map((p) => (
                      <div key={p.item_id} className="photo-frame aspect-[4/5] flex-1 rounded-md">
                        {pieces[p.item_id]?.photo && <img src={pieces[p.item_id].photo!} alt="" loading="lazy" className="h-full w-full object-cover" />}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between px-0.5 text-xs">
                    <span className="font-medium">{OCCASION_LABELS[s.occasion]}</span>
                    <span className={s.worn_on ? 'text-worn-ink' : 'text-faint'}>{s.worn_on ? `Worn ${prettyDate(s.worn_on)}` : prettyDate(s.created_at.slice(0, 10))}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}

function ResultSkeleton() {
  return (
    <div className="card overflow-hidden" aria-busy>
      <div className="border-b border-line px-6 py-5">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton mt-3 h-7 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-px bg-line">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-surface p-4">
            <div className="skeleton aspect-[4/5] w-full rounded-xl" />
            <div className="skeleton mt-3 h-4 w-2/3" />
            <div className="skeleton mt-2 h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
