import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { Modal } from '@/components/ui/Modal'

const MOVEMENT_LABELS: Record<string, string> = {
  vente: 'Vente', acompte: 'Acompte', solde: 'Solde', remboursement: 'Remboursement',
  depense: 'Dépense', entree: 'Entrée', sortie: 'Sortie', fond_ouverture: "Fond d'ouverture",
}

export function CashRegisterPage() {
  const [openModalOpen, setOpenModalOpen] = useState(false)
  const [closeModalOpen, setCloseModalOpen] = useState(false)

  const { data: register, refetch } = useQuery({
    queryKey: ['current-register'],
    queryFn: async () => (await supabase.from('cash_registers').select('*').eq('status', 'ouverte').maybeSingle()).data,
  })

  const { data: movements, refetch: refetchMovements } = useQuery({
    queryKey: ['register-movements', register?.id],
    queryFn: async () => (await supabase.from('cash_movements').select('*, payment_methods(name)').eq('cash_register_id', register!.id).order('created_at', { ascending: false })).data ?? [],
    enabled: !!register,
  })

  const { data: history } = useQuery({
    queryKey: ['register-history'],
    queryFn: async () => (await supabase.from('cash_registers').select('*').eq('status', 'cloturee').order('closed_at', { ascending: false }).limit(10)).data ?? [],
  })

  const totalIn = (movements ?? []).filter((m) => m.type !== 'depense' && m.type !== 'sortie').reduce((s, m) => s + m.amount, 0)
  const totalOut = (movements ?? []).filter((m) => m.type === 'depense' || m.type === 'sortie').reduce((s, m) => s + m.amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Caisse</h1>
        {register ? (
          <button onClick={() => setCloseModalOpen(true)} className="btn-danger">Clôturer la caisse</button>
        ) : (
          <button onClick={() => setOpenModalOpen(true)} className="btn-primary">Ouvrir la caisse</button>
        )}
      </div>

      {register ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Statut" value="Ouverte" />
            <MiniStat label="Fond d'ouverture" value={formatCurrency(register.opening_amount)} />
            <MiniStat label="Total encaissé" value={formatCurrency(totalIn)} />
            <MiniStat label="Sorties / dépenses" value={formatCurrency(totalOut)} />
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold">Mouvements de la journée</h2>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
                <tr><th className="py-2">Heure</th><th className="py-2">Type</th><th className="py-2">Moyen</th><th className="py-2 text-right">Montant</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(movements ?? []).map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 text-slate-500">{formatDateTime(m.created_at)}</td>
                    <td className="py-2">{MOVEMENT_LABELS[m.type] ?? m.type}</td>
                    <td className="py-2 text-slate-500">{(m as { payment_methods?: { name: string } }).payment_methods?.name ?? '—'}</td>
                    <td className={`py-2 text-right font-medium ${m.type === 'depense' || m.type === 'sortie' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatCurrency(m.amount)}
                    </td>
                  </tr>
                ))}
                {(movements ?? []).length === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-400">Aucun mouvement.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card p-8 text-center text-slate-400">Aucune caisse ouverte actuellement.</div>
      )}

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold">Historique des clôtures</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr><th className="py-2">Clôturée le</th><th className="py-2 text-right">Attendu</th><th className="py-2 text-right">Réel</th><th className="py-2 text-right">Écart</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(history ?? []).map((r) => (
              <tr key={r.id}>
                <td className="py-2 text-slate-500">{formatDateTime(r.closed_at)}</td>
                <td className="py-2 text-right">{formatCurrency(r.expected_cash)}</td>
                <td className="py-2 text-right">{formatCurrency(r.actual_cash)}</td>
                <td className={`py-2 text-right font-medium ${(r.cash_difference ?? 0) === 0 ? 'text-slate-500' : (r.cash_difference ?? 0) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(r.cash_difference)}
                </td>
              </tr>
            ))}
            {(history ?? []).length === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-400">Aucune clôture.</td></tr>}
          </tbody>
        </table>
      </div>

      <OpenRegisterModal open={openModalOpen} onClose={() => setOpenModalOpen(false)} onSaved={() => { setOpenModalOpen(false); refetch() }} />
      {register && (
        <CloseRegisterModal
          open={closeModalOpen}
          onClose={() => setCloseModalOpen(false)}
          registerId={register.id}
          onSaved={() => { setCloseModalOpen(false); refetch(); refetchMovements() }}
        />
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{value}</div>
    </div>
  )
}

function OpenRegisterModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState('0')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.rpc('open_cash_register', { p_opening_amount: Number(amount) || 0, p_notes: notes || null })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Ouvrir la caisse">
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div>
          <label className="label">Fond de caisse (MAD)</label>
          <input type="number" min={0} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={submit} disabled={submitting} className="btn-primary">{submitting ? 'Ouverture…' : 'Ouvrir'}</button>
        </div>
      </div>
    </Modal>
  )
}

function CloseRegisterModal({
  open, onClose, onSaved, registerId,
}: { open: boolean; onClose: () => void; onSaved: () => void; registerId: string }) {
  const [actualCash, setActualCash] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  type CloseResult = { register: { expected_cash: number; actual_cash: number; cash_difference: number } }
  const [result, setResult] = useState<CloseResult | null>(null)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    const { data, error } = await supabase.rpc('close_cash_register', {
      p_cash_register_id: registerId,
      p_actual_cash: Number(actualCash) || 0,
      p_notes: notes || null,
    })
    setSubmitting(false)
    if (error) { setError(error.message); return }
    setResult(data as unknown as CloseResult)
  }

  return (
    <Modal open={open} onClose={() => { setResult(null); onClose() }} title="Clôturer la caisse">
      {result ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-800">
            <Row label="Espèces théoriques" value={formatCurrency(result.register.expected_cash)} />
            <Row label="Espèces réelles" value={formatCurrency(result.register.actual_cash)} />
            <Row label="Écart" value={formatCurrency(result.register.cash_difference)} />
          </div>
          <button onClick={() => { setResult(null); onSaved() }} className="btn-primary w-full">Fermer</button>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div>
            <label className="label">Espèces comptées (MAD)</label>
            <input type="number" min={0} className="input" value={actualCash} onChange={(e) => setActualCash(e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary">Annuler</button>
            <button onClick={submit} disabled={submitting} className="btn-danger">{submitting ? 'Clôture…' : 'Clôturer'}</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}
