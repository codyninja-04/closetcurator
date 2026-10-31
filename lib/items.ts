import type { SupabaseClient } from '@supabase/supabase-js'
import { CATEGORIES, SEASONS, STYLE_TAGS, WARMTH, type Season, type StyleTag, type WardrobeItem } from './types'
import { cleanHex } from './claude/item-cataloger'
import { BadInput, oneOf, str } from './validate'

export const ITEM_COLUMNS =
  'id, user_id, added_at, photo_url, name, category, subcategory, primary_color, color_hex, pattern, style_tags, brand, season_appropriate, warmth, notes, wear_count, last_worn_date, is_active'

function list<T extends string>(v: unknown, field: string, options: readonly T[], max: number): T[] {
  if (v == null) return []
  if (!Array.isArray(v)) throw new BadInput(`${field} should be a list`)
  const out = Array.from(new Set(v.filter((x): x is T => typeof x === 'string' && (options as readonly string[]).includes(x))))
  return out.slice(0, max)
}

export type ItemFields = Pick<
  WardrobeItem,
  'name' | 'category' | 'subcategory' | 'primary_color' | 'color_hex' | 'pattern' | 'style_tags' | 'brand' | 'season_appropriate' | 'warmth' | 'notes'
>

// Validates the editable fields of an item. With partial set, only the keys
// present in the body are checked and returned, for PATCH.
export function parseItemFields(body: Record<string, unknown>, opts: { partial?: boolean } = {}): Partial<ItemFields> {
  const has = (k: string) => !opts.partial || k in body
  const out: Partial<ItemFields> = {}
  if (has('name')) out.name = str(body.name, 'Name', { max: 80, required: true })!
  if (has('category')) out.category = oneOf(body.category, 'Category', CATEGORIES)
  if (has('subcategory')) out.subcategory = str(body.subcategory, 'Type', { max: 60 })
  if (has('primary_color')) out.primary_color = str(body.primary_color, 'Colour', { max: 40 })
  if (has('color_hex')) out.color_hex = cleanHex(body.color_hex)
  if (has('pattern')) out.pattern = str(body.pattern, 'Pattern', { max: 40 })
  if (has('style_tags')) out.style_tags = list<StyleTag>(body.style_tags, 'Style', STYLE_TAGS, 6)
  if (has('brand')) out.brand = str(body.brand, 'Brand', { max: 60 })
  if (has('season_appropriate')) {
    const seasons = list<Season>(body.season_appropriate, 'Seasons', SEASONS, 5)
    out.season_appropriate = seasons.length === 0 ? ['year_round'] : seasons
  }
  if (has('warmth')) out.warmth = body.warmth == null ? 'medium' : oneOf(body.warmth, 'Warmth', WARMTH)
  if (has('notes')) out.notes = str(body.notes, 'Notes', { max: 500 })
  return out
}

export async function countActiveItems(supabase: SupabaseClient): Promise<number> {
  const { count } = await supabase.from('wardrobe_items').select('id', { count: 'exact', head: true }).eq('is_active', true)
  return count ?? 0
}
