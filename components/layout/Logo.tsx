import Link from 'next/link'

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#18181B" />
      <g fill="none" stroke="#FAFAFA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M27.5 19a4.5 4.5 0 1 1 6 4.2c-1 .4-1.5 1.2-1.5 2.3V28" />
        <path d="M32 28 13.8 41.2c-1.2.9-.6 2.8.9 2.8h34.6c1.5 0 2.1-1.9.9-2.8z" />
      </g>
    </svg>
  )
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="ClosetCurator home">
      <LogoMark />
      <span className="font-display text-[1.35rem] leading-none tracking-tight text-ink">
        Closet<span className="italic text-muted">Curator</span>
      </span>
    </Link>
  )
}
