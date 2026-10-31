import { describe, expect, it } from 'vitest'
import { describeItem, idleDays, lastWornLabel, similarItems, wearStatus } from './closet'
import { addDays, daysBetween, todayIn } from './dates'
import { fitWithin, isOwnPhotoPath } from './photos/shared'

const TODAY = '2026-10-31'

describe('wear status', () => {
  it('goes green, grey, then amber as a piece sits', () => {
    expect(wearStatus({ last_worn_date: '2026-10-25', added_at: '2026-01-01T00:00:00Z' }, TODAY)).toBe('recent')
    expect(wearStatus({ last_worn_date: '2026-09-01', added_at: '2026-01-01T00:00:00Z' }, TODAY)).toBe('steady')
    expect(wearStatus({ last_worn_date: '2026-07-01', added_at: '2026-01-01T00:00:00Z' }, TODAY)).toBe('unused')
  })

  it('counts never worn pieces from the day they were added', () => {
    expect(wearStatus({ last_worn_date: null, added_at: '2026-10-20T10:00:00Z' }, TODAY)).toBe('new')
    expect(wearStatus({ last_worn_date: null, added_at: '2026-05-01T10:00:00Z' }, TODAY)).toBe('unused')
    expect(idleDays({ last_worn_date: null, added_at: '2026-10-21T10:00:00Z' }, TODAY)).toBe(10)
  })

  it('labels the last wear in plain words', () => {
    expect(lastWornLabel(null, TODAY)).toBe('Not worn yet')
    expect(lastWornLabel(TODAY, TODAY)).toBe('Worn today')
    expect(lastWornLabel('2026-10-30', TODAY)).toBe('Worn yesterday')
    expect(lastWornLabel('2026-10-01', TODAY)).toBe('Worn 30 days ago')
    expect(lastWornLabel('2026-04-01', TODAY)).toBe('Worn 7 months ago')
  })
})

describe('describeItem', () => {
  it('skips solid and falls back to the category', () => {
    expect(describeItem({ primary_color: 'Navy', pattern: 'solid', subcategory: 'chinos', category: 'bottom' })).toBe('navy chinos')
    expect(describeItem({ primary_color: 'red', pattern: 'Plaid', subcategory: null, category: 'outerwear' })).toBe('red plaid outerwear')
  })
})

describe('similarItems', () => {
  const closet = [
    { id: '1', category: 'top' as const, subcategory: 'crew neck t-shirt', primary_color: 'grey' },
    { id: '2', category: 'top' as const, subcategory: 'hoodie', primary_color: 'light grey' },
    { id: '3', category: 'bottom' as const, subcategory: 'joggers', primary_color: 'grey' },
    { id: '4', category: 'top' as const, subcategory: 't-shirt', primary_color: 'white' },
  ]

  it('matches on category, a colour word and a type word', () => {
    expect(similarItems({ category: 'top', subcategory: 'zip hoodie', primary_color: 'grey' }, closet).map((i) => i.id)).toEqual(['2'])
    expect(similarItems({ category: 'top', subcategory: 'v-neck t-shirt', primary_color: 'grey' }, closet).map((i) => i.id)).toEqual(['1'])
  })

  it('finds nothing without a colour', () => {
    expect(similarItems({ category: 'top', subcategory: 'hoodie', primary_color: '' }, closet)).toEqual([])
  })
})

describe('dates', () => {
  it('does calendar maths in whole days', () => {
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(30)
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('works out today in a time zone and falls back to UTC', () => {
    const now = new Date('2026-10-31T20:00:00Z')
    expect(todayIn('Asia/Singapore', now)).toBe('2026-11-01')
    expect(todayIn('Not/AZone', now)).toBe('2026-10-31')
  })
})

describe('photos', () => {
  const USER = '11111111-1111-1111-1111-111111111111'

  it('shrinks the long edge without upscaling', () => {
    expect(fitWithin(4200, 2800)).toEqual({ width: 1400, height: 933 })
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('only accepts photos in the user items folder', () => {
    expect(isOwnPhotoPath(`${USER}/items/abc-123.jpg`, USER)).toBe(true)
    expect(isOwnPhotoPath(`someone/items/abc.jpg`, USER)).toBe(false)
    expect(isOwnPhotoPath(`${USER}/items/../x.jpg`, USER)).toBe(false)
    expect(isOwnPhotoPath(`${USER}/items/sub/x.jpg`, USER)).toBe(false)
    expect(isOwnPhotoPath(`${USER}/items/notes.txt`, USER)).toBe(false)
  })
})
