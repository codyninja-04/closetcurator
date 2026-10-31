'use client'

import { useState, useTransition } from 'react'
import type { TempUnit } from '@/lib/types'
import { deleteAccount, savePreferences } from './actions'

export function PreferencesForm({ unit, city }: { unit: TempUnit; city: string | null }) {
  const [pending, start] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null)
          setSaved(false)
          try {
            await savePreferences(fd)
            setSaved(true)
          } catch (e) {
            setError((e as Error).message)
          }
        })
      }
      onChange={() => setSaved(false)}
      className="space-y-5"
    >
      <fieldset>
        <legend className="field-label">Temperature</legend>
        <div className="flex gap-2">
          {(['C', 'F'] as const).map((u) => (
            <label key={u} className="cursor-pointer">
              <input type="radio" name="temp_unit" value={u} defaultChecked={unit === u} className="peer sr-only" />
              <span className="toggle-chip-off peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ink/40">
                {u === 'C' ? 'Celsius' : 'Fahrenheit'}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="home_city" className="field-label">
          Home city
        </label>
        <input id="home_city" name="home_city" className="input max-w-sm" maxLength={80} defaultValue={city ?? ''} placeholder="Singapore" />
        <p className="hint">Used for the weather when your browser doesn&rsquo;t share a location.</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-ghost py-2" disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="text-sm text-worn-ink">Saved</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </form>
  )
}

export function DeleteAccount({ items }: { items: number }) {
  const [pending, start] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Removes your account, {items} {items === 1 ? 'piece' : 'pieces'}, every photo, wear and outfit. Export first if you want a copy. This can&rsquo;t be undone.
        </p>
        {confirming ? (
          <div className="flex shrink-0 gap-2">
            <button type="button" className="btn-quiet" onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  try {
                    await deleteAccount()
                  } catch (e) {
                    setError((e as Error).message)
                  }
                })
              }
            >
              {pending ? 'Deleting…' : 'Yes, delete it all'}
            </button>
          </div>
        ) : (
          <button type="button" className="btn-ghost shrink-0" onClick={() => setConfirming(true)}>
            Delete account
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  )
}
