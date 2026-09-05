import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

const MAROON = '#6B1F2A'
const SAND = '#D9C8AE'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

// A single uncaught render error (a missing column after a skipped
// migration, a bad API response, ...) used to blank the entire app with no
// explanation — there was no error boundary anywhere. This catches it and
// shows something actionable instead of a blank white screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: SAND }}>
          <div className="w-full max-w-md rounded-xl border-t-4 bg-white p-6 shadow-sm" style={{ borderTopColor: MAROON }}>
            <div className="mb-3 flex items-center gap-2" style={{ color: MAROON }}>
              <AlertTriangle size={22} />
              <h1 className="text-lg font-semibold">Une erreur est survenue</h1>
            </div>
            <p className="mb-3 text-sm text-slate-600">
              Cette page n'a pas pu s'afficher correctement. Cela arrive généralement quand une mise à jour de la
              base de données n'a pas encore été appliquée sur Supabase.
            </p>
            <pre className="mb-4 max-h-32 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              {this.state.error.message}
            </pre>
            <button
              onClick={async () => {
                // A plain reload can still be served by a stale service
                // worker's own cache — this crash is often exactly that
                // (an old cached version of the app meeting a newer
                // database), so clear it out before reloading.
                try {
                  const registrations = await navigator.serviceWorker?.getRegistrations()
                  await Promise.all((registrations ?? []).map((r) => r.unregister()))
                  const keys = await caches?.keys()
                  await Promise.all((keys ?? []).map((k) => caches.delete(k)))
                } catch {
                  // Best effort — fall through to reload regardless.
                }
                this.setState({ error: null })
                window.location.reload()
              }}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: MAROON }}
            >
              Recharger la page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
