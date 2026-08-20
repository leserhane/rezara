import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/format'
import type { DocumentStatus } from '@/types/database'

const STATUS_LABELS: Record<DocumentStatus, string> = {
  brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté',
  refuse: 'Refusé', expire: 'Expiré', transforme: 'Transformé en vente',
}

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: quote, refetch } = useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('quotes').select('*, customers(first_name, last_name, phone, customer_number)').eq('id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: items } = useQuery({
    queryKey: ['quote-items', id],
    queryFn: async () => (await supabase.from('quote_items').select('*').eq('quote_id', id!)).data ?? [],
    enabled: !!id,
  })

  if (!quote) return <p className="text-slate-400">Chargement…</p>

  const subtotalTtc = (items ?? []).reduce((sum, it) => sum + it.line_total_ttc, 0)

  const setStatus = async (status: DocumentStatus) => {
    await supabase.from('quotes').update({ status }).eq('id', quote.id)
    refetch()
  }

  const convert = async () => {
    setConverting(true)
    setError(null)
    const { data, error } = await supabase.rpc('convert_quote_to_sale', { p_quote_id: quote.id })
    setConverting(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate(`/sales/${data.id}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{quote.quote_number}</h1>
          <p className="text-sm text-slate-400">{formatDate(quote.created_at)} · {STATUS_LABELS[quote.status]}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quote.status === 'brouillon' && <button onClick={() => setStatus('envoye')} className="btn-secondary">Marquer envoyé</button>}
          {(quote.status === 'brouillon' || quote.status === 'envoye') && (
            <>
              <button onClick={() => setStatus('accepte')} className="btn-secondary">Accepter</button>
              <button onClick={() => setStatus('refuse')} className="btn-secondary">Refuser</button>
            </>
          )}
          {quote.status !== 'transforme' && quote.status !== 'refuse' && quote.status !== 'expire' && (
            <button onClick={convert} disabled={converting} className="btn-primary">
              {converting ? 'Conversion…' : 'Transformer en vente'}
            </button>
          )}
          {quote.status === 'transforme' && quote.converted_sale_id && (
            <Link to={`/sales/${quote.converted_sale_id}`} className="btn-primary">Voir la vente</Link>
          )}
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {quote.customers && (
        <div className="card p-4">
          <div className="text-xs text-slate-400">Client</div>
          <Link to={`/clients/${quote.customer_id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
            {quote.customers.first_name} {quote.customers.last_name}
          </Link>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sand-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr><th className="px-4 py-3">Article</th><th className="px-4 py-3 text-right">Qté</th><th className="px-4 py-3 text-right">PU TTC</th><th className="px-4 py-3 text-right">Remise</th><th className="px-4 py-3 text-right">Total TTC</th></tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-slate-800">
            {(items ?? []).map((it) => (
              <tr key={it.id}>
                <td className="px-4 py-3">{it.description}</td>
                <td className="px-4 py-3 text-right">{it.quantity}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(it.unit_price_ht * (1 + it.tax_rate / 100))}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(it.discount_amount * (1 + it.tax_rate / 100))}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(it.line_total_ttc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card ml-auto max-w-xs space-y-1 p-4 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Sous-total TTC</span><span>{formatCurrency(subtotalTtc)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Remise</span><span>- {formatCurrency(subtotalTtc - quote.total_ttc)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">TVA</span><span>{formatCurrency(quote.tax_amount)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold dark:border-slate-800"><span>Total TTC</span><span>{formatCurrency(quote.total_ttc)}</span></div>
      </div>
    </div>
  )
}
