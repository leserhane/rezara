import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, User, Glasses, ShoppingCart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Result {
  id: string
  label: string
  sublabel: string
  type: 'customer' | 'product' | 'sale'
  to: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    const timeout = setTimeout(async () => {
      const [customers, products, sales] = await Promise.all([
        supabase
          .from('customers')
          .select('id, first_name, last_name, customer_number, phone')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,customer_number.ilike.%${query}%`)
          .limit(5),
        supabase.from('v_products').select('id, name, sku, barcode').or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`).limit(5),
        supabase.from('v_sales').select('id, sale_number, total_ttc').ilike('sale_number', `%${query}%`).limit(5),
      ])
      const r: Result[] = [
        ...(customers.data ?? []).map((c) => ({
          id: c.id,
          label: `${c.first_name} ${c.last_name}`,
          sublabel: `${c.customer_number}${c.phone ? ' · ' + c.phone : ''}`,
          type: 'customer' as const,
          to: `/clients/${c.id}`,
        })),
        ...(products.data ?? []).map((p) => ({
          id: p.id,
          label: p.name,
          sublabel: p.sku,
          type: 'product' as const,
          to: `/products/${p.id}`,
        })),
        ...(sales.data ?? []).map((s) => ({
          id: s.id,
          label: s.sale_number,
          sublabel: `${s.total_ttc} MAD`,
          type: 'sale' as const,
          to: `/sales/${s.id}`,
        })),
      ]
      setResults(r)
      setLoading(false)
    }, 250)
    return () => clearTimeout(timeout)
  }, [query])

  const icons = { customer: User, product: Glasses, sale: ShoppingCart }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-400 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
      >
        <Search size={16} />
        <span className="flex-1 text-left">Rechercher clients, produits, ventes…</span>
        <kbd className="hidden rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-400 sm:inline dark:border-slate-700">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh]" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-sand-200 px-4 py-3 dark:border-slate-800">
              <Search size={18} className="text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {loading && <p className="p-3 text-sm text-slate-400">Recherche…</p>}
              {!loading && query && results.length === 0 && <p className="p-3 text-sm text-slate-400">Aucun résultat.</p>}
              {results.map((r) => {
                const Icon = icons[r.type]
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => {
                      navigate(r.to)
                      setOpen(false)
                      setQuery('')
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Icon size={16} className="text-brand-700 dark:text-brand-400" />
                    <div>
                      <div className="text-sm font-medium">{r.label}</div>
                      <div className="text-xs text-slate-400">{r.sublabel}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
