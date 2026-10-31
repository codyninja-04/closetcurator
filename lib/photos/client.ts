'use client'

import { createClient } from '../supabase/client'
import { MAX_UPLOAD_BYTES, PHOTO_BUCKET, fitWithin, itemsPrefix } from './shared'

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
    } catch {
      // Fall through to the <img> path, which some older Safari builds need.
    }
  }
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.src = url
  await img.decode()
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) }
}

// Phone photos are 4 to 12 MB. Shrink to a 1400px JPEG before upload so the
// closet grid loads fast and the vision call stays well under its size limit.
// Transparent PNGs get a white backdrop instead of turning black.
export async function compressPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) throw new Error("That file isn't a photo.")
  const { source, width, height, release } = await decode(file).catch(() => {
    throw new Error("Couldn't read that photo. Try a JPEG or PNG.")
  })
  try {
    const size = fitWithin(width, height)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error("Couldn't process that photo.")
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size.width, size.height)
    ctx.drawImage(source, 0, 0, size.width, size.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
    if (!blob) throw new Error("Couldn't process that photo.")
    if (blob.size > MAX_UPLOAD_BYTES) throw new Error('That photo is too large even after shrinking it.')
    return blob
  } finally {
    release()
  }
}

// Uploads straight to the private bucket. Storage RLS only allows writes under
// the caller's own user id, so this can't land in someone else's folder.
export async function uploadItemPhoto(file: File): Promise<string> {
  const blob = await compressPhoto(file)
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in again to upload photos.')

  const path = `${itemsPrefix(user.id)}${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw new Error("The photo didn't upload. Check your connection and try again.")
  return path
}
