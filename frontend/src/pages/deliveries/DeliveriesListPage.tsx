import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/format'
import { Modal } from '@/components/ui/Modal'
import type { Delivery } from '@/types/database'

const STATUS_LABELS: Record<string, string> = { en_preparation: 'En préparation', prete: 'Prête', livree: 'Livrée' }
const STATUS_STYLES: Record<string, string> = {
  en_preparation: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  prete: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  livree: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export function DeliveriesListPage() {
  const [completing, setCompleting] = useState<Delivery | null>(null)

  const { data: deliveries, refetch } = useQuery({
    queryKey: ['deliveries-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*, sales(sale_number, customer_id)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as (typeof data[number] & { sales: { sale_number: string; customer_id: string } | null })[]
    },
  })

  const markReady = async (d: Delivery) => {
    await supabase.from('deliveries').update({ status: 'prete' }).eq('id', d.id)
    refetch()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Livraisons</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Vente</th>
              <th className="px-4 py-3">Créée le</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Livrée le</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-slate-800">
            {(deliveries ?? []).map((d) => (
              <tr key={d.id} className="hover:bg-sand-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <Link to={`/sales/${d.sale_id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">{d.sales?.sale_number ?? '—'}</Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(d.created_at)}</td>
                <td className="px-4 py-3"><span className={`badge ${STATUS_STYLES[d.status]}`}>{STATUS_LABELS[d.status]}</span></td>
                <td className="px-4 py-3 text-slate-500">{d.delivered_at ? formatDateTime(d.delivered_at) : '—'}</td>
                <td className="px-4 py-3 text-right">
                  {d.status === 'en_preparation' && <button onClick={() => markReady(d)} className="btn-secondary text-xs">Marquer prête</button>}
                  {d.status === 'prete' && <button onClick={() => setCompleting(d)} className="btn-primary text-xs">Enregistrer la livraison</button>}
                </td>
              </tr>
            ))}
            {(deliveries ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucune livraison.</td></tr>}
          </tbody>
        </table>
      </div>

      <CompleteDeliveryModal delivery={completing} onClose={() => setCompleting(null)} onSaved={() => { setCompleting(null); refetch() }} />
    </div>
  )
}

function CompleteDeliveryModal({ delivery, onClose, onSaved }: { delivery: Delivery | null; onClose: () => void; onSaved: () => void }) {
  const [receivedByName, setReceivedByName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!delivery) return
    setSubmitting(true)
    await supabase.from('deliveries').update({
      status: 'livree', delivered_at: new Date().toISOString(), received_by_name: receivedByName || null,
    }).eq('id', delivery.id)
    setSubmitting(false)
    setReceivedByName('')
    onSaved()
  }

  return (
    <Modal open={!!delivery} onClose={onClose} title="Confirmer la livraison">
      <div className="space-y-4">
        <div>
          <label className="label">Réceptionné par</label>
          <input className="input" value={receivedByName} onChange={(e) => setReceivedByName(e.target.value)} placeholder="Nom du client ou de la personne" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={submit} disabled={submitting} className="btn-primary">{submitting ? 'Enregistrement…' : 'Confirmer'}</button>
        </div>
      </div>
    </Modal>
  )
}
