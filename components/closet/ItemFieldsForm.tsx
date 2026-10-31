'use client'

import { useId } from 'react'
import { CATEGORY_LABELS, SEASON_LABELS, STYLE_LABELS, WARMTH_LABELS } from '@/lib/closet'
import { CATEGORIES, SEASONS, STYLE_TAGS, WARMTH, type Category, type Season, type StyleTag, type Warmth } from '@/lib/types'
import { GarmentIcon } from './GarmentIcon'

export interface ItemDraft {
  name: string
  category: Category
  subcategory: string
  primary_color: string
  color_hex: string | null
  pattern: string
  style_tags: StyleTag[]
  season_appropriate: Season[]
  warmth: Warmth
  brand: string
  notes: string
}

export const EMPTY_DRAFT: ItemDraft = {
  name: '',
  category: 'top',
  subcategory: '',
  primary_color: '',
  color_hex: null,
  pattern: 'solid',
  style_tags: [],
  season_appropriate: ['year_round'],
  warmth: 'medium',
  brand: '',
  notes: '',
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

// The editable catalog for one piece, shared by the add screen and the item
// page. Claude fills it in first, the person has the final say.
export function ItemFieldsForm({ value, onChange, compact = false }: { value: ItemDraft; onChange: (next: ItemDraft) => void; compact?: boolean }) {
  const id = useId()
  const set = <K extends keyof ItemDraft>(key: K, v: ItemDraft[K]) => onChange({ ...value, [key]: v })

  function toggleSeason(s: Season) {
    if (s === 'year_round') return set('season_appropriate', ['year_round'])
    const next = toggle(
      value.season_appropriate.filter((x) => x !== 'year_round'),
      s,
    )
    set('season_appropriate', next.length === 0 || next.length === 4 ? ['year_round'] : next)
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={`${id}-name`} className="field-label">
          Name
        </label>
        <input id={`${id}-name`} className="input" value={value.name} maxLength={80} placeholder="Navy oxford shirt" onChange={(e) => set('name', e.target.value)} />
      </div>

      <fieldset>
        <legend className="field-label">Category</legend>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => set('category', c)} className={value.category === c ? 'toggle-chip-on' : 'toggle-chip-off'} aria-pressed={value.category === c}>
              <GarmentIcon category={c} className="h-4 w-4" />
              {CATEGORY_LABELS[c].one}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-sub`} className="field-label">
            Type
          </label>
          <input id={`${id}-sub`} className="input" value={value.subcategory} maxLength={60} placeholder="button-down shirt" onChange={(e) => set('subcategory', e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${id}-color`} className="field-label">
            Colour
          </label>
          <div className="flex gap-2">
            <label className="relative h-[42px] w-[42px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line" style={{ background: value.color_hex ?? '#F4F4F5' }} title="Pick a swatch">
              <span className="sr-only">Colour swatch</span>
              <input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={value.color_hex ?? '#a1a1aa'} onChange={(e) => set('color_hex', e.target.value.toUpperCase())} />
            </label>
            <input id={`${id}-color`} className="input" value={value.primary_color} maxLength={40} placeholder="navy" onChange={(e) => set('primary_color', e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-pattern`} className="field-label">
            Pattern
          </label>
          <input id={`${id}-pattern`} className="input" value={value.pattern} maxLength={40} placeholder="solid" onChange={(e) => set('pattern', e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${id}-brand`} className="field-label">
            Brand <span className="font-normal text-faint">(optional)</span>
          </label>
          <input id={`${id}-brand`} className="input" value={value.brand} maxLength={60} onChange={(e) => set('brand', e.target.value)} />
        </div>
      </div>

      <fieldset>
        <legend className="field-label">Style</legend>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_TAGS.map((t) => {
            const on = value.style_tags.includes(t)
            return (
              <button key={t} type="button" onClick={() => set('style_tags', toggle(value.style_tags, t))} className={on ? 'toggle-chip-on' : 'toggle-chip-off'} aria-pressed={on}>
                {STYLE_LABELS[t]}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className={`grid gap-5 ${compact ? '' : 'sm:grid-cols-[1fr_auto]'}`}>
        <fieldset>
          <legend className="field-label">Seasons</legend>
          <div className="flex flex-wrap gap-1.5">
            {SEASONS.map((s) => {
              const on = value.season_appropriate.includes(s)
              return (
                <button key={s} type="button" onClick={() => toggleSeason(s)} className={on ? 'toggle-chip-on' : 'toggle-chip-off'} aria-pressed={on}>
                  {SEASON_LABELS[s]}
                </button>
              )
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className="field-label">Warmth</legend>
          <div className="inline-flex rounded-full border border-line bg-surface p-0.5">
            {WARMTH.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => set('warmth', w)}
                aria-pressed={value.warmth === w}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${value.warmth === w ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
              >
                {WARMTH_LABELS[w]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div>
        <label htmlFor={`${id}-notes`} className="field-label">
          Notes <span className="font-normal text-faint">(optional)</span>
        </label>
        <textarea id={`${id}-notes`} className="input min-h-[72px] resize-y" value={value.notes} maxLength={500} placeholder="Runs small, dry clean only, the one from the wedding…" onChange={(e) => set('notes', e.target.value)} />
      </div>
    </div>
  )
}

export function draftToBody(d: ItemDraft) {
  return {
    name: d.name.trim() || [d.primary_color, d.subcategory].filter(Boolean).join(' ') || 'Untitled piece',
    category: d.category,
    subcategory: d.subcategory,
    primary_color: d.primary_color,
    color_hex: d.color_hex,
    pattern: d.pattern,
    style_tags: d.style_tags,
    season_appropriate: d.season_appropriate,
    warmth: d.warmth,
    brand: d.brand,
    notes: d.notes,
  }
}
