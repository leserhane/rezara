import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Trash2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/format'
import type { Customer, Prescription, ProductWithVisibility, PaymentMethod } from '@/types/database'

interface CartLine {
  key: string
  product: ProductWithVisibility
  quantity: number
  discount_ttc: number
}

export function NewSalePage() {
  const { profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const preselectedCustomer = params.get('customer')

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [prescriptionId, setPrescriptionId] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<ProductWithVisibility[]>([])
  const [cartDiscount, setCartDiscount] = useState('0')
  const [depositAmount, setDepositAmount] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [openRegisterId, setOpenRegisterId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authModal, setAuthModal] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [authorizedBy, setAuthorizedBy] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => (await supabase.from('payment_methods').select('*').eq('is_active', true)).data as PaymentMethod[],
  })

  const { data: prescriptions } = useQuery({
    queryKey: ['customer-prescriptions', customer?.id],
    queryFn: async () => (await supabase.from('prescriptions').select('*').eq('customer_id', customer!.id).order('prescription_date', { ascending: false })).data as Prescription[],
    enabled: !!customer,
  })

  useEffect(() => {
    supabase.from('cash_registers').select('id').eq('status', 'ouverte').maybeSingle().then(({ data }) => setOpenRegisterId(data?.id ?? null))
  }, [])

  useEffect(() => {
    if (preselectedCustomer) {
      supabase.from('customers').select('*').eq('id', preselectedCustomer).single().then(({ data }) => data && setCustomer(data))
    }
  }, [preselectedCustomer])

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

  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('v_products')
        .select('*')
        .or(`name.ilike.%${productSearch}%,sku.ilike.%${productSearch}%,barcode.ilike.%${productSearch}%`)
        .eq('is_active', true)
        .gt('quantity', 0)
        .limit(8)
      setProductResults(data ?? [])
    }, 250)
    return () => clearTimeout(t)
  }, [productSearch])

  const addToCart = (product: ProductWithVisibility) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((l) => l.product.id === product.id)
      if (existingIdx >= 0) {
        const copy = [...prev]
        copy[existingIdx] = { ...copy[existingIdx], quantity: copy[existingIdx].quantity + 1 }
        return copy
      }
      return [...prev, { key: crypto.randomUUID(), product, quantity: 1, discount_ttc: 0 }]
    })
    setProductSearch('')
    setProductResults([])
  }

  const updateLine = (key: string, patch: Partial<CartLine>) => {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }
  const removeLine = (key: string) => setCart((prev) => prev.filter((l) => l.key !== key))

  // Discounts are entered by staff in TTC (what the customer actually sees
  // taken off their bill). The server's discount_amount columns are HT by
  // schema (line_total_ht = unit_price_ht*qty - discount_amount), so every
  // TTC amount entered here is converted to its HT equivalent before it's
  // ever sent to create_sale — that HT amount, added back with tax, lands
  // on exactly the TTC reduction the staff typed.
  const totals = useMemo(() => {
    const lines = cart.map((l) => {
      const discountHt = l.discount_ttc / (1 + l.product.tax_rate / 100)
      const lineHt = l.product.sale_price_ht * l.quantity - discountHt
      return { discountHt, lineHt, tax: lineHt * (l.product.tax_rate / 100), cost: (l.product.purchase_price_ht ?? 0) * l.quantity }
    })
    const subtotalHt = lines.reduce((sum, x) => sum + x.lineHt, 0)
    const itemsTax = lines.reduce((sum, x) => sum + x.tax, 0)
    const subtotalTtc = subtotalHt + itemsTax
    const cartDiscountTtc = Number(cartDiscount) || 0
    const avgTaxRate = subtotalHt > 0 ? itemsTax / subtotalHt : 0
    const cartDiscountHt = cartDiscountTtc / (1 + avgTaxRate)
    const ratio = subtotalHt > 0 ? (subtotalHt - cartDiscountHt) / subtotalHt : 1
    const totalHt = subtotalHt - cartDiscountHt
    const taxAmount = itemsTax * ratio
    const totalTtc = totalHt + taxAmount
    const costTotal = lines.reduce((sum, x) => sum + x.cost, 0)
    const marginAmount = totalHt - costTotal
    const discountPercent = subtotalHt > 0 ? (cartDiscountHt / subtotalHt) * 100 : 0
    return { lines, subtotalHt, subtotalTtc, taxAmount, totalHt, totalTtc, costTotal, marginAmount, discountPercent, cartDiscountHt }
  }, [cart, cartDiscount])

  const deposit = Number(depositAmount) || 0
  const balance = totals.totalTtc - deposit
  const exceedsLimit = profile && !isAdmin && totals.discountPercent > profile.max_discount_percent

  const doAuthorize = async () => {
    setAuthError(null)
    const { data, error } = await supabase.rpc('authorize_discount_override', { p_admin_email: adminEmail, p_admin_password: adminPassword })
    if (error) {
      setAuthError('Identifiants administrateur invalides.')
      return
    }
    setAuthorizedBy(data as string)
    setAuthModal(false)
  }

  const confirmSale = async () => {
    if (!customer || cart.length === 0) return
    if (exceedsLimit && !authorizedBy) {
      setAuthModal(true)
      return
    }
    setSubmitting(true)
    setError(null)

    const { data, error } = await supabase.rpc('create_sale', {
      p_customer_id: customer.id,
      p_items: cart.map((l, idx) => ({
        product_id: l.product.id,
        item_role: l.product.type,
        quantity: l.quantity,
        discount_amount: totals.lines[idx].discountHt,
      })),
      p_prescription_id: prescriptionId || null,
      p_cart_discount_amount: totals.cartDiscountHt,
      p_deposit_amount: deposit > 0 ? deposit : 0,
      p_payment_method_id: deposit > 0 ? paymentMethodId || null : null,
      p_cash_register_id: openRegisterId,
      p_discount_authorized_by: authorizedBy,
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate(`/sales/${data.id}`)
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Nouvelle vente</h1>

        {!openRegisterId && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertTriangle size={16} /> Aucune caisse ouverte : la vente pourra être créée mais aucun acompte ne pourra être encaissé en caisse.
          </div>
        )}

        {/* Customer */}
        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold">1. Client</h2>
          {customer ? (
            <div className="flex items-center justify-between rounded-lg bg-sand-50 px-3 py-2 dark:bg-slate-800">
              <div>
                <div className="font-medium">{customer.first_name} {customer.last_name}</div>
                <div className="text-xs text-slate-400">{customer.customer_number} {customer.phone && `· ${customer.phone}`}</div>
              </div>
              <button onClick={() => { setCustomer(null); setPrescriptionId('') }} className="text-xs text-red-600">Changer</button>
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
          {customer && (prescriptions?.length ?? 0) > 0 && (
            <div className="mt-3">
              <label className="label">Ordonnance</label>
              <select className="input" value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)}>
                <option value="">Aucune</option>
                {prescriptions!.map((p) => <option key={p.id} value={p.id}>{new Date(p.prescription_date).toLocaleDateString('fr-FR')} {p.doctor_name ? `— ${p.doctor_name}` : ''}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Products */}
        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold">2. Articles (monture, verres, lentilles, accessoires)</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Rechercher un produit à ajouter…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
            {productResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {productResults.map((p) => (
                  <button key={p.id} onClick={() => addToCart(p)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-sand-50 dark:hover:bg-slate-700">
                    <span>{p.name} <span className="text-xs text-slate-400">({p.sku})</span></span>
                    <span className="text-xs text-slate-500">{formatCurrency(p.sale_price_ttc)} · stock {p.quantity}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {cart.map((l) => (
              <div key={l.key} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
                <div className="min-w-[140px] flex-1">
                  <div className="text-sm font-medium">{l.product.name}</div>
                  <div className="text-xs text-slate-400">{formatCurrency(l.product.sale_price_ttc)} TTC</div>
                </div>
                <input
                  type="number" min={1} max={l.product.quantity} value={l.quantity}
                  onChange={(e) => updateLine(l.key, { quantity: Math.min(Number(e.target.value) || 1, l.product.quantity) })}
                  className="input w-16 text-center"
                />
                <input
                  type="number" min={0} placeholder="Remise TTC" value={l.discount_ttc || ''}
                  onChange={(e) => updateLine(l.key, { discount_ttc: Number(e.target.value) || 0 })}
                  className="input w-24"
                />
                <div className="w-24 text-right text-sm font-medium">
                  {formatCurrency(l.product.sale_price_ttc * l.quantity - l.discount_ttc)}
                </div>
                <button onClick={() => removeLine(l.key)} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            ))}
            {cart.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Aucun article ajouté.</p>}
          </div>
        </div>

        {/* Discount + payment */}
        <div className="card space-y-4 p-4">
          <h2 className="text-sm font-semibold">3. Remise & acompte</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Remise panier (MAD TTC)</label>
              <input type="number" min={0} className="input" value={cartDiscount} onChange={(e) => setCartDiscount(e.target.value)} />
              {exceedsLimit && (
                <p className="mt-1 text-xs text-amber-600">
                  Dépasse votre limite de {profile?.max_discount_percent}% — autorisation admin requise. {authorizedBy && '✓ Autorisé.'}
                </p>
              )}
            </div>
            <div>
              <label className="label">Acompte (MAD)</label>
              <input type="number" min={0} className="input" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            </div>
            <div>
              <label className="label">Moyen de paiement</label>
              <select className="input" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} disabled={deposit <= 0}>
                <option value="">—</option>
                {(paymentMethods ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="lg:col-span-1">
        <div className="card sticky top-4 space-y-3 p-4">
          <h2 className="text-sm font-semibold">Récapitulatif</h2>
          <SummaryRow label="Sous-total TTC" value={formatCurrency(totals.subtotalTtc)} />
          <SummaryRow label="Remise" value={`- ${formatCurrency(Number(cartDiscount) || 0)}`} />
          <SummaryRow label="TVA" value={formatCurrency(totals.taxAmount)} />
          <div className="border-t border-slate-200 pt-2 dark:border-slate-800">
            <SummaryRow label="TOTAL TTC" value={formatCurrency(totals.totalTtc)} big />
          </div>
          {isAdmin && (
            <SummaryRow label="Marge" value={`${formatCurrency(totals.marginAmount)} (${totals.totalHt > 0 ? ((totals.marginAmount / totals.totalHt) * 100).toFixed(1) : '0'}%)`} accent />
          )}
          <div className="border-t border-slate-200 pt-2 dark:border-slate-800">
            <SummaryRow label="PAYÉ (acompte)" value={formatCurrency(deposit)} />
            <SummaryRow label="RESTANT" value={formatCurrency(balance)} accent />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button
            onClick={confirmSale}
            disabled={!customer || cart.length === 0 || submitting}
            className="btn-primary w-full"
          >
            {submitting ? 'Création…' : 'Confirmer la vente'}
          </button>
        </div>
      </div>

      {authModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm p-5">
            <h3 className="mb-3 text-sm font-semibold">Autorisation administrateur requise</h3>
            {authError && <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</div>}
            <div className="space-y-3">
              <input className="input" placeholder="Email admin" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
              <input className="input" type="password" placeholder="Mot de passe admin" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setAuthModal(false)} className="btn-secondary">Annuler</button>
              <button onClick={doAuthorize} className="btn-primary">Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${big ? 'text-lg font-semibold' : 'text-sm'}`}>
      <span className={accent ? 'text-brand-700 dark:text-brand-400' : 'text-slate-500'}>{label}</span>
      <span className={accent ? 'font-semibold text-brand-700 dark:text-brand-400' : 'text-slate-900 dark:text-white'}>{value}</span>
    </div>
  )
}
