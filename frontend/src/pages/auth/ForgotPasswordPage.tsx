import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await requestPasswordReset(email)
    setError(error)
    setSubmitting(false)
    if (!error) setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-lg font-semibold text-slate-900 dark:text-white">Mot de passe oublié</h1>
        <div className="card p-6">
          {sent ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" type="email" required autoFocus className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Envoi…' : 'Envoyer le lien'}
              </button>
            </form>
          )}
          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-brand-700 hover:underline dark:text-brand-400">Retour à la connexion</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
