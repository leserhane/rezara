import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { session, profile, loading, isAdmin, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  // A valid Supabase Auth session with no matching (or deactivated)
  // profiles row — e.g. an account created in Auth before its profile
  // row was inserted — must NOT redirect to /login: the session is still
  // present there, so LoginPage bounces straight back to "/", and this
  // route bounces it right back to /login, forever. Sign out explicitly
  // instead so the loop can't happen, with a message that actually
  // explains what's wrong.
  if (!profile?.is_active) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="max-w-sm text-sm text-slate-600 dark:text-stone-300">
          {profile
            ? 'Votre compte a été désactivé.'
            : "Votre compte n'a pas encore été configuré."}{' '}
          Contactez un administrateur.
        </p>
        <button onClick={signOut} className="btn-secondary">Retour à la connexion</button>
      </div>
    )
  }

  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
