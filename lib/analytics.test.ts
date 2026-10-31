import { describe, expect, it } from 'vitest'
import { computeAnalytics } from './analytics'
import type { Category, StyleTag } from './types'

const TODAY = '2026-10-31'

function item(id: string, category: Category, opts: { tags?: StyleTag[]; last?: string | null; added?: string; active?: boolean; color?: string } = {}) {
  return {
    id,
    name: id,
    category,
    primary_color: opts.color ?? 'black',
    color_hex: null,
    style_tags: opts.tags ?? ['casual'],
    wear_count: 0,
    last_worn_date: opts.last ?? null,
    added_at: `${opts.added ?? '2026-01-01'}T00:00:00Z`,
    is_active: opts.active ?? true,
  }
}

const items = [
  item('tee', 'top', { last: '2026-10-30' }),
  item('suit', 'outerwear', { tags: ['formal'], last: '2026-03-01' }),
  item('new', 'bottom', { added: '2026-10-01' }),
  item('old', 'shoes', { added: '2026-02-01' }),
  item('gone', 'top', { active: false, last: '2026-10-29' }),
]
const wears = [
  { item_id: 'tee', worn_date: '2026-10-30', occasion: 'work' as const },
  { item_id: 'tee', worn_date: '2026-10-01', occasion: null },
  { item_id: 'tee', worn_date: '2026-06-01', occasion: 'casual' as const },
  { item_id: 'gone', worn_date: '2026-10-29', occasion: 'casual' as const },
]

describe('computeAnalytics', () => {
  const a = computeAnalytics(items, wears, TODAY)

  it('counts only active pieces and the 90 day window', () => {
    expect(a.totals.pieces).toBe(4)
    expect(a.totals.wears90).toBe(2)
    expect(a.totals.wears30).toBe(1)
    expect(a.totals.rotationPct).toBe(25)
    expect(a.totals.neverWorn).toBe(2)
  })

  it('lists idle pieces longest first, including never worn ones added long ago', () => {
    expect(a.unused.map((u) => u.id)).toEqual(['old', 'suit'])
    expect(a.unused[0].neverWorn).toBe(true)
    expect(a.unused[1].neverWorn).toBe(false)
  })

  it('breaks wears down by category with a per piece average', () => {
    const top = a.byCategory.find((c) => c.category === 'top')
    expect(top).toEqual({ category: 'top', pieces: 1, wears: 2, perPiece: 2 })
    expect(a.byCategory.some((c) => c.category === 'dress')).toBe(false)
  })

  it('compares owned and worn share by style', () => {
    const formal = a.styles.find((s) => s.tag === 'formal')
    expect(formal).toEqual({ tag: 'formal', ownedPct: 25, wornPct: 0 })
    const casual = a.styles.find((s) => s.tag === 'casual')
    expect(casual?.wornPct).toBe(100)
  })

  it('treats untagged wears as everyday and builds twelve weeks', () => {
    expect(a.occasions).toEqual([
      { occasion: 'work', wears: 1 },
      { occasion: 'other', wears: 1 },
    ])
    expect(a.weekly).toHaveLength(12)
    expect(a.weekly[11].weekStart).toBe('2026-10-26')
    expect(a.weekly[11].wears).toBe(1)
  })
})
