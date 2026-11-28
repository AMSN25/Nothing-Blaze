import { createContext } from 'react'
import type { Kind } from '../lib/tmdb'

export interface WatchEntry {
  id: number
  kind: Kind
  title: string
  poster: string
  year: string
  rating: string
}

export const toWatchEntry = (title: {
  id: number
  kind: Kind
  title: string
  poster: string
  year: string
  rating: string
}): WatchEntry => ({
  id: title.id,
  kind: title.kind,
  title: title.title,
  poster: title.poster,
  year: title.year,
  rating: title.rating,
})

export interface WatchlistValue {
  items: WatchEntry[]
  count: number
  has: (kind: Kind, id: number) => boolean
  toggle: (entry: WatchEntry) => void
  remove: (kind: Kind, id: number) => void
}

export const WatchlistContext = createContext<WatchlistValue | null>(null)
