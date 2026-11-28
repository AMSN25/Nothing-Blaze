import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../context/auth'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!name.trim()) return 'Name is required'
    if (!email.includes('@')) return 'Valid email is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (password !== confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setLoading(true)
    try {
      await signup(name.trim(), email.trim(), password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
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
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle mono">Join the cinema index</p>
        </header>

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={14} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="field">
            <label htmlFor="name" className="field-label mono">Name</label>
            <div className="field-input-wrapper">
              <User size={14} strokeWidth={1.6} className="field-icon" aria-hidden="true" />
              <input
                id="name"
                type="text"
                autoComplete="name"
                className="field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                disabled={loading}
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
                autoComplete="new-password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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

          <div className="field">
            <label htmlFor="confirmPassword" className="field-label mono">Confirm password</label>
            <div className="field-input-wrapper">
              <Lock size={14} strokeWidth={1.6} className="field-icon" aria-hidden="true" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="field-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              {password && confirmPassword && password === confirmPassword && (
                <Check size={14} strokeWidth={2} className="field-icon field-icon--success" aria-hidden="true" />
              )}
            </div>
          </div>

          <button type="submit" className="btn btn--solid btn--full auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer mono">
          Already have an account? <Link to="/login" className="link-arrow">Sign in</Link>
        </p>

        <p className="auth-footer mono">
          <Link to="/" className="link-arrow">Back to home</Link>
        </p>
      </div>
    </div>
  )
}

