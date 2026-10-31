import { apiUser, userToday } from '@/lib/auth'
import { claudeAvailable } from '@/lib/claude/client'
import { suggestOutfit, type OutfitItem } from '@/lib/claude/outfit-suggester'
import { OUTFIT_COLUMNS, piecesFor } from '@/lib/outfits'
import { DAILY_OUTFIT_CAP, limitsFor } from '@/lib/plan'
import { OCCASIONS } from '@/lib/types'
import { callsToday, recordCall } from '@/lib/usage'
import { BadInput, UUID, badRequest, oneOf, readJson, str } from '@/lib/validate'
import { describeWeather, parseWeatherInput, weatherForPrompt } from '@/lib/weather'

export const maxDuration = 60

// Enough for any real closet. Past this the prompt gets long for little gain.
const MAX_PIECES = 400

// POST { occasion, weather?, anchor_item_id?, avoid_item_ids?, request? }
export async function POST(req: Request) {
  const { supabase, user, plan, tempUnit, unauthorized } = await apiUser()
  if (unauthorized) return unauthorized
  if (!limitsFor(plan).outfits) return Response.json({ error: 'Outfit suggestions are part of Pro.', code: 'pro' }, { status: 403 })

  try {
    const body = await readJson(req)
    const occasion = oneOf(body.occasion, 'Occasion', OCCASIONS)
    const weather = parseWeatherInput(body.weather)
    const request = str(body.request, 'Extra request', { max: 200 })
    const anchorId = typeof body.anchor_item_id === 'string' && UUID.test(body.anchor_item_id) ? body.anchor_item_id : null
    const avoidIds = Array.isArray(body.avoid_item_ids) ? body.avoid_item_ids.filter((x): x is string => typeof x === 'string' && UUID.test(x)).slice(0, 10) : []

    if (!claudeAvailable()) return Response.json({ error: 'Outfit suggestions are switched off on this server.' }, { status: 503 })
    if ((await callsToday(supabase, 'outfit')) >= DAILY_OUTFIT_CAP) {
      return Response.json({ error: `That's ${DAILY_OUTFIT_CAP} outfits today. Your closet will still be here tomorrow.` }, { status: 429 })
    }

    const { data } = await supabase
      .from('wardrobe_items')
      .select('id, name, category, subcategory, primary_color, pattern, style_tags, season_appropriate, warmth, wear_count, last_worn_date, added_at')
      .eq('is_active', true)
      .order('last_worn_date', { ascending: false, nullsFirst: false })
      .limit(MAX_PIECES)
    const items = (data ?? []) as OutfitItem[]

    if (anchorId && !items.some((i) => i.id === anchorId)) throw new BadInput("That piece isn't in your closet any more")
    const wearable = new Set(items.map((i) => i.category))
    if (items.length < 3 || !(wearable.has('dress') || (wearable.has('top') && wearable.has('bottom')))) {
      return Response.json({ error: 'Add a few more pieces first, at least a top and a bottom (or a dress), so there is something to put together.', code: 'too_few' }, { status: 400 })
    }

    await recordCall(supabase, user.id, 'outfit')
    const today = userToday()
    const result = await suggestOutfit(items, { occasion, weather: weather ? weatherForPrompt(weather) : null, anchorId, avoidIds, request }, today).catch((e) => {
      console.error('suggestOutfit failed', e)
      return null
    })
    if (!result) return Response.json({ error: "Couldn't put an outfit together just now. Try again in a moment." }, { status: 502 })

    const { data: saved, error } = await supabase
      .from('outfit_suggestions')
      .insert({
        user_id: user.id,
        occasion,
        weather_summary: weather ? describeWeather(weather, tempUnit).slice(0, 200) : null,
        anchor_item_id: anchorId,
        picks: result.picks,
        overall_note: result.overall_note,
        gap_note: result.gap_note,
      })
      .select(OUTFIT_COLUMNS)
      .single()
    if (error || !saved) return Response.json({ error: "Couldn't save the suggestion. Try again." }, { status: 500 })

    return Response.json({ suggestion: saved, pieces: await piecesFor(supabase, [saved]) })
  } catch (e) {
    return badRequest(e)
  }
}
