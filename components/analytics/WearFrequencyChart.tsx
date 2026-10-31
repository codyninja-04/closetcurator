'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORY_LABELS } from '@/lib/closet'
import type { Analytics } from '@/lib/analytics'

type Mode = 'wears' | 'perPiece'

const INK = '#18181B'

// Wears in the last 90 days by category. One series, so one colour and no
// legend; the toggle switches between the total and wears per piece, which is
// the fairer comparison when you own twenty tops and two coats.
export function WearFrequencyChart({ data }: { data: Analytics['byCategory'] }) {
  const [mode, setMode] = useState<Mode>('wears')
  const rows = data.map((d) => ({ ...d, label: CATEGORY_LABELS[d.category].many }))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label">Wear frequency by category</p>
          <p className="mt-1 text-sm text-muted">{mode === 'wears' ? 'Total wears, last 90 days' : 'Average wears per piece, last 90 days'}</p>
        </div>
        <div className="inline-flex rounded-full border border-line bg-surface p-0.5 text-xs">
          {(
            [
              ['wears', 'Total'],
              ['perPiece', 'Per piece'],
            ] as const
          ).map(([m, label]) => (
            <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={`rounded-full px-3 py-1 font-medium transition ${mode === m ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -18 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="#E4E4E7" strokeDasharray="0" />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#D4D4D8' }} tick={{ fill: '#52525B', fontSize: 12 }} interval={0} />
            <YAxis allowDecimals={mode === 'perPiece'} tickLine={false} axisLine={false} tick={{ fill: '#71717A', fontSize: 11 }} width={44} />
            <Tooltip
              cursor={{ fill: 'rgba(24,24,27,0.04)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as (typeof rows)[number]
                return (
                  <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-card">
                    <p className="font-semibold text-ink">{row.label}</p>
                    <p className="mt-0.5 text-muted">
                      {row.wears} wears across {row.pieces} {row.pieces === 1 ? 'piece' : 'pieces'}
                    </p>
                    <p className="text-muted">{row.perPiece} per piece</p>
                  </div>
                )
              }}
            />
            <Bar dataKey={mode} fill={INK} radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
