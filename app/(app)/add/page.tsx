import type { Metadata } from 'next'
import { AddQueue } from '@/components/add/AddQueue'
import { PageHeader } from '@/components/layout/PageHeader'
import { requireUser } from '@/lib/auth'
import { countActiveItems } from '@/lib/items'
import { limitsFor } from '@/lib/plan'

export const metadata: Metadata = { title: 'Add items' }

export default async function AddPage() {
  const { supabase, plan } = await requireUser()
  const limit = limitsFor(plan).items
  const count = Number.isFinite(limit) ? await countActiveItems(supabase) : 0
  const remaining = Number.isFinite(limit) ? Math.max(0, limit - count) : null

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Add to your closet"
        title={
          <>
            Photograph it <span className="italic text-muted">once.</span>
          </>
        }
        sub="Claude reads the type, colour, pattern and style. Check what it got, change anything that's off, and save."
      />
      <AddQueue atLimit={remaining === 0} remaining={remaining} />
    </div>
  )
}
