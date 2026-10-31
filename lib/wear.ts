import type { SupabaseClient } from '@supabase/supabase-js'
import { addDays } from './dates'
import { WEAR_OCCASIONS, type WearOccasion } from './types'
import { BadInput, dateOrNull } from './validate'

// How far back a wear can be logged. Far enough to catch up after a trip,
// not so far that the stats turn into guesswork.
export const BACKDATE_DAYS = 60

// Picks the day to log. The client sends its own local date; we only accept
// something within the window around the server's idea of today, with a day
// of slack either side for time zones.
export function parseWearDate(v: unknown, serverToday: string): string {
  if (v == null || v === '') return serverToday
  const day = dateOrNull(v)
  if (!day) throw new BadInput('Date should look like 2026-03-14')
  if (day > addDays(serverToday, 1)) throw new BadInput("You can't log a wear in the future")
  if (day < addDays(serverToday, -BACKDATE_DAYS - 1)) throw new BadInput(`Wears can be logged up to ${BACKDATE_DAYS} days back`)
  return day
}

export function parseWearOccasion(v: unknown): WearOccasion | null {
  if (v == null || v === '') return null
  if (typeof v === 'string' && (WEAR_OCCASIONS as readonly string[]).includes(v)) return v as WearOccasion
  throw new BadInput("That occasion isn't one of the options")
}

// Logs a wear for each item. Days already logged are skipped quietly, since
// the unique index means a second tap shouldn't count twice.
export async function logWears(supabase: SupabaseClient, itemIds: string[], wornDate: string, occasion: WearOccasion | null) {
  const rows = itemIds.map((item_id) => ({ item_id, worn_date: wornDate, occasion }))
  const { data, error } = await supabase.from('wear_log').upsert(rows, { onConflict: 'item_id,worn_date', ignoreDuplicates: true }).select('id, item_id')
  if (error) throw error
  return data ?? []
}
