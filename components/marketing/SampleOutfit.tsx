import { GarmentIcon } from '@/components/closet/GarmentIcon'
import type { Category } from '@/lib/types'

// A made up suggestion drawn with the garment icons, so the landing and sign
// in pages can show what the app does without stock photos.
const PIECES: { category: Category; name: string; tint: string; ink: string; note: string; worn: string; idle?: boolean }[] = [
  { category: 'outerwear', name: 'Camel overcoat', tint: '#E9DCC8', ink: '#8A6A3F', note: 'Warm layer for 11°C and the walk from the station.', worn: '3 days ago' },
  { category: 'top', name: 'White oxford shirt', tint: '#F3F3F1', ink: '#71717A', note: 'Crisp under the coat, reads polished without a tie.', worn: '9 days ago' },
  { category: 'bottom', name: 'Charcoal wool trousers', tint: '#D9D9DC', ink: '#3F3F46', note: 'You haven’t worn these since July. They suit a client day.', worn: '104 days ago', idle: true },
  { category: 'shoes', name: 'Brown derbies', tint: '#E4D3C4', ink: '#6B4A2E', note: 'Picks up the coat and grounds the grey.', worn: '6 days ago' },
]

export function SampleOutfit({ className = '' }: { className?: string }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div>
          <p className="label">Work · 11°C, light rain</p>
          <p className="mt-1 font-display text-xl leading-tight">Tuesday, client meeting</p>
        </div>
        <span className="chip border-worn/30 bg-worn-soft/60 text-worn-ink">From your closet</span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-line">
        {PIECES.map((p) => (
          <div key={p.name} className="bg-surface p-3">
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl" style={{ background: p.tint, color: p.ink }}>
              <GarmentIcon category={p.category} className="h-14 w-14" strokeWidth={1.1} />
            </div>
            <p className="mt-2.5 text-sm font-medium leading-snug">{p.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{p.note}</p>
            <p className={`mt-1.5 flex items-center gap-1.5 text-[0.7rem] font-medium ${p.idle ? 'text-unused-ink' : 'text-faint'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${p.idle ? 'bg-unused' : 'bg-worn'}`} />
              Worn {p.worn}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
