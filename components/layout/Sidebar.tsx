import Link from 'next/link'
import { Logo } from './Logo'
import { NavLinks } from './nav'

// Desktop navigation. On phones the Header and its bottom bar take over.
export function Sidebar({ name, plan, itemCount, itemLimit }: { name: string; plan: string; itemCount: number; itemLimit: number | null }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface/80 px-4 py-6 backdrop-blur md:flex">
      <div className="px-2">
        <Logo href="/closet" />
      </div>
      <nav className="mt-10 flex flex-col gap-1">
        <NavLinks variant="side" />
      </nav>

      <div className="mt-auto space-y-3">
        {itemLimit != null && (
          <div className="rounded-xl border border-line bg-sunk/60 p-3">
            <div className="flex items-baseline justify-between">
              <p className="label">Items</p>
              <p className="figure text-xs text-muted">
                {itemCount}/{itemLimit}
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div className={`h-full rounded-full ${itemCount >= itemLimit ? 'bg-unused' : 'bg-ink'}`} style={{ width: `${Math.min(100, (itemCount / itemLimit) * 100)}%` }} />
            </div>
            <Link href="/settings#plan" className="mt-2 block text-xs font-medium text-ink underline-offset-4 hover:underline">
              Unlimited with Pro
            </Link>
          </div>
        )}
        <div className="rounded-xl border border-line p-3">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs capitalize text-faint">{plan} plan</p>
          <form action="/auth/signout" method="post" className="mt-2">
            <button className="text-xs font-medium text-muted underline-offset-4 hover:text-ink hover:underline">Sign out</button>
          </form>
        </div>
      </div>
    </aside>
  )
}
