import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { AuthContext, type AuthContextType, type AuthUser } from './auth'
import { supabase } from '../lib/supabase'
import { fetchProfile, updateProfileRecord } from '../lib/supabaseData'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let active = true

    const applySession = async (session: Session | null) => {
      if (!session?.user) {
        if (active) {
          setUser(null)
          setToken(null)
          setLoading(false)
        }
        return
      }

      const profile = await fetchProfile(session.user.id).catch(() => null)
      const nextUser: AuthUser = profile
        ? profile
        : {
            id: session.user.id,
            email: session.user.email ?? '',
            name: session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? 'Member',
            createdAt: session.user.created_at,
          }

      if (active) {
        setUser(nextUser)
        setToken(session.access_token)
        setLoading(false)
      }
    }

    void supabase.auth.getSession()
      .then(({ data }) => applySession(data.session))
      .catch(() => applySession(null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    navigate(location.state?.from?.pathname ?? '/')
  }

  const signup = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw new Error(error.message)
    if (!data.session) {
      throw new Error('Check your email to confirm your account, then sign in.')
    }
    navigate('/')
  }

  const logout = () => {
    void supabase.auth.signOut()
    navigate('/')
  }

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) throw new Error('Sign in first')

    const emailChanged = Boolean(
      updates.email && updates.email.toLowerCase() !== user.email.toLowerCase(),
    )

    if (emailChanged) {
      const { error } = await supabase.auth.updateUser({ email: updates.email })
      if (error) throw new Error(error.message)
    }

    await updateProfileRecord(user.id, {
      name: updates.name,
      avatar: updates.avatar,
    })

    const profile = await fetchProfile(user.id).catch(() => null)
    setUser(
      profile ?? {
        ...user,
        name: updates.name ?? user.name,
        avatar: updates.avatar ?? user.avatar,
      },
    )
  }

  const value: AuthContextType = { user, token, loading, login, signup, logout, updateProfile }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
