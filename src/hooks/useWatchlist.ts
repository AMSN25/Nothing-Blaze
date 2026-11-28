import { useContext } from 'react'
import { WatchlistContext, type WatchlistValue } from '../context/WatchlistContext'

export function useWatchlist(): WatchlistValue {
  const context = useContext(WatchlistContext)
  if (!context) throw new Error('useWatchlist must be used inside WatchlistProvider')
  return context
}
