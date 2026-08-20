import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SaleStatus } from '@/types/database'

export function SalesListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<SaleStatus | 'all'>('all')

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales-list', search, status],
    queryFn: async () => {
      let query = supabase.from('v_sales').select('*').order('created_at', { ascending: false }).limit(100)
      if (status !== 'all') query = query.eq('status', status)
      if (search.trim()) query = query.ilike('sale_number', `%${search}%`)
      const { data, error } = await query
      if (error) throw error

      const customerIds = [...new Set(data.map((s) => s.customer_id))]
      const { data: customers } = customerIds.length
        ? await supabase.from('customers').select('id, first_name, last_name').in('id', customerIds)
        : { data: [] as { id: string; first_name: string; last_name: string }[] }
      const customerMap = new Map((customers ?? []).map((c) => [c.id, c]))

      return data.map((s) => ({ ...s, customer: customerMap.get(s.customer_id) ?? null }))
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Ventes</h1>
        <Link to="/sales/new" className="btn-primary"><Plus size={16} /> Nouvelle vente</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="N° de vente…" className="input pl-9" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {(['all', 'non_paye', 'acompte', 'partiellement_paye', 'paye', 'annule'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                status === s ? 'bg-brand-700 text-white' : 'bg-sand-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {s === 'all' ? 'Toutes' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">N° Vente</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Restant</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-slate-800">
            {(sales ?? []).map((s) => (
              <tr key={s.id} className="hover:bg-sand-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3"><Link to={`/sales/${s.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">{s.sale_number}</Link></td>
                <td className="px-4 py-3">{s.customer ? `${s.customer.first_name} ${s.customer.last_name}` : '—'}</td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(s.created_at)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(s.total_ttc)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={s.amount_due > 0 ? 'font-medium text-red-600 dark:text-red-400' : 'text-slate-400'}>{formatCurrency(s.amount_due)}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
            {!isLoading && (sales ?? []).length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucune vente.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
