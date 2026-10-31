'use client'

import Link from 'next/link'
import { lastWornLabel, wearStatus } from '@/lib/closet'
import type { WardrobeItem } from '@/lib/types'
import { GarmentIcon } from './GarmentIcon'
import { WearLine } from './WearStatus'

export type ClosetItem = WardrobeItem & { photo: string | null }

// One piece on the rail: photo, a wear count tag, and how long since it was
// last on. The check button logs "worn today" without leaving the grid.
export function ItemCard({ item, today, onWear, logging }: { item: ClosetItem; today: string; onWear?: (item: ClosetItem) => void; logging?: boolean }) {
  const status = wearStatus(item, today)
  const wornToday = item.last_worn_date === today

  return (
    <div className="group relative">
      <Link href={`/closet/${item.id}`} className="block">
        <div className="photo-frame aspect-[4/5] rounded-2xl ring-1 ring-inset ring-black/[0.03] transition group-hover:shadow-lift">
          {item.photo ? (
            <img src={item.photo} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="flex h-full items-center justify-center text-strong">
              <GarmentIcon category={item.category} className="h-12 w-12" strokeWidth={1.1} />
            </div>
          )}
          <span className="figure absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[0.7rem] font-medium text-ink shadow-sm backdrop-blur" title={`Worn ${item.wear_count} times`}>
            {item.wear_count}×
          </span>
          {!item.is_active && <span className="absolute bottom-2.5 left-2.5 rounded-full bg-ink/80 px-2 py-0.5 text-[0.68rem] font-medium text-white">Archived</span>}
        </div>
        <p className="mt-2.5 truncate text-sm font-medium leading-snug">{item.name}</p>
        <WearLine status={status} label={lastWornLabel(item.last_worn_date, today)} className="mt-0.5" />
      </Link>

      {onWear && item.is_active && (
        <button
          type="button"
          onClick={() => onWear(item)}
          disabled={wornToday || logging}
          aria-label={wornToday ? `${item.name} logged as worn today` : `Log ${item.name} as worn today`}
          title={wornToday ? 'Worn today' : 'Wore it today'}
          className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur transition ${
            wornToday ? 'bg-worn text-white' : 'bg-white/90 text-ink opacity-100 hover:bg-ink hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'
          } disabled:cursor-default`}
        >
          {logging ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}
