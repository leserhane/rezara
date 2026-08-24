import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Menu, X, Sun, Moon, Monitor, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { navSections, mobileNavItems, type NavItem } from './nav'
import { GlobalSearch } from './GlobalSearch'
import { initials } from '@/lib/format'
import { NotificationBell } from './NotificationBell'
import clsx from 'clsx'

export function AppLayout() {
  const { profile, isAdmin, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const visibleSections = navSections
    .map((s) => ({ ...s, items: s.items.filter((n) => !n.adminOnly || isAdmin) }))
    .filter((s) => s.items.length > 0)

  return (
    <div className="flex h-screen overflow-hidden bg-sand-300 dark:bg-stone-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sand-300 bg-sand-100 lg:flex dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center gap-2.5 border-b border-sand-300 px-5 py-5 dark:border-stone-800">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-stone-800">
            <svg viewBox="0 0 200 140" className="h-6 w-9">
              <g fill="none" stroke="#6b1f2a" strokeWidth={13}>
                <circle cx="75" cy="70" r="50" />
                <circle cx="122" cy="70" r="50" />
              </g>
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Optimum Optic</div>
            <div className="text-xs text-sand-700 dark:text-stone-400">Gestion</div>
          </div>
        </div>
        <SidebarNav sections={visibleSections} />
        <UserMenu />
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sand-100 p-4 dark:bg-stone-900">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-brand-700 dark:text-white">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
            </div>
            <SidebarNav sections={visibleSections} onNavigate={() => setMobileMenuOpen(false)} />
            <div className="mt-4 border-t border-sand-300 pt-4 dark:border-stone-800">
              <UserMenu />
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-3 border-b border-sand-300 bg-sand-100 px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
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
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-sand-300 bg-sand-100 lg:hidden dark:border-stone-800 dark:bg-stone-900">
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

function SidebarNav({
  sections, onNavigate,
}: {
  sections: { label: string; items: NavItem[] }[]
  onNavigate?: () => void
}) {
  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
      {sections.map((section) => (
        <div key={section.label}>
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-sand-700 dark:text-stone-500">{section.label}</div>
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-700 text-white'
                      : 'text-slate-600 hover:bg-sand-100 dark:text-stone-300 dark:hover:bg-stone-800'
                  )
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
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
    <div className="hidden items-center gap-0.5 rounded-lg border border-sand-200 p-0.5 sm:flex dark:border-stone-700">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => setTheme(o.key)}
          className={clsx(
            'rounded-md p-1.5',
            theme === o.key ? 'bg-brand-700 text-white' : 'text-slate-400 hover:bg-sand-100 hover:text-slate-600'
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
    <div className="relative border-t border-sand-200 p-3 dark:border-stone-800">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-sand-100 dark:hover:bg-stone-800">
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
        <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg border border-sand-200 bg-white p-1 shadow-lg dark:border-stone-700 dark:bg-stone-800">
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
