import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Pencil, PackagePlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { useAuth } from '@/contexts/AuthContext'
import { ProductFormModal } from '@/components/products/ProductFormModal'
import { StockMovementModal } from '@/components/products/StockMovementModal'

const MOVEMENT_LABELS: Record<string, string> = {
  entree: 'Entrée', sortie: 'Sortie', transfert: 'Transfert', ajustement: 'Ajustement',
  retour_fournisseur: 'Retour fournisseur', retour_client: 'Retour client', vente: 'Vente', inventaire: 'Inventaire',
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAdmin } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [stockModalOpen, setStockModalOpen] = useState(false)

  const { data: product, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_products').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: rawProduct } = useQuery({
    queryKey: ['product-raw', id],
    queryFn: async () => (await supabase.from('products').select('*').eq('id', id!).single()).data,
    enabled: !!id && isAdmin,
  })

  const { data: movements, refetch: refetchMovements } = useQuery({
    queryKey: ['stock-movements', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('stock_movements').select('*').eq('product_id', id!).order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  if (!product) return <p className="text-slate-400">Chargement…</p>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{product.name}</h1>
          <p className="text-sm text-slate-400">{product.sku}{product.barcode ? ` · ${product.barcode}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStockModalOpen(true)} className="btn-secondary"><PackagePlus size={15} /> Mouvement de stock</button>
          {isAdmin && <button onClick={() => setEditOpen(true)} className="btn-primary"><Pencil size={15} /> Modifier</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Prix vente TTC" value={formatCurrency(product.sale_price_ttc)} />
        {isAdmin && <MiniStat label="Prix achat HT" value={formatCurrency(product.purchase_price_ht)} />}
        {isAdmin && <MiniStat label="Marge" value={product.margin_amount !== null ? `${formatCurrency(product.margin_amount)} (${product.margin_percent?.toFixed(1)}%)` : '—'} />}
        <MiniStat label="Stock" value={String(product.quantity)} warn={product.quantity <= product.stock_min} />
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Historique des mouvements de stock</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="py-2">Date</th>
              <th className="py-2">Type</th>
              <th className="py-2 text-right">Quantité</th>
              <th className="py-2 text-right">Stock après</th>
              <th className="py-2">Raison</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-slate-800">
            {(movements ?? []).map((m) => (
              <tr key={m.id}>
                <td className="py-2 text-slate-500">{formatDateTime(m.created_at)}</td>
                <td className="py-2">{MOVEMENT_LABELS[m.type] ?? m.type}</td>
                <td className={`py-2 text-right font-medium ${m.quantity_change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                </td>
                <td className="py-2 text-right">{m.new_quantity}</td>
                <td className="py-2 text-slate-500">{m.reason ?? '—'}</td>
              </tr>
            ))}
            {(movements ?? []).length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-400">Aucun mouvement enregistré.</td></tr>}
          </tbody>
        </table>
      </div>

      {rawProduct && (
        <ProductFormModal open={editOpen} onClose={() => setEditOpen(false)} existing={rawProduct} onSaved={() => { setEditOpen(false); refetch() }} />
      )}
      <StockMovementModal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        productId={product.id}
        currentQuantity={product.quantity}
        onSaved={() => { setStockModalOpen(false); refetch(); refetchMovements() }}
      />
    </div>
  )
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${warn ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{value}</div>
    </div>
  )
}
