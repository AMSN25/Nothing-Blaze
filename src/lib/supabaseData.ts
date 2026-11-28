import { supabase } from './supabase'
import type { Kind } from './tmdb'
import type { WatchEntry } from '../context/WatchlistContext'

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar: string
  createdAt: string
  isAdmin: boolean
}

export interface ListItem {
  id: number
  kind: Kind
  title: string
  year: string
  poster: string
  addedAt: string
}

export interface CustomList {
  id: string
  name: string
  description: string
  isPublic: boolean
  items: ListItem[]
  createdAt: string
  updatedAt: string
}

export interface RatingEntry {
  id: string
  userId: string
  kind: Kind
  titleId: number
  score: number
  review: string
  helpful: number
  createdAt: string
  authorName: string
  authorAvatar: string
}

export interface HistoryEntry {
  titleId: number
  kind: Kind
  title: string
  poster: string
  at: string
  progress: number
  season: number | null
  episode: number | null
}

interface ProfileRow {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
}

interface WatchlistRow {
  kind: Kind
  title_id: number
  title: string
  poster: string
  year: string
  rating: string
}

interface ListRow {
  id: string
  name: string
  description: string
  is_public: boolean
  created_at: string
  updated_at: string
}

interface ListItemRow {
  id: string
  list_id: string
  kind: Kind
  title_id: number
  title: string
  year: string
  poster: string
  position: number
  added_at: string
}

interface RatingRow {
  id: string
  user_id: string
  kind: Kind
  title_id: number
  score: number
  review: string
  helpful: number
  created_at: string
  author_name: string
  author_avatar: string
}

interface HistoryRow {
  title_id: string
  kind: Kind
  title: string
  poster: string
  watched_at: string
  progress: number | null
  season: number | null
  episode: number | null
}

const mapProfile = (row: ProfileRow): UserProfile => ({
  id: row.id,
  email: row.email,
  name: row.display_name || row.email.split('@')[0],
  avatar: row.avatar_url ?? '',
  createdAt: row.created_at,
  isAdmin: row.role === 'admin',
})

const mapListItem = (row: ListItemRow): ListItem => ({
  id: Number(row.title_id),
  kind: row.kind,
  title: row.title,
  year: row.year,
  poster: row.poster,
  addedAt: row.added_at,
})

const mapRating = (row: RatingRow): RatingEntry => ({
  id: row.id,
  userId: row.user_id,
  kind: row.kind,
  titleId: Number(row.title_id),
  score: row.score,
  review: row.review,
  helpful: row.helpful,
  createdAt: row.created_at,
  authorName: row.author_name || 'CineBlaze member',
  authorAvatar: row.author_avatar,
})

export async function fetchProfile(id: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,display_name,avatar_url,role,created_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapProfile(data as ProfileRow) : null
}

export async function fetchProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,display_name,avatar_url,role,created_at')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapProfile(row as ProfileRow))
}

export async function updateProfileRecord(
  id: string,
  updates: { name?: string; avatar?: string },
): Promise<void> {
  const patch: { display_name?: string; avatar_url?: string } = {}
  if (updates.name !== undefined) patch.display_name = updates.name
  if (updates.avatar !== undefined) patch.avatar_url = updates.avatar
  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchAdminCounts(): Promise<Record<string, { lists: number; history: number }>> {
  const [listResult, historyResult] = await Promise.all([
    supabase.from('lists').select('user_id'),
    supabase.from('watch_history').select('user_id'),
  ])
  if (listResult.error) throw new Error(listResult.error.message)
  if (historyResult.error) throw new Error(historyResult.error.message)

  const counts: Record<string, { lists: number; history: number }> = {}
  const ensure = (id: string) => {
    if (!counts[id]) counts[id] = { lists: 0, history: 0 }
    return counts[id]
  }
  for (const row of listResult.data ?? []) ensure(row.user_id).lists += 1
  for (const row of historyResult.data ?? []) ensure(row.user_id).history += 1
  return counts
}

export async function setProfileAdmin(id: string, isAdmin: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role: isAdmin ? 'admin' : 'user' })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_account', { target: id })
  if (error) throw new Error(error.message)
}

export async function resetAllData(): Promise<void> {
  const { error } = await supabase.rpc('admin_reset_all')
  if (error) throw new Error(error.message)
}

export async function fetchMaintenance(): Promise<boolean> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'maintenance')
    .maybeSingle()
  if (error) throw new Error(error.message)
  const value = data?.value as { enabled?: boolean } | null
  return value?.enabled === true
}

