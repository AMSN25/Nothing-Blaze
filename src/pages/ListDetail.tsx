import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Lock, Globe, GripVertical, AlertCircle } from 'lucide-react'
import PosterCard from '../components/PosterCard'
import { GridSkeleton } from '../components/Skeletons'
import { useAuth } from '../context/auth'
import {
  fetchUserLists,
  removeListItem,
  reorderListItems,
  updateUserList,
  type CustomList,
} from '../lib/supabaseData'

export default function ListDetail() {
  const params = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? ''
  const listId = params.id as string
  const [list, setList] = useState<CustomList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPublic, setEditPublic] = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const loadList = useCallback(async () => {
    if (!userId) {
      setList(null)
      setLoading(false)
      return
    }
    try {
      const lists = await fetchUserLists(userId)
      setList(lists.find((entry) => entry.id === listId) ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load list')
      setList(null)
    } finally {
      setLoading(false)
    }
  }, [userId, listId])

  useEffect(() => {
    void Promise.resolve()
      .then(loadList)
      .catch(() => undefined)
  }, [loadList])

  const isOwner = Boolean(user && list)

  if (authLoading || loading) {
    return (
      <div className="page">
        <section className="shell page-head">
          <p className="eyebrow mono">List</p>
          <h1 className="page-title">Loading…</h1>
        </section>
        <section className="section shell">
          <GridSkeleton />
        </section>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="page">
        <section className="shell page-head">
          <p className="eyebrow mono">List</p>
          <h1 className="page-title">List not found</h1>
        </section>
        <section className="section shell">
          <div className="empty shell">
            <p className="mono muted">404</p>
            <h1 className="empty__title">This list doesn&apos;t exist</h1>
            <Link className="btn btn--solid" to="/lists">
              Back to your lists
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !editName.trim()) return
    setError('')
    const updates = { name: editName.trim(), description: editDesc.trim(), isPublic: editPublic }
    try {
      await updateUserList(user.id, list.id, updates)
      setList({ ...list, ...updates })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update list')
    }
  }

  const handleDeleteItem = async (itemId: number, kind: 'movie' | 'tv') => {
    if (!user) return
    setError('')
    try {
      await removeListItem(user.id, list.id, kind, itemId)
      setList({ ...list, items: list.items.filter((item) => !(item.id === itemId && item.kind === kind)) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove title')
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!user || !draggingId || draggingId === targetId) return
    const fromIndex = list.items.findIndex((item) => `${item.kind}-${item.id}` === draggingId)
    const toIndex = list.items.findIndex((item) => `${item.kind}-${item.id}` === targetId)
    if (fromIndex !== -1 && toIndex !== -1) {
      const newItems = [...list.items]
      const [removed] = newItems.splice(fromIndex, 1)
      newItems.splice(toIndex, 0, removed)
      try {
        await reorderListItems(user.id, list.id, newItems)
        setList({ ...list, items: newItems })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not reorder list')
      }
    }
    setDraggingId(null)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
  }

  return (
    <div className="page list-detail-page">
      <section className="shell page-head">
        <button className="icon-btn detail__back" type="button" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={16} strokeWidth={1.6} />
        </button>
        {error ? (
          <div className="auth-error" role="alert">
            <AlertCircle size={14} strokeWidth={2} />
            <span>{error}</span>
          </div>
        ) : null}
        <div className="list-detail-header">
          {editing ? (
            <form onSubmit={handleSave} className="list-detail-edit">
              <div className="field">
                <input
                  type="text"
                  className="field-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <textarea
                  className="field-input field-textarea"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  placeholder="Description"
                />
              </div>
              <div className="field field-checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editPublic}
                    onChange={(e) => setEditPublic(e.target.checked)}
                  />
                  <span className="checkbox-custom" />
                  <span className="mono">Public</span>
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--solid">
                  Save
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="list-detail-meta">
                <span className={`list-visibility ${list.isPublic ? 'public' : 'private'}`}>
                  {list.isPublic ? <Globe size={12} strokeWidth={1.5} /> : <Lock size={12} strokeWidth={1.5} />}
                  <span className="mono">{list.isPublic ? 'Public' : 'Private'}</span>
                </span>
                <span className="list-count mono">{list.items.length} {list.items.length === 1 ? 'title' : 'titles'}</span>
              </div>
              <h1 className="list-detail-title">{list.name}</h1>
              {list.description && <p className="list-detail-desc">{list.description}</p>}
              <p className="list-detail-date mono">Updated {new Date(list.updatedAt).toLocaleDateString()}</p>
              {isOwner && (
                <button className="btn btn--ghost" type="button" onClick={() => { setEditName(list.name); setEditDesc(list.description); setEditPublic(list.isPublic); setEditing(true); }}>
                  <Edit size={14} strokeWidth={1.6} />
                  Edit list
                </button>
              )}
            </>
          )}
        </div>
      </section>

      <section className="section shell">
        {list.items.length === 0 ? (
          <div className="list-empty">
            <p className="mono muted">This list is empty</p>
            <p className="list-empty-text mono">Add titles from their detail pages</p>
          </div>
        ) : (
          <div className="list-items">
            {list.items.map((item, index) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="list-item"
                draggable={isOwner}
                onDragStart={(e) => handleDragStart(e, `${item.kind}-${item.id}`)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, `${item.kind}-${item.id}`)}
                onDragEnd={handleDragEnd}
                data-dragging={draggingId === `${item.kind}-${item.id}`}
              >
                <span className="list-item-rank mono">{index + 1}</span>
                {isOwner && (
                  <button className="list-item-drag" aria-label="Reorder">
                    <GripVertical size={14} strokeWidth={1.6} />
                  </button>
                )}
                <PosterCard
                  item={{
                    id: item.id,
                    kind: item.kind,
                    title: item.title,
                    year: item.year,
                    rating: '—',
                    poster: item.poster,
                    backdrop: '',
                    backdropCompact: '',
                    overview: '',
                    genres: [],
                    popularity: 0,
                  }}
                />
                <div className="list-item-info">
                  <Link to={`/title/${item.kind}/${item.id}`} className="list-item-title">
                    {item.title}
                  </Link>
                  <span className="list-item-year mono">{item.year}</span>
                  <span className="list-item-kind mono">{item.kind === 'tv' ? 'Series' : 'Film'}</span>
                </div>
                {isOwner && (
                  <button
                    className="icon-btn btn--danger"
                    onClick={() => handleDeleteItem(item.id, item.kind)}
                    aria-label="Remove from list"
                  >
                    <Trash2 size={14} strokeWidth={1.6} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
