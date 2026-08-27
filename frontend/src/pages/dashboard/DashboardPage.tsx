import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { StatCard } from '@/components/ui/StatCard'
import { formatCurrency } from '@/lib/format'
import {
  Wallet, ShoppingCart, TrendingUp, Percent, PackageX, Users, AlertTriangle,
  Wrench, CreditCard, CalendarClock, Banknote,
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Link } from 'react-router-dom'

type Period = 'today' | 'week' | 'month' | 'year'

function periodStart(period: Period): string {
  const now = new Date()
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  if (period === 'week') {
    const day = now.getDay() === 0 ? 7 : now.getDay()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1).toISOString()
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  return new Date(now.getFullYear(), 0, 1).toISOString()
}

export function DashboardPage() {
  const { profile, isAdmin } = useAuth()
  const [period, setPeriod] = useState<Period>('today')
  const since = useMemo(() => periodStart(period), [period])

  const salesQuery = useQuery({
    queryKey: ['dashboard-sales', since, isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_sales')
        .select('id, total_ttc, margin_amount, status, amount_due, created_at, optician_id')
        .gte('created_at', since)
        .neq('status', 'annule')
      if (error) throw error
      return data
    },
  })

  const lowStockQuery = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_low_stock_products').select('id, name, quantity, stock_min').limit(8)
      if (error) throw error
      return data
    },
  })

  const newClientsQuery = useQuery({
    queryKey: ['dashboard-new-clients', since],
    queryFn: async () => {
      const { count } = await supabase.from('customers').select('id', { count: 'exact', head: true }).gte('created_at', since)
      return count ?? 0
    },
  })

  const openRegisterQuery = useQuery({
    queryKey: ['dashboard-open-register', profile?.store_id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase.from('cash_registers').select('*').eq('status', 'ouverte').maybeSingle()
      return data
    },
  })

  const ordersQuery = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('id, order_number, status, expected_date, customer_id').neq('status', 'livree').neq('status', 'annulee')
      if (error) throw error
      return data
    },
  })

  const creditsOverdueQuery = useQuery({
    queryKey: ['dashboard-credits-overdue'],
    queryFn: async () => {
      const { data, error } = await supabase.from('credits').select('id, balance, due_date, customer_id').neq('status', 'solde').lt('due_date', new Date().toISOString().slice(0, 10))
      if (error) throw error
      return data
    },
  })

  const chequesDueSoonQuery = useQuery({
    queryKey: ['dashboard-cheques-due-soon'],
    queryFn: async () => {
      const inSevenDays = new Date(); inSevenDays.setDate(inSevenDays.getDate() + 7)
      const { data, error } = await supabase
        .from('cheques')
        .select('id, sale_id, amount, due_date, cheque_number, customers(first_name, last_name)')
        .eq('status', 'en_attente')
        .lte('due_date', inSevenDays.toISOString().slice(0, 10))
        .order('due_date')
      if (error) throw error
      return data
    },
  })

  const appointmentsTodayQuery = useQuery({
    queryKey: ['dashboard-appointments-today'],
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0)
      const end = new Date(); end.setHours(23, 59, 59, 999)
      const { data, error } = await supabase
        .from('appointments')
        .select('id, scheduled_at, reason, status, customers(first_name, last_name)')
        .gte('scheduled_at', start.toISOString())
        .lte('scheduled_at', end.toISOString())
        .neq('status', 'annule')
        .order('scheduled_at')
      if (error) throw error
      return data as (typeof data[number] & { customers: { first_name: string; last_name: string } | null })[]
    },
  })

  const sales = salesQuery.data ?? []
  const totalTtc = sales.reduce((sum, s) => sum + s.total_ttc, 0)
  const totalMargin = sales.reduce((sum, s) => sum + (s.margin_amount ?? 0), 0)
  const salesCount = sales.length
  const avgBasket = salesCount > 0 ? totalTtc / salesCount : 0
  const marginPercent = totalTtc > 0 ? (totalMargin / totalTtc) * 100 : 0
  const totalDue = sales.reduce((sum, s) => sum + s.amount_due, 0)
  const myTodaySales = sales.filter((s) => s.optician_id === profile?.id)
  const ordersInProgress = ordersQuery.data ?? []
  const ordersReady = ordersInProgress.filter((o) => o.status === 'prete' || o.status === 'client_informe')
  const creditsOverdue = creditsOverdueQuery.data ?? []
  const appointmentsToday = appointmentsTodayQuery.data ?? []
  const chequesDueSoon = chequesDueSoonQuery.data ?? []
  const today = new Date().toISOString().slice(0, 10)
  const chequesOverdue = chequesDueSoon.filter((c) => c.due_date < today)

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: "Aujourd'hui" },
    { key: 'week', label: 'Cette semaine' },
    { key: 'month', label: 'Ce mois' },
    { key: 'year', label: 'Cette année' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Bonjour, {profile?.first_name} 👋
          </h1>
          <p className="text-sm text-slate-500">Voici l'activité du magasin.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-stone-800 dark:bg-stone-900">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                period === p.key ? 'bg-brand-700 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-stone-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!openRegisterQuery.isLoading && !openRegisterQuery.data && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertTriangle size={18} />
          Aucune caisse n'est ouverte.
          <Link to="/cash-register" className="ml-auto font-medium underline">Ouvrir la caisse</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Chiffre d'affaires" value={formatCurrency(totalTtc)} icon={TrendingUp} accent="positive" />
        <StatCard label="Nombre de ventes" value={String(salesCount)} icon={ShoppingCart} />
        <StatCard label="Panier moyen" value={formatCurrency(avgBasket)} icon={Wallet} />
        {isAdmin ? (
          <StatCard label="Marge brute" value={`${formatCurrency(totalMargin)} (${marginPercent.toFixed(1)}%)`} icon={Percent} accent="positive" />
        ) : (
          <StatCard label="Mes ventes" value={String(myTodaySales.length)} icon={ShoppingCart} />
        )}
        <StatCard label="Créances clients" value={formatCurrency(totalDue)} icon={Wallet} accent="warning" />
        <StatCard label="Nouveaux clients" value={String(newClientsQuery.data ?? 0)} icon={Users} />
        <StatCard label="Produits en stock faible" value={String(lowStockQuery.data?.length ?? 0)} icon={PackageX} accent={lowStockQuery.data?.length ? 'negative' : 'default'} />
        <StatCard
          label="Caisse"
          value={openRegisterQuery.data ? 'Ouverte' : 'Fermée'}
          icon={Wallet}
          accent={openRegisterQuery.data ? 'positive' : 'negative'}
        />
        <StatCard label="Commandes en cours" value={String(ordersInProgress.length)} icon={Wrench} />
        <StatCard label="Commandes prêtes" value={String(ordersReady.length)} icon={Wrench} accent={ordersReady.length ? 'positive' : 'default'} />
        <StatCard label="Crédits en retard" value={String(creditsOverdue.length)} icon={CreditCard} accent={creditsOverdue.length ? 'negative' : 'default'} />
        <StatCard
          label="Chèques à échéance (7j)" value={String(chequesDueSoon.length)} icon={Banknote}
          accent={chequesOverdue.length ? 'negative' : chequesDueSoon.length ? 'warning' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Ventes récentes</h2>
          <div className="space-y-1">
            {sales.slice(0, 8).map((s) => (
              <Link key={s.id} to={`/sales/${s.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-sand-50 dark:hover:bg-stone-800">
                <span className="text-slate-500">{new Date(s.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(s.total_ttc)}</span>
                <StatusBadge status={s.status} />
              </Link>
            ))}
            {sales.length === 0 && <p className="px-2 py-4 text-center text-sm text-slate-400">Aucune vente sur cette période.</p>}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Stock faible</h2>
          <div className="space-y-1">
            {(lowStockQuery.data ?? []).map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-sand-50 dark:hover:bg-stone-800">
                <span className="text-slate-700 dark:text-stone-200">{p.name}</span>
                <span className="text-red-600 dark:text-red-400">{p.quantity} / min {p.stock_min}</span>
              </Link>
            ))}
            {(lowStockQuery.data ?? []).length === 0 && <p className="px-2 py-4 text-center text-sm text-slate-400">Aucune alerte de stock.</p>}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><CalendarClock size={16} /> Rendez-vous du jour</h2>
          <div className="space-y-1">
            {appointmentsToday.map((a) => (
              <Link key={a.id} to="/appointments" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-sand-50 dark:hover:bg-stone-800">
                <span className="text-slate-500">{new Date(a.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-slate-700 dark:text-stone-200">{a.customers ? `${a.customers.first_name} ${a.customers.last_name}` : '—'}</span>
                <span className="text-xs text-slate-400">{a.reason ?? ''}</span>
              </Link>
            ))}
            {appointmentsToday.length === 0 && <p className="px-2 py-4 text-center text-sm text-slate-400">Aucun rendez-vous aujourd'hui.</p>}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><Wrench size={16} /> Commandes atelier en cours</h2>
          <div className="space-y-1">
            {ordersInProgress.slice(0, 8).map((o) => (
              <Link key={o.id} to="/orders" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-sand-50 dark:hover:bg-stone-800">
                <span className="font-medium text-slate-700 dark:text-stone-200">{o.order_number}</span>
                <StatusBadge status={o.status} />
              </Link>
            ))}
            {ordersInProgress.length === 0 && <p className="px-2 py-4 text-center text-sm text-slate-400">Aucune commande en cours.</p>}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><Banknote size={16} /> Chèques à échéance</h2>
          <div className="space-y-1">
            {chequesDueSoon.slice(0, 8).map((c) => (
              <Link key={c.id} to={`/sales/${c.sale_id}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-sand-50 dark:hover:bg-stone-800">
                <span className={c.due_date < today ? 'font-medium text-red-600 dark:text-red-400' : 'text-slate-500'}>
                  {new Date(c.due_date).toLocaleDateString('fr-FR')}
                </span>
                <span className="text-slate-700 dark:text-stone-200">
                  {c.customers ? `${c.customers.first_name} ${c.customers.last_name}` : '—'}
                </span>
                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(c.amount)}</span>
              </Link>
            ))}
            {chequesDueSoon.length === 0 && <p className="px-2 py-4 text-center text-sm text-slate-400">Aucun chèque à échéance sous 7 jours.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
