'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { PHOTO_BUCKET, itemsPrefix } from '@/lib/photos/shared'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function signedIn() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function savePreferences(formData: FormData) {
  const { supabase, user } = await signedIn()
  const unit = String(formData.get('temp_unit') ?? 'C')
  if (unit !== 'C' && unit !== 'F') throw new Error('Pick Celsius or Fahrenheit')
  const city = String(formData.get('home_city') ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  const { error } = await supabase
    .from('profiles')
    .update({ temp_unit: unit, home_city: city || null })
    .eq('user_id', user.id)
  if (error) throw new Error("Couldn't save that. Try again.")
  revalidatePath('/', 'layout')
}

// Every table cascades from auth.users, so deleting the user takes every
// item, wear and outfit with it. Photos live in storage, so those go first.
export async function deleteAccount() {
  const { supabase, user } = await signedIn()
  const admin = createAdminClient()

  const folder = itemsPrefix(user.id).replace(/\/$/, '')
  for (;;) {
    const { data: files } = await admin.storage.from(PHOTO_BUCKET).list(folder, { limit: 1000 })
    if (!files?.length) break
    await admin.storage.from(PHOTO_BUCKET).remove(files.map((f) => `${folder}/${f.name}`))
    if (files.length < 1000) break
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) throw new Error('Could not delete the account. Try again or contact support.')

  await supabase.auth.signOut()
  redirect('/')
}
