import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Customer, GenderType } from '@/types/database'

export function ClientFormModal({
  open, onClose, onSaved, existing,
}: {
  open: boolean
  onClose: () => void
  onSaved: (customer: Customer) => void
  existing?: Customer | null
}) {
  const { profile } = useAuth()
  const [firstName, setFirstName] = useState(existing?.first_name ?? '')
  const [lastName, setLastName] = useState(existing?.last_name ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [whatsapp, setWhatsapp] = useState(existing?.whatsapp ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [address, setAddress] = useState(existing?.address ?? '')
  const [birthDate, setBirthDate] = useState(existing?.birth_date ?? '')
  const [gender, setGender] = useState<GenderType | ''>(existing?.gender ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)
    setError(null)

    const payload = {
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email: email || null,
      address: address || null,
      birth_date: birthDate || null,
      gender: gender || null,
      notes: notes || null,
    }

    const result = existing
      ? await supabase.from('customers').update(payload).eq('id', existing.id).select().single()
      : await supabase.from('customers').insert({ ...payload, store_id: profile.store_id, assigned_optician_id: profile.id, created_by: profile.id }).select().single()

    setSubmitting(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    onSaved(result.data as Customer)
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Modifier le client' : 'Nouveau client'} wide>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Prénom *</label>
            <input required className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="label">Nom *</label>
            <input required className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input className="input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Date de naissance</label>
            <input type="date" className="input" value={birthDate ?? ''} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Sexe</label>
            <select className="input" value={gender} onChange={(e) => setGender(e.target.value as GenderType)}>
              <option value="">—</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="label">Adresse</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
