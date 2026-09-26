import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// `vite build --mode desktop` produces the offline desktop edition bundled
// into desktop/app/: relative asset paths (base: './') so it loads over
// file://, no service worker (nothing to precache-and-update on a machine
// with no server to fetch a new version from), and '@/lib/supabase' /
// '@/contexts/AuthContext' / '@/pages/auth/LoginPage' resolved to their
// local-backend equivalents so every other file in the app — every page,
// every component — builds completely unchanged against either edition.
export default defineConfig(({ mode }) => {
  const isLocal = mode === 'desktop'

  return {
    plugins: [
      react(),
      ...(isLocal
        ? []
        : [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon-512.png'],
              manifest: {
                name: 'Optimum Optic ERP',
                short_name: 'Optimum Optic',
                description: "ERP complet pour magasin d'optique",
                theme_color: '#6b1f2a',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/dashboard/',
                scope: '/dashboard/',
                icons: [
                  { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
                  { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
                  { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                ],
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
              },
            }),
          ]),
    ],
    base: isLocal ? './' : '/dashboard/',
    resolve: {
      alias: [
        ...(isLocal
          ? [
              { find: '@/lib/supabase', replacement: path.resolve(dirname, './src/lib/localSupabase.ts') },
              { find: '@/contexts/AuthContext', replacement: path.resolve(dirname, './src/contexts/LocalAuthContext.tsx') },
              { find: '@/pages/auth/LoginPage', replacement: path.resolve(dirname, './src/pages/auth/LocalLoginPage.tsx') },
            ]
          : []),
        { find: '@', replacement: path.resolve(dirname, './src') },
      ],
    },
    server: {
      port: 5173,
    },
  }
})
