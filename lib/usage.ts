import type { SupabaseClient } from '@supabase/supabase-js'
import { startOfUtcDayIso } from './plan'

export type AiKind = 'scan' | 'outfit'

export async function callsToday(supabase: SupabaseClient, kind: AiKind): Promise<number> {
  const { count } = await supabase.from('ai_calls').select('id', { count: 'exact', head: true }).eq('kind', kind).gte('created_at', startOfUtcDayIso())
  return count ?? 0
}

// Recorded before the call goes out, so a failed call still counts. That's
// deliberate: a client stuck retrying a failing photo should still hit the cap.
export async function recordCall(supabase: SupabaseClient, userId: string, kind: AiKind) {
  await supabase.from('ai_calls').insert({ user_id: userId, kind })
}
