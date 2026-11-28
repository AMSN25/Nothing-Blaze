import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Kind } from '../lib/tmdb'
import { addWatchlistEntry, fetchWatchlist, removeWatchlistEntry } from '../lib/supabaseData'
import { useAuth } from './auth'
import { WatchlistContext, type WatchEntry, type WatchlistValue } from './WatchlistContext'

const GUEST_KEY = 'cineblaze.watchlist.v1'

function readGuest(): WatchEntry[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as WatchEntry[]) : []
  } catch {
    return []
  }
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const [items, setItems] = useState<WatchEntry[]>(readGuest)

  useEffect(() => {
    let active = true

    if (!userId) {
      void Promise.resolve().then(() => {
        if (active) setItems(readGuest())
      })
      return () => {
        active = false
      }
    }

    void fetchWatchlist(userId)
      .then((rows) => {
        if (active) setItems(rows)
      })
      .catch(() => {
        if (active) setItems([])
      })

    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      try {
        localStorage.setItem(GUEST_KEY, JSON.stringify(items))
      } catch {
        // Storage can be unavailable in private mode; the list still works in memory.
      }
    }
  }, [items, userId])

  const has = useCallback(
    (kind: Kind, id: number) => items.some((item) => item.kind === kind && item.id === id),
    [items],
  )

  const toggle = useCallback((entry: WatchEntry) => {
    const exists = items.some((item) => item.kind === entry.kind && item.id === entry.id)
    setItems((previous) =>
      exists
        ? previous.filter((item) => !(item.kind === entry.kind && item.id === entry.id))
        : [entry, ...previous],
    )
    if (!user) return
    if (exists) {
      void removeWatchlistEntry(user.id, entry.kind, entry.id).catch(() => undefined)
    } else {
      void addWatchlistEntry(user.id, entry).catch(() => undefined)
    }
  }, [items, user])

  const remove = useCallback((kind: Kind, id: number) => {
    setItems((previous) => previous.filter((item) => !(item.kind === kind && item.id === id)))
    if (user) void removeWatchlistEntry(user.id, kind, id).catch(() => undefined)
  }, [user])

  const value = useMemo<WatchlistValue>(
    () => ({ items, count: items.length, has, toggle, remove }),
    [items, has, toggle, remove],
  )

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}
