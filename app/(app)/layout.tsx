import { cookies } from 'next/headers'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { TimeZoneCookie } from '@/components/layout/TimeZoneCookie'
import { displayName, requireUser } from '@/lib/auth'
import { TZ_COOKIE } from '@/lib/dates'
import { limitsFor } from '@/lib/plan'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, plan } = await requireUser()
  const limit = limitsFor(plan).items
  let count = 0
  if (Number.isFinite(limit)) {
    const res = await supabase.from('wardrobe_items').select('id', { count: 'exact', head: true }).eq('is_active', true)
    count = res.count ?? 0
  }

  return (
    <div className="flex min-h-screen">
      <TimeZoneCookie current={cookies().get(TZ_COOKIE)?.value ?? null} />
      <Sidebar name={displayName(user)} plan={plan} itemCount={count} itemLimit={Number.isFinite(limit) ? limit : null} />
      <div className="min-w-0 flex-1">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 md:pb-16 md:pt-10">{children}</main>
      </div>
    </div>
  )
}
