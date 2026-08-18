import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

export function StatCard({
  label, value, icon: Icon, trend, accent = 'default',
}: {
  label: string
  value: string
  icon?: LucideIcon
  trend?: string
  accent?: 'default' | 'positive' | 'negative' | 'warning'
}) {
  const accentClasses = {
    default: 'text-brand-700 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400',
    positive: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
    negative: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
    warning: 'text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
  }
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
          {trend && <div className="mt-1 text-xs text-slate-400">{trend}</div>}
        </div>
        {Icon && (
          <div className={clsx('rounded-lg p-2', accentClasses[accent])}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  )
}
