import { Fragment, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/contexts/AuthContext'
import { Modal } from '@/components/ui/Modal'
import { CreditFormModal } from '@/components/credits/CreditFormModal'
import type { PaymentMethod, Cheque } from '@/types/database'
import { Receipt, Ban, Wrench, Truck, CreditCard, Glasses, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react'

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAdmin, profile } = useAuth()
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [creditModalOpen, setCreditModalOpen] = useState(false)
  const [orderBusy, setOrderBusy] = useState(false)
  const [deliveryBusy, setDeliveryBusy] = useState(false)

  const { data: sale, refetch } = useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_sales').select('*').eq('id', id!).single()
      if (error) throw error
      const { data: customer } = await supabase
        .from('customers')
        .select('first_name, last_name, phone, customer_number')
        .eq('id', data.customer_id)
        .single()
      return { ...data, customer }
    },
    enabled: !!id,
  })

  const { data: items } = useQuery({
    queryKey: ['sale-items', id],
    queryFn: async () => (await supabase.from('v_sale_items').select('*').eq('sale_id', id!)).data ?? [],
    enabled: !!id,
  })

  const { data: payments, refetch: refetchPayments } = useQuery({
    queryKey: ['sale-payments', id],
    queryFn: async () => (await supabase.from('payments').select('*, payment_methods(name)').eq('sale_id', id!).order('created_at')).data ?? [],
    enabled: !!id,
  })

  const { data: invoice } = useQuery({
    queryKey: ['sale-invoice', id],
    queryFn: async () => (await supabase.from('invoices').select('*').eq('sale_id', id!).maybeSingle()).data,
    enabled: !!id,
  })

  const { data: order, refetch: refetchOrder } = useQuery({
    queryKey: ['sale-order', id],
    queryFn: async () => (await supabase.from('orders').select('*').eq('sale_id', id!).maybeSingle()).data,
    enabled: !!id,
  })

  const { data: delivery, refetch: refetchDelivery } = useQuery({
    queryKey: ['sale-delivery', id],
    queryFn: async () => (await supabase.from('deliveries').select('*').eq('sale_id', id!).maybeSingle()).data,
    enabled: !!id,
  })

  const { data: credit } = useQuery({
    queryKey: ['sale-credit', id],
    queryFn: async () => (await supabase.from('credits').select('*').eq('sale_id', id!).maybeSingle()).data,
    enabled: !!id,
  })

  if (!sale) return <p className="text-slate-400">Chargement…</p>

  const subtotalTtc = (items ?? []).reduce((sum, it) => sum + it.line_total_ttc, 0)

  const queryClient = useQueryClient()
  const refreshAll = () => {
    refetch()
    refetchPayments()
    queryClient.invalidateQueries({ queryKey: ['sale-cheques', sale.id] })
  }

  const createOrder = async () => {
    if (!profile) return
    setOrderBusy(true)
    await supabase.from('orders').insert({
      store_id: profile.store_id, sale_id: sale.id, customer_id: sale.customer_id, created_by: profile.id,
    })
    setOrderBusy(false)
    refetchOrder()
  }

  const createDelivery = async () => {
    setDeliveryBusy(true)
    await supabase.from('deliveries').insert({ sale_id: sale.id, order_id: order?.id ?? null })
    setDeliveryBusy(false)
    refetchDelivery()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{sale.sale_number}</h1>
            <StatusBadge status={sale.status} />
          </div>
          <p className="text-sm text-slate-400">{formatDateTime(sale.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice && <Link to={`/invoices/${invoice.id}`} className="btn-secondary"><Receipt size={15} /> Facture</Link>}
          {items?.some((it) => it.item_role === 'verre') && (
            <Link to={`/sales/${sale.id}/lens-sheet`} className="btn-secondary"><Glasses size={15} /> Fiche technique verres</Link>
          )}
          {!order && sale.status !== 'annule' && (
            <button onClick={createOrder} disabled={orderBusy} className="btn-secondary"><Wrench size={15} /> Créer une commande atelier</button>
          )}
          {order && <Link to="/orders" className="btn-secondary"><Wrench size={15} /> Suivi atelier</Link>}
          {!delivery && sale.status !== 'annule' && (
            <button onClick={createDelivery} disabled={deliveryBusy} className="btn-secondary"><Truck size={15} /> Créer une livraison</button>
          )}
          {delivery && <Link to="/deliveries" className="btn-secondary"><Truck size={15} /> Livraison</Link>}
          {!credit && sale.status !== 'annule' && sale.amount_due > 0 && (
            <button onClick={() => setCreditModalOpen(true)} className="btn-secondary"><CreditCard size={15} /> Convertir en crédit</button>
          )}
          {credit && <Link to="/credits" className="btn-secondary"><CreditCard size={15} /> Voir le crédit</Link>}
          {sale.status !== 'annule' && sale.amount_due > 0 && (
            <button onClick={() => setPaymentModalOpen(true)} className="btn-primary">Encaisser un paiement</button>
          )}
          {isAdmin && sale.status !== 'annule' && sale.amount_paid === 0 && (
            <button onClick={() => setCancelModalOpen(true)} className="btn-danger"><Ban size={15} /> Annuler</button>
          )}
        </div>
      </div>

      {sale.customer && (
        <div className="card p-4">
          <div className="text-xs text-slate-400">Client</div>
          <Link to={`/clients/${sale.customer_id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
            {sale.customer.first_name} {sale.customer.last_name}
          </Link>
          <div className="text-xs text-slate-400">{sale.customer.customer_number} {sale.customer.phone && `· ${sale.customer.phone}`}</div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-stone-800">
            <tr>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3 text-right">Qté</th>
              <th className="px-4 py-3 text-right">PU TTC</th>
              <th className="px-4 py-3 text-right">Remise</th>
              <th className="px-4 py-3 text-right">Total TTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-stone-800">
            {(items ?? []).map((it) => (
              <tr key={it.id}>
                <td className="px-4 py-3">{it.description}</td>
                <td className="px-4 py-3 text-right">{it.quantity}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(it.unit_price_ht * (1 + it.tax_rate / 100))}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(it.discount_amount * (1 + it.tax_rate / 100))}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(it.line_total_ttc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card space-y-2 p-4">
          <h2 className="mb-2 text-sm font-semibold">Résumé financier</h2>
          <Row label="Sous-total TTC" value={formatCurrency(subtotalTtc)} />
          <Row label="Remise" value={`- ${formatCurrency(subtotalTtc - sale.total_ttc)}`} />
          <Row label="TVA" value={formatCurrency(sale.tax_amount)} />
          <Row label="TOTAL TTC" value={formatCurrency(sale.total_ttc)} big />
          {isAdmin && sale.cost_total !== null && <Row label="Coût d'achat" value={formatCurrency(sale.cost_total)} />}
          <Row label="Marge" value={`${formatCurrency(sale.margin_amount)} (${sale.margin_percent.toFixed(1)}%)`} accent />
          <div className="border-t border-slate-200 pt-2 dark:border-stone-800">
            <Row label="PAYÉ" value={formatCurrency(sale.amount_paid)} />
            <Row label="RESTANT" value={formatCurrency(sale.amount_due)} accent={sale.amount_due > 0} />
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold">Paiements</h2>
          <div className="space-y-2">
            {(payments ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-sand-50 px-3 py-2 text-sm dark:bg-stone-800">
                <div>
                  <div className="font-medium">{p.payment_number}</div>
                  <div className="text-xs text-slate-400">{formatDateTime(p.created_at)} · {p.payment_type}</div>
                </div>
                <div className="font-semibold">{formatCurrency(p.amount)}</div>
              </div>
            ))}
            {(payments ?? []).length === 0 && <p className="py-4 text-center text-sm text-slate-400">Aucun paiement enregistré.</p>}
          </div>
        </div>
      </div>

      <ChequesCard saleId={sale.id} />

      <RecordPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        saleId={sale.id}
        amountDue={sale.amount_due}
        onSaved={() => { setPaymentModalOpen(false); refreshAll() }}
      />
      <CancelSaleModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        saleId={sale.id}
        onSaved={() => { setCancelModalOpen(false); refreshAll() }}
      />
      <CreditFormModal
        open={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        saleId={sale.id}
        amountDue={sale.amount_due}
        onSaved={() => { setCreditModalOpen(false); refreshAll() }}
      />
    </div>
  )
}

function Row({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${big ? 'text-base font-semibold' : 'text-sm'}`}>
      <span className="text-slate-500">{label}</span>
      <span className={accent ? 'font-semibold text-brand-700 dark:text-brand-400' : 'text-slate-900 dark:text-white'}>{value}</span>
    </div>
  )
}

interface ChequeLine {
  key: string
  amount: string
  due_date: string
  cheque_number: string
  bank_name: string
}

const emptyChequeLine = (): ChequeLine => ({ key: crypto.randomUUID(), amount: '', due_date: '', cheque_number: '', bank_name: '' })

function RecordPaymentModal({
  open, onClose, onSaved, saleId, amountDue,
}: { open: boolean; onClose: () => void; onSaved: () => void; saleId: string; amountDue: number }) {
  const [amount, setAmount] = useState(String(amountDue))
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [cheques, setCheques] = useState<ChequeLine[]>([emptyChequeLine()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: methods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => (await supabase.from('payment_methods').select('*').eq('is_active', true)).data as PaymentMethod[],
    enabled: open,
  })
  const { data: register } = useQuery({
    queryKey: ['open-register'],
    queryFn: async () => (await supabase.from('cash_registers').select('id').eq('status', 'ouverte').maybeSingle()).data,
    enabled: open,
  })

  const isCheque = methods?.find((m) => m.id === paymentMethodId)?.code === 'cheque'
  const chequeTotal = cheques.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  const updateCheque = (key: string, patch: Partial<ChequeLine>) => {
    setCheques((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)))
  }
  const addCheque = () => setCheques((prev) => (prev.length >= 5 ? prev : [...prev, emptyChequeLine()]))
  const removeCheque = (key: string) => setCheques((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.key !== key)))

  const submit = async () => {
    if (!paymentMethodId) { setError('Choisissez un moyen de paiement.'); return }
    setSubmitting(true)
    setError(null)

    if (isCheque) {
      if (cheques.some((c) => !c.amount || !c.due_date)) {
        setSubmitting(false)
        setError('Chaque chèque doit avoir un montant et une date d\'échéance.')
        return
      }
      const { error } = await supabase.rpc('record_cheque_payment', {
        p_sale_id: saleId,
        p_cheques: cheques.map((c) => ({
          amount: Number(c.amount), due_date: c.due_date,
          cheque_number: c.cheque_number || null, bank_name: c.bank_name || null,
        })),
        p_cash_register_id: register?.id ?? null,
      })
      setSubmitting(false)
      if (error) { setError(error.message); return }
      onSaved()
      return
    }

    const { error } = await supabase.rpc('record_payment', {
      p_sale_id: saleId,
      p_amount: Number(amount),
      p_payment_type: Number(amount) >= amountDue ? 'solde' : 'acompte',
      p_payment_method_id: paymentMethodId,
      p_cash_register_id: register?.id ?? null,
    })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Encaisser un paiement" wide={isCheque}>
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div>
          <label className="label">Moyen de paiement</label>
          <select className="input" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
            <option value="">—</option>
            {(methods ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        {isCheque ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Répartissez le paiement sur 1 à 5 chèques (à échéances différentes si besoin). Chaque chèque sera suivi
              individuellement jusqu'à son encaissement.
            </p>
            {cheques.map((c, idx) => (
              <div key={c.key} className="grid grid-cols-2 gap-2 rounded-lg border border-sand-200 p-3 sm:grid-cols-5 dark:border-stone-700">
                <div className="sm:col-span-1">
                  <label className="label text-xs">Montant #{idx + 1}</label>
                  <input type="number" min={0.01} step="0.01" className="input" value={c.amount} onChange={(e) => updateCheque(c.key, { amount: e.target.value })} />
                </div>
                <div className="sm:col-span-1">
                  <label className="label text-xs">Échéance</label>
                  <input type="date" className="input" value={c.due_date} onChange={(e) => updateCheque(c.key, { due_date: e.target.value })} />
                </div>
                <div className="sm:col-span-1">
                  <label className="label text-xs">N° chèque</label>
                  <input className="input" value={c.cheque_number} onChange={(e) => updateCheque(c.key, { cheque_number: e.target.value })} />
                </div>
                <div className="sm:col-span-1">
                  <label className="label text-xs">Banque</label>
                  <input className="input" value={c.bank_name} onChange={(e) => updateCheque(c.key, { bank_name: e.target.value })} />
                </div>
                <div className="flex items-end sm:col-span-1">
                  <button
                    type="button" onClick={() => removeCheque(c.key)} disabled={cheques.length <= 1}
                    className="btn-secondary w-full justify-center disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <button type="button" onClick={addCheque} disabled={cheques.length >= 5} className="btn-secondary text-xs disabled:opacity-40">
                <Plus size={14} /> Ajouter un chèque {cheques.length >= 5 && '(max. 5)'}
              </button>
              <span className={`text-sm font-medium ${chequeTotal > amountDue ? 'text-red-600' : 'text-slate-500'}`}>
                Total : {formatCurrency(chequeTotal)} / {formatCurrency(amountDue)}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <label className="label">Montant (restant : {formatCurrency(amountDue)})</label>
            <input type="number" max={amountDue} min={0.01} step="0.01" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={submit} disabled={submitting || (isCheque && chequeTotal > amountDue)} className="btn-primary">
            {submitting ? 'Encaissement…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ChequesCard({ saleId }: { saleId: string }) {
  const queryClient = useQueryClient()
  const { data: cheques, refetch } = useQuery({
    queryKey: ['sale-cheques', saleId],
    queryFn: async () => (await supabase.from('cheques').select('*').eq('sale_id', saleId).order('due_date')).data as Cheque[],
  })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  if (!cheques || cheques.length === 0) return null

  const cash = async (id: string) => {
    setBusyId(id)
    await supabase.rpc('cash_cheque', { p_cheque_id: id })
    setBusyId(null)
    refetch()
  }
  const reject = async (id: string) => {
    setBusyId(id)
    await supabase.rpc('reject_cheque', { p_cheque_id: id, p_reason: rejectReason || null })
    setBusyId(null)
    setRejectingId(null)
    setRejectReason('')
    refetch()
    // A bounced cheque reverses part of the sale's amount_paid, so the
    // financial summary card (driven by a separate query) needs a refresh too.
    queryClient.invalidateQueries({ queryKey: ['sale', saleId] })
  }

  const statusLabel: Record<Cheque['status'], string> = { en_attente: 'En attente', encaisse: 'Encaissé', rejete: 'Rejeté' }
  const statusStyle: Record<Cheque['status'], string> = {
    en_attente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    encaisse: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rejete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div className="card overflow-x-auto">
      <div className="border-b border-sand-200 px-4 py-3 text-sm font-semibold dark:border-stone-800">Chèques</div>
      <table className="w-full text-sm">
        <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-stone-800">
          <tr>
            <th className="px-4 py-2">N°</th>
            <th className="px-4 py-2">Banque</th>
            <th className="px-4 py-2 text-right">Montant</th>
            <th className="px-4 py-2">Échéance</th>
            <th className="px-4 py-2">Statut</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sand-100 dark:divide-stone-800">
          {cheques.map((c) => (
            <Fragment key={c.id}>
              <tr>
                <td className="px-4 py-2">{c.cheque_number || '—'}</td>
                <td className="px-4 py-2 text-slate-500">{c.bank_name || '—'}</td>
                <td className="px-4 py-2 text-right font-medium">{formatCurrency(c.amount)}</td>
                <td className={`px-4 py-2 ${c.status === 'en_attente' && c.due_date < new Date().toISOString().slice(0, 10) ? 'font-medium text-red-600' : ''}`}>
                  {formatDateTime(c.due_date).split(' ')[0]}
                </td>
                <td className="px-4 py-2"><span className={`badge ${statusStyle[c.status]}`}>{statusLabel[c.status]}</span></td>
                <td className="px-4 py-2">
                  {c.status === 'en_attente' && (
                    <div className="flex gap-1">
                      <button onClick={() => cash(c.id)} disabled={busyId === c.id} title="Marquer encaissé" className="text-slate-400 hover:text-emerald-600">
                        <CheckCircle2 size={16} />
                      </button>
                      <button onClick={() => setRejectingId(rejectingId === c.id ? null : c.id)} title="Marquer rejeté" className="text-slate-400 hover:text-red-600">
                        <XCircle size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
              {rejectingId === c.id && (
                <tr>
                  <td colSpan={6} className="bg-sand-50 px-4 py-2 dark:bg-stone-900">
                    <div className="flex items-center gap-2">
                      <input
                        className="input flex-1" placeholder="Motif du rejet (facultatif)"
                        value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <button onClick={() => reject(c.id)} disabled={busyId === c.id} className="btn-danger">Confirmer le rejet</button>
                      <button onClick={() => setRejectingId(null)} className="btn-secondary">Annuler</button>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CancelSaleModal({
  open, onClose, onSaved, saleId,
}: { open: boolean; onClose: () => void; onSaved: () => void; saleId: string }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.rpc('cancel_sale', { p_sale_id: saleId, p_reason: reason })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Annuler la vente">
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <p className="text-sm text-slate-500">Cette action réintègre le stock des articles et marque la vente comme annulée. Elle reste consultable dans l'historique.</p>
        <div>
          <label className="label">Motif *</label>
          <textarea required className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Retour</button>
          <button onClick={submit} disabled={submitting || !reason} className="btn-danger">{submitting ? 'Annulation…' : "Confirmer l'annulation"}</button>
        </div>
      </div>
    </Modal>
  )
}
