import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface ProfileRow { id: string; first_name: string; last_name: string; role_key: string }

// Opticians aren't accounts, so there's nothing to "log in" as — this is
// asked fresh at the moment of every create-action that needs to know who
// did it (a sale, a new client, an ordonnance, a devis, starting an
// inventory…), never remembered between actions. See LocalAuthContext's
// enterOpticianShell/opticianGate for how this gets wired to those actions.
export function OpticianPickerModal({ onPick, onCancel }: { onPick: (id: string) => void; onCancel: () => void }) {
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    window.__local.listProfiles().then((rows) => {
      if (cancelled) return
      setProfiles((rows as ProfileRow[]).filter((p) => p.role_key !== 'admin'))
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <Modal open onClose={onCancel} title="Qui effectue cette action ?">
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-400">Chargement…</p>
      ) : profiles.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          Aucun opticien enregistré. Demandez à l'administrateur d'en ajouter un dans Paramètres.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              className="flex flex-col items-center gap-2 rounded-xl border border-sand-200 p-4 text-center hover:border-brand-400 hover:bg-brand-50 dark:border-stone-700 dark:hover:bg-stone-800"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                <User size={18} />
              </span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{p.first_name} {p.last_name}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
