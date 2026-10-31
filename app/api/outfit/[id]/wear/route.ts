import { apiUser, userToday } from '@/lib/auth'
import type { OutfitPick } from '@/lib/types'
import { BadInput, UUID, badRequest, readJson } from '@/lib/validate'
import { logWears, parseWearDate } from '@/lib/wear'

// POST { date? } logs every piece of a suggested outfit as worn, tagged with
// the outfit's occasion, and marks the suggestion as the one they went with.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await readJson(req)
    const day = parseWearDate(body.date, userToday())

    const { data: outfit } = await supabase.from('outfit_suggestions').select('id, occasion, picks').eq('id', params.id).maybeSingle()
    if (!outfit) return Response.json({ error: 'Not found' }, { status: 404 })

    const ids = ((outfit.picks ?? []) as OutfitPick[]).map((p) => p.item_id)
    const { data: live } = await supabase.from('wardrobe_items').select('id').in('id', ids).eq('is_active', true)
    const liveIds = (live ?? []).map((r) => r.id as string)
    if (liveIds.length === 0) return Response.json({ error: 'None of these pieces are in your closet any more.' }, { status: 400 })

    const inserted = await logWears(supabase, liveIds, day, outfit.occasion)
    await supabase.from('outfit_suggestions').update({ worn_on: day }).eq('id', params.id)
    return Response.json({ logged: inserted.length, worn_on: day })
  } catch (e) {
    if (e instanceof BadInput) return badRequest(e)
    console.error('log outfit failed', e)
    return Response.json({ error: "Couldn't log the outfit. Try again." }, { status: 500 })
  }
}
