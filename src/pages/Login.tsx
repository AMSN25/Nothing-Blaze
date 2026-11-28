import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/auth'

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page auth-page">
      <div className="shell auth-card">
        <header className="auth-header">
          <Link to="/" className="brand" aria-label="CineBlaze home">
            CINEBLAZE<i>®</i>
          </Link>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle mono">Sign in to your cinema index</p>
        </header>

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={14} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="field">
            <label htmlFor="email" className="field-label mono">Email</label>
            <div className="field-input-wrapper">
              <Mail size={14} strokeWidth={1.6} className="field-icon" aria-hidden="true" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password" className="field-label mono">Password</label>
            <div className="field-input-wrapper">
              <Lock size={14} strokeWidth={1.6} className="field-icon" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="field-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} strokeWidth={1.6} /> : <Eye size={14} strokeWidth={1.6} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn--solid btn--full auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer mono">
          Don&apos;t have an account? <Link to="/signup" className="link-arrow">Sign up</Link>
        </p>

        <p className="auth-footer mono">
          <Link to="/" className="link-arrow">Back to home</Link>
        </p>
      </div>
    </div>
  )
}

