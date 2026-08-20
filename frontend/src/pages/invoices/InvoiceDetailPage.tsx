import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/format'

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: invoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*, customers(first_name, last_name, phone, address, customer_number)').eq('id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: items } = useQuery({
    queryKey: ['invoice-items', id],
    queryFn: async () => (await supabase.from('invoice_items').select('*').eq('invoice_id', id!)).data ?? [],
    enabled: !!id,
  })

  const { data: store } = useQuery({
    queryKey: ['store'],
    queryFn: async () => (await supabase.from('stores').select('*').limit(1).single()).data,
  })

  if (!invoice) return <p className="text-slate-400">Chargement…</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Facture {invoice.invoice_number}</h1>
        <button onClick={() => window.print()} className="btn-primary"><Printer size={16} /> Imprimer / PDF</button>
      </div>

      <div id="invoice-print" className="card mx-auto max-w-2xl p-8 print:border-0 print:shadow-none">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold text-brand-700">{store?.name ?? 'Optimum Optic'}</div>
            <div className="text-xs text-slate-500">{store?.address}</div>
            <div className="text-xs text-slate-500">{store?.phone} {store?.email && `· ${store.email}`}</div>
            {store?.ice && <div className="text-xs text-slate-500">ICE : {store.ice}</div>}
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold uppercase text-slate-400">Facture</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{invoice.invoice_number}</div>
            <div className="text-xs text-slate-500">{formatDate(invoice.issued_at)}</div>
          </div>
        </div>

        {invoice.customers && (
          <div className="mb-6 rounded-lg bg-sand-50 p-3 text-sm dark:bg-slate-800">
            <div className="font-medium">{invoice.customers.first_name} {invoice.customers.last_name}</div>
            <div className="text-xs text-slate-500">{invoice.customers.customer_number}</div>
            {invoice.customers.phone && <div className="text-xs text-slate-500">{invoice.customers.phone}</div>}
            {invoice.customers.address && <div className="text-xs text-slate-500">{invoice.customers.address}</div>}
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="border-b border-slate-300 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Désignation</th>
              <th className="py-2 text-right">Qté</th>
              <th className="py-2 text-right">PU HT</th>
              <th className="py-2 text-right">TVA</th>
              <th className="py-2 text-right">Total TTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {(items ?? []).map((it) => (
              <tr key={it.id}>
                <td className="py-2">{it.description}</td>
                <td className="py-2 text-right">{it.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(it.unit_price_ht)}</td>
                <td className="py-2 text-right">{it.tax_rate}%</td>
                <td className="py-2 text-right">{formatCurrency(it.line_total_ttc)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Total HT</span><span>{formatCurrency(invoice.total_ht)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">TVA</span><span>{formatCurrency(invoice.tax_amount)}</span></div>
          <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-semibold"><span>Total TTC</span><span>{formatCurrency(invoice.total_ttc)}</span></div>
          <div className="flex justify-between text-emerald-700"><span>Payé</span><span>{formatCurrency(invoice.amount_paid)}</span></div>
          <div className="flex justify-between font-semibold text-red-600"><span>Restant dû</span><span>{formatCurrency(invoice.amount_due)}</span></div>
        </div>
      </div>
    </div>
  )
}
