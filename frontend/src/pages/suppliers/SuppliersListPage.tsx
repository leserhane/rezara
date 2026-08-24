import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { SupplierFormModal, SUPPLIER_CATEGORY_OPTIONS } from '@/components/suppliers/SupplierFormModal'
import type { Supplier, SupplierCategory } from '@/types/database'

export function SuppliersListPage() {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<SupplierCategory | 'all'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)

  const { data: suppliers, refetch, isLoading } = useQuery({
    queryKey: ['suppliers-list', search],
    queryFn: async () => {
      let query = supabase.from('suppliers').select('*').order('name')
      if (search.trim()) query = query.or(`name.ilike.%${search}%,contact_name.ilike.%${search}%,phone.ilike.%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  const filtered = (suppliers ?? []).filter(
    (s) => categoryFilter === 'all' || (s.categories ?? []).includes(categoryFilter)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Fournisseurs</h1>
        {isAdmin && (
          <button onClick={() => { setEditing(null); setFormOpen(true) }} className="btn-primary">
            <Plus size={16} /> Nouveau fournisseur
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, contact, téléphone…" className="input pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
              categoryFilter === 'all' ? 'bg-brand-700 text-white' : 'bg-sand-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300'
            }`}
          >
            Tous
          </button>
          {SUPPLIER_CATEGORY_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setCategoryFilter(o.value)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                categoryFilter === o.value ? 'bg-brand-700 text-white' : 'bg-sand-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-stone-800">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Conditions</th>
              <th className="px-4 py-3">Délai moyen</th>
              {isAdmin && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-stone-800">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-sand-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">
                  {(s.categories ?? []).length === 0 ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(s.categories ?? []).map((c) => (
                        <span key={c} className="badge bg-sand-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300">
                          {SUPPLIER_CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{s.contact_name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{s.phone ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{s.payment_terms ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{s.average_lead_time_days ? `${s.average_lead_time_days} j` : '—'}</td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditing(s); setFormOpen(true) }} className="text-slate-400 hover:text-brand-700">
                      <Pencil size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Aucun fournisseur.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <SupplierFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        existing={editing}
        onSaved={() => { setFormOpen(false); refetch() }}
      />
    </div>
  )
}
