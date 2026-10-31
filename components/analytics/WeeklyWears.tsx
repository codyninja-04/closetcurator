'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { prettyDate } from '@/lib/dates'
import type { Analytics } from '@/lib/analytics'

// Twelve weeks of logging at a glance. Mostly tells you whether you've kept
// up the habit, which is what makes the rest of the page trustworthy.
export function WeeklyWears({ data }: { data: Analytics['weekly'] }) {
  const rows = data.map((d) => ({ ...d, label: prettyDate(d.weekStart) }))
  const total = data.reduce((s, d) => s + d.wears, 0)
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="label">Wears logged per week</p>
        <p className="figure text-xs text-muted">{total} in 12 weeks</p>
      </div>
      <div className="mt-4 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="22%">
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#D4D4D8' }} tick={{ fill: '#71717A', fontSize: 10 }} interval={2} />
            <Tooltip
              cursor={{ fill: 'rgba(24,24,27,0.04)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as (typeof rows)[number]
                return (
                  <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-card">
                    <p className="font-semibold text-ink">Week of {row.label}</p>
                    <p className="text-muted">{row.wears} wears logged</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="wears" fill="#3F3F46" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
