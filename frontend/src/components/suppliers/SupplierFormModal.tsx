import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import type { Supplier } from '@/types/database'

export function SupplierFormModal({
  open, onClose, onSaved, existing,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  existing?: Supplier | null
}) {
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [ice, setIce] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [leadTime, setLeadTime] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(existing?.name ?? '')
    setContactName(existing?.contact_name ?? '')
    setPhone(existing?.phone ?? '')
    setEmail(existing?.email ?? '')
    setAddress(existing?.address ?? '')
    setIce(existing?.ice ?? '')
    setPaymentTerms(existing?.payment_terms ?? '')
    setLeadTime(existing?.average_lead_time_days ? String(existing.average_lead_time_days) : '')
    setNotes(existing?.notes ?? '')
  }, [existing, open])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      name, contact_name: contactName || null, phone: phone || null, email: email || null,
      address: address || null, ice: ice || null, payment_terms: paymentTerms || null,
      average_lead_time_days: leadTime ? Number(leadTime) : null, notes: notes || null,
    }

    const result = existing
      ? await supabase.from('suppliers').update(payload).eq('id', existing.id)
      : await supabase.from('suppliers').insert(payload)

    setSubmitting(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'} wide>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="label">Nom *</label><input required className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">Contact</label><input className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} /></div>
          <div><label className="label">Téléphone</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label">Adresse</label><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div><label className="label">ICE</label><input className="input" value={ice} onChange={(e) => setIce(e.target.value)} /></div>
          <div><label className="label">Conditions de paiement</label><input className="input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} /></div>
          <div><label className="label">Délai moyen (jours)</label><input type="number" min={0} className="input" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} /></div>
        </div>
        <div><label className="label">Notes</label><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  )
}
