import type { Plan } from './types'

// From the spec: free keeps up to 40 items, pro gets unlimited items, outfit
// suggestions and wear analytics. Limits only apply when ENFORCE_PRO is on, so
// the whole app is usable before billing is wired up.
export function enforcingPlans(): boolean {
  return process.env.ENFORCE_PRO === 'true'
}

export const FREE_ITEM_LIMIT = 40

export function limitsFor(plan: Plan) {
  const limited = enforcingPlans() && plan !== 'pro'
  return {
    items: limited ? FREE_ITEM_LIMIT : Infinity,
    outfits: !limited,
    analytics: !limited,
  }
}

export type Limits = ReturnType<typeof limitsFor>

// Per person per day ceilings on Claude calls, pro included, so a stuck client
// or a script can't run up the bill. Scans are generous because people tend to
// photograph a whole rail in one sitting.
export const DAILY_SCAN_CAP = 80
export const DAILY_OUTFIT_CAP = 30

export function startOfUtcDayIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}
