import type { SupabaseClient } from '@supabase/supabase-js'
import { PHOTO_BUCKET } from './shared'

const SIGNED_FOR_SECONDS = 60 * 60

// Turns stored paths into short lived URLs for rendering. Unknown or missing
// files simply don't appear in the map.
export async function signPhotos(supabase: SupabaseClient, paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter((p): p is string => !!p)))
  if (unique.length === 0) return {}
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(unique, SIGNED_FOR_SECONDS)
  const out: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) out[row.path] = row.signedUrl
  }
  return out
}

// Same as signPhotos but swaps the path for a url on each row, which is what
// most pages want to hand to a client component.
export async function withPhotoUrls<T extends { photo_url: string }>(supabase: SupabaseClient, rows: T[]): Promise<(T & { photo: string | null })[]> {
  const signed = await signPhotos(
    supabase,
    rows.map((r) => r.photo_url),
  )
  return rows.map((r) => ({ ...r, photo: signed[r.photo_url] ?? null }))
}

export async function downloadPhoto(supabase: SupabaseClient, path: string): Promise<{ base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' } | null> {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(path)
  if (error || !data) return null
  const type = data.type === 'image/png' || data.type === 'image/webp' ? data.type : 'image/jpeg'
  const base64 = Buffer.from(await data.arrayBuffer()).toString('base64')
  return { base64, mediaType: type }
}

// Best effort cleanup. A leftover file is harmless, so failures are ignored.
export async function removePhotos(supabase: SupabaseClient, paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p)
  if (list.length) await supabase.storage.from(PHOTO_BUCKET).remove(list)
}
