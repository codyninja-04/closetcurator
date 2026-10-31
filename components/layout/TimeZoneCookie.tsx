'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { TZ_COOKIE } from '@/lib/dates'

// Tells the server which calendar day it is for this person. If the cookie
// was missing or stale, refresh once so "worn today" lines up.
export function TimeZoneCookie({ current }: { current: string | null }) {
  const router = useRouter()
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!tz || tz === current) return
    document.cookie = `${TZ_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }, [current, router])
  return null
}
