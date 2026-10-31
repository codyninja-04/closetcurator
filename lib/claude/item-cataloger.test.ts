import { describe, expect, it } from 'vitest'
import { cleanHex, parseCatalog } from './item-cataloger'

const GOOD = {
  is_clothing: true,
  name: 'navy oxford shirt',
  category: 'top',
  subcategory: 'Button-Down Shirt',
  primary_color: 'Navy',
  color_hex: '#1f2a44',
  pattern: 'Solid',
  style_tags: ['smart_casual', 'business', 'smart_casual', 'glam'],
  season_appropriate: ['year_round'],
  warmth: 'medium',
  brand: null,
}

describe('parseCatalog', () => {
  it('normalises a good answer', () => {
    const out = parseCatalog(GOOD)
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.catalog).toEqual({
      name: 'Navy oxford shirt',
      category: 'top',
      subcategory: 'button-down shirt',
      primary_color: 'navy',
      color_hex: '#1F2A44',
      pattern: 'solid',
      style_tags: ['smart_casual', 'business'],
      season_appropriate: ['year_round'],
      warmth: 'medium',
      brand: null,
    })
  })

  it('says so when the photo is not clothing', () => {
    expect(parseCatalog({ ...GOOD, is_clothing: false })).toEqual({ ok: false, reason: 'not_clothing' })
  })

  it('rejects an unknown category', () => {
    expect(parseCatalog({ ...GOOD, category: 'jumpsuit' })).toEqual({ ok: false, reason: 'unreadable' })
    expect(parseCatalog(null)).toEqual({ ok: false, reason: 'unreadable' })
  })

  it('drops year_round when specific seasons are given, and collapses all four', () => {
    const a = parseCatalog({ ...GOOD, season_appropriate: ['year_round', 'summer'] })
    expect(a.ok && a.catalog.season_appropriate).toEqual(['summer'])
    const b = parseCatalog({ ...GOOD, season_appropriate: ['spring', 'summer', 'autumn', 'winter'] })
    expect(b.ok && b.catalog.season_appropriate).toEqual(['year_round'])
  })

  it('falls back sensibly on missing fields', () => {
    const out = parseCatalog({ category: 'shoes', primary_color: 'white', subcategory: 'sneakers', warmth: 'scorching', brand: 'unknown' })
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.catalog.name).toBe('White sneakers')
    expect(out.catalog.warmth).toBe('medium')
    expect(out.catalog.pattern).toBe('solid')
    expect(out.catalog.brand).toBeNull()
  })
})

describe('cleanHex', () => {
  it('accepts six digit hex only', () => {
    expect(cleanHex('#abcdef')).toBe('#ABCDEF')
    expect(cleanHex('#abc')).toBeNull()
    expect(cleanHex('navy')).toBeNull()
  })
})
