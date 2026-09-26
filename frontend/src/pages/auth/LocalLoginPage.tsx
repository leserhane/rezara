import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/LocalAuthContext'
import { Lock, Users } from 'lucide-react'

interface ProfileOption {
  id: string
  first_name: string
  last_name: string
  role_key: 'admin' | 'opticien'
}

// Local-edition replacement for '@/pages/auth/LoginPage'. Opticians aren't
// accounts, so there's nothing to log in as here — "Opticien" just opens
// the app (unattributed; the scrolling name list only shows up later, at
// the moment of an actual sale/client/ordonnance/etc — see
// LocalAuthContext's requestOpticianForAction/opticianGate). Only "Admin"
// is a real account, password-protected, matching how it was set up at
// install time.
export function LoginPage() {
  const { session, enterOpticianShell, loginAsAdmin } = useAuth()
  const location = useLocation()
  const [adminProfiles, setAdminProfiles] = useState<ProfileOption[]>([])
  const [screen, setScreen] = useState<'choose' | 'admin-pick' | 'admin-password'>('choose')
  const [adminId, setAdminId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    window.__local.listProfiles().then((rows) => setAdminProfiles((rows as ProfileOption[]).filter((p) => p.role_key === 'admin')))
  }, [])

  if (session) {
    const from = (location.state as { from?: string })?.from ?? '/'
    return <Navigate to={from} replace />
  }

  const chooseAdmin = () => {
    setError(null)
    if (adminProfiles.length === 1) { setAdminId(adminProfiles[0].id); setScreen('admin-password') }
    else setScreen('admin-pick')
  }

  const submitAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminId) return
    setSubmitting(true)
    setError(null)
    const { error } = await loginAsAdmin(adminId, password)
    setSubmitting(false)
    if (error) setError(error)
    else setPassword('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-300 px-4 dark:bg-stone-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-stone-900">
            <svg viewBox="0 0 200 140" className="h-11 w-16">
              <g fill="none" stroke="#6b1f2a" strokeWidth={13}>
                <circle cx="75" cy="70" r="50" />
                <circle cx="122" cy="70" r="50" />
              </g>
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-brand-700 dark:text-white">Optimum Optic</h1>
          <p className="text-sm text-sand-700 dark:text-stone-400">
            {screen === 'choose' ? 'Comment souhaitez-vous continuer ?' : 'Connexion administrateur'}
          </p>
        </div>

        <div className="card space-y-3 border-t-4 border-t-brand-700 p-6">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{error}</div>}

          {screen === 'choose' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={enterOpticianShell}
                className="flex flex-col items-center gap-2 rounded-lg border border-sand-200 p-5 text-center hover:bg-sand-50 dark:border-stone-700 dark:hover:bg-stone-800"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                  <Users size={20} />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">Opticien</span>
              </button>
              <button
                onClick={chooseAdmin}
                className="flex flex-col items-center gap-2 rounded-lg border border-sand-200 p-5 text-center hover:bg-sand-50 dark:border-stone-700 dark:hover:bg-stone-800"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                  <Lock size={20} />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">Admin</span>
              </button>
            </div>
          )}

          {screen === 'admin-pick' && (
            <div className="space-y-2">
              {adminProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setAdminId(p.id); setScreen('admin-password') }}
                  className="flex w-full items-center gap-3 rounded-lg border border-sand-200 p-3 text-left hover:bg-sand-50 dark:border-stone-700 dark:hover:bg-stone-800"
                >
                  <Lock size={16} className="text-brand-700 dark:text-brand-400" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{p.first_name} {p.last_name}</span>
                </button>
              ))}
              {adminProfiles.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Aucun compte administrateur.</p>}
              <button onClick={() => setScreen('choose')} className="btn-secondary w-full">Retour</button>
            </div>
          )}

          {screen === 'admin-password' && (
            <form onSubmit={submitAdminPassword} className="space-y-3">
              <p className="text-sm text-slate-500">Mot de passe administrateur</p>
              <input
                type="password" autoFocus required className="input"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setScreen('choose'); setAdminId(null); setPassword(''); setError(null) }}
                  className="btn-secondary flex-1"
                >
                  Retour
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? 'Connexion…' : 'Se connecter'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
