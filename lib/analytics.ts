import { UNUSED_AFTER_DAYS, idleDays, wearStatus } from './closet'
import { addDays, daysBetween } from './dates'
import { CATEGORIES, STYLE_TAGS, WEAR_OCCASIONS, type Category, type StyleTag, type WardrobeItem, type WearOccasion } from './types'

export const WINDOW_DAYS = 90

type Item = Pick<WardrobeItem, 'id' | 'name' | 'category' | 'primary_color' | 'color_hex' | 'style_tags' | 'wear_count' | 'last_worn_date' | 'added_at' | 'is_active'>
type Wear = { item_id: string; worn_date: string; occasion: WearOccasion | null }

export interface Analytics {
  totals: {
    pieces: number
    wears30: number
    wears90: number
    // Share of active pieces worn at least once in the last 90 days.
    rotationPct: number
    neverWorn: number
    unused: number
  }
  byCategory: { category: Category; pieces: number; wears: number; perPiece: number }[]
  unused: { id: string; name: string; category: Category; idle: number; neverWorn: boolean }[]
  mostWorn: { id: string; name: string; wears: number }[]
  styles: { tag: StyleTag; ownedPct: number; wornPct: number }[]
  colors: { color: string; hex: string | null; pieces: number; wears: number }[]
  occasions: { occasion: WearOccasion; wears: number }[]
  weekly: { weekStart: string; wears: number }[]
}

const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100))

// Everything on the insights page, from the closet and its wear log. Pure so
// it can be tested and reused by the API route.
export function computeAnalytics(allItems: Item[], wears: Wear[], today: string): Analytics {
  const items = allItems.filter((i) => i.is_active)
  const activeIds = new Set(items.map((i) => i.id))
  const since = addDays(today, -(WINDOW_DAYS - 1))
  const recent = wears.filter((w) => w.worn_date >= since && w.worn_date <= today && activeIds.has(w.item_id))

  const wears90ByItem = new Map<string, number>()
  for (const w of recent) wears90ByItem.set(w.item_id, (wears90ByItem.get(w.item_id) ?? 0) + 1)

  const unusedItems = items
    .filter((i) => wearStatus(i, today) === 'unused')
    .map((i) => ({ id: i.id, name: i.name, category: i.category, idle: idleDays(i, today), neverWorn: !i.last_worn_date }))
    .sort((a, b) => b.idle - a.idle)

  const byCategory = CATEGORIES.map((category) => {
    const inCat = items.filter((i) => i.category === category)
    const w = inCat.reduce((s, i) => s + (wears90ByItem.get(i.id) ?? 0), 0)
    return { category, pieces: inCat.length, wears: w, perPiece: inCat.length ? Math.round((w / inCat.length) * 10) / 10 : 0 }
  }).filter((c) => c.pieces > 0)

  const mostWorn = items
    .map((i) => ({ id: i.id, name: i.name, wears: wears90ByItem.get(i.id) ?? 0, total: i.wear_count }))
    .filter((i) => i.wears > 0)
    .sort((a, b) => b.wears - a.wears || b.total - a.total)
    .slice(0, 6)
    .map(({ id, name, wears }) => ({ id, name, wears }))

  // Owned share: pieces carrying a tag out of all pieces. Worn share: wears of
  // pieces carrying a tag out of all wears. A big gap means you own for one
  // life and dress for another.
  const styles = STYLE_TAGS.map((tag) => {
    const owned = items.filter((i) => i.style_tags?.includes(tag))
    const worn = owned.reduce((s, i) => s + (wears90ByItem.get(i.id) ?? 0), 0)
    return { tag, ownedPct: pct(owned.length, items.length), wornPct: pct(worn, recent.length) }
  })
    .filter((s) => s.ownedPct > 0 || s.wornPct > 0)
    .sort((a, b) => b.ownedPct - a.ownedPct)

  const colorMap = new Map<string, { color: string; hex: string | null; pieces: number; wears: number }>()
  for (const i of items) {
    const color = (i.primary_color ?? '').trim().toLowerCase()
    if (!color) continue
    const row = colorMap.get(color) ?? { color, hex: null, pieces: 0, wears: 0 }
    row.pieces++
    row.wears += wears90ByItem.get(i.id) ?? 0
    row.hex = row.hex ?? i.color_hex
    colorMap.set(color, row)
  }
  const colors = Array.from(colorMap.values())
    .sort((a, b) => b.pieces - a.pieces || b.wears - a.wears)
    .slice(0, 10)

  const occasions = WEAR_OCCASIONS.map((occasion) => ({ occasion, wears: recent.filter((w) => (w.occasion ?? 'other') === occasion).length })).filter((o) => o.wears > 0)

  // Twelve Monday-start weeks ending this week.
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7
  const thisWeek = addDays(today, -dow)
  const weekly = Array.from({ length: 12 }, (_, i) => {
    const weekStart = addDays(thisWeek, -(11 - i) * 7)
    const end = addDays(weekStart, 6)
    return { weekStart, wears: wears.filter((w) => activeIds.has(w.item_id) && w.worn_date >= weekStart && w.worn_date <= end).length }
  })

  return {
    totals: {
      pieces: items.length,
      wears30: recent.filter((w) => daysBetween(w.worn_date, today) < 30).length,
      wears90: recent.length,
      rotationPct: pct(wears90ByItem.size, items.length),
      neverWorn: items.filter((i) => !i.last_worn_date).length,
      unused: unusedItems.length,
    },
    byCategory,
    unused: unusedItems,
    mostWorn,
    styles,
    colors,
    occasions,
    weekly,
  }
}

export { UNUSED_AFTER_DAYS }