export async function setMaintenanceValue(enabled: boolean): Promise<void> {
  const { error } = await supabase.from('site_settings').upsert({
    key: 'maintenance',
    value: { enabled },
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function fetchWatchlist(userId: string): Promise<WatchEntry[]> {
  const { data, error } = await supabase
    .from('watchlist')
    .select('kind,title_id,title,poster,year,rating')
    .eq('user_id', userId)
    .order('added_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => {
    const entry = row as WatchlistRow
    return {
      id: Number(entry.title_id),
      kind: entry.kind,
      title: entry.title,
      poster: entry.poster,
      year: entry.year,
      rating: entry.rating,
    }
  })
}

export async function addWatchlistEntry(userId: string, entry: WatchEntry): Promise<void> {
  const { error } = await supabase.from('watchlist').upsert(
    {
      user_id: userId,
      kind: entry.kind,
      title_id: entry.id,
      title: entry.title,
      poster: entry.poster,
      year: entry.year,
      rating: entry.rating,
    },
    { onConflict: 'user_id,kind,title_id', ignoreDuplicates: true },
  )
  if (error) throw new Error(error.message)
}

export async function removeWatchlistEntry(userId: string, kind: Kind, titleId: number): Promise<void> {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('kind', kind)
    .eq('title_id', titleId)
  if (error) throw new Error(error.message)
}

export async function fetchUserLists(userId: string): Promise<CustomList[]> {
  const { data: rows, error } = await supabase
    .from('lists')
    .select('id,name,description,is_public,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)

  const listRows = (rows ?? []) as ListRow[]
  if (listRows.length === 0) return []

  const ids = listRows.map((row) => row.id)
  const { data: itemRows, error: itemError } = await supabase
    .from('list_items')
    .select('id,list_id,kind,title_id,title,year,poster,position,added_at')
    .in('list_id', ids)
    .order('position', { ascending: true })
    .order('added_at', { ascending: true })
  if (itemError) throw new Error(itemError.message)

  const items = (itemRows ?? []) as ListItemRow[]
  return listRows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    isPublic: row.is_public,
    items: items.filter((item) => item.list_id === row.id).map(mapListItem),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function createUserList(
  userId: string,
  data: { name: string; description: string; isPublic: boolean },
): Promise<CustomList> {
  const { data: row, error } = await supabase
    .from('lists')
    .insert({
      user_id: userId,
      name: data.name,
      description: data.description,
      is_public: data.isPublic,
    })
    .select('id,name,description,is_public,created_at,updated_at')
    .single()
  if (error) throw new Error(error.message)
  const created = row as ListRow
  return {
    id: created.id,
    name: created.name,
    description: created.description,
    isPublic: created.is_public,
    items: [],
    createdAt: created.created_at,
    updatedAt: created.updated_at,
  }
}

export async function updateUserList(
  userId: string,
  id: string,
  updates: Partial<Pick<CustomList, 'name' | 'description' | 'isPublic'>>,
): Promise<void> {
  const patch: { name?: string; description?: string; is_public?: boolean; updated_at: string } = {
    updated_at: new Date().toISOString(),
  }
  if (updates.name !== undefined) patch.name = updates.name
  if (updates.description !== undefined) patch.description = updates.description
  if (updates.isPublic !== undefined) patch.is_public = updates.isPublic
  const { error } = await supabase.from('lists').update(patch).eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function deleteUserList(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('lists').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function addListItem(userId: string, listId: string, item: Omit<ListItem, 'addedAt'>): Promise<void> {
  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('id')
    .eq('id', listId)
    .eq('user_id', userId)
    .maybeSingle()
  if (listError) throw new Error(listError.message)
  if (!list) return

  const { count, error: countError } = await supabase
    .from('list_items')
    .select('id', { count: 'exact', head: true })
    .eq('list_id', listId)
  if (countError) throw new Error(countError.message)

  const { error } = await supabase.from('list_items').upsert(
    {
      list_id: listId,
      kind: item.kind,
      title_id: item.id,
      title: item.title,
      year: item.year,
      poster: item.poster,
      position: count ?? 0,
    },
    { onConflict: 'list_id,kind,title_id', ignoreDuplicates: true },
  )
  if (error) throw new Error(error.message)

  const { error: touchError } = await supabase
    .from('lists')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', listId)
    .eq('user_id', userId)
  if (touchError) throw new Error(touchError.message)
}

export async function removeListItem(userId: string, listId: string, kind: Kind, titleId: number): Promise<void> {
  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('id')
    .eq('id', listId)
    .eq('user_id', userId)
    .maybeSingle()
  if (listError) throw new Error(listError.message)
  if (!list) return

  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('list_id', listId)
    .eq('kind', kind)
    .eq('title_id', titleId)
  if (error) throw new Error(error.message)
}

export async function reorderListItems(userId: string, listId: string, items: ListItem[]): Promise<void> {
  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('id')
    .eq('id', listId)
    .eq('user_id', userId)
    .maybeSingle()
  if (listError) throw new Error(listError.message)
  if (!list) return

  const { data: rows, error: fetchError } = await supabase
    .from('list_items')
    .select('id,kind,title_id')
    .eq('list_id', listId)
  if (fetchError) throw new Error(fetchError.message)

  const keyed = new Map(
    (rows ?? []).map((row) => [`${row.kind}-${Number(row.title_id)}`, row.id as string]),
  )
  const updates = items
    .map((item, index) => {
      const rowId = keyed.get(`${item.kind}-${item.id}`)
      return rowId ? { id: rowId, position: index } : null
    })
    .filter((row): row is { id: string; position: number } => row !== null)
  if (updates.length === 0) return

  await Promise.all(
    updates.map(async ({ id, position }) => {
      const { error } = await supabase
        .from('list_items')
        .update({ position })
        .eq('id', id)
        .eq('list_id', listId)
      if (error) throw new Error(error.message)
    }),
  )
}

export async function fetchRatings(kind: Kind, titleId: number): Promise<RatingEntry[]> {
  const { data, error } = await supabase
    .from('ratings')
    .select('id,user_id,kind,title_id,score,review,helpful,created_at,author_name,author_avatar')
    .eq('kind', kind)
    .eq('title_id', titleId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapRating(row as RatingRow))
}

export async function saveRating(
  userId: string,
  kind: Kind,
  titleId: number,
  score: number,
  review: string,
  author: { name: string; avatar: string },
): Promise<void> {
  const { error } = await supabase.from('ratings').upsert(
    {
      user_id: userId,
      kind,
      title_id: titleId,
      score,
      review,
      author_name: author.name,
      author_avatar: author.avatar,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,kind,title_id' },
  )
  if (error) throw new Error(error.message)
}

export async function fetchUserRatingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('ratings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function deleteRating(userId: string, kind: Kind, titleId: number): Promise<void> {
  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('user_id', userId)
    .eq('kind', kind)
    .eq('title_id', titleId)
  if (error) throw new Error(error.message)
}

export async function fetchHistory(userId: string): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from('watch_history')
    .select('title_id,kind,title,poster,watched_at,progress,season,episode')
    .eq('user_id', userId)
    .order('watched_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => {
    const entry = row as HistoryRow
    return {
      titleId: Number(entry.title_id.slice(entry.kind.length + 1)),
      kind: entry.kind,
      title: entry.title,
      poster: entry.poster,
      at: entry.watched_at,
      progress: entry.progress ?? 0,
      season: entry.season,
      episode: entry.episode,
    }
  })
}

export async function recordHistory(
  userId: string,
  item: {
    id: number
    kind: Kind
    title: string
    poster: string
  },
  playback?: { season?: number | null; episode?: number | null },
): Promise<void> {
  const { error } = await supabase.from('watch_history').upsert(
    {
      user_id: userId,
      title_id: `${item.kind}-${item.id}`,
      kind: item.kind,
      title: item.title,
      poster: item.poster,
      watched_at: new Date().toISOString(),
      season: playback?.season ?? null,
      episode: playback?.episode ?? null,
    },
    { onConflict: 'user_id,title_id' },
  )
  if (error) throw new Error(error.message)
}

/** Persist how far a title got while it was playing (0-100). */
export async function saveWatchProgress(
  userId: string,
  kind: Kind,
  titleId: number,
  progress: number,
): Promise<void> {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)))
  const { error } = await supabase
    .from('watch_history')
    .update({ progress: clamped })
    .eq('user_id', userId)
    .eq('title_id', `${kind}-${titleId}`)
  if (error) throw new Error(error.message)
}

export async function clearHistory(userId: string): Promise<void> {
  const { error } = await supabase.from('watch_history').delete().eq('user_id', userId)
  if (error) throw new Error(error.message)
}
