import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/format'

export function CreditsListPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'settled'>('active')

  const { data: credits, isLoading } = useQuery({
    queryKey: ['credits-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credits')
        .select('*, sales(sale_number), customers(first_name, last_name, phone)')
        .order('due_date', { ascending: true })
      if (error) throw error
      return data as (typeof data[number] & {
        sales: { sale_number: string } | null
        customers: { first_name: string; last_name: string; phone: string | null } | null
      })[]
    },
  })

  const isOverdue = (dueDate: string | null, status: string) => status !== 'solde' && dueDate && new Date(dueDate) < new Date()

  const filtered = (credits ?? []).filter((c) => {
    if (filter === 'all') return true
    if (filter === 'settled') return c.status === 'solde'
    if (filter === 'overdue') return isOverdue(c.due_date, c.status)
    return c.status !== 'solde'
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Crédits clients</h1>

      <div className="flex gap-1 overflow-x-auto">
        {[
          { key: 'active', label: 'Actifs' },
          { key: 'overdue', label: 'En retard' },
          { key: 'settled', label: 'Soldés' },
          { key: 'all', label: 'Tous' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
              filter === f.key ? 'bg-brand-700 text-white' : 'bg-sand-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-stone-800">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Vente</th>
              <th className="px-4 py-3 text-right">Initial</th>
              <th className="px-4 py-3 text-right">Payé</th>
              <th className="px-4 py-3 text-right">Solde</th>
              <th className="px-4 py-3">Échéance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-stone-800">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-sand-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-3">
                  <Link to={`/credits/${c.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
                    {c.customers ? `${c.customers.first_name} ${c.customers.last_name}` : '—'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  <Link to={`/sales/${c.sale_id}`} className="hover:underline">{c.sales?.sale_number ?? '—'}</Link>
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(c.initial_amount)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(c.paid_amount)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.balance)}</td>
                <td className="px-4 py-3">
                  <span className={isOverdue(c.due_date, c.status) ? 'font-medium text-red-600 dark:text-red-400' : 'text-slate-500'}>
                    {formatDate(c.due_date)}
                  </span>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucun crédit.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
