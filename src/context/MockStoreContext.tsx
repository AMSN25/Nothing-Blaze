import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth'
import type { TitleSummary } from '../lib/tmdb'
import {
  addListItem,
  clearHistory,
  createUserList,
  deleteUserList,
  fetchHistory,
  fetchUserLists,
  recordHistory as recordHistoryFn,
  removeListItem,
  type CustomList,
  type HistoryEntry,
} from '../lib/supabaseData'

interface MockStoreValue {
  lists: CustomList[]
  history: HistoryEntry[]
  refresh: () => void
  createList: (name: string) => CustomList | null
  deleteList: (id: string) => void
  addToList: (listId: string, titleId: string) => void
  removeFromList: (listId: string, titleId: string) => void
  recordHistory: (item: TitleSummary, playback?: { season?: number; episode?: number }) => void
  clearHistory: () => void
}

const MockStoreContext = createContext<MockStoreValue | undefined>(undefined)

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const [lists, setLists] = useState<CustomList[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const reload = useCallback(async () => {
    if (!userId) {
      setLists([])
      setHistory([])
      return
    }
    const [nextLists, nextHistory] = await Promise.all([
      fetchUserLists(userId),
      fetchHistory(userId),
    ])
    setLists(nextLists)
    setHistory(nextHistory)
  }, [userId])

  useEffect(() => {
    void Promise.resolve()
      .then(reload)
      .catch(() => undefined)
  }, [reload])

  const refresh = () => {
    void reload().catch(() => undefined)
  }

  const value: MockStoreValue = {
    lists,
    history,
    refresh,
    createList: (name) => {
      if (!userId) return null
      void createUserList(userId, { name, description: '', isPublic: true })
        .then(refresh)
        .catch(() => undefined)
      return null
    },
    deleteList: (id) => {
      if (!userId) return
      void deleteUserList(userId, id).then(refresh).catch(() => undefined)
    },
    addToList: (listId, titleId) => {
      if (!userId) return
      void addListItem(userId, listId, {
        id: Number(titleId),
        kind: 'movie',
        title: titleId,
        year: '',
        poster: '',
      }).then(refresh).catch(() => undefined)
    },
    removeFromList: (listId, titleId) => {
      if (!userId) return
      void removeListItem(userId, listId, 'movie', Number(titleId)).then(refresh).catch(() => undefined)
    },
    recordHistory: (item, playback) => {
      if (!userId) return
      void recordHistoryFn(userId, item, playback).then(refresh).catch(() => undefined)
    },
    clearHistory: () => {
      if (!userId) return
      void clearHistory(userId).then(refresh).catch(() => undefined)
    },
  }

  return <MockStoreContext.Provider value={value}>{children}</MockStoreContext.Provider>
}

export function useMockStore() {
  const ctx = useContext(MockStoreContext)
  if (!ctx) throw new Error('useMockStore must be used within MockStoreProvider')
  return ctx
}
