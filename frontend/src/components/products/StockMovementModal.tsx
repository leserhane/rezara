import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { StockMovementType } from '@/types/database'

const TYPE_OPTIONS: { value: StockMovementType; label: string; sign: 1 | -1; adminOnly?: boolean }[] = [
  { value: 'entree', label: 'Entrée de stock', sign: 1 },
  { value: 'sortie', label: 'Sortie de stock', sign: -1 },
  { value: 'retour_fournisseur', label: 'Retour fournisseur', sign: -1 },
  { value: 'retour_client', label: 'Retour client', sign: 1 },
  { value: 'ajustement', label: 'Ajustement (correction)', sign: 1, adminOnly: true },
]

export function StockMovementModal({
  open, onClose, onSaved, productId, currentQuantity,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  productId: string
  currentQuantity: number
}) {
  const { isAdmin } = useAuth()
  const [type, setType] = useState<StockMovementType>('entree')
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = TYPE_OPTIONS.filter((o) => !o.adminOnly || isAdmin)
  const selected = options.find((o) => o.value === type) ?? options[0]
  const signedChange = selected.sign * Math.abs(Number(quantity) || 0)
  const resultingQuantity = currentQuantity + signedChange

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.rpc('apply_stock_movement', {
      p_product_id: productId,
      p_type: type,
      p_quantity_change: signedChange,
      p_reason: reason || null,
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Mouvement de stock">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div>
          <label className="label">Type de mouvement</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as StockMovementType)}>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Quantité</label>
          <input type="number" min={1} required className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div>
          <label className="label">Justification</label>
          <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Obligatoire pour un ajustement" />
        </div>
        <div className="rounded-lg bg-sand-50 px-3 py-2 text-sm dark:bg-slate-800">
          Stock actuel : <strong>{currentQuantity}</strong> → nouveau stock : <strong className={resultingQuantity < 0 ? 'text-red-600' : ''}>{resultingQuantity}</strong>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={submitting || resultingQuantity < 0} className="btn-primary">
            {submitting ? 'Enregistrement…' : 'Confirmer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
