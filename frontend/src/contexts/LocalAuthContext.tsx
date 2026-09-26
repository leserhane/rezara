import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Profile, Role } from '@/types/database'

// Local-edition replacement for '@/contexts/AuthContext' — same exported
// names and the parts of the shape ProtectedRoute/pages actually use
// (session, profile, role, loading, isAdmin, signOut, refreshProfile), so
// nothing outside auth screens needs to know which edition it's running
// in. What differs is entirely how you *become* signed in: no email or
// password for an optician, just picking a name from a list the admin
// maintains; the admin picks their own name too, then enters the
// password set at install time.

interface LocalAuthState {
  session: { id: string } | null
  profile: Profile | null
  role: Role | null
  loading: boolean
  isAdmin: boolean
  pickOptician: (id: string) => Promise<{ error: string | null }>
  loginAsAdmin: (id: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<LocalAuthState | undefined>(undefined)

const ROLE_NAMES: Record<string, string> = { admin: 'Administrateur', opticien: 'Opticien' }

function roleFromKey(key: string): Role {
  return { id: key, key: key as Role['key'], name: ROLE_NAMES[key] ?? key, description: null, is_system: true, created_at: new Date().toISOString() }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<Role | null>(null)

  const pickOptician = useCallback(async (id: string) => {
    const { data, error } = await window.__local.pickOptician(id)
    if (error) return { error: error.message }
    const result = data as { profile: Profile; role_key: string }
    setProfile(result.profile)
    setRole(roleFromKey(result.role_key))
    return { error: null }
  }, [])

  const loginAsAdmin = useCallback(async (id: string, password: string) => {
    const { data, error } = await window.__local.adminLogin(id, password)
    if (error) return { error: error.message === 'invalid_password' ? 'Mot de passe incorrect.' : error.message }
    const result = data as { profile: Profile; role_key: string }
    setProfile(result.profile)
    setRole(roleFromKey(result.role_key))
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await window.__local.signOut()
    setProfile(null)
    setRole(null)
  }, [])

  const requestPasswordReset = useCallback(async () => {
    return { error: "Réinitialisation indisponible dans l'édition locale — contactez un administrateur." }
  }, [])

  const refreshProfile = useCallback(async () => {
    // Nothing to re-fetch remotely in the local edition; the profile
    // object set at pick/login time is already current.
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session: profile ? { id: profile.id } : null,
        profile,
        role,
        loading: false,
        isAdmin: role?.key === 'admin',
        pickOptician,
        loginAsAdmin,
        signOut,
        requestPasswordReset,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
