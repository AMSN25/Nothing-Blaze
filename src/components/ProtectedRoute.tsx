import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="shell" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="shell" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

