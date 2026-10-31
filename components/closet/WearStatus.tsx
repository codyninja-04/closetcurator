import type { WearStatus } from '@/lib/closet'

const STYLE: Record<WearStatus, { dot: string; text: string }> = {
  recent: { dot: 'bg-worn', text: 'text-worn-ink' },
  steady: { dot: 'bg-strong', text: 'text-faint' },
  new: { dot: 'bg-strong ring-2 ring-sunk', text: 'text-faint' },
  unused: { dot: 'bg-unused', text: 'text-unused-ink' },
}

// The coloured "last worn" line under each piece: green when it's in rotation,
// amber once it has sat for 90 days, grey in between.
export function WearLine({ status, label, className = '' }: { status: WearStatus; label: string; className?: string }) {
  const s = STYLE[status]
  return (
    <p className={`flex items-center gap-1.5 text-xs font-medium ${s.text} ${className}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} aria-hidden />
      <span className="truncate">{label}</span>
    </p>
  )
}
