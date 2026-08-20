import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/format'
import type { Customer, ProductWithVisibility } from '@/types/database'

interface CartLine {
  key: string
  product: ProductWithVisibility
  quantity: number
  discount_ttc: number
}

export function NewQuotePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const preselectedCustomer = params.get('customer')

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<ProductWithVisibility[]>([])
  const [cartDiscount, setCartDiscount] = useState('0')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (preselectedCustomer) {
      supabase.from('customers').select('*').eq('id', preselectedCustomer).single().then(({ data }) => data && setCustomer(data))
    }
  }, [preselectedCustomer])

  useEffect(() => {
    if (!customerSearch.trim()) { setCustomerResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('customers').select('*')
        .or(`first_name.ilike.%${customerSearch}%,last_name.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`)
        .limit(6)
      setCustomerResults(data ?? [])
    }, 250)
    return () => clearTimeout(t)
  }, [customerSearch])

  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('v_products').select('*').or(`name.ilike.%${productSearch}%,sku.ilike.%${productSearch}%`).eq('is_active', true).limit(8)
      setProductResults(data ?? [])
    }, 250)
    return () => clearTimeout(t)
  }, [productSearch])

  const addToCart = (product: ProductWithVisibility) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.product.id === product.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 }
        return copy
      }
      return [...prev, { key: crypto.randomUUID(), product, quantity: 1, discount_ttc: 0 }]
    })
    setProductSearch('')
    setProductResults([])
  }
  const updateLine = (key: string, patch: Partial<CartLine>) => setCart((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const removeLine = (key: string) => setCart((prev) => prev.filter((l) => l.key !== key))

  // Discounts are entered by staff in TTC (what the customer sees taken
  // off). quote_items.discount_amount is HT by schema, so every TTC amount
  // typed here is converted to its HT equivalent before it's inserted or
  // sent to update_quote_discount — that HT amount, taxed back, lands on
  // exactly the TTC reduction that was typed.
  const totals = useMemo(() => {
    const lines = cart.map((l) => {
      const discountHt = l.discount_ttc / (1 + l.product.tax_rate / 100)
      const lineHt = l.product.sale_price_ht * l.quantity - discountHt
      return { discountHt, lineHt, tax: lineHt * (l.product.tax_rate / 100) }
    })
    const subtotalHt = lines.reduce((sum, x) => sum + x.lineHt, 0)
    const itemsTax = lines.reduce((sum, x) => sum + x.tax, 0)
    const subtotalTtc = subtotalHt + itemsTax
    const cartDiscountTtc = Number(cartDiscount) || 0
    const avgTaxRate = subtotalHt > 0 ? itemsTax / subtotalHt : 0
    const cartDiscountHt = cartDiscountTtc / (1 + avgTaxRate)
    const totalHt = subtotalHt - cartDiscountHt
    const ratio = subtotalHt > 0 ? Math.max(subtotalHt - cartDiscountHt, 0) / subtotalHt : 1
    const taxAmount = itemsTax * ratio
    return { lines, subtotalHt, subtotalTtc, totalHt, totalTtc: totalHt + taxAmount, cartDiscountHt }
  }, [cart, cartDiscount])

  const submit = async () => {
    if (!customer || !profile || cart.length === 0) return
    setSubmitting(true)
    setError(null)

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        store_id: profile.store_id, customer_id: customer.id, optician_id: profile.id,
        status: 'brouillon', valid_until: validUntil || null, notes: notes || null,
      })
      .select()
      .single()

    if (quoteError || !quote) {
      setSubmitting(false)
      setError(quoteError?.message ?? 'Erreur lors de la création du devis.')
      return
    }

    const { error: itemsError } = await supabase.from('quote_items').insert(
      cart.map((l, idx) => ({
        quote_id: quote.id,
        product_id: l.product.id,
        item_role: l.product.type,
        quantity: l.quantity,
        unit_price_ht: l.product.sale_price_ht,
        discount_amount: totals.lines[idx].discountHt,
        tax_rate: l.product.tax_rate,
      }))
    )

    if (itemsError) {
      setSubmitting(false)
      setError(itemsError.message)
      return
    }

    if (Number(cartDiscount) > 0) {
      await supabase.rpc('update_quote_discount', { p_quote_id: quote.id, p_discount_amount: totals.cartDiscountHt })
    }

    setSubmitting(false)
    navigate(`/quotes/${quote.id}`)
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Nouveau devis</h1>

        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold">Client</h2>
          {customer ? (
            <div className="flex items-center justify-between rounded-lg bg-sand-50 px-3 py-2 dark:bg-slate-800">
              <div>
                <div className="font-medium">{customer.first_name} {customer.last_name}</div>
                <div className="text-xs text-slate-400">{customer.customer_number}</div>
              </div>
              <button onClick={() => setCustomer(null)} className="text-xs text-red-600">Changer</button>
            </div>
          ) : (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" placeholder="Rechercher un client…" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
              {customerResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  {customerResults.map((c) => (
                    <button key={c.id} onClick={() => { setCustomer(c); setCustomerSearch(''); setCustomerResults([]) }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-sand-50 dark:hover:bg-slate-700">
                      <span>{c.first_name} {c.last_name}</span>
                      <span className="text-xs text-slate-400">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold">Articles</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Rechercher un produit à ajouter…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
            {productResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {productResults.map((p) => (
                  <button key={p.id} onClick={() => addToCart(p)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-sand-50 dark:hover:bg-slate-700">
                    <span>{p.name}</span>
                    <span className="text-xs text-slate-500">{formatCurrency(p.sale_price_ttc)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {cart.map((l) => (
              <div key={l.key} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
                <div className="min-w-[140px] flex-1 text-sm font-medium">{l.product.name}</div>
                <input type="number" min={1} value={l.quantity} onChange={(e) => updateLine(l.key, { quantity: Number(e.target.value) || 1 })} className="input w-16 text-center" />
                <input type="number" min={0} placeholder="Remise TTC" value={l.discount_ttc || ''} onChange={(e) => updateLine(l.key, { discount_ttc: Number(e.target.value) || 0 })} className="input w-24" />
                <div className="w-24 text-right text-sm font-medium">{formatCurrency(l.product.sale_price_ttc * l.quantity - l.discount_ttc)}</div>
                <button onClick={() => removeLine(l.key)} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            ))}
            {cart.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Aucun article ajouté.</p>}
          </div>
        </div>

        <div className="card space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div><label className="label">Remise panier (MAD TTC)</label><input type="number" min={0} className="input" value={cartDiscount} onChange={(e) => setCartDiscount(e.target.value)} /></div>
            <div><label className="label">Valide jusqu'au</label><input type="date" className="input" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="card sticky top-4 space-y-3 p-4">
          <h2 className="text-sm font-semibold">Récapitulatif</h2>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Sous-total TTC</span><span>{formatCurrency(totals.subtotalTtc)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Remise</span><span>- {formatCurrency(Number(cartDiscount) || 0)}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-semibold dark:border-slate-800"><span>TOTAL TTC</span><span>{formatCurrency(totals.totalTtc)}</span></div>
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <button onClick={submit} disabled={!customer || cart.length === 0 || submitting} className="btn-primary w-full">
            {submitting ? 'Création…' : 'Créer le devis'}
          </button>
        </div>
      </div>
    </div>
  )
}
