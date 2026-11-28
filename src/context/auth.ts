import { createContext, useContext } from 'react'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
  isAdmin?: boolean
}

export interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<AuthUser>) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
