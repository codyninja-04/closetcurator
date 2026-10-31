'use client'

import { CATEGORY_LABELS } from '@/lib/closet'
import { CATEGORIES, type Category } from '@/lib/types'
import { GarmentIcon } from './GarmentIcon'

export type CategoryChoice = Category | 'all'

// Horizontal chip rail. Categories with nothing in them are hidden so a new
// closet doesn't look empty.
export function CategoryFilter({ value, counts, onChange }: { value: CategoryChoice; counts: Record<CategoryChoice, number>; onChange: (c: CategoryChoice) => void }) {
  const options: CategoryChoice[] = ['all', ...CATEGORIES.filter((c) => counts[c] > 0)]
  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Filter by category">
      {options.map((c) => {
        const on = value === c
        return (
          <button key={c} type="button" role="tab" aria-selected={on} onClick={() => onChange(c)} className={`shrink-0 ${on ? 'toggle-chip-on' : 'toggle-chip-off'}`}>
            <GarmentIcon category={c} className="h-4 w-4" />
            {c === 'all' ? 'Everything' : CATEGORY_LABELS[c].many}
            <span className={`figure text-[0.7rem] ${on ? 'text-white/60' : 'text-faint'}`}>{counts[c]}</span>
          </button>
        )
      })}
    </div>
  )
}
