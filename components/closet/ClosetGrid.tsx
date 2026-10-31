'use client'

import { useMemo, useState } from 'react'
import { idleDays } from '@/lib/closet'
import { CATEGORIES } from '@/lib/types'
import { CategoryFilter, type CategoryChoice } from './CategoryFilter'
import { ItemCard, type ClosetItem } from './ItemCard'

type Sort = 'recent' | 'most' | 'least' | 'idle'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'recent', label: 'Newest first' },
  { value: 'most', label: 'Most worn' },
  { value: 'least', label: 'Least worn' },
  { value: 'idle', label: 'Longest on the hanger' },
]

interface Toast {
  itemId: string
  entryId: string
  name: string
  before: Pick<ClosetItem, 'wear_count' | 'last_worn_date'>
}

export function ClosetGrid({ initial, today }: { initial: ClosetItem[]; today: string }) {
  const [items, setItems] = useState(initial)
  const [category, setCategory] = useState<CategoryChoice>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const [logging, setLogging] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c = Object.fromEntries([['all', items.length], ...CATEGORIES.map((k) => [k, 0])]) as Record<CategoryChoice, number>
    for (const i of items) c[i.category]++
    return c
  }, [items])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = items.filter((i) => {
      if (category !== 'all' && i.category !== category) return false
      if (!q) return true
      return [i.name, i.subcategory, i.primary_color, i.pattern, i.brand, ...(i.style_tags ?? [])].some((v) => v?.toLowerCase().includes(q))
    })
    const sorted = [...list]
    if (sort === 'most') sorted.sort((a, b) => b.wear_count - a.wear_count)
    if (sort === 'least') sorted.sort((a, b) => a.wear_count - b.wear_count)
    if (sort === 'idle') sorted.sort((a, b) => idleDays(b, today) - idleDays(a, today))
    return sorted
  }, [items, category, query, sort, today])

  async function wear(item: ClosetItem) {
    setLogging(item.id)
    setError(null)
    try {
      const res = await fetch(`/api/items/${item.id}/wear`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: today }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok && data.code !== 'duplicate') throw new Error(data.error || "Couldn't log that.")
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, wear_count: data.wear_count ?? i.wear_count, last_worn_date: data.last_worn_date ?? today } : i)))
      if (data.entry) setToast({ itemId: item.id, entryId: data.entry.id, name: item.name, before: { wear_count: item.wear_count, last_worn_date: item.last_worn_date } })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLogging(null)
    }
  }

  async function undo() {
    if (!toast) return
    const t = toast
    setToast(null)
    const res = await fetch(`/api/items/${t.itemId}/wear?entry=${t.entryId}`, { method: 'DELETE' })
    if (res.ok) setItems((list) => list.map((i) => (i.id === t.itemId ? { ...i, ...t.before } : i)))
  }

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CategoryFilter value={category} counts={counts} onChange={setCategory} />
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1 lg:w-56 lg:flex-none">
            <span className="sr-only">Search your closet</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" strokeLinecap="round" />
            </svg>
            <input className="input rounded-full py-2 pl-9" placeholder="Search colour, type, brand" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label className="shrink-0">
            <span className="sr-only">Sort</span>
            <select className="input w-auto rounded-full py-2 pr-8" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="heading text-2xl">Nothing matches that</p>
          <p className="mt-2 text-sm text-muted">Try another category or clear the search.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((item, i) => (
            <div key={item.id} className="animate-rise-in" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
              <ItemCard item={item} today={today} onWear={wear} logging={logging === item.id} />
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-sm animate-rise-in items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-lift md:bottom-8" role="status">
          <span className="h-2 w-2 shrink-0 rounded-full bg-worn" />
          <span className="min-w-0 flex-1 truncate">Logged {toast.name} for today</span>
          <button type="button" className="font-semibold underline underline-offset-4" onClick={undo}>
            Undo
          </button>
          <button type="button" className="text-white/60 hover:text-white" onClick={() => setToast(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
