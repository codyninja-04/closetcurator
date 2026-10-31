import type { SupabaseClient } from '@supabase/supabase-js'
import { addDays } from './dates'
import { computeAnalytics } from './analytics'
import type { WearOccasion } from './types'

// Loads what computeAnalytics needs. Wears only go back as far as the charts
// look, so a long history doesn't slow the page down.
export async function loadAnalytics(supabase: SupabaseClient, today: string) {
  const [{ data: items }, { data: wears }] = await Promise.all([
    supabase.from('wardrobe_items').select('id, name, category, primary_color, color_hex, style_tags, wear_count, last_worn_date, added_at, is_active, photo_url'),
    supabase
      .from('wear_log')
      .select('item_id, worn_date, occasion')
      .gte('worn_date', addDays(today, -120))
      .order('worn_date', { ascending: false })
      .limit(10000),
  ])
  const rows = items ?? []
  return { items: rows, analytics: computeAnalytics(rows, (wears ?? []) as { item_id: string; worn_date: string; occasion: WearOccasion | null }[], today) }
}
