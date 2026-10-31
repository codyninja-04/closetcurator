import { apiUser } from '@/lib/auth'
import { catalogItem } from '@/lib/claude/item-cataloger'
import { claudeAvailable } from '@/lib/claude/client'
import { similarItems } from '@/lib/closet'
import { downloadPhoto, signPhotos } from '@/lib/photos/server'
import { isOwnPhotoPath } from '@/lib/photos/shared'
import { DAILY_SCAN_CAP } from '@/lib/plan'
import { callsToday, recordCall } from '@/lib/usage'
import { badRequest, readJson } from '@/lib/validate'

export const maxDuration = 60

// POST { path } where path is a photo the browser just uploaded. Claude reads
// the piece, and the closet is checked for things that look the same so the
// add screen can say "you might already own this".
export async function POST(req: Request) {
  const { supabase, user, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized

  try {
    const body = await readJson(req)
    if (!isOwnPhotoPath(body.path, user.id)) return Response.json({ error: "That photo isn't in your closet folder." }, { status: 400 })

    if (!claudeAvailable()) return Response.json({ error: 'Auto tagging is switched off on this server. Fill the details in yourself.' }, { status: 503 })
    if ((await callsToday(supabase, 'scan')) >= DAILY_SCAN_CAP) {
      return Response.json({ error: `That's ${DAILY_SCAN_CAP} photos read today. Fill this one in by hand, or come back tomorrow.` }, { status: 429 })
    }

    const image = await downloadPhoto(supabase, body.path)
    if (!image) return Response.json({ error: "Couldn't find that photo. Try uploading it again." }, { status: 404 })

    await recordCall(supabase, user.id, 'scan')
    const outcome = await catalogItem(image).catch((e) => {
      console.error('catalogItem failed', e)
      return null
    })
    if (!outcome) return Response.json({ error: "Claude couldn't be reached. Fill the details in yourself, or try again in a minute." }, { status: 502 })
    if (!outcome.ok) {
      const message = outcome.reason === 'not_clothing' ? "That doesn't look like clothing. Try a photo with the piece filling most of the frame." : "Couldn't make out the piece. A plainer background and better light usually help."
      return Response.json({ error: message, reason: outcome.reason }, { status: 422 })
    }

    const { data: closet } = await supabase.from('wardrobe_items').select('id, name, category, subcategory, primary_color, photo_url').eq('is_active', true)
    const similar = similarItems(outcome.catalog, closet ?? []).slice(0, 4)
    const signed = await signPhotos(
      supabase,
      similar.map((s) => s.photo_url),
    )

    return Response.json({
      catalog: outcome.catalog,
      similar: similar.map((s) => ({ id: s.id, name: s.name, photo: signed[s.photo_url] ?? null })),
    })
  } catch (e) {
    return badRequest(e)
  }
}
