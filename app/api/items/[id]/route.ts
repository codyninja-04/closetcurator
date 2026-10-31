import { apiUser } from '@/lib/auth'
import { ITEM_COLUMNS, countActiveItems, parseItemFields } from '@/lib/items'
import { removePhotos } from '@/lib/photos/server'
import { limitsFor } from '@/lib/plan'
import { UUID, badRequest, bool, readJson } from '@/lib/validate'

// PATCH any editable field, plus is_active to archive or restore a piece.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { supabase, plan, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await readJson(req)
    const update: Record<string, unknown> = parseItemFields(body, { partial: true })
    if ('is_active' in body) {
      update.is_active = bool(body.is_active)
      const limit = limitsFor(plan).items
      if (update.is_active && Number.isFinite(limit) && (await countActiveItems(supabase)) >= limit) {
        return Response.json({ error: `The free plan holds ${limit} active items. Archive something else first.` }, { status: 403 })
      }
    }
    if (Object.keys(update).length === 0) return Response.json({ error: 'Nothing to change' }, { status: 400 })

    const { data, error } = await supabase.from('wardrobe_items').update(update).eq('id', params.id).select(ITEM_COLUMNS).maybeSingle()
    if (error) return Response.json({ error: "Couldn't save the change. Try again." }, { status: 500 })
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ item: data })
  } catch (e) {
    return badRequest(e)
  }
}

// Deletes the piece, its wear history (by cascade) and its photo.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!UUID.test(params.id)) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase.from('wardrobe_items').delete().eq('id', params.id).select('photo_url').maybeSingle()
  if (error) return Response.json({ error: "Couldn't delete it. Try again." }, { status: 500 })
  if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
  await removePhotos(supabase, [data.photo_url])
  return Response.json({ ok: true })
}
