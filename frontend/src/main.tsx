import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, refetchOnWindowFocus: true, retry: 1 },
  },
})

// This app ships database migrations together with matching frontend code,
// so a device left running an old cached bundle (very easy to end up on —
// iOS in particular keeps a PWA's assets cached aggressively, whether it
// was added to the Home Screen or not) can start talking to a newer
// database shape and crash. Once a new service worker takes over — it
// activates automatically (registerType: 'autoUpdate') as soon as it's
// fetched — force a one-time reload so the tab actually picks up the
// fresh code instead of continuing to run the stale bundle already in
// memory until the user thinks to close and reopen it themselves.
if ('serviceWorker' in navigator) {
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>
)
