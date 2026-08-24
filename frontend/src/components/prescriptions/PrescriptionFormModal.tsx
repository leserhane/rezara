import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Prescription } from '@/types/database'

const eyeFields = [
  { key: 'sphere', label: 'Sphère' },
  { key: 'cylinder', label: 'Cylindre' },
  { key: 'axis', label: 'Axe' },
  { key: 'addition', label: 'Addition' },
  { key: 'prism', label: 'Prisme' },
] as const

export function PrescriptionFormModal({
  open, onClose, onSaved, customerId,
}: {
  open: boolean
  onClose: () => void
  onSaved: (p: Prescription) => void
  customerId: string
}) {
  const { profile } = useAuth()
  const [od, setOd] = useState<Record<string, string>>({})
  const [og, setOg] = useState<Record<string, string>>({})
  const [odBase, setOdBase] = useState('')
  const [ogBase, setOgBase] = useState('')
  const [odAcuity, setOdAcuity] = useState('')
  const [ogAcuity, setOgAcuity] = useState('')
  const [pd, setPd] = useState('')
  const [height, setHeight] = useState('')
  const [correctionType, setCorrectionType] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().slice(0, 10))
  const [validUntil, setValidUntil] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const num = (v: string) => (v.trim() === '' ? null : Number(v))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)
    setError(null)

    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        customer_id: customerId,
        od_sphere: num(od.sphere ?? ''), od_cylinder: num(od.cylinder ?? ''), od_axis: num(od.axis ?? ''),
        od_addition: num(od.addition ?? ''), od_prism: num(od.prism ?? ''), od_base: odBase || null, od_acuity: odAcuity || null,
        og_sphere: num(og.sphere ?? ''), og_cylinder: num(og.cylinder ?? ''), og_axis: num(og.axis ?? ''),
        og_addition: num(og.addition ?? ''), og_prism: num(og.prism ?? ''), og_base: ogBase || null, og_acuity: ogAcuity || null,
        pd: num(pd), height: num(height),
        correction_type: correctionType || null,
        doctor_name: doctorName || null,
        prescription_date: prescriptionDate,
        valid_until: validUntil || null,
        created_by: profile.id,
      })
      .select()
      .single()

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved(data as Prescription)
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle ordonnance" wide>
      <form onSubmit={onSubmit} className="space-y-5">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <EyeBlock title="Œil droit (OD)" values={od} onChange={setOd} base={odBase} setBase={setOdBase} acuity={odAcuity} setAcuity={setOdAcuity} />
          <EyeBlock title="Œil gauche (OG)" values={og} onChange={setOg} base={ogBase} setBase={setOgBase} acuity={ogAcuity} setAcuity={setOgAcuity} />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div><label className="label">DP</label><input className="input" value={pd} onChange={(e) => setPd(e.target.value)} /></div>
          <div><label className="label">Hauteur</label><input className="input" value={height} onChange={(e) => setHeight(e.target.value)} /></div>
          <div className="col-span-2"><label className="label">Type de correction</label><input className="input" value={correctionType} onChange={(e) => setCorrectionType(e.target.value)} /></div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><label className="label">Médecin</label><input className="input" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} /></div>
          <div><label className="label">Date</label><input type="date" className="input" value={prescriptionDate} onChange={(e) => setPrescriptionDate(e.target.value)} /></div>
          <div><label className="label">Valide jusqu'au</label><input type="date" className="input" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  )
}

function EyeBlock({
  title, values, onChange, base, setBase, acuity, setAcuity,
}: {
  title: string
  values: Record<string, string>
  onChange: (v: Record<string, string>) => void
  base: string
  setBase: (v: string) => void
  acuity: string
  setAcuity: (v: string) => void
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-stone-800">
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-stone-200">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {eyeFields.map((f) => (
          <div key={f.key}>
            <label className="label text-xs">{f.label}</label>
            <input
              className="input"
              value={values[f.key] ?? ''}
              onChange={(e) => onChange({ ...values, [f.key]: e.target.value })}
            />
          </div>
        ))}
        <div>
          <label className="label text-xs">Base</label>
          <input className="input" value={base} onChange={(e) => setBase(e.target.value)} />
        </div>
        <div>
          <label className="label text-xs">Acuité</label>
          <input className="input" value={acuity} onChange={(e) => setAcuity(e.target.value)} />
        </div>
      </div>
    </div>
  )
}
