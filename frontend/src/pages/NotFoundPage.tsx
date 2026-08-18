import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">404</h1>
      <p className="text-slate-500">Page introuvable.</p>
      <Link to="/" className="btn-primary">Retour au tableau de bord</Link>
    </div>
  )
}
