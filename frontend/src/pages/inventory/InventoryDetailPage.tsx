import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateTime } from '@/lib/format'
import type { InventoryStatus } from '@/types/database'

const STATUS_LABELS: Record<InventoryStatus, string> = {
  en_cours: 'En cours', valide: 'Validé', annule: 'Annulé',
}
const STATUS_STYLES: Record<InventoryStatus, string> = {
  en_cours: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  valide: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  annule: 'bg-slate-100 text-slate-500 dark:bg-stone-800 dark:text-stone-400',
}

export function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile, isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: inventory } = useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventories').select('*, profiles(first_name, last_name)').eq('id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: items, refetch: refetchItems } = useQuery({
    queryKey: ['inventory-items', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*, products(name, sku)')
        .eq('inventory_id', id!)
        .order('products(name)')
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  if (!inventory) return <p className="text-slate-400">Chargement…</p>

  const rows = items ?? []
  const countedCount = rows.filter((r) => r.counted_quantity !== null).length
  const isOpen = inventory.status === 'en_cours'

  const setCount = async (itemId: string, value: string) => {
    const counted = value === '' ? null : Math.max(0, Number(value) || 0)
    await supabase.from('inventory_items').update({
      counted_quantity: counted,
      counted_by: counted === null ? null : profile?.id ?? null,
      counted_at: counted === null ? null : new Date().toISOString(),
    }).eq('id', itemId)
    refetchItems()
  }

  const validate = async () => {
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.rpc('validate_inventory', { p_inventory_id: inventory.id })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    queryClient.invalidateQueries({ queryKey: ['inventory', id] })
    refetchItems()
  }

  const cancel = async () => {
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.rpc('cancel_inventory', { p_inventory_id: inventory.id })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    queryClient.invalidateQueries({ queryKey: ['inventory', id] })
    refetchItems()
  }

  return (
    <div className="space-y-4">
      <Link to="/inventory" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-700"><ArrowLeft size={14} /> Retour aux inventaires</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{inventory.reference}</h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[inventory.status]}`}>
              {STATUS_LABELS[inventory.status]}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Démarré le {formatDateTime(inventory.started_at)}
            {inventory.profiles && ` par ${inventory.profiles.first_name} ${inventory.profiles.last_name}`}
          </p>
          {inventory.status === 'valide' && inventory.validated_at && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">Validé le {formatDateTime(inventory.validated_at)}</p>
          )}
          <p className="mt-1 text-sm text-slate-500">{countedCount} / {rows.length} articles comptés</p>
        </div>

        {isAdmin && isOpen && (
          <div className="flex gap-2">
            <button onClick={cancel} disabled={submitting} className="btn-secondary"><XCircle size={16} /> Annuler l'inventaire</button>
            <button onClick={validate} disabled={submitting} className="btn-primary">
              <CheckCircle2 size={16} /> {submitting ? 'Validation…' : "Valider (applique les écarts au stock)"}
            </button>
          </div>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-stone-800">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3 text-right">Théorique</th>
              <th className="px-4 py-3 text-right">Compté</th>
              <th className="px-4 py-3 text-right">Écart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-stone-800">
            {rows.map((it) => (
              <tr key={it.id}>
                <td className="px-4 py-3">{it.products?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-400">{it.products?.sku ?? '—'}</td>
                <td className="px-4 py-3 text-right text-slate-500">{it.theoretical_quantity}</td>
                <td className="px-4 py-3 text-right">
                  {isOpen ? (
                    <input
                      type="number" min={0} className="input w-24 text-right"
                      defaultValue={it.counted_quantity ?? ''}
                      onBlur={(e) => setCount(it.id, e.target.value)}
                      placeholder="—"
                    />
                  ) : (
                    it.counted_quantity ?? '—'
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {it.counted_quantity === null ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <span className={it.difference === 0 ? 'text-slate-500' : it.difference > 0 ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'font-medium text-red-600 dark:text-red-400'}>
                      {it.difference > 0 ? `+${it.difference}` : it.difference}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucun produit actif à compter.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
