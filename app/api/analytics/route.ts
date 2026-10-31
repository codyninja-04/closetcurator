import { apiUser, userToday } from '@/lib/auth'
import { loadAnalytics } from '@/lib/analytics-data'
import { limitsFor } from '@/lib/plan'

// The same numbers the insights page shows, as JSON.
export async function GET() {
  const { supabase, plan, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!limitsFor(plan).analytics) return Response.json({ error: 'Wear analytics are part of Pro.', code: 'pro' }, { status: 403 })

  const { analytics } = await loadAnalytics(supabase, userToday())
  return Response.json({ analytics })
}
