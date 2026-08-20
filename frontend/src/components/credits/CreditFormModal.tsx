import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/format'
import { Plus, Trash2 } from 'lucide-react'

interface Installment {
  key: string
  due_date: string
  amount: string
}

export function CreditFormModal({
  open, onClose, onSaved, saleId, amountDue,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  saleId: string
  amountDue: number
}) {
  const today = new Date()
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().slice(0, 10)
  const [frequency, setFrequency] = useState('mensuel')
  const [installments, setInstallments] = useState<Installment[]>([
    { key: crypto.randomUUID(), due_date: nextMonth, amount: String(amountDue) },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = installments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const remaining = amountDue - total

  const addInstallment = () => {
    const last = installments[installments.length - 1]
    const nextDate = last ? new Date(new Date(last.due_date).setMonth(new Date(last.due_date).getMonth() + 1)) : new Date()
    setInstallments((prev) => [...prev, { key: crypto.randomUUID(), due_date: nextDate.toISOString().slice(0, 10), amount: '' }])
  }
  const updateInstallment = (key: string, patch: Partial<Installment>) =>
    setInstallments((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)))
  const removeInstallment = (key: string) => setInstallments((prev) => prev.filter((i) => i.key !== key))

  const submit = async () => {
    if (Math.abs(remaining) > 0.01) {
      setError(`Le total des échéances doit être égal au solde dû (écart : ${formatCurrency(remaining)}).`)
      return
    }
    setSubmitting(true)
    setError(null)
    const dueDate = installments[installments.length - 1]?.due_date
    const { error } = await supabase.rpc('create_credit', {
      p_sale_id: saleId,
      p_due_date: dueDate,
      p_frequency: frequency,
      p_installments: installments.map((i) => ({ due_date: i.due_date, amount: Number(i.amount) || 0 })),
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Convertir le solde en crédit" wide>
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="rounded-lg bg-sand-50 px-3 py-2 text-sm dark:bg-slate-800">
          Solde à échelonner : <strong>{formatCurrency(amountDue)}</strong>
        </div>
        <div>
          <label className="label">Fréquence</label>
          <select className="input max-w-xs" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="mensuel">Mensuelle</option>
            <option value="hebdomadaire">Hebdomadaire</option>
            <option value="unique">Échéance unique</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="label">Échéances</label>
          {installments.map((i) => (
            <div key={i.key} className="flex items-center gap-2">
              <input type="date" className="input" value={i.due_date} onChange={(e) => updateInstallment(i.key, { due_date: e.target.value })} />
              <input type="number" min={0} step="0.01" className="input" value={i.amount} onChange={(e) => updateInstallment(i.key, { amount: e.target.value })} placeholder="Montant" />
              <button onClick={() => removeInstallment(i.key)} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          ))}
          <button onClick={addInstallment} className="btn-ghost text-sm"><Plus size={14} /> Ajouter une échéance</button>
        </div>
        <div className={`text-sm ${Math.abs(remaining) > 0.01 ? 'text-red-600' : 'text-emerald-600'}`}>
          Total échéances : {formatCurrency(total)} {Math.abs(remaining) > 0.01 && `(écart : ${formatCurrency(remaining)})`}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={submit} disabled={submitting} className="btn-primary">{submitting ? 'Création…' : 'Créer le crédit'}</button>
        </div>
      </div>
    </Modal>
  )
}
