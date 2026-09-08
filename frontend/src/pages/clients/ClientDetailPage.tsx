import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { Plus, Phone, Mail, MapPin, Pencil, ShoppingCart, Calendar, PhoneCall, MessageCircle } from 'lucide-react'
import { PrescriptionFormModal } from '@/components/prescriptions/PrescriptionFormModal'
import { ClientFormModal } from '@/components/clients/ClientFormModal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { CustomerNoteType } from '@/types/database'

const VIP_LABELS: Record<string, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', vip: 'VIP' }

const NOTE_TYPE_LABELS: Record<CustomerNoteType, string> = {
  appel: 'Appel', visite: 'Visite', email: 'Email', whatsapp: 'WhatsApp', sms: 'SMS', autre: 'Autre',
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [tab, setTab] = useState<'info' | 'prescriptions' | 'history' | 'suivi'>('info')
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [noteType, setNoteType] = useState<CustomerNoteType>('appel')
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const { data: customer, refetch: refetchCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: stats } = useQuery({
    queryKey: ['customer-stats', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_customer_stats').select('*').eq('customer_id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: prescriptions, refetch: refetchPrescriptions } = useQuery({
    queryKey: ['prescriptions', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('prescriptions').select('*').eq('customer_id', id!).order('prescription_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: sales } = useQuery({
    queryKey: ['customer-sales', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_sales').select('*').eq('customer_id', id!).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ['customer-notes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*, profiles(first_name, last_name)')
        .eq('customer_id', id!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as (typeof data[number] & { profiles: { first_name: string; last_name: string } | null })[]
    },
    enabled: !!id,
  })

  const { data: appointments } = useQuery({
    queryKey: ['customer-appointments', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('appointments').select('*').eq('customer_id', id!).order('scheduled_at', { ascending: false }).limit(5)
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const addNote = async () => {
    if (!profile || !id || !noteText.trim()) return
    setSavingNote(true)
    const { error } = await supabase.from('customer_notes').insert({
      customer_id: id, note: noteText.trim(), type: noteType, created_by: profile.id,
    })
    setSavingNote(false)
    if (!error) {
      setNoteText('')
      refetchNotes()
    }
  }

  if (!customer) return <p className="text-slate-400">Chargement…</p>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{customer.first_name} {customer.last_name}</h1>
            {stats && <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{VIP_LABELS[stats.vip_tier]}</span>}
          </div>
          <p className="text-sm text-slate-400">{customer.customer_number}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditOpen(true)} className="btn-secondary"><Pencil size={15} /> Modifier</button>
          <Link to={`/sales/new?customer=${customer.id}`} className="btn-primary"><ShoppingCart size={15} /> Nouvelle vente</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Valeur totale (CLV)" value={formatCurrency(stats?.lifetime_value ?? 0)} />
        <MiniStat label="Achats" value={String(stats?.purchase_count ?? 0)} />
        <MiniStat label="Panier moyen" value={formatCurrency(stats?.average_basket ?? 0)} />
        <MiniStat label="Solde dû" value={formatCurrency(stats?.balance_due ?? 0)} warn={!!stats?.balance_due} />
      </div>

      <div className="flex gap-1 border-b border-sand-200 dark:border-stone-800">
        {[
          { key: 'info', label: 'Informations' },
          { key: 'suivi', label: `Suivi (${notes?.length ?? 0})` },
          { key: 'prescriptions', label: `Ordonnances (${prescriptions?.length ?? 0})` },
          { key: 'history', label: `Historique (${sales?.length ?? 0})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.key ? 'border-brand-700 text-brand-700 dark:text-brand-400' : 'border-transparent text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="card space-y-3 p-4">
          <InfoRow icon={Phone} label="Téléphone" value={customer.phone} />
          <InfoRow icon={Phone} label="WhatsApp" value={customer.whatsapp} />
          <InfoRow icon={Mail} label="Email" value={customer.email} />
          <InfoRow icon={MapPin} label="Adresse" value={customer.address} />
          <InfoRow label="Date de naissance" value={formatDate(customer.birth_date)} />
          <InfoRow label="Client depuis" value={formatDate(customer.created_at)} />
          {customer.tags.length > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-32 text-slate-400">Étiquettes</span>
              <div className="flex flex-wrap gap-1">
                {customer.tags.map((t) => (
                  <span key={t} className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">{t}</span>
                ))}
              </div>
            </div>
          )}
          {customer.notes && (
            <div className="border-t border-slate-100 pt-3 dark:border-stone-800">
              <div className="text-xs font-medium text-slate-400">Notes</div>
              <p className="mt-1 text-sm text-slate-700 dark:text-stone-300">{customer.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'suivi' && (
        <div className="space-y-4">
          <div className="card space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Prochains rendez-vous</h2>
              <Link to="/appointments" className="text-xs text-brand-700 hover:underline dark:text-brand-400">Voir tout</Link>
            </div>
            {(appointments ?? []).length === 0 && <p className="text-sm text-slate-400">Aucun rendez-vous enregistré.</p>}
            {(appointments ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-700 dark:text-stone-200"><Calendar size={14} className="text-slate-400" /> {formatDateTime(a.scheduled_at)} {a.reason && `— ${a.reason}`}</span>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>

          <div className="card space-y-3 p-4">
            <h2 className="text-sm font-semibold">Ajouter une interaction</h2>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(NOTE_TYPE_LABELS) as CustomerNoteType[]).map((t) => (
                <button
                  key={t} type="button" onClick={() => setNoteType(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${noteType === t ? 'bg-brand-700 text-white' : 'bg-sand-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300'}`}
                >
                  {NOTE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            <textarea
              className="input" rows={2} placeholder="Ce qui a été dit, convenu, à relancer…"
              value={noteText} onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex justify-end">
              <button onClick={addNote} disabled={savingNote || !noteText.trim()} className="btn-primary">
                {savingNote ? 'Enregistrement…' : 'Ajouter'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {(notes ?? []).map((n) => (
              <div key={n.id} className="card flex items-start gap-3 p-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand-100 text-slate-500 dark:bg-stone-800 dark:text-stone-400">
                  {n.type === 'appel' ? <PhoneCall size={14} /> : n.type === 'whatsapp' || n.type === 'sms' ? <MessageCircle size={14} /> : <Calendar size={14} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">{NOTE_TYPE_LABELS[n.type]}</span>
                    <span className="text-xs text-slate-400">{formatDateTime(n.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700 dark:text-stone-200">{n.note}</p>
                  {n.profiles && <p className="mt-1 text-xs text-slate-400">Par {n.profiles.first_name} {n.profiles.last_name}</p>}
                </div>
              </div>
            ))}
            {(notes ?? []).length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucune interaction enregistrée.</p>}
          </div>
        </div>
      )}

      {tab === 'prescriptions' && (
        <div className="space-y-3">
          <button onClick={() => setPrescriptionModalOpen(true)} className="btn-primary"><Plus size={15} /> Nouvelle ordonnance</button>
          {(prescriptions ?? []).map((p) => (
            <div key={p.id} className="card p-4">
              <div className="mb-2 flex justify-between text-sm text-slate-400">
                <span>{formatDate(p.prescription_date)} {p.doctor_name ? `— ${p.doctor_name}` : ''}</span>
                {p.valid_until && <span>Valide jusqu'au {formatDate(p.valid_until)}</span>}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <EyeSummary title="OD" sphere={p.od_sphere} cylinder={p.od_cylinder} axis={p.od_axis} addition={p.od_addition} acuity={p.od_acuity} />
                <EyeSummary title="OG" sphere={p.og_sphere} cylinder={p.og_cylinder} axis={p.og_axis} addition={p.og_addition} acuity={p.og_acuity} />
              </div>
              {(p.pd || p.height) && (
                <div className="mt-2 flex gap-4 text-xs text-slate-400">
                  {p.pd && <span>DP: {p.pd}</span>}
                  {p.height && <span>Hauteur: {p.height}</span>}
                </div>
              )}
            </div>
          ))}
          {(prescriptions ?? []).length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucune ordonnance enregistrée.</p>}
        </div>
      )}

      {tab === 'history' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-stone-800">
              <tr>
                <th className="px-4 py-3">N° Vente</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Payé</th>
                <th className="px-4 py-3 text-right">Restant</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100 dark:divide-stone-800">
              {(sales ?? []).map((s) => (
                <tr key={s.id} className="hover:bg-sand-50 dark:hover:bg-stone-800/50">
                  <td className="px-4 py-3"><Link to={`/sales/${s.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">{s.sale_number}</Link></td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(s.created_at)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(s.total_ttc)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(s.amount_paid)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(s.amount_due)}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
              {(sales ?? []).length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucune vente.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <PrescriptionFormModal
        open={prescriptionModalOpen}
        onClose={() => setPrescriptionModalOpen(false)}
        customerId={customer.id}
        onSaved={() => { setPrescriptionModalOpen(false); refetchPrescriptions() }}
      />
      <ClientFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        existing={customer}
        onSaved={() => { setEditOpen(false); refetchCustomer() }}
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

function InfoRow({ icon: Icon, label, value }: { icon?: typeof Phone; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {Icon && <Icon size={15} className="text-slate-400" />}
      <span className="w-32 text-slate-400">{label}</span>
      <span className="text-slate-700 dark:text-stone-200">{value || '—'}</span>
    </div>
  )
}

function EyeSummary({
  title, sphere, cylinder, axis, addition, acuity,
}: { title: string; sphere: number | null; cylinder: number | null; axis: number | null; addition: number | null; acuity: string | null }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-slate-400">{title}</div>
      <div className="text-slate-700 dark:text-stone-200">
        Sph {sphere ?? '—'} · Cyl {cylinder ?? '—'} · Axe {axis ?? '—'} · Add {addition ?? '—'}
        {acuity && <span className="text-slate-400"> · AV {acuity}</span>}
      </div>
    </div>
  )
}
