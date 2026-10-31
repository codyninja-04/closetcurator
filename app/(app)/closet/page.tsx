import type { Metadata } from 'next'
import Link from 'next/link'
import { ClosetGrid } from '@/components/closet/ClosetGrid'
import { GarmentIcon } from '@/components/closet/GarmentIcon'
import { PageHeader } from '@/components/layout/PageHeader'
import { requireUser, userToday } from '@/lib/auth'
import { wearStatus } from '@/lib/closet'
import { daysBetween } from '@/lib/dates'
import { ITEM_COLUMNS } from '@/lib/items'
import { withPhotoUrls } from '@/lib/photos/server'
import type { WardrobeItem } from '@/lib/types'

export const metadata: Metadata = { title: 'Closet' }

export default async function ClosetPage({ searchParams }: { searchParams: { view?: string } }) {
  const { supabase } = await requireUser()
  const archived = searchParams.view === 'archived'
  const today = userToday()

  const [{ data }, { count: archivedCount }] = await Promise.all([
    supabase.from('wardrobe_items').select(ITEM_COLUMNS).eq('is_active', !archived).order('added_at', { ascending: false }),
    supabase.from('wardrobe_items').select('id', { count: 'exact', head: true }).eq('is_active', false),
  ])
  const items = await withPhotoUrls(supabase, (data ?? []) as WardrobeItem[])

  if (!archived && items.length === 0) return <EmptyCloset />

  const wornThisMonth = items.filter((i) => i.last_worn_date && daysBetween(i.last_worn_date, today) < 30).length
  const unused = items.filter((i) => wearStatus(i, today) === 'unused').length

  return (
    <div>
      <PageHeader
        eyebrow={archived ? 'Archived pieces' : 'Your closet'}
        title={
          archived ? (
            'Passed on'
          ) : (
            <>
              {items.length} {items.length === 1 ? 'piece' : 'pieces'}, <span className="italic text-muted">on the rail.</span>
            </>
          )
        }
        sub={
          archived ? (
            'Things you donated, sold or put away. They keep their wear history and can be restored any time.'
          ) : (
            <>
              <span className="text-worn-ink">{wornThisMonth} worn in the last 30 days.</span>{' '}
              {unused > 0 ? (
                <Link href="/analytics#unused" className="text-unused-ink underline decoration-unused/40 underline-offset-4 hover:decoration-unused">
                  {unused} not worn in 90 days.
                </Link>
              ) : (
                'Nothing gathering dust right now.'
              )}{' '}
              Tap the tick on a piece when you put it on.
            </>
          )
        }
        action={
          <div className="flex gap-2">
            {archived ? (
              <Link href="/closet" className="btn-ghost py-2">
                Back to closet
              </Link>
            ) : (
              <>
                {(archivedCount ?? 0) > 0 && (
                  <Link href="/closet?view=archived" className="btn-quiet py-2">
                    Archived ({archivedCount})
                  </Link>
                )}
                <Link href="/outfit" className="btn-ghost py-2">
                  Get an outfit
                </Link>
                <Link href="/add" className="btn-primary hidden py-2 md:inline-flex">
                  Add items
                </Link>
              </>
            )}
          </div>
        }
      />

      {archived && items.length === 0 ? (
        <p className="text-sm text-muted">Nothing archived yet.</p>
      ) : (
        <ClosetGrid key={archived ? 'archived' : 'active'} initial={items} today={today} />
      )}
    </div>
  )
}

function EmptyCloset() {
  return (
    <div className="mx-auto max-w-xl pt-10 text-center">
      <div className="rail mx-auto w-64" aria-hidden />
      <div className="mx-auto flex w-64 justify-around text-strong">
        {(['top', 'dress', 'outerwear'] as const).map((c, i) => (
          <div key={c} className="flex flex-col items-center">
            <span className="h-3 w-px bg-strong" />
            <span className="animate-sway origin-top" style={{ animationDelay: `${i * 0.4}s` }}>
              <GarmentIcon category={c} className="h-12 w-12" strokeWidth={1} />
            </span>
          </div>
        ))}
      </div>
      <h1 className="heading mt-10 text-5xl">An empty rail</h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted">
        Start with the things you wear most, then work through the drawers. Ten pieces is enough for the first outfit suggestions to be useful.
      </p>
      <Link href="/add" className="btn-primary mt-8 px-6 py-3">
        Photograph your first pieces
      </Link>
    </div>
  )
}
