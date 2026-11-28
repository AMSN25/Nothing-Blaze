import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Lock, Globe, Star, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/auth'
import {
  createUserList,
  deleteUserList,
  fetchUserLists,
  updateUserList,
  type CustomList,
} from '../lib/supabaseData'

export default function Lists() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? ''
  const [lists, setLists] = useState<CustomList[]>([])
  const [loadingLists, setLoadingLists] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDesc, setNewListDesc] = useState('')
  const [newListPublic, setNewListPublic] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPublic, setEditPublic] = useState(true)

  useEffect(() => {
    if (!userId) {
      void Promise.resolve().then(() => {
        setLists([])
        setLoadingLists(false)
      })
      return
    }

    let active = true
    void fetchUserLists(userId)
      .then((rows) => {
        if (active) setLists(rows)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load lists')
      })
      .finally(() => {
        if (active) setLoadingLists(false)
      })
    return () => {
      active = false
    }
  }, [userId])

  if (authLoading) {
    return (
      <div className="page">
        <div className="shell" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return
    setError('')
    try {
      const list = await createUserList(user.id, {
        name: newListName.trim(),
        description: newListDesc.trim(),
        isPublic: newListPublic,
      })
      setLists((prev) => [list, ...prev])
      setShowCreate(false)
      setNewListName('')
      setNewListDesc('')
      setNewListPublic(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create list')
    }
  }

  const handleEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault()
    if (!editName.trim()) return
    setError('')
    const updates = { name: editName.trim(), description: editDesc.trim(), isPublic: editPublic }
    try {
      await updateUserList(user.id, id, updates)
      setLists((prev) => prev.map((list) => (list.id === id ? { ...list, ...updates } : list)))
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update list')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this list?')) return
    setError('')
    try {
      await deleteUserList(user.id, id)
      setLists((prev) => prev.filter((list) => list.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete list')
    }
  }

  const startEdit = (list: CustomList) => {
    setEditingId(list.id)
    setEditName(list.name)
    setEditDesc(list.description)
    setEditPublic(list.isPublic)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  return (
    <div className="page lists-page">
      <section className="shell page-head">
        <p className="eyebrow mono">06 / Lists</p>
        <h1 className="page-title">Your Lists</h1>
        <p className="page-copy mono">Curate your own collections</p>
      </section>

      <section className="section shell">
        {error ? (
          <div className="auth-error" role="alert">
            <AlertCircle size={14} strokeWidth={2} />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="lists-header">
          <button className="btn btn--solid" type="button" onClick={() => setShowCreate(true)}>
            <Plus size={14} strokeWidth={2} />
            New list
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="list-form">
            <div className="field">
              <label htmlFor="listName" className="field-label mono">List name</label>
              <input
                id="listName"
                type="text"
                className="field-input"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g., Best Sci-Fi Movies"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="listDesc" className="field-label mono">Description (optional)</label>
              <textarea
                id="listDesc"
                className="field-input field-textarea"
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                placeholder="What's this list about?"
                rows={3}
              />
            </div>
            <div className="field field-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newListPublic}
                  onChange={(e) => setNewListPublic(e.target.checked)}
                />
                <span className="checkbox-custom" />
                <span className="mono">Public (visible to others)</span>
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn--solid">
                Create list
              </button>
            </div>
          </form>
        )}

        {lists.length === 0 && !showCreate && !loadingLists && (
          <div className="lists-empty">
            <div className="lists-empty-icon">
              <Star size={48} strokeWidth={1.5} />
            </div>
            <h3 className="lists-empty-title">No lists yet</h3>
            <p className="lists-empty-text mono">Create your first collection of films, series, or anime</p>
            <button className="btn btn--solid" type="button" onClick={() => setShowCreate(true)}>
              <Plus size={14} strokeWidth={2} />
              Create list
            </button>
          </div>
        )}

        {lists.length > 0 && (
          <div className="lists-grid">
            {lists.map((list) => (
              <article key={list.id} className={`list-card ${editingId === list.id ? 'editing' : ''}`}>
                {editingId === list.id ? (
                  <form onSubmit={(e) => handleEdit(e, list.id)} className="list-card-edit">
                    <div className="field">
                      <input
                        type="text"
                        className="field-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
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
                      <button type="button" className="btn btn--ghost" onClick={cancelEdit}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn--solid">
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <Link to={`/list/${list.id}`} className="list-card-link">
                      <div className="list-card-poster">
                        {list.items[0]?.poster ? (
                          <img src={list.items[0].poster} alt="" loading="lazy" />
                        ) : (
                          <div className="list-card-placeholder">
                            {list.items[1]?.poster && <img src={list.items[1].poster} alt="" />}
                            {list.items[2]?.poster && <img src={list.items[2].poster} alt="" />}
                            {list.items[3]?.poster && <img src={list.items[3].poster} alt="" />}
                          </div>
                        )}
                        <span className="list-card-count mono">{list.items.length}</span>
                        <span className={`list-card-visibility ${list.isPublic ? 'public' : 'private'}`}>
                          {list.isPublic ? <Globe size={12} strokeWidth={1.5} /> : <Lock size={12} strokeWidth={1.5} />}
                        </span>
                      </div>
                      <div className="list-card-content">
                        <h3 className="list-card-title">{list.name}</h3>
                        {list.description && <p className="list-card-desc">{list.description}</p>}
                        <div className="list-card-meta mono">
                          <span>{list.items.length} {list.items.length === 1 ? 'title' : 'titles'}</span>
                          <span>Updated {new Date(list.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="list-card-actions">
                      <button className="icon-btn" onClick={() => startEdit(list)} aria-label="Edit list">
                        <Edit size={14} strokeWidth={1.6} />
                      </button>
                      <button className="icon-btn btn--danger" onClick={() => handleDelete(list.id)} aria-label="Delete list">
                        <Trash2 size={14} strokeWidth={1.6} />
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
