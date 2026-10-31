import { addDays, prettyDate } from '@/lib/dates'

const WEEKS = 12

// The last twelve weeks as a grid of days, one column per week, filled where
// the piece was worn. Weeks start on Monday.
export function WearCalendar({ days, today }: { days: Set<string>; today: string }) {
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7
  const start = addDays(today, -dow - (WEEKS - 1) * 7)
  const columns = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)))
  const count = columns.flat().filter((d) => days.has(d)).length

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="label">Last 12 weeks</p>
        <p className="figure text-xs text-muted">{count} wears</p>
      </div>
      <div className="mt-3 flex gap-[3px]" role="img" aria-label={`Worn ${count} times in the last 12 weeks`}>
        {columns.map((col, i) => (
          <div key={i} className="flex flex-1 flex-col gap-[3px]">
            {col.map((d) => (
              <span
                key={d}
                title={d > today ? undefined : `${prettyDate(d)}${days.has(d) ? ', worn' : ''}`}
                className={`aspect-square w-full rounded-[3px] ${d > today ? 'bg-transparent' : days.has(d) ? 'bg-ink' : d === today ? 'bg-line ring-1 ring-ink/40' : 'bg-sunk'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
