import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/format'
import { useAuth } from '@/contexts/AuthContext'
import { ProductFormModal } from '@/components/products/ProductFormModal'
import type { ProductType } from '@/types/database'

const TYPE_LABELS: Record<ProductType, string> = {
  monture: 'Monture', verre: 'Verre', lentille: 'Lentille', accessoire: 'Accessoire',
}

export function ProductsListPage() {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<ProductType | 'all'>('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const { data: products, refetch, isLoading } = useQuery({
    queryKey: ['products', search, type],
    queryFn: async () => {
      let query = supabase.from('v_products').select('*').order('name').limit(200)
      if (type !== 'all') query = query.eq('type', type)
      if (search.trim()) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  const filtered = lowStockOnly ? (products ?? []).filter((p) => p.quantity <= p.stock_min) : products ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Produits & Stock</h1>
        {isAdmin && (
          <button onClick={() => setFormOpen(true)} className="btn-primary">
            <Plus size={16} /> Nouveau produit
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, référence, code-barres…" className="input pl-9" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {(['all', 'monture', 'verre', 'lentille', 'accessoire'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                type === t ? 'bg-brand-700 text-white' : 'bg-sand-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {t === 'all' ? 'Tous' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Stock faible uniquement
        </label>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Prix vente TTC</th>
              {isAdmin && <th className="px-4 py-3 text-right">Marge</th>}
              <th className="px-4 py-3 text-right">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-slate-800">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-sand-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <Link to={`/products/${p.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">{p.name}</Link>
                  <div className="text-xs text-slate-400">{p.sku}</div>
                </td>
                <td className="px-4 py-3 text-slate-500">{TYPE_LABELS[p.type]}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(p.sale_price_ttc)}</td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right text-slate-500">
                    {p.margin_amount !== null ? `${formatCurrency(p.margin_amount)} (${p.margin_percent?.toFixed(1)}%)` : '—'}
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <span className={p.quantity <= p.stock_min ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}>
                    {p.quantity}
                  </span>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-slate-400">Aucun produit trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); refetch() }} />
    </div>
  )
}
