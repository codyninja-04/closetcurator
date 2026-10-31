'use client'

import Link from 'next/link'
import { useState } from 'react'
import { postJson } from '@/lib/api'
import { CATEGORY_LABELS, OCCASION_LABELS } from '@/lib/closet'
import { prettyDate } from '@/lib/dates'
import type { OutfitPiece } from '@/lib/outfits'
import type { Category, OutfitSuggestion as Suggestion } from '@/lib/types'
import { GarmentIcon } from '../closet/GarmentIcon'

// Head to toe, so the grid reads like a person standing there.
const ORDER: Category[] = ['outerwear', 'top', 'dress', 'bottom', 'shoes', 'bag', 'accessory']

export function OutfitSuggestion({
  suggestion,
  pieces,
  today,
  onWorn,
  onTryAnother,
  busy,
}: {
  suggestion: Suggestion
  pieces: Record<string, OutfitPiece>
  today: string
  onWorn: (id: string, day: string) => void
  onTryAnother?: () => void
  busy?: boolean
}) {
  const [logging, setLogging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const picks = [...suggestion.picks]
    .filter((p) => pieces[p.item_id])
    .sort((a, b) => ORDER.indexOf(pieces[a.item_id].category as Category) - ORDER.indexOf(pieces[b.item_id].category as Category))
  const missing = suggestion.picks.length - picks.length
  const wornToday = suggestion.worn_on === today

  async function wear() {
    setLogging(true)
    setError(null)
    try {
      const res = await postJson<{ worn_on: string }>(`/api/outfit/${suggestion.id}/wear`, { date: today })
      onWorn(suggestion.id, res.worn_on)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLogging(false)
    }
  }

  return (
    <article className="card animate-rise-in overflow-hidden">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <p className="label">
            {OCCASION_LABELS[suggestion.occasion]}
            {suggestion.weather_summary ? ` · ${suggestion.weather_summary}` : ''}
          </p>
          <p className="heading mt-1 text-3xl">
            {picks.length} pieces, <span className="italic text-muted">all yours.</span>
          </p>
        </div>
        {suggestion.worn_on && <span className="chip border-worn/30 bg-worn-soft/60 text-worn-ink">{wornToday ? 'Wearing it today' : `Worn ${prettyDate(suggestion.worn_on)}`}</span>}
      </header>

      <div className={`grid gap-px bg-line ${picks.length > 4 ? 'grid-cols-2 sm:grid-cols-3' : picks.length === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
        {picks.map((p, i) => {
          const piece = pieces[p.item_id]
          return (
            <div key={p.item_id} className="animate-rise-in bg-surface p-3 sm:p-4" style={{ animationDelay: `${i * 70}ms` }}>
              <Link href={`/closet/${piece.id}`} className="group block">
                <div className="photo-frame aspect-[4/5] rounded-xl">
                  {piece.photo ? (
                    <img src={piece.photo} alt={piece.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-strong">
                      <GarmentIcon category={piece.category as Category} className="h-10 w-10" />
                    </div>
                  )}
                  {p.item_id === suggestion.anchor_item_id && <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[0.66rem] font-semibold text-white">Your pick</span>}
                </div>
              </Link>
              <p className="label mt-3">{CATEGORY_LABELS[piece.category as Category]?.one ?? piece.category}</p>
              <p className="mt-0.5 text-sm font-medium leading-snug">{piece.name}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{p.reasoning}</p>
            </div>
          )
        })}
      </div>

      <div className="space-y-3 px-5 py-5 sm:px-6">
        {suggestion.overall_note && <p className="font-display text-xl italic leading-snug text-ink">&ldquo;{suggestion.overall_note}&rdquo;</p>}
        {suggestion.gap_note && (
          <p className="rounded-xl bg-sunk px-3.5 py-2.5 text-sm text-muted">
            <span className="font-semibold text-ink">Worth knowing: </span>
            {suggestion.gap_note}
          </p>
        )}
        {missing > 0 && <p className="text-xs text-faint">{missing === 1 ? 'One piece has' : `${missing} pieces have`} since been deleted from your closet.</p>}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" className={wornToday ? 'btn bg-worn text-white' : 'btn-primary'} onClick={wear} disabled={logging || wornToday}>
            {wornToday ? '✓ Logged for today' : logging ? 'Logging…' : 'Wearing this today'}
          </button>
          {onTryAnother && (
            <button type="button" className="btn-ghost" onClick={onTryAnother} disabled={busy}>
              {busy ? 'Thinking…' : 'Try another'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
