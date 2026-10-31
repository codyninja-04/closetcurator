import { apiUser, userToday } from '@/lib/auth'
import { BadInput, UUID, badRequest, readJson } from '@/lib/validate'
import { logWears, parseWearDate, parseWearOccasion } from '@/lib/wear'

// POST { date?, occasion? } logs a wear. Date defaults to today.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await readJson(req)
    const day = parseWearDate(body.date, userToday())
    const occasion = parseWearOccasion(body.occasion)

    const { data: item } = await supabase.from('wardrobe_items').select('id').eq('id', params.id).maybeSingle()
    if (!item) return Response.json({ error: 'Not found' }, { status: 404 })

    const inserted = await logWears(supabase, [params.id], day, occasion)
    if (inserted.length === 0) return Response.json({ error: 'Already logged for that day', code: 'duplicate' }, { status: 409 })

    const { data: fresh } = await supabase.from('wardrobe_items').select('wear_count, last_worn_date').eq('id', params.id).single()
    return Response.json({ entry: { id: inserted[0].id, worn_date: day, occasion }, ...fresh }, { status: 201 })
  } catch (e) {
    if (e instanceof BadInput) return badRequest(e)
    console.error('log wear failed', e)
    return Response.json({ error: "Couldn't log that wear. Try again." }, { status: 500 })
  }
}

// DELETE ?entry=<wear id> undoes one wear.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  const entry = new URL(req.url).searchParams.get('entry')
  if (!UUID.test(params.id) || !entry || !UUID.test(entry)) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase.from('wear_log').delete().eq('id', entry).eq('item_id', params.id).select('id').maybeSingle()
  if (error) return Response.json({ error: "Couldn't undo that. Try again." }, { status: 500 })
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: fresh } = await supabase.from('wardrobe_items').select('wear_count, last_worn_date').eq('id', params.id).single()
  return Response.json({ ok: true, ...fresh })
}
