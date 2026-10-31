import { STYLE_LABELS } from '@/lib/closet'
import type { Analytics } from '@/lib/analytics'

// Owned share against worn share for each style, as paired thin bars. Two
// series, so there's a legend, and each bar carries its value as text.
export function StyleGap({ data }: { data: Analytics['styles'] }) {
  const biggest = [...data].sort((a, b) => b.ownedPct - b.wornPct - (a.ownedPct - a.wornPct))[0]
  const gap = biggest && biggest.ownedPct - biggest.wornPct >= 15 ? biggest : null

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="label">What you own vs what you wear</p>
        <div className="flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-strong" aria-hidden /> Owned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-ink" aria-hidden /> Worn
          </span>
        </div>
      </div>
      {gap && (
        <p className="mt-2 text-sm text-muted">
          {gap.ownedPct}% of your closet is {STYLE_LABELS[gap.tag].toLowerCase()}, but it&rsquo;s only {gap.wornPct}% of what you put on.
        </p>
      )}
      <ul className="mt-4 space-y-3.5">
        {data.map((s) => (
          <li key={s.tag} className="grid grid-cols-[96px_1fr] items-center gap-3 text-sm">
            <span className="truncate text-muted">{STYLE_LABELS[s.tag]}</span>
            <div className="space-y-1">
              <Bar value={s.ownedPct} className="bg-strong" label="owned" />
              <Bar value={s.wornPct} className="bg-ink" label="worn" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Bar({ value, className, label }: { value: number; className: string; label: string }) {
  return (
    <div className="flex items-center gap-2" title={`${value}% ${label}`}>
      <div className="h-1.5 flex-1 rounded-full bg-sunk">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.max(value, value > 0 ? 2 : 0)}%` }} />
      </div>
      <span className="figure w-9 text-right text-xs text-muted">{value}%</span>
    </div>
  )
}
