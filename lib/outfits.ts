import type { SupabaseClient } from '@supabase/supabase-js'
import type { OutfitSuggestion } from './types'
import { withPhotoUrls } from './photos/server'

export const OUTFIT_COLUMNS = 'id, created_at, occasion, weather_summary, anchor_item_id, picks, overall_note, gap_note, worn_on'

export interface OutfitPiece {
  id: string
  name: string
  category: string
  photo: string | null
  is_active: boolean
}

// Loads the pieces behind a set of suggestions in one query, with photos
// signed. Deleted pieces simply drop out.
export async function piecesFor(supabase: SupabaseClient, suggestions: Pick<OutfitSuggestion, 'picks'>[]): Promise<Record<string, OutfitPiece>> {
  const ids = Array.from(new Set(suggestions.flatMap((s) => (s.picks ?? []).map((p) => p.item_id))))
  if (ids.length === 0) return {}
  const { data } = await supabase.from('wardrobe_items').select('id, name, category, photo_url, is_active').in('id', ids)
  const rows = await withPhotoUrls(supabase, data ?? [])
  return Object.fromEntries(rows.map((r) => [r.id, { id: r.id, name: r.name, category: r.category, photo: r.photo, is_active: r.is_active }]))
}
