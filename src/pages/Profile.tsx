import { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Mail, User, LogOut, Save, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/auth'
import { useWatchlist } from '../hooks/useWatchlist'
import { useMockStore } from '../context/MockStoreContext'
import { fetchUserRatingCount } from '../lib/supabaseData'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout, updateProfile, loading: authLoading } = useAuth()
  const userId = user?.id ?? ''
  const { count } = useWatchlist()
  const { lists, history } = useMockStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [ratingsCount, setRatingsCount] = useState(0)

  useEffect(() => {
    if (!userId) return
    void fetchUserRatingCount(userId)
      .then(setRatingsCount)
      .catch(() => setRatingsCount(0))
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      await updateProfile({ name: name.trim(), email: email.trim() })
      setSuccess('Profile updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="page profile-page">
      <section className="shell page-head">
        <p className="eyebrow mono">05 / Account</p>
        <h1 className="page-title">Profile</h1>
      </section>

      <section className="section shell">
        <div className="profile-grid">
          <div className="profile-card">
            <div className="profile-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h2 className="profile-name">{user.name}</h2>
            <p className="profile-email mono">{user.email}</p>
            <p className="profile-member mono">Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

            <div className="profile-stats">
              <div className="profile-stat">
                <span className="mono">{count}</span>
                <span className="mono">Watchlist</span>
              </div>
              <div className="profile-stat">
                <span className="mono">{ratingsCount}</span>
                <span className="mono">Ratings</span>
              </div>
              <div className="profile-stat">
                <span className="mono">{lists.length}</span>
                <span className="mono">Lists</span>
              </div>
              <div className="profile-stat">
                <span className="mono">{history.length}</span>
                <span className="mono">History</span>
              </div>
            </div>

            {user.isAdmin ? (
              <a className="link-arrow" href="/admin" style={{ marginTop: 12, display: 'inline-flex' }}>
                Open admin
              </a>
            ) : null}
          </div>

          <div className="profile-form-card">
            <h3 className="profile-section-title mono">Account settings</h3>

            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={14} strokeWidth={2} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="auth-success" role="status">
                <Check size={14} strokeWidth={2} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="auth-form">
              <div className="field">
                <label htmlFor="name" className="field-label mono">Name</label>
                <div className="field-input-wrapper">
                  <User size={14} strokeWidth={1.6} className="field-icon" aria-hidden="true" />
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    className="field-input"
                    value={name || user.name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="email" className="field-label mono">Email</label>
                <div className="field-input-wrapper">
                  <Mail size={14} strokeWidth={1.6} className="field-icon" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="field-input"
                    value={email || user.email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn--solid btn--full auth-submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
                <Save size={12} strokeWidth={2} />
              </button>
            </form>

            <div className="profile-danger">
              <hr className="divider" />
              <button
                type="button"
                className="btn btn--ghost btn--full btn--danger"
                onClick={() => setShowLogout(true)}
              >
                <LogOut size={12} strokeWidth={2} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </section>

      {showLogout && (
        <div className="modal-overlay" onClick={() => setShowLogout(false)} role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="logout-title" className="modal-title mono">Sign out</h3>
            <p className="modal-text">Are you sure you want to sign out?</p>
            <div className="modal-actions">
              <button className="btn btn--ghost" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="btn btn--solid btn--danger" onClick={handleLogout}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

