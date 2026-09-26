import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import type { Profile, Role } from '@/types/database'
import { supabase, opticianGate, UNPICKED_OPTICIAN_ID } from '@/lib/localSupabase'
import { OpticianPickerModal } from '@/components/auth/OpticianPickerModal'

// Local-edition replacement for '@/contexts/AuthContext'. There are only
// two ways into the app: "Opticien" (no password — the app opens straight
// into the dashboard/clients/ventes/etc, unattributed) and "Admin"
// (password-protected, unlocks stock/prices/reductions/settings and
// margins everywhere). Opticians are just names the admin maintains, not
// accounts — a name only gets picked, via the modal below, at the exact
// moment a create-action needs to know who did it, and that pick is never
// remembered: the very next action asks again. See localSupabase.ts's
// opticianGate for the plumbing that triggers the modal from ordinary
// supabase.from(...).insert(...)/supabase.rpc(...) calls.

interface LocalAuthState {
  session: { id: string } | null
  profile: Profile | null
  role: Role | null
  loading: boolean
  isAdmin: boolean
  isOpticianShell: boolean
  enterOpticianShell: () => Promise<void>
  loginAsAdmin: (id: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
  // Exposed for flows that need to know *which* optician was picked before
  // deciding whether to proceed (NewSalePage checks the picked optician's
  // own discount limit before submitting a sale) — the automatic gate in
  // localSupabase.ts covers every other create-action on its own.
  requestOpticianForAction: () => Promise<Profile | null>
  activateOptician: (id: string) => Promise<void>
  deactivateOptician: () => Promise<void>
}

const AuthContext = createContext<LocalAuthState | undefined>(undefined)

const ROLE_NAMES: Record<string, string> = { admin: 'Administrateur', opticien: 'Opticien' }

function roleFromKey(key: string): Role {
  return { id: key, key: key as Role['key'], name: ROLE_NAMES[key] ?? key, description: null, is_system: true, created_at: new Date().toISOString() }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [isOpticianShell, setIsOpticianShell] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pendingResolve = useRef<((p: Profile | null) => void) | null>(null)

  const requestOpticianForAction = useCallback(() => {
    return new Promise<Profile | null>((resolve) => {
      pendingResolve.current = resolve
      setPickerOpen(true)
    })
  }, [])

  // Registered once so plain supabase.from(...)/rpc(...) calls anywhere in
  // the app can trigger the same modal without importing this context.
  useEffect(() => {
    opticianGate.request = async () => {
      const picked = await requestOpticianForAction()
      return picked ? { id: picked.id, store_id: picked.store_id, max_discount_percent: picked.max_discount_percent } : null
    }
    return () => { opticianGate.request = null }
  }, [requestOpticianForAction])

  useEffect(() => {
    opticianGate.active = isOpticianShell
  }, [isOpticianShell])

  const handlePick = useCallback(async (id: string) => {
    setPickerOpen(false)
    const { data, error } = await window.__local.pickOptician(id)
    await window.__local.signOut()
    const resolve = pendingResolve.current
    pendingResolve.current = null
    resolve?.(error ? null : (data as { profile: Profile }).profile)
  }, [])

  const handleCancelPick = useCallback(() => {
    setPickerOpen(false)
    const resolve = pendingResolve.current
    pendingResolve.current = null
    resolve?.(null)
  }, [])

  const enterOpticianShell = useCallback(async () => {
    const { data } = await supabase.from('stores').select('id').limit(1).maybeSingle()
    const storeId = (data as { id: string } | null)?.id ?? ''
    const now = new Date().toISOString()
    const shellProfile: Profile = {
      id: UNPICKED_OPTICIAN_ID, store_id: storeId, role_id: '',
      first_name: 'Opticien', last_name: '', phone: null, is_active: true,
      // No specific optician chosen yet — a generous default so the
      // discount-limit warning never shows prematurely; the real optician's
      // own limit is what's actually enforced once one is picked for a sale.
      max_discount_percent: 100, notifications_last_seen_at: null, created_at: now, updated_at: now,
    }
    setProfile(shellProfile)
    setRole(roleFromKey('opticien'))
    setIsOpticianShell(true)
  }, [])

  const loginAsAdmin = useCallback(async (id: string, password: string) => {
    const { data, error } = await window.__local.adminLogin(id, password)
    if (error) return { error: error.message === 'invalid_password' ? 'Mot de passe incorrect.' : error.message }
    const result = data as { profile: Profile; role_key: string }
    setProfile(result.profile)
    setRole(roleFromKey(result.role_key))
    setIsOpticianShell(false)
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await window.__local.signOut()
    setProfile(null)
    setRole(null)
    setIsOpticianShell(false)
  }, [])

  const requestPasswordReset = useCallback(async () => {
    return { error: "Réinitialisation indisponible dans l'édition locale — contactez un administrateur." }
  }, [])

  const refreshProfile = useCallback(async () => {
    // Nothing to re-fetch remotely in the local edition; the profile
    // object set at pick/login time is already current.
  }, [])

  const activateOptician = useCallback(async (id: string) => { await window.__local.pickOptician(id) }, [])
  const deactivateOptician = useCallback(async () => { await window.__local.signOut() }, [])

  return (
    <AuthContext.Provider
      value={{
        session: profile ? { id: profile.id } : null,
        profile,
        role,
        loading: false,
        isAdmin: role?.key === 'admin',
        isOpticianShell,
        enterOpticianShell,
        loginAsAdmin,
        signOut,
        requestPasswordReset,
        refreshProfile,
        requestOpticianForAction,
        activateOptician,
        deactivateOptician,
      }}
    >
      {children}
      {pickerOpen && <OpticianPickerModal onPick={handlePick} onCancel={handleCancelPick} />}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
