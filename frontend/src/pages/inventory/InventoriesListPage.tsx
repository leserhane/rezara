import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, ClipboardList } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/format'
import type { InventoryStatus } from '@/types/database'

const STATUS_LABELS: Record<InventoryStatus, string> = {
  en_cours: 'En cours', valide: 'Validé', annule: 'Annulé',
}
const STATUS_STYLES: Record<InventoryStatus, string> = {
  en_cours: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  valide: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  annule: 'bg-slate-100 text-slate-500 dark:bg-stone-800 dark:text-stone-400',
}

export function InventoriesListPage() {
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: inventories, isLoading, refetch } = useQuery({
    queryKey: ['inventories-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventories')
        .select('*, profiles(first_name, last_name)')
        .order('started_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as (typeof data[number] & { profiles: { first_name: string; last_name: string } | null })[]
    },
  })

  const ongoing = (inventories ?? []).find((i) => i.status === 'en_cours')

  const startInventory = async () => {
    setStarting(true)
    setError(null)
    const { data, error } = await supabase.rpc('start_inventory', {})
    setStarting(false)
    if (error) {
      setError(error.message)
      refetch()
      return
    }
    navigate(`/inventory/${data.id}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Inventaire</h1>
        {ongoing ? (
          <Link to={`/inventory/${ongoing.id}`} className="btn-primary"><ClipboardList size={16} /> Reprendre l'inventaire en cours</Link>
        ) : (
          <button onClick={startInventory} disabled={starting} className="btn-primary">
            <Plus size={16} /> {starting ? 'Démarrage…' : 'Nouvel inventaire'}
          </button>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-stone-800">
            <tr>
              <th className="px-4 py-3">Référence</th>
              <th className="px-4 py-3">Démarré le</th>
              <th className="px-4 py-3">Par</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-stone-800">
            {(inventories ?? []).map((inv) => (
              <tr key={inv.id} className="hover:bg-sand-50 dark:hover:bg-stone-800/50">
                <td className="px-4 py-3">
                  <Link to={`/inventory/${inv.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">{inv.reference}</Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(inv.started_at)}</td>
                <td className="px-4 py-3">{inv.profiles ? `${inv.profiles.first_name} ${inv.profiles.last_name}` : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status]}`}>
                    {STATUS_LABELS[inv.status]}
                  </span>
                </td>
              </tr>
            ))}
            {!isLoading && (inventories ?? []).length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Aucun inventaire pour le moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
