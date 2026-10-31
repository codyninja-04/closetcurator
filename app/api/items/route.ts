import { apiUser } from '@/lib/auth'
import { ITEM_COLUMNS, countActiveItems, parseItemFields } from '@/lib/items'
import { withPhotoUrls } from '@/lib/photos/server'
import { isOwnPhotoPath } from '@/lib/photos/shared'
import { limitsFor } from '@/lib/plan'
import { CATEGORIES } from '@/lib/types'
import { badRequest, readJson } from '@/lib/validate'

// GET ?category=top&archived=1 lists the closet with signed photo urls.
export async function GET(req: Request) {
  const { supabase, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  const params = new URL(req.url).searchParams
  let query = supabase
    .from('wardrobe_items')
    .select(ITEM_COLUMNS)
    .eq('is_active', params.get('archived') !== '1')
    .order('added_at', { ascending: false })
  const category = params.get('category')
  if (category && (CATEGORIES as readonly string[]).includes(category)) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return Response.json({ error: "Couldn't load your closet." }, { status: 500 })
  return Response.json({ items: await withPhotoUrls(supabase, data ?? []) })
}

// POST { path, name, category, ... } saves a new piece.
export async function POST(req: Request) {
  const { supabase, user, plan, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  try {
    const body = await readJson(req)
    if (!isOwnPhotoPath(body.path, user.id)) return Response.json({ error: "That photo isn't in your closet folder." }, { status: 400 })
    const fields = parseItemFields(body)

    const limit = limitsFor(plan).items
    if (Number.isFinite(limit) && (await countActiveItems(supabase)) >= limit) {
      return Response.json({ error: `The free plan holds ${limit} items. Archive something you've passed on, or go Pro for unlimited.`, code: 'limit' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert({ ...fields, user_id: user.id, photo_url: body.path })
      .select('id')
      .single()
    if (error || !data) return Response.json({ error: "Couldn't save that piece. Try again." }, { status: 500 })
    return Response.json({ id: data.id }, { status: 201 })
  } catch (e) {
    return badRequest(e)
  }
}
