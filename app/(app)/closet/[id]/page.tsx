import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ItemDetail } from '@/components/closet/ItemDetail'
import { requireUser, userToday } from '@/lib/auth'
import { ITEM_COLUMNS } from '@/lib/items'
import { signPhotos } from '@/lib/photos/server'
import type { WardrobeItem, WearEntry } from '@/lib/types'
import { UUID } from '@/lib/validate'

export const metadata: Metadata = { title: 'Item' }

export default async function ItemPage({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound()
  const { supabase } = await requireUser()

  const { data: item } = await supabase.from('wardrobe_items').select(ITEM_COLUMNS).eq('id', params.id).maybeSingle()
  if (!item) notFound()

  const { data: wears } = await supabase
    .from('wear_log')
    .select('id, item_id, created_at, worn_date, occasion')
    .eq('item_id', params.id)
    .order('worn_date', { ascending: false })
    .limit(120)
  const signed = await signPhotos(supabase, [item.photo_url])

  return <ItemDetail item={{ ...(item as WardrobeItem), photo: signed[item.photo_url] ?? null }} wears={(wears ?? []) as WearEntry[]} today={userToday()} />
}
