import type Anthropic from '@anthropic-ai/sdk'
import { CATEGORIES, SEASONS, STYLE_TAGS, WARMTH, type Catalog, type Category, type Season, type StyleTag, type Warmth } from '../types'
import { CLAUDE_MODEL, anthropic } from './client'

const SYSTEM = `You catalog clothing for someone's personal digital wardrobe. They photograph one piece at a time, usually laid flat, on a hanger or worn in a mirror selfie.

Describe the main garment in the photo, not the background, the hanger or the person wearing it. If several pieces are visible, catalog the one that is most clearly the subject. If there is no clothing, shoe, bag or accessory in the photo, set is_clothing to false and fill the rest with your best guess.

Fields:
- name: a short label they would recognise on a hanger, 2 to 5 words, colour first. "Navy oxford shirt", "Black leather Chelsea boots", "Cream cable knit jumper". No brand in the name.
- category: one of top, bottom, dress, outerwear, shoes, accessory, bag. Jumpsuits count as dress. Blazers, jackets, coats and cardigans worn open over a top count as outerwear. Belts, scarves, hats, ties, jewellery and watches are accessories.
- subcategory: the specific type in plain words, e.g. "button-down shirt", "chinos", "midi skirt", "running shoes", "tote".
- primary_color: the dominant colour as a common name ("navy", "olive", "cream", "charcoal", "burgundy"). Use two words only when one isn't enough ("light blue").
- color_hex: a hex swatch close to that colour as it would look in good daylight, e.g. "#1F2A44".
- pattern: solid, striped, checked, plaid, floral, polka dot, graphic, camo, animal print, colour block, textured or another short word.
- style_tags: one to three from casual, smart_casual, business, formal, sporty, streetwear. Choose what it is genuinely worn for.
- season_appropriate: year_round, or the seasons it suits (spring, summer, autumn, winter). Linen and shorts lean summer, heavy wool and down lean winter.
- warmth: light (tees, linen, sandals), medium (most shirts, jeans, light knits), or warm (coats, heavy knits, boots lined for cold).
- brand: only if a logo or label is clearly readable in the photo, otherwise null. Never guess a brand from the style.

Always answer by calling the record_item tool.`

const TOOL: Anthropic.Tool = {
  name: 'record_item',
  description: 'Record the catalog entry for the clothing item in the photo.',
  input_schema: {
    type: 'object',
    properties: {
      is_clothing: { type: 'boolean' },
      name: { type: 'string' },
      category: { type: 'string', enum: [...CATEGORIES] },
      subcategory: { type: 'string' },
      primary_color: { type: 'string' },
      color_hex: { type: 'string' },
      pattern: { type: 'string' },
      style_tags: { type: 'array', items: { type: 'string', enum: [...STYLE_TAGS] } },
      season_appropriate: { type: 'array', items: { type: 'string', enum: [...SEASONS] } },
      warmth: { type: 'string', enum: [...WARMTH] },
      brand: { type: ['string', 'null'] },
    },
    required: ['is_clothing', 'name', 'category', 'subcategory', 'primary_color', 'color_hex', 'pattern', 'style_tags', 'season_appropriate', 'warmth', 'brand'],
  },
}

function text(v: unknown, max: number): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

function pick<T extends string>(v: unknown, options: readonly T[]): T | null {
  return typeof v === 'string' && (options as readonly string[]).includes(v) ? (v as T) : null
}

function pickMany<T extends string>(v: unknown, options: readonly T[], max: number): T[] {
  if (!Array.isArray(v)) return []
  return Array.from(new Set(v.map((x) => pick(x, options)).filter((x): x is T => x !== null))).slice(0, max)
}

export function cleanHex(v: unknown): string | null {
  const s = text(v, 9)
  return /^#[0-9a-f]{6}$/i.test(s) ? s.toUpperCase() : null
}

export type CatalogOutcome = { ok: true; catalog: Catalog } | { ok: false; reason: 'not_clothing' | 'unreadable' }

// Turn the tool call into a Catalog the form can show, or say why not. Kept
// separate so it can be tested without calling the API.
export function parseCatalog(input: unknown): CatalogOutcome {
  if (!input || typeof input !== 'object') return { ok: false, reason: 'unreadable' }
  const r = input as Record<string, unknown>
  if (r.is_clothing === false) return { ok: false, reason: 'not_clothing' }

  const category = pick<Category>(r.category, CATEGORIES)
  if (!category) return { ok: false, reason: 'unreadable' }

  let seasons = pickMany<Season>(r.season_appropriate, SEASONS, 4)
  // "Year round" plus specific seasons contradicts itself. Keep the specific ones.
  if (seasons.length > 1) seasons = seasons.filter((s) => s !== 'year_round')
  if (seasons.length === 0 || seasons.length === 4) seasons = ['year_round']

  const subcategory = text(r.subcategory, 60).toLowerCase()
  const primary_color = text(r.primary_color, 40).toLowerCase()
  const brand = text(r.brand, 60)
  const fallbackName = [primary_color, subcategory].filter(Boolean).join(' ')
  const name = text(r.name, 80) || fallbackName || 'Untitled piece'

  return {
    ok: true,
    catalog: {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      category,
      subcategory,
      primary_color,
      color_hex: cleanHex(r.color_hex),
      pattern: text(r.pattern, 40).toLowerCase() || 'solid',
      style_tags: pickMany<StyleTag>(r.style_tags, STYLE_TAGS, 3),
      season_appropriate: seasons,
      warmth: pick<Warmth>(r.warmth, WARMTH) ?? 'medium',
      brand: brand && brand.toLowerCase() !== 'null' && brand.toLowerCase() !== 'unknown' ? brand : null,
    },
  }
}

export async function catalogItem(image: { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }): Promise<CatalogOutcome> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: 'tool', name: TOOL.name },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } },
          { type: 'text', text: 'Catalog this piece.' },
        ],
      },
    ],
  })

  const block = response.content.find((b) => b.type === 'tool_use')
  return block && block.type === 'tool_use' ? parseCatalog(block.input) : { ok: false, reason: 'unreadable' }
}
