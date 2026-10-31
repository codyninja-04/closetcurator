import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { TZ_COOKIE, isValidTimeZone, todayIn } from './dates'
import { createClient } from './supabase/server'
import type { Plan, TempUnit } from './types'

export interface Profile {
  plan: Plan
  tempUnit: TempUnit
  homeCity: string | null
}

const DEFAULT_PROFILE: Profile = { plan: 'free', tempUnit: 'C', homeCity: null }

async function profileFor(supabase: SupabaseClient, userId: string): Promise<Profile> {
  const { data } = await supabase.from('profiles').select('plan, temp_unit, home_city').eq('user_id', userId).maybeSingle()
  return {
    plan: (data?.plan as Plan | undefined) ?? DEFAULT_PROFILE.plan,
    tempUnit: (data?.temp_unit as TempUnit | undefined) ?? DEFAULT_PROFILE.tempUnit,
    homeCity: (data?.home_city as string | null | undefined) ?? null,
  }
}

// The user's time zone from the cookie the app shell sets, UTC until it has.
export function userTimeZone(): string {
  const tz = cookies().get(TZ_COOKIE)?.value
  return isValidTimeZone(tz) ? tz : 'UTC'
}

export function userToday(): string {
  return todayIn(userTimeZone())
}

// Server components behind the app layout call this to get the signed in user.
export async function requireUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return { supabase, user, ...(await profileFor(supabase, user.id)) }
}

// Route handler version: returns a 401 response instead of redirecting.
export async function apiUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, ...DEFAULT_PROFILE, unauthorized: NextResponse.json({ error: 'Sign in first' }, { status: 401 }) }
  return { supabase, user, ...(await profileFor(supabase, user.id)), unauthorized: null }
}

export function displayName(user: { email?: string | null; user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined
  const name = (meta?.full_name ?? meta?.name)?.trim()
  if (name) return name.split(/\s+/)[0]
  return user.email?.split('@')[0] ?? 'there'
}
