import { describe, expect, it } from 'vitest'
import type { Category } from '../types'
import { buildClosetList, buildPrompt, parseOutfit, type OutfitItem } from './outfit-suggester'

function item(id: string, category: Category, extra: Partial<OutfitItem> = {}): OutfitItem {
  return {
    id,
    name: `${category} ${id}`,
    category,
    subcategory: null,
    primary_color: 'black',
    pattern: 'solid',
    style_tags: ['casual'],
    season_appropriate: ['year_round'],
    warmth: 'medium',
    wear_count: 0,
    last_worn_date: null,
    added_at: '2026-01-01T00:00:00Z',
    ...extra,
  }
}

const ITEMS = [item('a', 'top'), item('b', 'top'), item('c', 'bottom'), item('d', 'shoes'), item('e', 'dress'), item('f', 'accessory')]
const { text, aliases } = buildClosetList(ITEMS, '2026-10-31')
const categoryOf = new Map(ITEMS.map((i) => [i.id, i.category]))

describe('buildClosetList', () => {
  it('gives every piece a short alias and its wear history', () => {
    expect(aliases.get('p1')).toBe('a')
    expect(aliases.size).toBe(6)
    expect(text.split('\n')[0]).toContain('p1 | top')
    expect(text).toContain('never worn')
    const worn = buildClosetList([item('x', 'top', { wear_count: 3, last_worn_date: '2026-10-21' })], '2026-10-31').text
    expect(worn).toContain('worn 3x, last 10 days ago')
  })
})

describe('buildPrompt', () => {
  it('names the anchor and the pieces to avoid by alias', () => {
    const reverse = new Map(Array.from(aliases.entries()).map(([k, v]) => [v, k]))
    const prompt = buildPrompt(text, { occasion: 'work', weather: null, anchorId: 'c', avoidIds: ['a', 'c', 'zzz'], request: 'no black' }, (id) => reverse.get(id))
    expect(prompt).toContain('Must include: p3')
    expect(prompt).toContain('Avoid if possible (in the last suggestion): p1\n')
    expect(prompt).toContain('<request>\nno black\n</request>')
  })
})

describe('parseOutfit', () => {
  it('maps aliases to ids and keeps reasoning', () => {
    const out = parseOutfit(
      {
        picks: [
          { id: 'p1', reasoning: 'Clean base.' },
          { id: 'P3', reasoning: 'Matches.' },
          { id: 'p4', reasoning: 'Grounds it.' },
        ],
        overall_note: 'Simple and sharp.',
        gap_note: null,
      },
      aliases,
      categoryOf,
      null,
    )
    expect(out?.picks.map((p) => p.item_id)).toEqual(['a', 'c', 'd'])
    expect(out?.overall_note).toBe('Simple and sharp.')
    expect(out?.gap_note).toBeNull()
  })

  it('drops unknown ids, repeats, a second top and a dress over separates', () => {
    const out = parseOutfit(
      {
        picks: [{ id: 'p1' }, { id: 'p1' }, { id: 'p2' }, { id: 'p99' }, { id: 'p3' }, { id: 'p5' }, { id: 'p4' }],
        overall_note: '',
        gap_note: 'null',
      },
      aliases,
      categoryOf,
      null,
    )
    expect(out?.picks.map((p) => p.item_id)).toEqual(['a', 'c', 'd'])
    expect(out?.gap_note).toBeNull()
  })

  it('puts the anchor back if Claude left it out', () => {
    const out = parseOutfit({ picks: [{ id: 'p5', reasoning: 'x' }, { id: 'p4', reasoning: 'y' }], overall_note: '', gap_note: null }, aliases, categoryOf, 'f')
    expect(out?.picks[0].item_id).toBe('f')
  })

  it('returns null when there is no real outfit', () => {
    expect(parseOutfit({ picks: [{ id: 'p1' }], overall_note: '' }, aliases, categoryOf, null)).toBeNull()
    expect(parseOutfit('nope', aliases, categoryOf, null)).toBeNull()
  })
})
