import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeState | undefined>(undefined)
const STORAGE_KEY = 'optimum-optic-theme'

function getSystemTheme(): 'light' | 'dark' {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

// Some mobile browsers (Safari private browsing, several in-app webviews
// like Instagram/Facebook/TikTok) throw on any localStorage access instead
// of just returning null — this reads/writes the theme preference on a
// best-effort basis so a blocked storage never takes down the whole app.
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignored: theme just won't persist across visits on this browser.
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (safeGetItem(STORAGE_KEY) as Theme) || 'system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
    theme === 'system' ? getSystemTheme() : theme
  )

  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme
    setResolvedTheme(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => {
      const resolved = getSystemTheme()
      setResolvedTheme(resolved)
      document.documentElement.classList.toggle('dark', resolved === 'dark')
    }
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [theme])

  const setTheme = (t: Theme) => {
    safeSetItem(STORAGE_KEY, t)
    setThemeState(t)
  }

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
