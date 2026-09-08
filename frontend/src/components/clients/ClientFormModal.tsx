import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Customer, GenderType } from '@/types/database'

export const SUGGESTED_CUSTOMER_TAGS = ['Prospect', 'VIP', 'Fidèle', 'À contacter', 'Insatisfait']

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
  const [tags, setTags] = useState<string[]>(existing?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || tags.includes(trimmed)) return
    setTags((prev) => [...prev, trimmed])
    setTagInput('')
  }
  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag))

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
      tags,
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
          <label className="label">Étiquettes</label>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600"><X size={12} /></button>
              </span>
            ))}
            <input
              className="input h-7 w-32 py-0 text-xs"
              placeholder="+ étiquette"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
            />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SUGGESTED_CUSTOMER_TAGS.filter((t) => !tags.includes(t)).map((t) => (
              <button key={t} type="button" onClick={() => addTag(t)} className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs text-slate-500 hover:bg-sand-200 dark:bg-stone-800 dark:text-stone-400">
                + {t}
              </button>
            ))}
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
