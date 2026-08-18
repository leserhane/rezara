import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/format'
import type { DocumentStatus } from '@/types/database'

const STATUS_LABELS: Record<DocumentStatus, string> = {
  brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté',
  refuse: 'Refusé', expire: 'Expiré', transforme: 'Transformé en vente',
}
const STATUS_STYLES: Record<DocumentStatus, string> = {
  brouillon: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  envoye: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  accepte: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  refuse: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  expire: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  transforme: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export function QuotesListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<DocumentStatus | 'all'>('all')

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes-list', search, status],
    queryFn: async () => {
      let query = supabase.from('quotes').select('*, customers(first_name, last_name)').order('created_at', { ascending: false }).limit(100)
      if (status !== 'all') query = query.eq('status', status)
      if (search.trim()) query = query.ilike('quote_number', `%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return data as (typeof data[number] & { customers: { first_name: string; last_name: string } | null })[]
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Devis</h1>
        <Link to="/quotes/new" className="btn-primary"><Plus size={16} /> Nouveau devis</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="N° de devis…" className="input pl-9" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {(['all', 'brouillon', 'envoye', 'accepte', 'refuse', 'expire', 'transforme'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                status === s ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {s === 'all' ? 'Tous' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">N° Devis</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Total TTC</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(quotes ?? []).map((q) => (
              <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3"><Link to={`/quotes/${q.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">{q.quote_number}</Link></td>
                <td className="px-4 py-3">{q.customers ? `${q.customers.first_name} ${q.customers.last_name}` : '—'}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(q.created_at)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(q.total_ttc)}</td>
                <td className="px-4 py-3"><span className={`badge ${STATUS_STYLES[q.status]}`}>{STATUS_LABELS[q.status]}</span></td>
              </tr>
            ))}
            {!isLoading && (quotes ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucun devis.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
