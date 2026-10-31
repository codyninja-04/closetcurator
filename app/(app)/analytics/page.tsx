import type { Metadata } from 'next'
import Link from 'next/link'
import { StyleGap } from '@/components/analytics/StyleGap'
import { UnusedItemsList } from '@/components/analytics/UnusedItemsList'
import { WearFrequencyChart } from '@/components/analytics/WearFrequencyChart'
import { WeeklyWears } from '@/components/analytics/WeeklyWears'
import { PageHeader } from '@/components/layout/PageHeader'
import { loadAnalytics } from '@/lib/analytics-data'
import { requireUser, userToday } from '@/lib/auth'
import { OCCASION_LABELS, UNUSED_AFTER_DAYS } from '@/lib/closet'
import { signPhotos } from '@/lib/photos/server'
import { limitsFor } from '@/lib/plan'

export const metadata: Metadata = { title: 'Insights' }

export default async function AnalyticsPage() {
  const { supabase, plan } = await requireUser()

  if (!limitsFor(plan).analytics) {
    return (
      <div>
        <PageHeader eyebrow="Insights" title="How you really dress" />
        <div className="card p-6 sm:p-8">
          <p className="heading text-3xl">Wear analytics are part of Pro</p>
          <p className="mt-2 max-w-lg text-sm text-muted">See what hasn&rsquo;t been worn in 90 days, which categories you lean on, and how your closet compares with what you actually put on. $5 a month.</p>
          <Link href="/settings#plan" className="btn-primary mt-5">
            See plans
          </Link>
        </div>
      </div>
    )
  }

  const today = userToday()
  const { items, analytics: a } = await loadAnalytics(supabase, today)
  const photoById = new Map(items.map((i) => [i.id, i.photo_url as string]))
  const signed = await signPhotos(
    supabase,
    a.unused.map((u) => photoById.get(u.id)),
  )
  const unused = a.unused.map((u) => ({ ...u, photo: signed[photoById.get(u.id) ?? ''] ?? null }))

  if (a.totals.pieces === 0) {
    return (
      <div>
        <PageHeader eyebrow="Insights" title="How you really dress" />
        <p className="text-sm text-muted">
          Nothing to show yet.{' '}
          <Link href="/add" className="font-medium text-ink underline underline-offset-4">
            Add some pieces
          </Link>{' '}
          and log what you wear for a couple of weeks.
        </p>
      </div>
    )
  }

  const tiles = [
    { label: 'Pieces', value: a.totals.pieces, note: `${a.totals.neverWorn} never worn` },
    { label: 'Wears, 30 days', value: a.totals.wears30, note: `${a.totals.wears90} in 90 days` },
    { label: 'In rotation', value: `${a.totals.rotationPct}%`, note: 'worn in the last 90 days' },
    { label: 'Gathering dust', value: a.totals.unused, note: `${UNUSED_AFTER_DAYS}+ days on the hanger`, amber: a.totals.unused > 0 },
  ]
  const occTotal = a.occasions.reduce((s, o) => s + o.wears, 0)

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title={
          <>
            You wear {a.totals.rotationPct}% <span className="italic text-muted">of your closet.</span>
          </>
        }
        sub={a.totals.wears90 === 0 ? 'Log what you wear for a couple of weeks and these numbers start to mean something.' : 'Based on the last 90 days of wears you have logged.'}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className={`card p-4 sm:p-5 ${t.amber ? 'border-unused/30 bg-unused-soft/30' : ''}`}>
            <p className="label">{t.label}</p>
            <p className={`figure mt-2 text-3xl ${t.amber ? 'text-unused-ink' : ''}`}>{t.value}</p>
            <p className="mt-1 text-xs text-faint">{t.note}</p>
          </div>
        ))}
      </div>

      <section id="unused" className="mt-12 scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="heading text-3xl">Not worn in {UNUSED_AFTER_DAYS} days</h2>
            <p className="mt-1 text-sm text-muted">Candidates to donate or sell. Or to wear this week, if you still love them.</p>
          </div>
          {unused.length > 0 && <span className="chip border-unused/30 bg-unused-soft/50 text-unused-ink">{unused.length} pieces</span>}
        </div>
        <UnusedItemsList initial={unused} />
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="card p-5 sm:p-6">
          <WearFrequencyChart data={a.byCategory} />
        </div>
        <div className="card p-5 sm:p-6">
          <p className="label">Most worn, 90 days</p>
          {a.mostWorn.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No wears logged yet.</p>
          ) : (
            <ol className="mt-3 divide-y divide-line">
              {a.mostWorn.map((m, i) => (
                <li key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="figure w-4 text-xs text-faint">{i + 1}</span>
                  <Link href={`/closet/${m.id}`} className="min-w-0 flex-1 truncate hover:underline">
                    {m.name}
                  </Link>
                  <span className="figure text-muted">{m.wears}×</span>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-6 border-t border-line pt-5">
            <WeeklyWears data={a.weekly} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <StyleGap data={a.styles} />
        </div>
        <div className="card p-5 sm:p-6">
          <p className="label">Your colours</p>
          <p className="mt-1 text-sm text-muted">Pieces owned and wears in 90 days, by main colour.</p>
          <ul className="mt-4 space-y-2.5">
            {a.colors.map((c) => (
              <li key={c.color} className="flex items-center gap-3 text-sm">
                <span className="h-5 w-5 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: c.hex ?? '#E4E4E7' }} aria-hidden />
                <span className="min-w-0 flex-1 truncate capitalize">{c.color}</span>
                <span className="figure text-xs text-muted">{c.pieces} owned</span>
                <span className="figure w-16 text-right text-xs text-ink">{c.wears} wears</span>
              </li>
            ))}
          </ul>
          {occTotal > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="label">What you dress for</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.occasions
                  .sort((x, y) => y.wears - x.wears)
                  .map((o) => (
                    <span key={o.occasion} className="chip">
                      {OCCASION_LABELS[o.occasion]}
                      <span className="figure text-faint">{Math.round((o.wears / occTotal) * 100)}%</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
