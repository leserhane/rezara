import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateTime } from '@/lib/format'
import { Modal } from '@/components/ui/Modal'
import type { Appointment, Customer } from '@/types/database'

const STATUS_LABELS: Record<string, string> = { planifie: 'Planifié', confirme: 'Confirmé', realise: 'Réalisé', annule: 'Annulé', absent: 'Absent' }
const STATUS_STYLES: Record<string, string> = {
  planifie: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  confirme: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  realise: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  annule: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  absent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export function AppointmentsPage() {
  const [formOpen, setFormOpen] = useState(false)

  const { data: appointments, refetch } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, customers(first_name, last_name, phone)')
        .order('scheduled_at', { ascending: true })
      if (error) throw error
      return data as (typeof data[number] & { customers: { first_name: string; last_name: string; phone: string | null } | null })[]
    },
  })

  const upcoming = (appointments ?? []).filter((a) => a.status !== 'annule' && a.status !== 'realise')
  const past = (appointments ?? []).filter((a) => a.status === 'annule' || a.status === 'realise')

  const setStatus = async (id: string, status: Appointment['status']) => {
    await supabase.from('appointments').update({ status }).eq('id', id)
    refetch()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Rendez-vous</h1>
        <button onClick={() => setFormOpen(true)} className="btn-primary"><Plus size={16} /> Nouveau rendez-vous</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Motif</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcoming.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">{formatDateTime(a.scheduled_at)}</td>
                <td className="px-4 py-3">
                  {a.customers ? <Link to={`/clients/${a.customer_id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">{a.customers.first_name} {a.customers.last_name}</Link> : '—'}
                </td>
                <td className="px-4 py-3 text-slate-500">{a.reason ?? '—'}</td>
                <td className="px-4 py-3"><span className={`badge ${STATUS_STYLES[a.status]}`}>{STATUS_LABELS[a.status]}</span></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    {a.status === 'planifie' && <button onClick={() => setStatus(a.id, 'confirme')} className="btn-secondary text-xs">Confirmer</button>}
                    <button onClick={() => setStatus(a.id, 'realise')} className="btn-secondary text-xs">Réalisé</button>
                    <button onClick={() => setStatus(a.id, 'absent')} className="btn-secondary text-xs">Absent</button>
                    <button onClick={() => setStatus(a.id, 'annule')} className="btn-ghost text-xs text-red-600">Annuler</button>
                  </div>
                </td>
              </tr>
            ))}
            {upcoming.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucun rendez-vous à venir.</td></tr>}
          </tbody>
        </table>
      </div>

      {past.length > 0 && (
        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-500">Historique ({past.length})</summary>
          <div className="mt-3 space-y-1">
            {past.map((a) => (
              <div key={a.id} className="flex justify-between text-sm">
                <span>{formatDateTime(a.scheduled_at)} — {a.customers ? `${a.customers.first_name} ${a.customers.last_name}` : '—'}</span>
                <span className={`badge ${STATUS_STYLES[a.status]}`}>{STATUS_LABELS[a.status]}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <AppointmentFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); refetch() }} />
    </div>
  )
}

function AppointmentFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSearch = async (value: string) => {
    setSearch(value)
    if (!value.trim()) { setResults([]); return }
    const { data } = await supabase.from('customers').select('*').or(`first_name.ilike.%${value}%,last_name.ilike.%${value}%,phone.ilike.%${value}%`).limit(6)
    setResults(data ?? [])
  }

  const submit = async () => {
    if (!profile || !customer || !scheduledAt) return
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.from('appointments').insert({
      store_id: profile.store_id, customer_id: customer.id, optician_id: profile.id,
      scheduled_at: new Date(scheduledAt).toISOString(), reason: reason || null, created_by: profile.id,
    })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    setCustomer(null); setScheduledAt(''); setReason('')
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouveau rendez-vous">
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div>
          <label className="label">Client</label>
          {customer ? (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
              <span>{customer.first_name} {customer.last_name}</span>
              <button onClick={() => setCustomer(null)} className="text-xs text-red-600">Changer</button>
            </div>
          ) : (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Rechercher un client…" />
              {results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  {results.map((c) => (
                    <button key={c.id} onClick={() => { setCustomer(c); setResults([]) }} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
                      {c.first_name} {c.last_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div><label className="label">Date et heure</label><input type="datetime-local" className="input" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
        <div><label className="label">Motif</label><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={submit} disabled={submitting || !customer || !scheduledAt} className="btn-primary">{submitting ? 'Création…' : 'Créer'}</button>
        </div>
      </div>
    </Modal>
  )
}
