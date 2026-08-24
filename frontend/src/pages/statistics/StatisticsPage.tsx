import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/format'
import { StatCard } from '@/components/ui/StatCard'
import { TrendingUp, ShoppingCart, Percent, Users } from 'lucide-react'

const COLOR_CA = '#2a78d6'
const COLOR_MARGE = '#eb6834'

type Period = '30' | '90' | '365'

export function StatisticsPage() {
  const { isAdmin } = useAuth()
  const [period, setPeriod] = useState<Period>('30')
  const days = Number(period)
  const since = useMemo(() => new Date(Date.now() - days * 86400000).toISOString(), [days])

  const { data: sales } = useQuery({
    queryKey: ['stats-sales', since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_sales')
        .select('id, total_ttc, margin_amount, status, optician_id, created_at')
        .gte('created_at', since)
        .neq('status', 'annule')
      if (error) throw error
      return data
    },
  })

  const { data: saleItems } = useQuery({
    queryKey: ['stats-sale-items', since],
    queryFn: async () => {
      const saleIds = (sales ?? []).map((s) => s.id)
      if (saleIds.length === 0) return []
      const { data, error } = await supabase.from('sale_items').select('product_id, description, quantity, line_total_ht').in('sale_id', saleIds)
      if (error) throw error
      return data
    },
    enabled: !!sales,
  })

  const { data: profiles } = useQuery({
    queryKey: ['stats-profiles'],
    queryFn: async () => (await supabase.from('profiles').select('id, first_name, last_name')).data ?? [],
  })

  const { data: customerStats } = useQuery({
    queryKey: ['stats-customers'],
    queryFn: async () => (await supabase.from('v_customer_stats').select('*')).data ?? [],
  })

  const dailySeries = useMemo(() => {
    const byDay = new Map<string, { date: string; ca: number; marge: number }>()
    for (const s of sales ?? []) {
      const day = s.created_at.slice(0, 10)
      const entry = byDay.get(day) ?? { date: day, ca: 0, marge: 0 }
      entry.ca += s.total_ttc
      entry.marge += s.margin_amount ?? 0
      byDay.set(day, entry)
    }
    return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [sales])

  const topProducts = useMemo(() => {
    const byProduct = new Map<string, { name: string; total: number; quantity: number }>()
    for (const it of saleItems ?? []) {
      const key = it.product_id ?? it.description ?? 'Autre'
      const entry = byProduct.get(key) ?? { name: it.description ?? 'Autre', total: 0, quantity: 0 }
      entry.total += it.line_total_ht
      entry.quantity += it.quantity
      byProduct.set(key, entry)
    }
    return Array.from(byProduct.values()).sort((a, b) => b.total - a.total).slice(0, 8)
  }, [saleItems])

  const byOptician = useMemo(() => {
    const map = new Map<string, { name: string; ca: number; count: number }>()
    for (const s of sales ?? []) {
      const p = (profiles ?? []).find((pr) => pr.id === s.optician_id)
      const name = p ? `${p.first_name} ${p.last_name}` : 'Inconnu'
      const entry = map.get(s.optician_id) ?? { name, ca: 0, count: 0 }
      entry.ca += s.total_ttc
      entry.count += 1
      map.set(s.optician_id, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.ca - a.ca)
  }, [sales, profiles])

  const totalCa = (sales ?? []).reduce((sum, s) => sum + s.total_ttc, 0)
  const totalMargin = (sales ?? []).reduce((sum, s) => sum + (s.margin_amount ?? 0), 0)
  const avgBasket = sales && sales.length > 0 ? totalCa / sales.length : 0
  const activeClients = (customerStats ?? []).filter((c) => c.purchase_count > 0).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Statistiques</h1>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-stone-800 dark:bg-stone-900">
          {(['30', '90', '365'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${period === p ? 'bg-brand-700 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-stone-800'}`}
            >
              {p === '30' ? '30 jours' : p === '90' ? '90 jours' : '12 mois'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Chiffre d'affaires" value={formatCurrency(totalCa)} icon={TrendingUp} accent="positive" />
        <StatCard label="Nombre de ventes" value={String(sales?.length ?? 0)} icon={ShoppingCart} />
        <StatCard label="Panier moyen" value={formatCurrency(avgBasket)} icon={ShoppingCart} />
        {isAdmin ? (
          <StatCard label="Marge totale" value={`${formatCurrency(totalMargin)} (${totalCa > 0 ? ((totalMargin / totalCa) * 100).toFixed(1) : 0}%)`} icon={Percent} accent="positive" />
        ) : (
          <StatCard label="Clients actifs" value={String(activeClients)} icon={Users} />
        )}
      </div>

      <div className="card p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Évolution du chiffre d'affaires {isAdmin && 'et de la marge'}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dailySeries} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-stone-800" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="ca" name="Chiffre d'affaires" stroke={COLOR_CA} strokeWidth={2} dot={false} />
            {isAdmin && <Line type="monotone" dataKey="marge" name="Marge" stroke={COLOR_MARGE} strokeWidth={2} dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Produits les plus vendus (CA HT)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-stone-800" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={140} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="total" name="CA HT" fill={COLOR_CA} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Performance par opticien</h2>
          <div className="space-y-3">
            {byOptician.map((o) => (
              <div key={o.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-stone-200">{o.name}</span>
                  <span className="text-slate-500">{formatCurrency(o.ca)} · {o.count} ventes</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-stone-800">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${byOptician[0] ? (o.ca / byOptician[0].ca) * 100 : 0}%`, backgroundColor: COLOR_CA }}
                  />
                </div>
              </div>
            ))}
            {byOptician.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucune donnée sur cette période.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
