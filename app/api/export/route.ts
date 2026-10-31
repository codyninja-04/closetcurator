import { apiUser, userToday } from '@/lib/auth'
import { ITEM_COLUMNS } from '@/lib/items'
import { OUTFIT_COLUMNS } from '@/lib/outfits'
import { signPhotos } from '@/lib/photos/server'

// Everything the user has, as one JSON download.
export async function GET() {
  const { supabase, user, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  const [{ data: items }, { data: wears }, { data: outfits }] = await Promise.all([
    supabase.from('wardrobe_items').select(ITEM_COLUMNS).order('added_at'),
    supabase.from('wear_log').select('id, item_id, worn_date, occasion, created_at').order('worn_date'),
    supabase.from('outfit_suggestions').select(OUTFIT_COLUMNS).order('created_at'),
  ])
  const signed = await signPhotos(
    supabase,
    (items ?? []).map((i) => i.photo_url),
  )

  const body = {
    exported_at: new Date().toISOString(),
    account: user.email,
    items: (items ?? []).map(({ user_id: _user, ...i }) => ({ ...i, photo_link: signed[i.photo_url] ?? null })),
    wear_log: wears ?? [],
    outfits: outfits ?? [],
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="closetcurator-${userToday()}.json"`,
    },
  })
}
