import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/format'
import { PrescriptionFormModal } from '@/components/prescriptions/PrescriptionFormModal'
import type { Customer } from '@/types/database'

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
  const [pickerOpen, setPickerOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const { data, isLoading, refetch } = useQuery({
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

  useEffect(() => {
    if (!customerSearch.trim()) { setCustomerResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .or(`first_name.ilike.%${customerSearch}%,last_name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`)
        .limit(6)
      setCustomerResults(data ?? [])
    }, 250)
    return () => clearTimeout(t)
  }, [customerSearch])

  const closePicker = () => {
    setPickerOpen(false)
    setCustomerSearch('')
    setCustomerResults([])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Ordonnances</h1>
        <button onClick={() => setPickerOpen(true)} className="btn-primary"><Plus size={16} /> Nouvelle ordonnance</button>
      </div>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Client, médecin…" className="input pl-9" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-stone-800">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Médecin</th>
              <th className="px-4 py-3">OD Sph.</th>
              <th className="px-4 py-3">OG Sph.</th>
              <th className="px-4 py-3">Validité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-stone-800">
            {(data ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-sand-50 dark:hover:bg-stone-800/50">
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

      {pickerOpen && !selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Pour quel client ?</h3>
              <button onClick={closePicker} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                className="input pl-9"
                placeholder="Rechercher un client…"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
            {customerResults.length > 0 && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-sand-200 dark:border-stone-700">
                {customerResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-sand-50 dark:hover:bg-stone-700"
                  >
                    <span>{c.first_name} {c.last_name}</span>
                    <span className="text-xs text-slate-400">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCustomer && (
        <PrescriptionFormModal
          open={true}
          customerId={selectedCustomer.id}
          onClose={() => { setSelectedCustomer(null); closePicker() }}
          onSaved={() => { setSelectedCustomer(null); closePicker(); refetch() }}
        />
      )}
    </div>
  )
}
