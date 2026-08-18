import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { session, profile, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (!profile?.is_active) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
