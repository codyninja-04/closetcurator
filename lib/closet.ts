import type { Category, Occasion, Season, StyleTag, WardrobeItem, Warmth, WearOccasion } from './types'
import { daysBetween } from './dates'

export const CATEGORY_LABELS: Record<Category, { one: string; many: string }> = {
  top: { one: 'Top', many: 'Tops' },
  bottom: { one: 'Bottom', many: 'Bottoms' },
  dress: { one: 'Dress', many: 'Dresses' },
  outerwear: { one: 'Outerwear', many: 'Outerwear' },
  shoes: { one: 'Shoes', many: 'Shoes' },
  accessory: { one: 'Accessory', many: 'Accessories' },
  bag: { one: 'Bag', many: 'Bags' },
}

export const STYLE_LABELS: Record<StyleTag, string> = {
  casual: 'Casual',
  smart_casual: 'Smart casual',
  business: 'Business',
  formal: 'Formal',
  sporty: 'Sporty',
  streetwear: 'Streetwear',
}

export const SEASON_LABELS: Record<Season, string> = {
  year_round: 'Year round',
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
}

export const WARMTH_LABELS: Record<Warmth, string> = {
  light: 'Light',
  medium: 'Mid weight',
  warm: 'Warm',
}

export const OCCASION_LABELS: Record<WearOccasion, string> = {
  work: 'Work',
  casual: 'Casual',
  date: 'Date',
  formal: 'Formal event',
  gym: 'Gym',
  other: 'Everyday',
}

export const OCCASION_HINTS: Record<Occasion, string> = {
  work: 'Office or client day',
  casual: 'Errands, coffee, weekend',
  date: 'Dinner, drinks, a night out',
  formal: 'Wedding, gala, ceremony',
  gym: 'Training or a run',
}

// Not worn for this long and it shows up as a donate or sell candidate.
export const UNUSED_AFTER_DAYS = 90
export const RECENT_WITHIN_DAYS = 14

export type WearStatus = 'recent' | 'steady' | 'unused' | 'new'

// Days since it was last worn, or since it was added if it never has been.
export function idleDays(item: Pick<WardrobeItem, 'last_worn_date' | 'added_at'>, today: string): number {
  return Math.max(0, daysBetween(item.last_worn_date ?? item.added_at.slice(0, 10), today))
}

export function wearStatus(item: Pick<WardrobeItem, 'last_worn_date' | 'added_at'>, today: string): WearStatus {
  const idle = idleDays(item, today)
  if (idle >= UNUSED_AFTER_DAYS) return 'unused'
  if (!item.last_worn_date) return 'new'
  return idle <= RECENT_WITHIN_DAYS ? 'recent' : 'steady'
}

export function lastWornLabel(lastWorn: string | null, today: string): string {
  if (!lastWorn) return 'Not worn yet'
  const d = daysBetween(lastWorn, today)
  if (d <= 0) return 'Worn today'
  if (d === 1) return 'Worn yesterday'
  if (d < 60) return `Worn ${d} days ago`
  const months = Math.round(d / 30)
  return months < 24 ? `Worn ${months} months ago` : `Worn ${Math.round(d / 365)} years ago`
}

export function describeItem(item: Pick<WardrobeItem, 'primary_color' | 'pattern' | 'subcategory' | 'category'>): string {
  const pattern = item.pattern && item.pattern.toLowerCase() !== 'solid' ? item.pattern.toLowerCase() : null
  return [item.primary_color?.toLowerCase(), pattern, item.subcategory?.toLowerCase() ?? CATEGORY_LABELS[item.category].one.toLowerCase()].filter(Boolean).join(' ')
}

function words(s: string | null | undefined): Set<string> {
  return new Set(
    (s ?? '')
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length > 2),
  )
}

// Rough "is this the same thing" check, used to flag a likely duplicate while
// adding an item. Same category, a shared colour word and an overlapping type.
export function similarItems<T extends Pick<WardrobeItem, 'category' | 'subcategory' | 'primary_color'>>(
  candidate: Pick<WardrobeItem, 'category' | 'subcategory' | 'primary_color'>,
  closet: T[],
): T[] {
  const cType = words(candidate.subcategory)
  const cColor = words(candidate.primary_color)
  if (cColor.size === 0) return []
  return closet.filter((item) => {
    if (item.category !== candidate.category) return false
    const color = words(item.primary_color)
    if (!Array.from(cColor).some((w) => color.has(w))) return false
    const type = words(item.subcategory)
    return cType.size === 0 || type.size === 0 || Array.from(cType).some((w) => type.has(w))
  })
}
