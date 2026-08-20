import { useEffect, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Product, ProductType } from '@/types/database'

export function ProductFormModal({
  open, onClose, onSaved, existing,
}: {
  open: boolean
  onClose: () => void
  onSaved: (p: Product) => void
  existing?: Product | null
}) {
  const { profile } = useAuth()
  const [type, setType] = useState<ProductType>(existing?.type ?? 'monture')
  const [sku, setSku] = useState(existing?.sku ?? '')
  const [name, setName] = useState(existing?.name ?? '')
  const [barcode, setBarcode] = useState(existing?.barcode ?? '')
  const [brandId, setBrandId] = useState(existing?.brand_id ?? '')
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? '')
  const [supplierId, setSupplierId] = useState(existing?.supplier_id ?? '')
  const [purchasePrice, setPurchasePrice] = useState(String(existing?.purchase_price_ht ?? ''))
  const [salePrice, setSalePrice] = useState(String(existing?.sale_price_ht ?? ''))
  const [taxRate, setTaxRate] = useState(String(existing?.tax_rate ?? 20))
  const [quantity, setQuantity] = useState(String(existing?.quantity ?? 0))
  const [stockMin, setStockMin] = useState(String(existing?.stock_min ?? 2))
  const [location, setLocation] = useState(existing?.location ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existing) {
      setType(existing.type)
      setSku(existing.sku)
      setName(existing.name)
      setBarcode(existing.barcode ?? '')
      setBrandId(existing.brand_id ?? '')
      setCategoryId(existing.category_id ?? '')
      setSupplierId(existing.supplier_id ?? '')
      setPurchasePrice(String(existing.purchase_price_ht))
      setSalePrice(String(existing.sale_price_ht))
      setTaxRate(String(existing.tax_rate))
      setQuantity(String(existing.quantity))
      setStockMin(String(existing.stock_min))
      setLocation(existing.location ?? '')
    }
  }, [existing])

  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: async () => (await supabase.from('brands').select('*').order('name')).data ?? [] })
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: async () => (await supabase.from('suppliers').select('*').order('name')).data ?? [] })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: async () => (await supabase.from('product_categories').select('*').order('name')).data ?? [] })

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)
    setError(null)

    const payload = {
      type,
      sku,
      name,
      barcode: barcode || null,
      brand_id: brandId || null,
      category_id: categoryId || null,
      supplier_id: supplierId || null,
      purchase_price_ht: Number(purchasePrice) || 0,
      sale_price_ht: Number(salePrice) || 0,
      tax_rate: Number(taxRate) || 0,
      stock_min: Number(stockMin) || 0,
      location: location || null,
    }

    const result = existing
      ? await supabase.from('products').update(payload).eq('id', existing.id).select().single()
      : await supabase
          .from('products')
          .insert({ ...payload, store_id: profile.store_id, quantity: Number(quantity) || 0, created_by: profile.id })
          .select()
          .single()

    setSubmitting(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    onSaved(result.data as Product)
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Modifier le produit' : 'Nouveau produit'} wide>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div>
          <label className="label">Type de produit *</label>
          <div className="flex gap-2">
            {(['monture', 'verre', 'lentille', 'accessoire'] as ProductType[]).map((t) => (
              <button
                key={t}
                type="button"
                disabled={!!existing}
                onClick={() => setType(t)}
                className={`rounded-lg px-3 py-1.5 text-sm ${type === t ? 'bg-brand-700 text-white' : 'bg-sand-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="label">Référence (SKU) *</label><input required className="input" value={sku} onChange={(e) => setSku(e.target.value)} /></div>
          <div><label className="label">Nom *</label><input required className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">Code-barres</label><input className="input" value={barcode} onChange={(e) => setBarcode(e.target.value)} /></div>
          <div><label className="label">Emplacement</label><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div>
            <label className="label">Marque</label>
            <select className="input" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              <option value="">—</option>
              {(brands ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">—</option>
              {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fournisseur</label>
            <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">—</option>
              {(suppliers ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div><label className="label">Achat HT</label><input type="number" step="0.01" className="input" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} /></div>
          <div><label className="label">Vente HT *</label><input required type="number" step="0.01" className="input" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} /></div>
          <div><label className="label">TVA %</label><input type="number" step="0.01" className="input" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
          <div>
            <label className="label">Stock initial</label>
            <input type="number" className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} disabled={!!existing} />
          </div>
          <div><label className="label">Seuil min.</label><input type="number" className="input" value={stockMin} onChange={(e) => setStockMin(e.target.value)} /></div>
        </div>
        {existing && (
          <p className="text-xs text-slate-400">
            Le stock ne se modifie pas ici : utilisez un mouvement de stock depuis la fiche produit.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  )
}
