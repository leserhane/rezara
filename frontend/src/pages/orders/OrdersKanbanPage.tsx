import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/format'
import { AlertTriangle } from 'lucide-react'
import type { OrderStatus } from '@/types/database'

const COLUMNS: { key: OrderStatus; label: string }[] = [
  { key: 'creee', label: 'Créée' },
  { key: 'verres_commandes', label: 'Verres commandés' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'recue', label: 'Reçue' },
  { key: 'montage', label: 'Montage' },
  { key: 'controle', label: 'Contrôle' },
  { key: 'prete', label: 'Prête' },
  { key: 'client_informe', label: 'Client informé' },
  { key: 'livree', label: 'Livrée' },
]

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  creee: 'verres_commandes',
  verres_commandes: 'en_attente',
  en_attente: 'recue',
  recue: 'montage',
  montage: 'controle',
  controle: 'prete',
  prete: 'client_informe',
  client_informe: 'livree',
}

export function OrdersKanbanPage() {
  const { data: orders, refetch } = useQuery({
    queryKey: ['orders-kanban'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(first_name, last_name)')
        .neq('status', 'annulee')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as (typeof data[number] & { customers: { first_name: string; last_name: string } | null })[]
    },
  })

  const advance = async (orderId: string, current: OrderStatus) => {
    const next = NEXT_STATUS[current]
    if (!next) return
    await supabase.from('orders').update({ status: next }).eq('id', orderId)
    refetch()
  }

  const isOverdue = (expected: string | null, status: OrderStatus) =>
    expected && status !== 'livree' && new Date(expected) < new Date()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Atelier — Suivi des commandes</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const columnOrders = (orders ?? []).filter((o) => o.status === col.key)
          return (
            <div key={col.key} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase text-slate-500">{col.label}</h2>
                <span className="text-xs text-slate-400">{columnOrders.length}</span>
              </div>
              <div className="space-y-2">
                {columnOrders.map((o) => (
                  <div key={o.id} className="card space-y-2 p-3">
                    <div className="flex items-center justify-between">
                      <Link to={`/sales/${o.sale_id}`} className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">{o.order_number}</Link>
                      {isOverdue(o.expected_date, o.status) && <AlertTriangle size={14} className="text-red-500" />}
                    </div>
                    <div className="text-xs text-slate-500">{o.customers ? `${o.customers.first_name} ${o.customers.last_name}` : '—'}</div>
                    {o.expected_date && (
                      <div className={`text-xs ${isOverdue(o.expected_date, o.status) ? 'font-medium text-red-600' : 'text-slate-400'}`}>
                        Prévue le {formatDate(o.expected_date)}
                      </div>
                    )}
                    {NEXT_STATUS[o.status] && (
                      <button onClick={() => advance(o.id, o.status)} className="btn-secondary w-full text-xs">
                        → {COLUMNS.find((c) => c.key === NEXT_STATUS[o.status])?.label}
                      </button>
                    )}
                  </div>
                ))}
                {columnOrders.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-stone-800">Vide</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
