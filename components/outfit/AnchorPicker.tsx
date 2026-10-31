'use client'

import { useEffect, useMemo, useState } from 'react'
import { CATEGORY_LABELS } from '@/lib/closet'
import { CATEGORIES, type Category } from '@/lib/types'
import { GarmentIcon } from '../closet/GarmentIcon'

export interface PickerItem {
  id: string
  name: string
  category: Category
  photo: string | null
}

// "Build around this piece". A sheet with the closet in a grid, filterable by
// category. Phones get it from the bottom, desktops as a centred dialog.
export function AnchorPicker({ items, value, onChange }: { items: PickerItem[]; value: string | null; onChange: (id: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category | 'all'>('all')
  const selected = items.find((i) => i.id === value) ?? null
  const shown = useMemo(() => (category === 'all' ? items : items.filter((i) => i.category === category)), [items, category])
  const present = CATEGORIES.filter((c) => items.some((i) => i.category === c))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {selected ? (
        <div className="flex items-center gap-3 rounded-2xl border border-ink/20 bg-surface p-2.5 pr-4">
          <div className="photo-frame h-16 w-14 shrink-0 rounded-xl">{selected.photo && <img src={selected.photo} alt="" className="h-full w-full object-cover" />}</div>
          <div className="min-w-0 flex-1">
            <p className="label">Built around</p>
            <p className="truncate text-sm font-medium">{selected.name}</p>
          </div>
          <button type="button" className="text-xs font-medium text-muted underline-offset-4 hover:text-ink hover:underline" onClick={() => setOpen(true)}>
            Change
          </button>
          <button type="button" className="text-xs font-medium text-muted underline-offset-4 hover:text-danger hover:underline" onClick={() => onChange(null)}>
            Remove
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-strong bg-surface p-4 text-left transition hover:border-ink">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sunk text-ink">
            <GarmentIcon category="all" className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-medium">Build around a piece</span>
            <span className="block text-xs text-faint">Optional. Like the shirt you just bought, or something you never wear.</span>
          </span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal
            aria-label="Pick a piece to build around"
            className="flex max-h-[85vh] w-full max-w-3xl animate-rise-in flex-col rounded-t-3xl bg-bg shadow-lift sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="heading text-2xl">Build around…</p>
              <button type="button" className="btn-quiet px-3 py-1.5" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto px-5 py-3 scrollbar-none">
              {(['all', ...present] as const).map((c) => (
                <button key={c} type="button" onClick={() => setCategory(c)} className={`shrink-0 ${category === c ? 'toggle-chip-on' : 'toggle-chip-off'}`}>
                  {c === 'all' ? 'Everything' : CATEGORY_LABELS[c].many}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 overflow-y-auto px-5 pb-6 sm:grid-cols-5">
              {shown.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.id)
                    setOpen(false)
                  }}
                  className="text-left"
                >
                  <div className={`photo-frame aspect-[4/5] rounded-xl transition ${item.id === value ? 'ring-2 ring-ink ring-offset-2' : 'hover:opacity-90'}`}>
                    {item.photo ? (
                      <img src={item.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-strong">
                        <GarmentIcon category={item.category} className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-xs text-muted">{item.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
