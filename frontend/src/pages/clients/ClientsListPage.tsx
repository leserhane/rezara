import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/format'
import { ClientFormModal } from '@/components/clients/ClientFormModal'

const VIP_LABELS: Record<string, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', vip: 'VIP' }
const VIP_STYLES: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  silver: 'bg-slate-200 text-slate-700 dark:bg-stone-700 dark:text-stone-200',
  gold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  vip: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export function ClientsListPage() {
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<'all' | 'inactive' | 'balance_due' | 'vip'>('all')
  const [formOpen, setFormOpen] = useState(false)

  const { data: customers, refetch, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      let query = supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(100)
      if (search.trim()) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,customer_number.ilike.%${search}%,email.ilike.%${search}%`
        )
      }
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['customer-stats-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_customer_stats').select('*')
      if (error) throw error
      return new Map(data.map((s) => [s.customer_id, s]))
    },
  })

  const filtered = (customers ?? []).filter((c) => {
    if (segment === 'all') return true
    const s = stats?.get(c.id)
    if (!s) return false
    if (segment === 'inactive') return !s.last_purchase_at || (Date.now() - new Date(s.last_purchase_at).getTime()) / 86400000 > 540
    if (segment === 'balance_due') return s.balance_due > 0
    if (segment === 'vip') return s.vip_tier === 'vip' || s.vip_tier === 'gold'
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Clients</h1>
        <button onClick={() => setFormOpen(true)} className="btn-primary">
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone, numéro…"
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'vip', label: 'VIP / Gold' },
            { key: 'balance_due', label: 'Solde impayé' },
            { key: 'inactive', label: 'Inactifs (18m+)' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSegment(s.key as typeof segment)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                segment === s.key ? 'bg-brand-700 text-white' : 'bg-sand-100 text-slate-600 dark:bg-stone-800 dark:text-stone-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-stone-800">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Segment</th>
              <th className="px-4 py-3 text-right">Total dépensé</th>
              <th className="px-4 py-3 text-right">Solde dû</th>
              <th className="px-4 py-3">Dernier achat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-stone-800">
            {filtered.map((c) => {
              const s = stats?.get(c.id)
              return (
                <tr key={c.id} className="hover:bg-sand-50 dark:hover:bg-stone-800/50">
                  <td className="px-4 py-3">
                    <Link to={`/clients/${c.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
                      {c.first_name} {c.last_name}
                    </Link>
                    <div className="text-xs text-slate-400">{c.customer_number}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-stone-300">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    {s && <span className={`badge ${VIP_STYLES[s.vip_tier]}`}>{VIP_LABELS[s.vip_tier]}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(s?.lifetime_value ?? 0)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={s?.balance_due ? 'font-medium text-red-600 dark:text-red-400' : 'text-slate-400'}>
                      {formatCurrency(s?.balance_due ?? 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(s?.last_purchase_at)}</td>
                </tr>
              )
            })}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucun client trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ClientFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); refetch() }} />
    </div>
  )
}
