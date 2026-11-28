import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '../context/auth'
import { setMaintenanceSnapshot, useMaintenance } from '../lib/maintenance'
import {
  deleteAccount,
  fetchAdminCounts,
  fetchProfiles,
  resetAllData,
  setMaintenanceValue as setMaintenance,
  setProfileAdmin,
  type UserProfile,
} from '../lib/supabaseData'

interface AdminCounts {
  [userId: string]: { lists: number; history: number }
}

export default function Admin() {
  const { user } = useAuth()
  const maintenance = useMaintenance()
  const [accounts, setAccounts] = useState<UserProfile[]>([])
  const [counts, setCounts] = useState<AdminCounts>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const [profiles, nextCounts] = await Promise.all([
      fetchProfiles(),
      fetchAdminCounts(),
    ])
    setAccounts(profiles)
    setCounts(nextCounts)
  }, [])

  useEffect(() => {
    if (!user?.isAdmin) return
    void Promise.resolve()
      .then(refresh)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load admin data')
      })
  }, [user?.isAdmin, refresh])

  if (!user?.isAdmin) return <Navigate to="/" replace />

  const toggleMaintenance = async () => {
    const next = !maintenance
    setBusy('maintenance')
    try {
      await setMaintenance(next)
      setMaintenanceSnapshot(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update site status')
    } finally {
      setBusy(null)
    }
  }

  const toggleAdmin = async (account: UserProfile) => {
    setBusy(account.id)
    try {
      await setProfileAdmin(account.id, !account.isAdmin)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update role')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (account: UserProfile) => {
    if (!confirm(`Delete ${account.email}? This cannot be undone.`)) return
    setBusy(account.id)
    try {
      await deleteAccount(account.id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account')
    } finally {
      setBusy(null)
    }
  }

  const resetAll = async () => {
    if (!confirm('Delete ALL other accounts, lists and history?')) return
    setBusy('reset')
    try {
      await resetAllData()
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset data')
    } finally {
      setBusy(null)
    }
  }

  const adminCount = accounts.filter((account) => account.isAdmin).length

  return (
    <div className="page">
      <section className="shell page-head">
        <p className="eyebrow mono">Admin</p>
        <h1 className="page-title">Control room</h1>
      </section>

      <section className="section shell">
        {error ? (
          <div className="auth-error" role="alert">
            <AlertCircle size={14} strokeWidth={2} />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="profile-grid">
          <div className="profile-card">
            <h2 className="profile-name mono">{accounts.length}</h2>
            <p className="profile-email mono">Accounts</p>
          </div>
          <div className="profile-card">
            <h2 className="profile-name mono">{adminCount}</h2>
            <p className="profile-email mono">Admins</p>
          </div>
          <div className="profile-card">
            <h2 className="profile-name mono">Supabase</h2>
            <p className="profile-email mono">Auth mode</p>
          </div>
        </div>

        <div className="profile-form-card" style={{ marginTop: 24 }}>
          <h3 className="profile-section-title mono">Site status</h3>
          <p className="profile-email mono">
            Under construction: {maintenance ? 'on' : 'off'}
          </p>
          <p className="auth-subtitle mono" style={{ marginTop: 8 }}>
            {maintenance
              ? 'Visitors see a maintenance page. You can still use the site.'
              : 'Visitors can browse the site normally.'}
          </p>
          <button
            type="button"
            className={`btn ${maintenance ? 'btn--solid' : 'btn--ghost'}`}
            aria-pressed={maintenance}
            onClick={toggleMaintenance}
            disabled={busy === 'maintenance'}
            style={{ marginTop: 16 }}
          >
            {maintenance ? 'Turn off under construction' : 'Turn on under construction'}
          </button>
        </div>

        <div className="profile-form-card" style={{ marginTop: 24 }}>
          <h3 className="profile-section-title mono">Accounts</h3>
          <ul className="admin-list">
            {accounts.map((account) => {
              const totals = counts[account.id] ?? { lists: 0, history: 0 }
              return (
                <li key={account.id} className="admin-list__row admin-list__row--wide">
                  <span>{account.name}</span>
                  <span className="mono">{account.email}</span>
                  <span className="mono">{account.isAdmin ? 'admin' : 'user'}</span>
                  <span className="mono">{totals.lists} lists · {totals.history} history</span>
                  <span className="admin-list__actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      disabled={busy === account.id}
                      onClick={() => toggleAdmin(account)}
                    >
                      {account.isAdmin ? 'Revoke admin' : 'Make admin'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm btn--danger"
                      disabled={busy === account.id || account.id === user.id}
                      onClick={() => remove(account)}
                    >
                      Delete
                    </button>
                  </span>
                </li>
              )
            })}
            {accounts.length === 0 ? <li className="mono">No accounts yet.</li> : null}
          </ul>

          <div style={{ marginTop: 24 }}>
            <button type="button" className="btn btn--ghost btn--danger" onClick={resetAll} disabled={busy === 'reset'}>
              Reset all data
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
