import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/format'

interface Row {
  id: string
  customer_id: string
  prescription_date: string
  doctor_name: string | null
  valid_until: string | null
  od_sphere: number | null
  og_sphere: number | null
  customers: { first_name: string; last_name: string; customer_number: string } | null
}

export function PrescriptionsListPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['all-prescriptions', search],
    queryFn: async () => {
      let query = supabase
        .from('prescriptions')
        .select('id, customer_id, prescription_date, doctor_name, valid_until, od_sphere, og_sphere, customers(first_name, last_name, customer_number)')
        .order('prescription_date', { ascending: false })
        .limit(100)
      const { data, error } = await query
      if (error) throw error
      let rows = (data ?? []) as unknown as Row[]
      if (search.trim()) {
        const q = search.toLowerCase()
        rows = rows.filter((r) =>
          `${r.customers?.first_name} ${r.customers?.last_name} ${r.customers?.customer_number} ${r.doctor_name ?? ''}`
            .toLowerCase()
            .includes(q)
        )
      }
      return rows
    },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Ordonnances</h1>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Client, médecin…" className="input pl-9" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Médecin</th>
              <th className="px-4 py-3">OD Sph.</th>
              <th className="px-4 py-3">OG Sph.</th>
              <th className="px-4 py-3">Validité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(data ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <Link to={`/clients/${p.customer_id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
                    {p.customers?.first_name} {p.customers?.last_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(p.prescription_date)}</td>
                <td className="px-4 py-3 text-slate-500">{p.doctor_name ?? '—'}</td>
                <td className="px-4 py-3">{p.od_sphere ?? '—'}</td>
                <td className="px-4 py-3">{p.og_sphere ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(p.valid_until)}</td>
              </tr>
            ))}
            {!isLoading && (data ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucune ordonnance.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
