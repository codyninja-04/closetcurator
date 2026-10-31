'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const NAV = [
  { href: '/closet', label: 'Closet', icon: 'closet' },
  { href: '/outfit', label: 'Outfit', icon: 'outfit' },
  { href: '/add', label: 'Add', icon: 'add' },
  { href: '/analytics', label: 'Insights', icon: 'chart' },
  { href: '/settings', label: 'Settings', icon: 'cog' },
] as const

type IconName = (typeof NAV)[number]['icon']

export function NavIcon({ name, className = 'h-[18px] w-[18px]' }: { name: IconName; className?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...common}>
      {name === 'closet' && (
        <>
          <path d="M3 4.5h18" />
          <path d="M7 4.5v1.5M7 6 4.5 9.5h5zM12.5 4.5V6l-2 7h4z" />
          <path d="M17.5 4.5V6l-2.5 3v10.5h5V9z" />
        </>
      )}
      {name === 'outfit' && (
        <>
          <path d="M12 3.5 13 6.5h3.2l-2.6 1.9 1 3.1L12 9.6l-2.6 1.9 1-3.1-2.6-1.9H11z" />
          <path d="M5 14.5h14l-1.5 6h-11z" />
        </>
      )}
      {name === 'add' && (
        <>
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z" />
          <path d="M12 10v6M9 13h6" />
        </>
      )}
      {name === 'chart' && <path d="M4 20V11M9.5 20V5M15 20v-6M20.5 20V8" />}
      {name === 'cog' && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </>
      )}
    </svg>
  )
}

function useActive() {
  const path = usePathname()
  return (href: string) => path === href || path.startsWith(`${href}/`)
}

export function NavLinks({ variant }: { variant: 'side' | 'bottom' }) {
  const isActive = useActive()
  return (
    <>
      {NAV.map((item) => {
        const active = isActive(item.href)
        if (variant === 'bottom') {
          if (item.icon === 'add') {
            return (
              <Link key={item.href} href={item.href} aria-label="Add an item" aria-current={active ? 'page' : undefined} className="flex flex-1 items-center justify-center py-1.5">
                <span className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lift transition ${active ? 'bg-primary-hover' : 'bg-ink'} text-white`}>
                  <NavIcon name="add" className="h-5 w-5" />
                </span>
              </Link>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.66rem] font-semibold tracking-wide transition ${active ? 'text-ink' : 'text-faint hover:text-ink'}`}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          )
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-ink text-white' : 'text-muted hover:bg-sunk hover:text-ink'}`}
          >
            <NavIcon name={item.icon} />
            {item.icon === 'add' ? 'Add items' : item.label}
          </Link>
        )
      })}
    </>
  )
}
