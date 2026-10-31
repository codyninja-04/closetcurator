'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { postJson } from '@/lib/api'
import { CATEGORY_LABELS, OCCASION_LABELS, SEASON_LABELS, STYLE_LABELS, WARMTH_LABELS, describeItem, idleDays, lastWornLabel, wearStatus } from '@/lib/closet'
import { addDays, prettyDate } from '@/lib/dates'
import { WEAR_OCCASIONS, type WearEntry, type WearOccasion } from '@/lib/types'
import { BACKDATE_DAYS } from '@/lib/wear'
import { GarmentIcon } from './GarmentIcon'
import { ItemFieldsForm, draftToBody, type ItemDraft } from './ItemFieldsForm'
import type { ClosetItem } from './ItemCard'
import { WearCalendar } from './WearCalendar'
import { WearLine } from './WearStatus'

function toDraft(item: ClosetItem): ItemDraft {
  return {
    name: item.name,
    category: item.category,
    subcategory: item.subcategory ?? '',
    primary_color: item.primary_color ?? '',
    color_hex: item.color_hex,
    pattern: item.pattern ?? '',
    style_tags: item.style_tags ?? [],
    season_appropriate: item.season_appropriate ?? ['year_round'],
    warmth: item.warmth,
    brand: item.brand ?? '',
    notes: item.notes ?? '',
  }
}

