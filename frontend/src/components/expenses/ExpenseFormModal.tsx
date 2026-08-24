import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'

export function ExpenseFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [categoryId, setCategoryId] = useState('')
  const [amountHt, setAmountHt] = useState('')
  const [taxAmount, setTaxAmount] = useState('0')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [payFromRegister, setPayFromRegister] = useState(false)
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => (await supabase.from('expense_categories').select('*').order('name')).data ?? [],
    enabled: open,
  })
  const { data: methods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => (await supabase.from('payment_methods').select('*').eq('is_active', true)).data ?? [],
    enabled: open,
  })
  const { data: register } = useQuery({
    queryKey: ['open-register'],
    queryFn: async () => (await supabase.from('cash_registers').select('id').eq('status', 'ouverte').maybeSingle()).data,
    enabled: open,
  })

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (payFromRegister && !paymentMethodId) {
      setError('Choisissez un moyen de paiement pour une dépense payée depuis la caisse.')
      return
    }
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.rpc('record_expense', {
      p_category_id: categoryId,
      p_amount_ht: Number(amountHt) || 0,
      p_tax_amount: Number(taxAmount) || 0,
      p_payment_method_id: paymentMethodId || null,
      p_cash_register_id: payFromRegister ? register?.id ?? null : null,
      p_comment: comment || null,
      p_expense_date: expenseDate,
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setCategoryId(''); setAmountHt(''); setTaxAmount('0'); setComment(''); setPayFromRegister(false)
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle dépense" wide>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Catégorie *</label>
            <select required className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">—</option>
              {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Date</label><input type="date" className="input" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} /></div>
          <div><label className="label">Montant HT *</label><input required type="number" step="0.01" min={0.01} className="input" value={amountHt} onChange={(e) => setAmountHt(e.target.value)} /></div>
          <div><label className="label">TVA</label><input type="number" step="0.01" min={0} className="input" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} /></div>
          <div>
            <label className="label">Moyen de paiement</label>
            <select className="input" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
              <option value="">—</option>
              {(methods ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-stone-300">
              <input type="checkbox" checked={payFromRegister} onChange={(e) => setPayFromRegister(e.target.checked)} disabled={!register} />
              Payée depuis la caisse {!register && '(aucune caisse ouverte)'}
            </label>
          </div>
        </div>
        <div><label className="label">Commentaire</label><textarea className="input" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} /></div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  )
}
