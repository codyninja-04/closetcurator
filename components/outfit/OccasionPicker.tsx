'use client'

import { OCCASION_HINTS, OCCASION_LABELS } from '@/lib/closet'
import { OCCASIONS, type Occasion } from '@/lib/types'

export function OccasionPicker({ value, onChange }: { value: Occasion; onChange: (o: Occasion) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Occasion">
      {OCCASIONS.map((o) => {
        const on = value === o
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o)}
            className={`rounded-2xl border px-4 py-3 text-left transition ${on ? 'border-ink bg-ink text-white shadow-lift' : 'border-line bg-surface hover:border-strong'} ${o === 'gym' ? 'col-span-2 sm:col-span-1' : ''}`}
          >
            <span className="block font-display text-xl leading-tight">{OCCASION_LABELS[o]}</span>
            <span className={`mt-0.5 block text-xs ${on ? 'text-white/65' : 'text-faint'}`}>{OCCASION_HINTS[o]}</span>
          </button>
        )
      })}
    </div>
  )
}