export function ItemDetail({ item: initial, wears: initialWears, today }: { item: ClosetItem; wears: WearEntry[]; today: string }) {
  const router = useRouter()
  const [item, setItem] = useState(initial)
  const [wears, setWears] = useState(initialWears)
  const [occasion, setOccasion] = useState<WearOccasion | null>(null)
  const [otherDay, setOtherDay] = useState(false)
  const [day, setDay] = useState(addDays(today, -1))
  const [logging, setLogging] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => toDraft(initial))
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = wearStatus(item, today)
  const wornDays = useMemo(() => new Set(wears.map((w) => w.worn_date)), [wears])
  const wornToday = wornDays.has(today)
  const idle = idleDays(item, today)

  async function logWear(date: string) {
    setLogging(true)
    setError(null)
    try {
      const res = await postJson<{ entry: WearEntry; wear_count: number; last_worn_date: string | null }>(`/api/items/${item.id}/wear`, { date, occasion })
      setWears((list) => [{ ...res.entry, item_id: item.id, created_at: new Date().toISOString() }, ...list].sort((a, b) => b.worn_date.localeCompare(a.worn_date)))
      setItem((cur) => ({ ...cur, wear_count: res.wear_count, last_worn_date: res.last_worn_date }))
      setOtherDay(false)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLogging(false)
    }
  }

  async function undo(entry: WearEntry) {
    setError(null)
    try {
      const res = await postJson<{ wear_count: number; last_worn_date: string | null }>(`/api/items/${item.id}/wear?entry=${entry.id}`, {}, 'DELETE')
      setWears((list) => list.filter((w) => w.id !== entry.id))
      setItem((cur) => ({ ...cur, wear_count: res.wear_count, last_worn_date: res.last_worn_date }))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function saveEdit() {
    setSaving(true)
    setError(null)
    try {
      const res = await postJson<{ item: ClosetItem }>(`/api/items/${item.id}`, draftToBody(draft), 'PATCH')
      setItem((cur) => ({ ...cur, ...res.item, photo: cur.photo }))
      setEditing(false)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function setActive(active: boolean) {
    setError(null)
    try {
      const res = await postJson<{ item: ClosetItem }>(`/api/items/${item.id}`, { is_active: active }, 'PATCH')
      setItem((cur) => ({ ...cur, ...res.item, photo: cur.photo }))
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function remove() {
    setError(null)
    try {
      await postJson(`/api/items/${item.id}`, {}, 'DELETE')
      router.push('/closet')
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const tags = [
    CATEGORY_LABELS[item.category].one,
    ...(item.style_tags ?? []).map((t) => STYLE_LABELS[t]),
    ...(item.season_appropriate ?? []).map((s) => SEASON_LABELS[s]),
    WARMTH_LABELS[item.warmth],
  ]

  return (
    <div>
      <Link href={item.is_active ? '/closet' : '/closet?view=archived'} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <span aria-hidden>←</span> {item.is_active ? 'Closet' : 'Archived'}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
        <div className="lg:sticky lg:top-10 lg:self-start">
          <div className="photo-frame aspect-[4/5] rounded-3xl">
            {item.photo ? (
              <img src={item.photo} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-strong">
                <GarmentIcon category={item.category} className="h-24 w-24" strokeWidth={0.9} />
              </div>
            )}
            {!item.is_active && <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">Archived</span>}
          </div>
        </div>

        <div className="min-w-0">
          <p className="label flex items-center gap-2">
            {item.color_hex && <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: item.color_hex }} />}
            {describeItem(item)}
            {item.brand && <span className="normal-case tracking-normal text-muted">· {item.brand}</span>}
          </p>
          <h1 className="heading mt-2 text-4xl leading-[1.05] sm:text-5xl">{item.name}</h1>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>

          <dl className="mt-7 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface">
            <div className="p-4">
              <dt className="label">Worn</dt>
              <dd className="figure mt-1.5 text-2xl">{item.wear_count}×</dd>
            </div>
            <div className="p-4">
              <dt className="label">{item.last_worn_date ? 'Last on' : 'Idle for'}</dt>
              <dd className="mt-1.5 text-sm font-medium leading-tight">
                {item.last_worn_date ? prettyDate(item.last_worn_date) : `${idle} ${idle === 1 ? 'day' : 'days'}`}
                <WearLine status={status} label={lastWornLabel(item.last_worn_date, today)} className="mt-1" />
              </dd>
            </div>
            <div className="p-4">
              <dt className="label">Added</dt>
              <dd className="mt-1.5 text-sm font-medium">{prettyDate(item.added_at.slice(0, 10), { year: true })}</dd>
            </div>
          </dl>

          {status === 'unused' && item.is_active && (
            <div className="mt-4 rounded-2xl border border-unused/30 bg-unused-soft/40 p-4 text-sm">
              <p className="font-semibold text-unused-ink">{item.last_worn_date ? `Not worn in ${idle} days` : `Not worn since you added it ${idle} days ago`}</p>
              <p className="mt-1 text-muted">Wear it this week, or let it go to someone who will.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/outfit?anchor=${item.id}`} className="btn-ghost py-1.5 text-xs">
                  Build an outfit around it
                </Link>
                <button type="button" className="btn-quiet py-1.5 text-xs" onClick={() => setActive(false)}>
                  Passed it on, archive it
                </button>
              </div>
            </div>
          )}

          {item.is_active && (
            <section className="card mt-6 p-5">
              <div className="flex flex-wrap gap-1.5">
                {WEAR_OCCASIONS.map((o) => (
                  <button key={o} type="button" onClick={() => setOccasion(occasion === o ? null : o)} className={occasion === o ? 'toggle-chip-on' : 'toggle-chip-off'} aria-pressed={occasion === o}>
                    {OCCASION_LABELS[o]}
                  </button>
                ))}
              </div>
              <p className="hint">Optional. Tag what it was for and the insights page can show what you dress for most.</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {otherDay ? (
                  <>
                    <label className="sr-only" htmlFor="wear-day">
                      Day worn
                    </label>
                    <input id="wear-day" type="date" className="input w-auto py-2" value={day} min={addDays(today, -BACKDATE_DAYS)} max={today} onChange={(e) => setDay(e.target.value)} />
                    <button type="button" className="btn-primary" disabled={logging || !day || wornDays.has(day)} onClick={() => logWear(day)}>
                      {wornDays.has(day) ? 'Already logged' : logging ? 'Logging…' : 'Log that day'}
                    </button>
                    <button type="button" className="btn-quiet" onClick={() => setOtherDay(false)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className={`${wornToday ? 'btn bg-worn text-white' : 'btn-primary'} flex-1 py-3 sm:flex-none sm:px-8`} disabled={wornToday || logging} onClick={() => logWear(today)}>
                      {wornToday ? '✓ Worn today' : logging ? 'Logging…' : 'Wore it today'}
                    </button>
                    <button type="button" className="btn-quiet" onClick={() => setOtherDay(true)}>
                      A different day
                    </button>
                  </>
                )}
              </div>
            </section>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}

          <section className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="card p-5">
              <WearCalendar days={wornDays} today={today} />
            </div>
            <div className="card p-5">
              <p className="label">History</p>
              {wears.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No wears logged yet.</p>
              ) : (
                <ul className="mt-2 max-h-48 divide-y divide-line overflow-y-auto pr-1">
                  {wears.map((w) => (
                    <li key={w.id} className="group flex items-center justify-between gap-2 py-2 text-sm">
                      <span className="figure">{prettyDate(w.worn_date, { year: w.worn_date.slice(0, 4) !== today.slice(0, 4) })}</span>
                      <span className="flex items-center gap-2">
                        {w.occasion && <span className="text-xs text-muted">{OCCASION_LABELS[w.occasion]}</span>}
                        <button type="button" onClick={() => undo(w)} className="text-xs text-faint hover:text-danger" aria-label={`Remove wear on ${w.worn_date}`}>
                          Remove
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {item.notes && !editing && (
            <section className="mt-6">
              <p className="label">Notes</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{item.notes}</p>
            </section>
          )}

          <section className="mt-8 border-t border-line pt-6">
            {editing ? (
              <div className="card p-5 sm:p-6">
                <ItemFieldsForm value={draft} onChange={setDraft} />
                <div className="mt-6 flex gap-2">
                  <button type="button" className="btn-primary" disabled={saving} onClick={saveEdit}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    className="btn-quiet"
                    onClick={() => {
                      setDraft(toDraft(item))
                      setEditing(false)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {item.is_active && (
                  <Link href={`/outfit?anchor=${item.id}`} className="btn-primary">
                    Build an outfit around this
                  </Link>
                )}
                <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
                  Edit details
                </button>
                <button type="button" className="btn-ghost" onClick={() => setActive(!item.is_active)}>
                  {item.is_active ? 'Archive' : 'Back in the closet'}
                </button>
                {confirmDelete ? (
                  <span className="flex gap-2">
                    <button type="button" className="btn-danger" onClick={remove}>
                      Delete for good
                    </button>
                    <button type="button" className="btn-quiet" onClick={() => setConfirmDelete(false)}>
                      Keep it
                    </button>
                  </span>
                ) : (
                  <button type="button" className="btn-quiet text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setConfirmDelete(true)}>
                    Delete
                  </button>
                )}
              </div>
            )}
            {!editing && <p className="hint mt-3">Archive keeps the wear history for your insights. Delete removes the piece, its photo and every logged wear.</p>}
          </section>
        </div>
      </div>
    </div>
  )
}
