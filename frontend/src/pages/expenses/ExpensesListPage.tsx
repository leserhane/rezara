import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/format'
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal'

export function ExpensesListPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => (await supabase.from('expense_categories').select('*').order('name')).data ?? [],
  })

  const { data: expenses, refetch, isLoading } = useQuery({
    queryKey: ['expenses-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false }).limit(200)
      if (error) throw error
      return data
    },
  })

  const categoryMap = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.name])), [categories])
  const filtered = categoryFilter === 'all' ? (expenses ?? []) : (expenses ?? []).filter((e) => e.category_id === categoryFilter)
  const total = filtered.reduce((sum, e) => sum + e.amount_ttc, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Dépenses</h1>
        <button onClick={() => setFormOpen(true)} className="btn-primary"><Plus size={16} /> Nouvelle dépense</button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select className="input max-w-xs" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">Toutes les catégories</option>
          {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="text-sm text-slate-500">Total : <strong className="text-slate-900 dark:text-white">{formatCurrency(total)}</strong></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Commentaire</th>
              <th className="px-4 py-3 text-right">Montant TTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-slate-800">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-sand-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium">{e.expense_number}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(e.expense_date)}</td>
                <td className="px-4 py-3">{categoryMap.get(e.category_id) ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{e.comment ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(e.amount_ttc)}</td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucune dépense.</td></tr>}
          </tbody>
        </table>
      </div>

      <ExpenseFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); refetch() }} />
    </div>
  )
}
