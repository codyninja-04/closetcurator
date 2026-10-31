'use client'

import Link from 'next/link'
import { useState } from 'react'
import { postJson } from '@/lib/api'
import { CATEGORY_LABELS } from '@/lib/closet'
import type { Category } from '@/lib/types'
import { GarmentIcon } from '../closet/GarmentIcon'

export interface UnusedRow {
  id: string
  name: string
  category: Category
  idle: number
  neverWorn: boolean
  photo: string | null
}

function idleLabel(days: number): string {
  if (days < 120) return `${days} days`
  const months = Math.round(days / 30)
  return months < 24 ? `${months} months` : `${Math.round(days / 365)} years`
}

// Pieces nobody has worn in 90+ days. Each one gets a way to put it back in
// rotation (build an outfit around it) or to let it go (archive).
export function UnusedItemsList({ initial }: { initial: UnusedRow[] }) {
  const [rows, setRows] = useState(initial)
  const [archived, setArchived] = useState<UnusedRow[]>([])
  const [error, setError] = useState<string | null>(null)

  async function archive(row: UnusedRow) {
    setError(null)
    setRows((r) => r.filter((x) => x.id !== row.id))
    try {
      await postJson(`/api/items/${row.id}`, { is_active: false }, 'PATCH')
      setArchived((a) => [row, ...a])
    } catch (e) {
      setRows((r) => [...r, row].sort((a, b) => b.idle - a.idle))
      setError((e as Error).message)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center">
        <p className="heading text-2xl">{archived.length ? 'Cleared' : 'Everything is in rotation'}</p>
        <p className="mt-1 text-sm text-muted">
          {archived.length ? `${archived.length} ${archived.length === 1 ? 'piece' : 'pieces'} archived. They keep their history in the archive.` : 'Nothing has sat for 90 days. Nice.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <li key={row.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-2.5">
            <Link href={`/closet/${row.id}`} className="photo-frame h-24 w-20 shrink-0 rounded-xl">
              {row.photo ? (
                <img src={row.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-strong">
                  <GarmentIcon category={row.category} className="h-8 w-8" />
                </div>
              )}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col py-0.5">
              <Link href={`/closet/${row.id}`} className="truncate text-sm font-medium hover:underline">
                {row.name}
              </Link>
              <p className="text-xs text-faint">{CATEGORY_LABELS[row.category].one}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-unused-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-unused" aria-hidden />
                {row.neverWorn ? `Never worn, added ${idleLabel(row.idle)} ago` : `Not worn in ${idleLabel(row.idle)}`}
              </p>
              <div className="mt-auto flex gap-3 pt-2 text-xs font-semibold">
                <Link href={`/outfit?anchor=${row.id}`} className="text-ink underline-offset-4 hover:underline">
                  Wear it this week
                </Link>
                <button type="button" onClick={() => archive(row)} className="text-muted underline-offset-4 hover:text-ink hover:underline">
                  Passed it on
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
