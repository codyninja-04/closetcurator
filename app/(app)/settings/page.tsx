import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { requireUser } from '@/lib/auth'
import { FREE_ITEM_LIMIT, enforcingPlans } from '@/lib/plan'
import { weatherAvailable } from '@/lib/weather'
import { DeleteAccount, PreferencesForm } from './SettingsForms'

export const metadata: Metadata = { title: 'Settings' }

const FREE = [`Up to ${FREE_ITEM_LIMIT} items`, 'Claude tags every photo', 'Wear logging and history', 'Duplicate check when adding', 'Export everything']
const PRO = ['Unlimited items', 'Outfit suggestions with weather', 'Wear analytics and the unused list', 'Everything in Free']

export default async function SettingsPage() {
  const { supabase, user, plan, tempUnit, homeCity } = await requireUser()
  const { count } = await supabase.from('wardrobe_items').select('id', { count: 'exact', head: true })
  const enforcing = enforcingPlans()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" />

      <div className="space-y-6">
        <section className="card p-5 sm:p-6">
          <h2 className="heading text-2xl">Account</h2>
          <p className="mt-1 text-sm text-muted">
            Signed in with Google as <span className="font-medium text-ink">{user.email}</span>
          </p>
          <form action="/auth/signout" method="post" className="mt-4">
            <button className="btn-ghost py-2">Sign out</button>
          </form>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="heading text-2xl">Weather</h2>
          <p className="mb-5 mt-1 text-sm text-muted">
            {weatherAvailable() ? 'How temperatures show on the outfit page, and where to check the weather.' : 'Live weather isn’t set up on this server, so you’ll pick conditions by hand. The unit still applies.'}
          </p>
          <PreferencesForm unit={tempUnit} city={homeCity} />
        </section>

        <section id="plan" className="card scroll-mt-24 p-5 sm:p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="heading text-2xl">Plan</h2>
            <span className="chip capitalize">{plan}</span>
          </div>
          {!enforcing && <p className="mt-2 rounded-xl bg-worn-soft/60 px-3 py-2 text-sm text-worn-ink">Billing isn&rsquo;t switched on yet, so everything is unlocked for now.</p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <PlanCard name="Free" price="$0" items={FREE} current={plan === 'free'} />
            <PlanCard name="Pro" price="$5 / month" items={PRO} current={plan === 'pro'} highlight />
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="heading text-2xl">Your data</h2>
          <p className="mt-1 text-sm text-muted">Every piece, wear and outfit as one JSON file. Photos come as links that work for an hour.</p>
          <a href="/api/export" className="btn-ghost mt-4 py-2" download>
            Download export
          </a>
        </section>

        <section className="card border-danger/20 p-5 sm:p-6">
          <h2 className="heading mb-2 text-2xl">Delete account</h2>
          <DeleteAccount items={count ?? 0} />
        </section>
      </div>
    </div>
  )
}

function PlanCard({ name, price, items, current, highlight }: { name: string; price: string; items: string[]; current: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? 'border-ink bg-ink text-white' : 'border-line'}`}>
      <div className="flex items-baseline justify-between">
        <p className="font-display text-2xl">{name}</p>
        <p className={`figure text-sm ${highlight ? 'text-white/70' : 'text-muted'}`}>{price}</p>
      </div>
      <ul className={`mt-3 space-y-1.5 text-sm ${highlight ? 'text-white/80' : 'text-muted'}`}>
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className={highlight ? 'text-white' : 'text-faint'} aria-hidden>
              ✓
            </span>
            {i}
          </li>
        ))}
      </ul>
      {current && <p className={`mt-3 text-xs font-semibold ${highlight ? 'text-white' : 'text-ink'}`}>Your current plan</p>}
    </div>
  )
}
