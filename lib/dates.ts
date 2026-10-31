// Wear dates are calendar days in the user's own time zone, stored as plain
// YYYY-MM-DD. The browser sets a tz cookie so server pages agree on "today".

export const TZ_COOKIE = 'cc_tz'

export function isValidTimeZone(tz: string | undefined | null): tz is string {
  if (!tz || tz.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function todayIn(tz?: string | null, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: isValidTimeZone(tz) ? tz : 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

function toUtc(day: string): number {
  const [y, m, d] = day.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

// Whole days from a to b. Positive when b is later.
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000)
}

export function addDays(day: string, n: number): string {
  return new Date(toUtc(day) + n * 86_400_000).toISOString().slice(0, 10)
}

export function prettyDate(day: string, opts: { year?: boolean } = {}): string {
  return new Date(toUtc(day)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: opts.year ? 'numeric' : undefined, timeZone: 'UTC' })
}
