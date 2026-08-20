import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/format'
import { Modal } from '@/components/ui/Modal'
import type { CreditInstallment, PaymentMethod } from '@/types/database'

export function CreditDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [payingInstallment, setPayingInstallment] = useState<CreditInstallment | null>(null)

  const { data: credit, refetch } = useQuery({
    queryKey: ['credit', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('credits').select('*, sales(sale_number), customers(first_name, last_name, phone, customer_number)').eq('id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: installments, refetch: refetchInstallments } = useQuery({
    queryKey: ['credit-installments', id],
    queryFn: async () => (await supabase.from('credit_installments').select('*').eq('credit_id', id!).order('due_date')).data ?? [],
    enabled: !!id,
  })

  if (!credit) return <p className="text-slate-400">Chargement…</p>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Crédit — {credit.customers?.first_name} {credit.customers?.last_name}</h1>
        <p className="text-sm text-slate-400">
          Vente <Link to={`/sales/${credit.sale_id}`} className="text-brand-700 hover:underline dark:text-brand-400">{credit.sales?.sale_number}</Link>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Montant initial" value={formatCurrency(credit.initial_amount)} />
        <MiniStat label="Payé" value={formatCurrency(credit.paid_amount)} />
        <MiniStat label="Solde" value={formatCurrency(credit.balance)} warn={credit.balance > 0} />
        <MiniStat label="Statut" value={credit.status === 'solde' ? 'Soldé' : 'Actif'} />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Échéance</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3 text-right">Payé</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-slate-800">
            {(installments ?? []).map((i) => {
              const overdue = i.status !== 'payee' && new Date(i.due_date) < new Date()
              return (
                <tr key={i.id}>
                  <td className="px-4 py-3">
                    <span className={overdue ? 'font-medium text-red-600 dark:text-red-400' : ''}>{formatDate(i.due_date)}</span>
                    {overdue && <span className="ml-2 text-xs text-red-500">en retard</span>}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(i.amount)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(i.paid_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${i.status === 'payee' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {i.status === 'payee' ? 'Payée' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {i.status !== 'payee' && (
                      <button onClick={() => setPayingInstallment(i)} className="btn-secondary text-xs">Encaisser</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <PayInstallmentModal
        installment={payingInstallment}
        saleId={credit.sale_id}
        onClose={() => setPayingInstallment(null)}
        onSaved={() => { setPayingInstallment(null); refetch(); refetchInstallments() }}
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

function PayInstallmentModal({
  installment, saleId, onClose, onSaved,
}: { installment: CreditInstallment | null; saleId: string; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: methods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => (await supabase.from('payment_methods').select('*').eq('is_active', true)).data as PaymentMethod[],
    enabled: !!installment,
  })
  const { data: register } = useQuery({
    queryKey: ['open-register'],
    queryFn: async () => (await supabase.from('cash_registers').select('id').eq('status', 'ouverte').maybeSingle()).data,
    enabled: !!installment,
  })

  const due = installment ? installment.amount - installment.paid_amount : 0

  const submit = async () => {
    if (!installment) return
    if (!paymentMethodId) { setError('Choisissez un moyen de paiement.'); return }
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.rpc('record_payment', {
      p_sale_id: saleId,
      p_amount: Number(amount) || due,
      p_payment_type: 'echeance_credit',
      p_payment_method_id: paymentMethodId,
      p_cash_register_id: register?.id ?? null,
      p_credit_installment_id: installment.id,
    })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    setAmount('')
    onSaved()
  }

  return (
    <Modal open={!!installment} onClose={onClose} title="Encaisser l'échéance">
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div>
          <label className="label">Montant (dû : {formatCurrency(due)})</label>
          <input type="number" step="0.01" min={0.01} max={due} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(due)} />
        </div>
        <div>
          <label className="label">Moyen de paiement</label>
          <select className="input" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
            <option value="">—</option>
            {(methods ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={submit} disabled={submitting} className="btn-primary">{submitting ? 'Encaissement…' : 'Confirmer'}</button>
        </div>
      </div>
    </Modal>
  )
}
