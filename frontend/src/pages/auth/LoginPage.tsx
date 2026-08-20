import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const { session, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) {
    const from = (location.state as { from?: string })?.from ?? '/'
    return <Navigate to={from} replace />
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) setError('Email ou mot de passe incorrect.')
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
            <svg viewBox="0 0 200 140" className="h-11 w-16">
              <g fill="none" stroke="#6b1f2a" strokeWidth={13}>
                <circle cx="75" cy="70" r="50" />
                <circle cx="122" cy="70" r="50" />
              </g>
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-brand-700 dark:text-white">Optimum Optic</h1>
          <p className="text-sm text-sand-700 dark:text-slate-400">Espace de gestion</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 border-t-4 border-t-brand-700 p-6">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{error}</div>}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required autoFocus className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@optimumoptic.com" />
          </div>
          <div>
            <label className="label" htmlFor="password">Mot de passe</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
          <div className="text-center">
            <Link to="/forgot-password" className="text-sm text-brand-700 hover:underline dark:text-brand-400">
              Mot de passe oublié ?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
