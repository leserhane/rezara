import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing. Copy .env.example to .env and fill in your Supabase project credentials.'
  )
}

// Some mobile browsers (Safari private browsing, several in-app webviews
// like Instagram/Facebook/TikTok) throw on any localStorage access instead
// of just returning null. Supabase's default storage adapter assumes a
// working localStorage, so a throw there can take down auth initialization
// — and with it the whole app — before anything ever renders. This falls
// back to an in-memory store on write/read failure: the session just won't
// survive a reload on that browser, instead of the app failing to open.
const memoryFallback = new Map<string, string>()
const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return memoryFallback.get(key) ?? null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      memoryFallback.set(key, value)
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch {
      memoryFallback.delete(key)
    }
  },
}

export const supabase = createClient<Database>(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: safeStorage,
  },
})
