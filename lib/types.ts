export const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'bag'] as const
export type Category = (typeof CATEGORIES)[number]

export const STYLE_TAGS = ['casual', 'smart_casual', 'business', 'formal', 'sporty', 'streetwear'] as const
export type StyleTag = (typeof STYLE_TAGS)[number]

export const SEASONS = ['year_round', 'spring', 'summer', 'autumn', 'winter'] as const
export type Season = (typeof SEASONS)[number]

export const WARMTH = ['light', 'medium', 'warm'] as const
export type Warmth = (typeof WARMTH)[number]

export const OCCASIONS = ['work', 'casual', 'date', 'formal', 'gym'] as const
export type Occasion = (typeof OCCASIONS)[number]

// What a wear can be logged as. "other" covers a plain "wore it today".
export const WEAR_OCCASIONS = [...OCCASIONS, 'other'] as const
export type WearOccasion = (typeof WEAR_OCCASIONS)[number]

export type Plan = 'free' | 'pro'
export type TempUnit = 'C' | 'F'

export interface WardrobeItem {
  id: string
  user_id: string
  added_at: string
  photo_url: string
  name: string
  category: Category
  subcategory: string | null
  primary_color: string | null
  color_hex: string | null
  pattern: string | null
  style_tags: StyleTag[]
  brand: string | null
  season_appropriate: Season[]
  warmth: Warmth
  notes: string | null
  wear_count: number
  last_worn_date: string | null
  is_active: boolean
}

export interface WearEntry {
  id: string
  item_id: string
  created_at: string
  worn_date: string
  occasion: WearOccasion | null
}

// What Claude reads off a photo. The user can correct any of it before saving.
export interface Catalog {
  name: string
  category: Category
  subcategory: string
  primary_color: string
  color_hex: string | null
  pattern: string
  style_tags: StyleTag[]
  season_appropriate: Season[]
  warmth: Warmth
  brand: string | null
}

export interface OutfitPick {
  item_id: string
  reasoning: string
}

export interface OutfitResult {
  picks: OutfitPick[]
  overall_note: string
  gap_note: string | null
}

export interface OutfitSuggestion extends OutfitResult {
  id: string
  created_at: string
  occasion: Occasion
  weather_summary: string | null
  anchor_item_id: string | null
  worn_on: string | null
}
