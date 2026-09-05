import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Printer, Pencil, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/format'

type DiscountMode = 'detail' | 'net'

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [discountMode, setDiscountMode] = useState<DiscountMode | null>(null)
  const [editing, setEditing] = useState(false)
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const { data: invoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*, customers(first_name, last_name, phone, address, customer_number)').eq('id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: items, refetch: refetchItems } = useQuery({
    queryKey: ['invoice-items', id],
    queryFn: async () => (await supabase.from('invoice_items').select('*').eq('invoice_id', id!)).data ?? [],
    enabled: !!id,
  })

  const { data: store } = useQuery({
    queryKey: ['store'],
    queryFn: async () => (await supabase.from('stores').select('*').limit(1).single()).data,
  })

  const hasDiscount = (items ?? []).some((it) => it.discount_amount > 0)

  // Every time this invoice is opened, ask again how to present a discount
  // on the printed document — never persist a silent default, since the
  // right answer depends on what was agreed with that specific customer.
  useEffect(() => {
    setDiscountMode(null)
  }, [id])

  if (!invoice) return <p className="text-slate-400">Chargement…</p>

  const askDiscountMode = hasDiscount && discountMode === null
  const mode: DiscountMode = discountMode ?? 'net'

  const startEditingPrices = () => {
    const initial: Record<string, string> = {}
    for (const it of items ?? []) initial[it.id] = it.line_total_ttc.toFixed(2)
    setEditedPrices(initial)
    setEditError(null)
    setEditing(true)
  }

  const editedTotal = (items ?? []).reduce((sum, it) => sum + (Number(editedPrices[it.id]) || 0), 0)
  const editedTotalMatches = Math.abs(editedTotal - invoice.total_ttc) < 0.01

  const saveReallocatedPrices = async () => {
    setSaving(true)
    setEditError(null)
    const { error } = await supabase.rpc('reallocate_invoice_item_prices', {
      p_invoice_id: invoice.id,
      p_items: (items ?? []).map((it) => ({ invoice_item_id: it.id, new_price_ttc: Number(editedPrices[it.id]) || 0 })),
    })
    setSaving(false)
    if (error) {
      setEditError(error.message)
      return
    }
    setEditing(false)
    refetchItems()
    queryClient.invalidateQueries({ queryKey: ['invoice', id] })
  }

  return (
    <div className="space-y-4">
      {askDiscountMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
          <div className="card w-full max-w-sm border-t-4 border-t-brand-700 p-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Remise sur la facture</h3>
            <p className="mb-4 text-sm text-slate-500">
              Cette vente comporte une remise. Comment souhaitez-vous l'afficher sur la facture ?
            </p>
            <div className="space-y-2">
              <button onClick={() => setDiscountMode('detail')} className="btn-secondary w-full justify-start text-left">
                Afficher le détail de la remise (prix plein + remise déduite)
              </button>
              <button onClick={() => setDiscountMode('net')} className="btn-secondary w-full justify-start text-left">
                Afficher directement le prix net (sans ligne de remise)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Facture {invoice.invoice_number}</h1>
        <div className="flex items-center gap-3">
          {hasDiscount && (
            <div className="flex items-center gap-0.5 rounded-lg border border-sand-200 p-0.5 text-xs">
              <button
                onClick={() => setDiscountMode('detail')}
                className={`rounded-md px-2 py-1 ${mode === 'detail' ? 'bg-brand-700 text-white' : 'text-slate-500 hover:bg-sand-100'}`}
              >
                Avec remise
              </button>
              <button
                onClick={() => setDiscountMode('net')}
                className={`rounded-md px-2 py-1 ${mode === 'net' ? 'bg-brand-700 text-white' : 'text-slate-500 hover:bg-sand-100'}`}
              >
                Prix net
              </button>
            </div>
          )}
          {!editing && (
            <button onClick={startEditingPrices} className="btn-secondary"><Pencil size={15} /> Modifier les prix</button>
          )}
          <button onClick={() => window.print()} className="btn-primary"><Printer size={16} /> Imprimer / PDF</button>
        </div>
      </div>

      {editing && (
        <div className="card space-y-3 border-t-4 border-t-brand-700 p-4 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Répartir le montant de la facture</h2>
            <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <p className="text-xs text-slate-500">
            Ajustez la répartition entre les articles (ex. monture / verres) sans changer le total de la facture.
          </p>
          {editError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</div>}
          <div className="space-y-2">
            {(items ?? []).map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-700 dark:text-stone-200">{it.description}</span>
                <div className="relative w-32">
                  <input
                    type="number" step="0.01" min={0} className="input pr-12 text-right"
                    value={editedPrices[it.id] ?? ''}
                    onChange={(e) => setEditedPrices((prev) => ({ ...prev, [it.id]: e.target.value }))}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">MAD</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-sand-200 pt-3 text-sm dark:border-stone-800">
            <span className={editedTotalMatches ? 'text-slate-500' : 'font-medium text-red-600'}>
              Total saisi : {formatCurrency(editedTotal)} / {formatCurrency(invoice.total_ttc)}
              {!editedTotalMatches && ' — doit être identique au total de la facture'}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-secondary">Annuler</button>
              <button onClick={saveReallocatedPrices} disabled={saving || !editedTotalMatches} className="btn-primary">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="invoice-print" className="card mx-auto max-w-2xl p-8 print:border-0 print:shadow-none">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold text-brand-700">{store?.name ?? 'Optimum Optic'}</div>
            <div className="text-xs text-slate-500">{store?.address}</div>
            <div className="text-xs text-slate-500">{store?.phone} {store?.email && `· ${store.email}`}</div>
            {store?.ice && <div className="text-xs text-slate-500">ICE : {store.ice}</div>}
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold uppercase text-slate-400">Facture</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{invoice.invoice_number}</div>
            <div className="text-xs text-slate-500">{formatDate(invoice.issued_at)}</div>
          </div>
        </div>

        {invoice.customers && (
          <div className="mb-6 rounded-lg bg-sand-50 p-3 text-sm dark:bg-stone-800">
            <div className="font-medium">{invoice.customers.first_name} {invoice.customers.last_name}</div>
            <div className="text-xs text-slate-500">{invoice.customers.customer_number}</div>
            {invoice.customers.phone && <div className="text-xs text-slate-500">{invoice.customers.phone}</div>}
            {invoice.customers.address && <div className="text-xs text-slate-500">{invoice.customers.address}</div>}
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="border-b border-slate-300 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Désignation</th>
              <th className="py-2 text-right">Qté</th>
              <th className="py-2 text-right">PU TTC</th>
              {mode === 'detail' && <th className="py-2 text-right">Remise</th>}
              <th className="py-2 text-right">Total TTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {(items ?? []).map((it) => {
              const unitTtcGross = it.unit_price_ht * (1 + it.tax_rate / 100)
              const discountTtc = it.discount_amount * (1 + it.tax_rate / 100)
              const unitTtcNet = it.quantity > 0 ? it.line_total_ttc / it.quantity : unitTtcGross
              return (
                <tr key={it.id}>
                  <td className="py-2">{it.description}</td>
                  <td className="py-2 text-right">{it.quantity}</td>
                  <td className="py-2 text-right">{formatCurrency(mode === 'detail' ? unitTtcGross : unitTtcNet)}</td>
                  {mode === 'detail' && (
                    <td className="py-2 text-right">{discountTtc > 0 ? `- ${formatCurrency(discountTtc)}` : '—'}</td>
                  )}
                  <td className="py-2 text-right">{formatCurrency(it.line_total_ttc)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Total HT</span><span>{formatCurrency(invoice.total_ht)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">TVA</span><span>{formatCurrency(invoice.tax_amount)}</span></div>
          <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-semibold"><span>Total TTC</span><span>{formatCurrency(invoice.total_ttc)}</span></div>
          <div className="flex justify-between text-emerald-700"><span>Payé</span><span>{formatCurrency(invoice.amount_paid)}</span></div>
          <div className="flex justify-between font-semibold text-red-600"><span>Restant dû</span><span>{formatCurrency(invoice.amount_due)}</span></div>
        </div>
      </div>
    </div>
  )
}
