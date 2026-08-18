import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Menu, X, Sun, Moon, Monitor, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { navItems, mobileNavItems } from './nav'
import { GlobalSearch } from './GlobalSearch'
import { initials } from '@/lib/format'
import { NotificationBell } from './NotificationBell'
import clsx from 'clsx'

export function AppLayout() {
  const { profile, isAdmin, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const visibleNav = navItems.filter((n) => !n.adminOnly || isAdmin)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 px-5 py-5">
          <svg viewBox="0 0 200 140" className="h-8 w-11">
            <g fill="none" stroke="#6b1f2a" strokeWidth={13}>
              <circle cx="75" cy="70" r="50" />
              <circle cx="122" cy="70" r="50" />
            </g>
          </svg>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Optimum Optic</div>
            <div className="text-xs text-slate-400">Gestion</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <UserMenu />
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white p-4 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
            </div>
            <nav className="space-y-1">
              {visibleNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                      isActive ? 'bg-brand-700 text-white' : 'text-slate-600 dark:text-slate-300'
                    )
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <UserMenu />
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <button onClick={() => setMobileMenuOpen(true)} className="text-slate-500 lg:hidden">
            <Menu size={22} />
          </button>
          <div className="flex-1">
            <GlobalSearch />
          </div>
          <ThemeToggle />
          <NotificationBell />
          <div className="hidden items-center gap-2 lg:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
              {profile ? initials(profile.first_name, profile.last_name) : '…'}
            </div>
          </div>
          <button onClick={signOut} title="Déconnexion" className="text-slate-400 hover:text-slate-600 lg:hidden">
            <LogOut size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-slate-200 bg-white lg:hidden dark:border-slate-800 dark:bg-slate-900">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]',
                  isActive ? 'text-brand-700 dark:text-brand-400' : 'text-slate-400'
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const options = [
    { key: 'light', icon: Sun },
    { key: 'dark', icon: Moon },
    { key: 'system', icon: Monitor },
  ] as const

  return (
    <div className="hidden items-center gap-0.5 rounded-lg border border-slate-200 p-0.5 sm:flex dark:border-slate-700">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => setTheme(o.key)}
          className={clsx(
            'rounded-md p-1.5',
            theme === o.key ? 'bg-brand-700 text-white' : 'text-slate-400 hover:text-slate-600'
          )}
          title={o.key}
        >
          <o.icon size={15} />
        </button>
      ))}
    </div>
  )
}

function UserMenu() {
  const { profile, role, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  return (
    <div className="relative border-t border-slate-200 p-3 dark:border-slate-800">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
          {profile ? initials(profile.first_name, profile.last_name) : '…'}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
            {profile ? `${profile.first_name} ${profile.last_name}` : '…'}
          </div>
          <div className="truncate text-xs text-slate-400">{role?.name ?? ''}</div>
        </div>
        <ChevronDown size={16} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      )}
    </div>
  )
}
