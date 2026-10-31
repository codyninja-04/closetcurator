'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { postJson } from '@/lib/api'
import { uploadItemPhoto } from '@/lib/photos/client'
import { PHOTO_BUCKET } from '@/lib/photos/shared'
import { createClient } from '@/lib/supabase/client'
import type { Catalog } from '@/lib/types'
import { EMPTY_DRAFT, ItemFieldsForm, draftToBody, type ItemDraft } from '../closet/ItemFieldsForm'

type Status = 'queued' | 'uploading' | 'scanning' | 'review' | 'saving' | 'saved' | 'failed'

interface Similar {
  id: string
  name: string
  photo: string | null
}

interface Entry {
  key: string
  file: File
  preview: string
  status: Status
  path: string | null
  draft: ItemDraft
  similar: Similar[]
  // Shown above the form when Claude couldn't fill it in.
  note: string | null
  error: string | null
  savedId: string | null
}

const PARALLEL = 2

function fromCatalog(c: Catalog): ItemDraft {
  return { ...c, brand: c.brand ?? '', notes: '' }
}

export function AddQueue({ atLimit, remaining }: { atLimit: boolean; remaining: number | null }) {
  const input = useRef<HTMLInputElement>(null)
  const started = useRef(new Set<string>())
  const [entries, setEntries] = useState<Entry[]>([])
  const [dragging, setDragging] = useState(false)

  const patch = useCallback((key: string, change: Partial<Entry> | ((e: Entry) => Partial<Entry>)) => {
    setEntries((list) => list.map((e) => (e.key === key ? { ...e, ...(typeof change === 'function' ? change(e) : change) } : e)))
  }, [])

  const scan = useCallback(
    async (key: string, path: string) => {
      patch(key, { status: 'scanning', note: null, error: null })
      try {
        const res = await postJson<{ catalog: Catalog; similar: Similar[] }>('/api/items/scan', { path })
        patch(key, { status: 'review', draft: fromCatalog(res.catalog), similar: res.similar })
      } catch (e) {
        patch(key, (cur) => ({ status: 'review', note: (e as Error).message, draft: cur.draft.name ? cur.draft : EMPTY_DRAFT }))
      }
    },
    [patch],
  )

  const run = useCallback(
    async (entry: Entry) => {
      patch(entry.key, { status: 'uploading', error: null })
      let path: string
      try {
        path = await uploadItemPhoto(entry.file)
      } catch (e) {
        patch(entry.key, { status: 'failed', error: (e as Error).message })
        return
      }
      patch(entry.key, { path })
      await scan(entry.key, path)
    },
    [patch, scan],
  )

  // Feed the queue a couple at a time so a dozen photos don't all hit the
  // network and Claude at once.
  useEffect(() => {
    const busy = entries.filter((e) => e.status === 'uploading' || e.status === 'scanning').length
    const next = entries.filter((e) => e.status === 'queued' && !started.current.has(e.key)).slice(0, Math.max(0, PARALLEL - busy))
    for (const e of next) {
      started.current.add(e.key)
      void run(e)
    }
  }, [entries, run])

  function addFiles(files: FileList | File[] | null) {
    if (!files) return
    const list = Array.from(files).slice(0, 24)
    setEntries((cur) => [
      ...cur,
      ...list.map<Entry>((file) => ({
        key: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: 'queued',
        path: null,
        draft: EMPTY_DRAFT,
        similar: [],
        note: null,
        error: null,
        savedId: null,
      })),
    ])
    if (input.current) input.current.value = ''
  }

  async function save(entry: Entry) {
    if (!entry.path) return
    patch(entry.key, { status: 'saving', error: null })
    try {
      const res = await postJson<{ id: string }>('/api/items', { path: entry.path, ...draftToBody(entry.draft) })
      patch(entry.key, { status: 'saved', savedId: res.id })
    } catch (e) {
      patch(entry.key, { status: 'review', error: (e as Error).message })
    }
  }

  async function discard(entry: Entry) {
    setEntries((list) => list.filter((e) => e.key !== entry.key))
    URL.revokeObjectURL(entry.preview)
    if (entry.path && entry.status !== 'saved') await createClient().storage.from(PHOTO_BUCKET).remove([entry.path])
  }

  function retryUpload(entry: Entry) {
    started.current.delete(entry.key)
    patch(entry.key, { status: 'queued', error: null })
  }

  const ready = entries.filter((e) => e.status === 'review' && e.path)
  const saved = entries.filter((e) => e.status === 'saved').length
  const working = entries.filter((e) => ['queued', 'uploading', 'scanning'].includes(e.status)).length

  async function saveAll() {
    for (const e of ready) await save(e)
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => addFiles(e.target.files)}
      />

      {atLimit ? (
        <div className="card border-unused/30 bg-unused-soft/40 p-6">
          <p className="heading text-2xl">Your closet is full on the free plan</p>
          <p className="mt-2 text-sm text-muted">Archive pieces you&rsquo;ve passed on, or go Pro for an unlimited closet.</p>
          <Link href="/settings#plan" className="btn-primary mt-4">
            See plans
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            addFiles(e.dataTransfer.files)
          }}
          className={`group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed px-6 text-center transition ${
            entries.length ? 'py-8' : 'py-16 sm:py-20'
          } ${dragging ? 'border-ink bg-sunk' : 'border-strong bg-surface hover:border-ink hover:bg-sunk/50'}`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-lift transition group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z" />
              <circle cx="12" cy="12.5" r="3.5" />
            </svg>
          </span>
          <span className="heading mt-5 text-3xl">{entries.length ? 'Add more photos' : 'Take or choose photos'}</span>
          <span className="mt-2 max-w-md text-sm text-muted">One piece per photo. Pick a whole batch at once if you like, they&rsquo;re read two at a time.</span>
          {remaining != null && <span className="figure mt-3 text-xs text-faint">{remaining} spaces left on the free plan</span>}
        </button>
      )}

      {entries.length === 0 && !atLimit && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['Plain background', 'A bed, the floor or a door. Busy patterns behind it confuse the read.'],
            ['One piece, filling the frame', 'Lay it flat or hang it up. Mirror selfies work but crop to the piece.'],
            ['Shopping?', 'Snap something in a shop to see if you own a lookalike, then discard it.'],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-sm font-semibold">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{b}</p>
            </div>
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {working > 0 && <span className="mr-3">Reading {working}…</span>}
              {saved > 0 && (
                <span>
                  {saved} saved ·{' '}
                  <Link href="/closet" className="font-medium text-ink underline underline-offset-4">
                    see your closet
                  </Link>
                </span>
              )}
            </p>
            {ready.length > 1 && (
              <button type="button" className="btn-primary py-2" onClick={saveAll}>
                Save all {ready.length}
              </button>
            )}
          </div>
          <ul className="space-y-4">
            {entries.map((entry) => (
              <QueueCard key={entry.key} entry={entry} onDraft={(d) => patch(entry.key, { draft: d })} onSave={() => save(entry)} onDiscard={() => discard(entry)} onRescan={() => entry.path && scan(entry.key, entry.path)} onRetry={() => retryUpload(entry)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function QueueCard({
  entry,
  onDraft,
  onSave,
  onDiscard,
  onRescan,
  onRetry,
}: {
  entry: Entry
  onDraft: (d: ItemDraft) => void
  onSave: () => void
  onDiscard: () => void
  onRescan: () => void
  onRetry: () => void
}) {
  if (entry.status === 'saved') {
    return (
      <li className="card flex animate-rise-in items-center gap-4 p-3">
        <img src={entry.preview} alt="" className="h-14 w-12 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{entry.draft.name || 'Saved'}</p>
          <p className="flex items-center gap-1.5 text-xs text-worn-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-worn" /> On the rail
          </p>
        </div>
        {entry.savedId && (
          <Link href={`/closet/${entry.savedId}`} className="btn-quiet py-1.5 text-xs">
            View
          </Link>
        )}
      </li>
    )
  }

  const busy = entry.status === 'queued' || entry.status === 'uploading' || entry.status === 'scanning'

  return (
    <li className="card animate-rise-in overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[240px_1fr]">
        <div className="photo-frame aspect-[4/5] max-h-[340px] w-full md:max-h-none">
          <img src={entry.preview} alt="" className="h-full w-full object-contain" />
          {busy && (
            <div className="absolute inset-0 bg-white/30">
              <div className="absolute inset-x-0 h-1/3 animate-scan bg-gradient-to-b from-transparent via-white/70 to-transparent" />
              <span className="absolute bottom-3 left-3 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
                {entry.status === 'queued' ? 'Waiting' : entry.status === 'uploading' ? 'Uploading' : 'Reading the piece'}
              </span>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6">
          {busy && (
            <div className="space-y-3" aria-busy>
              <div className="skeleton h-7 w-2/3" />
              <div className="skeleton h-4 w-1/2" />
              <div className="flex gap-2 pt-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-8 w-20 rounded-full" />
                ))}
              </div>
            </div>
          )}

          {entry.status === 'failed' && (
            <div>
              <p className="font-medium text-danger">{entry.error}</p>
              <div className="mt-4 flex gap-2">
                <button type="button" className="btn-primary py-2" onClick={onRetry}>
                  Try again
                </button>
                <button type="button" className="btn-quiet py-2" onClick={onDiscard}>
                  Remove
                </button>
              </div>
            </div>
          )}

          {(entry.status === 'review' || entry.status === 'saving') && (
            <>
              {entry.note && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sunk px-3.5 py-2.5 text-sm text-muted">
                  <span>{entry.note}</span>
                  <button type="button" onClick={onRescan} className="text-sm font-semibold text-ink underline underline-offset-4">
                    Read it again
                  </button>
                </div>
              )}

              {entry.similar.length > 0 && (
                <div className="mb-5 rounded-xl border border-unused/30 bg-unused-soft/40 p-3.5">
                  <p className="text-sm font-semibold text-unused-ink">You might already own this</p>
                  <p className="mt-0.5 text-xs text-muted">Same category and colour as {entry.similar.length === 1 ? 'this piece' : 'these'} in your closet.</p>
                  <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
                    {entry.similar.map((s) => (
                      <Link key={s.id} href={`/closet/${s.id}`} target="_blank" className="w-20 shrink-0">
                        <div className="photo-frame aspect-[4/5] rounded-lg">{s.photo && <img src={s.photo} alt="" className="h-full w-full object-cover" />}</div>
                        <p className="mt-1 truncate text-[0.7rem] text-muted">{s.name}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <ItemFieldsForm value={entry.draft} onChange={onDraft} compact />

              {entry.error && (
                <p role="alert" className="mt-4 text-sm text-danger">
                  {entry.error}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
                <button type="button" className="btn-primary" onClick={onSave} disabled={entry.status === 'saving'}>
                  {entry.status === 'saving' ? 'Saving…' : 'Save to closet'}
                </button>
                <button type="button" className="btn-quiet" onClick={onDiscard} disabled={entry.status === 'saving'}>
                  Discard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
