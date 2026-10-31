// Photo rules shared by the browser uploader and the API routes.

export const PHOTO_BUCKET = 'closet-photos'
export const MAX_EDGE = 1400
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

// Scale so the longest edge fits MAX_EDGE. Never upscales.
export function fitWithin(width: number, height: number, maxEdge = MAX_EDGE): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 }
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

// Every photo lives under {user_id}/items/. The API checks a path sent by the
// client against this before saving it, so nobody can point an item at a file
// outside their own folder.
export function itemsPrefix(userId: string): string {
  return `${userId}/items/`
}

export function isOwnPhotoPath(path: unknown, userId: string): path is string {
  if (typeof path !== 'string') return false
  if (path.includes('..') || path.length > 300) return false
  const rest = path.slice(itemsPrefix(userId).length)
  return path.startsWith(itemsPrefix(userId)) && /^[A-Za-z0-9-]+\.(jpe?g|png|webp)$/i.test(rest)
}
