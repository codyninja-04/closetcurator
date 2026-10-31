import type { Category } from '@/lib/types'

// Line drawings for each category. Used on the filter chips, as the stand in
// when a photo can't load, and on the landing page.
export function GarmentIcon({ category, className = 'h-5 w-5', strokeWidth = 1.6 }: { category: Category | 'all'; className?: string; strokeWidth?: number }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...common}>
      {category === 'all' && (
        <>
          <path d="M10.5 6.5a1.5 1.5 0 1 1 2 1.4c-.3.1-.5.4-.5.8V10" />
          <path d="M12 10 3.6 15.6c-.6.4-.3 1.4.4 1.4h16c.7 0 1-1 .4-1.4z" />
        </>
      )}
      {category === 'top' && <path d="M8.5 3.5 4 6l-1.5 4 3 1.2V20.5h13V11.2l3-1.2L20 6l-4.5-2.5c-.6 1.6-2 2.5-3.5 2.5s-2.9-.9-3.5-2.5z" />}
      {category === 'bottom' && (
        <>
          <path d="M6.5 3.5h11l1 17h-4.3L12 9.5l-2.2 11H5.5z" />
          <path d="M6.5 6.5h11" />
        </>
      )}
      {category === 'dress' && (
        <>
          <path d="M9 3v3.5L7.5 9.5 9 11 5 20.5h14L15 11l1.5-1.5L15 6.5V3" />
          <path d="M9 6.5c1 .8 2 1.2 3 1.2s2-.4 3-1.2" />
        </>
      )}
      {category === 'outerwear' && (
        <>
          <path d="M9 3.5 4.5 5.5 3 20.5h4.5V12M15 3.5l4.5 2L21 20.5h-4.5V12" />
          <path d="M9 3.5 12 8l3-4.5M12 8v12.5M7.5 20.5h9" />
        </>
      )}
      {category === 'shoes' && (
        <>
          <path d="M3 16.5V9.5h4.5c.6 1.6 2 2.5 3.5 2.5l5 1.5c2.4.7 4.5 1.6 4.5 3v1H3z" />
          <path d="M3 17.5h18M10 12l-1 2M13 12.8 12 15" />
        </>
      )}
      {category === 'accessory' && (
        <>
          <circle cx="12" cy="13" r="5" />
          <path d="M9.5 8.7 10 3.5h4l.5 5.2M9.5 17.3l.5 3.2h4l.5-3.2M12 11v2l1.5 1" />
        </>
      )}
      {category === 'bag' && (
        <>
          <path d="M4.5 8.5h15l-1 12h-13z" />
          <path d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5" />
        </>
      )}
    </svg>
  )
}
