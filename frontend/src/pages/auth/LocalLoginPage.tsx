import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/LocalAuthContext'
import { Lock, User } from 'lucide-react'

interface ProfileOption {
  id: string
  first_name: string
  last_name: string
  role_key: 'admin' | 'opticien'
}

// Local-edition replacement for '@/pages/auth/LoginPage': no email or
// password for an optician — just their name, added once by the admin.
// Only the admin's own tile asks for a password, matching how the
// account was set up at install time.
export function LoginPage() {
  const { session, pickOptician, loginAsAdmin } = useAuth()
  const location = useLocation()
  const [profiles, setProfiles] = useState<ProfileOption[]>([])
  const [adminId, setAdminId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    window.__local.listProfiles().then((rows) => setProfiles(rows as ProfileOption[]))
  }, [])

  if (session) {
    const from = (location.state as { from?: string })?.from ?? '/'
    return <Navigate to={from} replace />
  }

  const choose = async (p: ProfileOption) => {
    setError(null)
    if (p.role_key === 'admin') { setAdminId(p.id); return }
    setSubmitting(true)
    const { error } = await pickOptician(p.id)
    setSubmitting(false)
    if (error) setError(error)
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
          <p className="text-sm text-sand-700 dark:text-stone-400">Qui travaille aujourd'hui ?</p>
        </div>

        <div className="card space-y-3 border-t-4 border-t-brand-700 p-6">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{error}</div>}

          {adminId ? (
            <form onSubmit={submitAdminPassword} className="space-y-3">
              <p className="text-sm text-slate-500">Mot de passe administrateur</p>
              <input
                type="password" autoFocus required className="input"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setAdminId(null); setPassword(''); setError(null) }} className="btn-secondary flex-1">Retour</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? 'Connexion…' : 'Se connecter'}</button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => choose(p)}
                  disabled={submitting}
                  className="flex flex-col items-center gap-2 rounded-lg border border-sand-200 p-4 text-center hover:bg-sand-50 disabled:opacity-50 dark:border-stone-700 dark:hover:bg-stone-800"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                    {p.role_key === 'admin' ? <Lock size={18} /> : <User size={18} />}
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{p.first_name} {p.last_name}</span>
                </button>
              ))}
              {profiles.length === 0 && <p className="col-span-2 py-6 text-center text-sm text-slate-400">Aucun profil. Contactez un administrateur.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
