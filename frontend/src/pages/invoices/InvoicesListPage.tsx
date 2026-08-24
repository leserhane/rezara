import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/format'

export function InvoicesListPage() {
  const [search, setSearch] = useState('')

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', search],
    queryFn: async () => {
      let query = supabase.from('invoices').select('*, customers(first_name, last_name)').order('issued_at', { ascending: false }).limit(100)
      if (search.trim()) query = query.ilike('invoice_number', `%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return data as (typeof data[number] & { customers: { first_name: string; last_name: string } | null })[]
    },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Factures</h1>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="N° de facture…" className="input pl-9" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-stone-800">
            <tr>
              <th className="px-4 py-3">N° Facture</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Total TTC</th>
              <th className="px-4 py-3 text-right">Restant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-stone-800">
            {(invoices ?? []).map((inv) => (
              <tr key={inv.id} className="hover:bg-sand-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-3"><Link to={`/invoices/${inv.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">{inv.invoice_number}</Link></td>
                <td className="px-4 py-3">{inv.customers ? `${inv.customers.first_name} ${inv.customers.last_name}` : '—'}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(inv.issued_at)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(inv.total_ttc)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={inv.amount_due > 0 ? 'font-medium text-red-600' : 'text-slate-400'}>{formatCurrency(inv.amount_due)}</span>
                </td>
              </tr>
            ))}
            {!isLoading && (invoices ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucune facture.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
