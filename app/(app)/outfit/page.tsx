import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { OutfitBuilder } from '@/components/outfit/OutfitBuilder'
import { requireUser, userToday } from '@/lib/auth'
import { OUTFIT_COLUMNS, piecesFor } from '@/lib/outfits'
import { withPhotoUrls } from '@/lib/photos/server'
import { limitsFor } from '@/lib/plan'
import type { Category, OutfitSuggestion } from '@/lib/types'
import { UUID } from '@/lib/validate'
import { weatherAvailable } from '@/lib/weather'

export const metadata: Metadata = { title: 'Outfit' }

export default async function OutfitPage({ searchParams }: { searchParams: { anchor?: string } }) {
  const { supabase, plan, tempUnit, homeCity } = await requireUser()

  const [{ data: rows }, { data: recent }] = await Promise.all([
    supabase.from('wardrobe_items').select('id, name, category, photo_url').eq('is_active', true).order('added_at', { ascending: false }),
    supabase.from('outfit_suggestions').select(OUTFIT_COLUMNS).order('created_at', { ascending: false }).limit(8),
  ])
  const items = await withPhotoUrls(supabase, rows ?? [])
  const history = (recent ?? []) as OutfitSuggestion[]
  const pieces = await piecesFor(supabase, history)
  const anchor = searchParams.anchor && UUID.test(searchParams.anchor) && items.some((i) => i.id === searchParams.anchor) ? searchParams.anchor : null

  return (
    <div>
      <PageHeader
        eyebrow="Get dressed"
        title={
          <>
            What to wear, <span className="italic text-muted">from what you own.</span>
          </>
        }
        sub="Pick the occasion and the weather. Every suggestion comes from your closet, and it leans toward pieces you haven't worn in a while."
      />
      {items.length < 3 ? (
        <div className="card p-6 sm:p-8">
          <p className="heading text-3xl">A few more pieces first</p>
          <p className="mt-2 max-w-lg text-sm text-muted">Outfits need something to work with. Add at least a top, a bottom and some shoes, and suggestions get better the more of your closet is in here.</p>
          <Link href="/add" className="btn-primary mt-5">
            Add items
          </Link>
        </div>
      ) : (
        <OutfitBuilder
          items={items.map((i) => ({ id: i.id, name: i.name, category: i.category as Category, photo: i.photo }))}
          history={history}
          pieces={pieces}
          anchor={anchor}
          today={userToday()}
          unit={tempUnit}
          homeCity={homeCity}
          liveWeather={weatherAvailable()}
          allowed={limitsFor(plan).outfits}
        />
      )}
    </div>
  )
}
