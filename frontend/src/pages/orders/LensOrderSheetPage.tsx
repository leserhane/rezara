import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/format'
import { Printer, Save, Glasses } from 'lucide-react'
import type {
  LensSheetCategory, LensSheetType, LensSheetMaterial, LensSheetFinish, LensSheetVision,
} from '@/types/database'

const MAROON = '#6B1F2A'
const SAND = '#D9C8AE'

const CATEGORY_OPTIONS: { value: LensSheetCategory; label: string }[] = [
  { value: 'homme_adulte', label: 'Homme adulte' },
  { value: 'femme_adulte', label: 'Femme adulte' },
  { value: 'homme_enfant', label: 'Homme enfant' },
  { value: 'femme_enfant', label: 'Femme enfant' },
]
const LENS_TYPE_OPTIONS: { value: LensSheetType; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'aminci', label: 'Aminci' },
  { value: 'super_aminci', label: 'Super-aminci' },
  { value: 'extra_aminci', label: 'Extra-aminci' },
]
const MATERIAL_OPTIONS: { value: LensSheetMaterial; label: string }[] = [
  { value: 'organique', label: 'Organique' },
  { value: 'mineral', label: 'Minéral' },
  { value: 'polycarbonate', label: 'Polycarbonate' },
]
const FINISH_OPTIONS: { value: LensSheetFinish; label: string }[] = [
  { value: 'clair', label: 'Clair' },
  { value: 'anti_reflet', label: 'Anti-reflet' },
  { value: 'lumiere_bleue', label: 'Anti-lumière bleue' },
  { value: 'photochromique', label: 'Photochromique' },
  { value: 'transitions', label: 'Transitions' },
  { value: 'teinte', label: 'Teinté' },
]
const TINT_CATEGORY_OPTIONS = ['A', 'B', 'C', 'D', 'TD']
const TINT_COLOR_OPTIONS = [
  { value: 'bleu', label: 'Bleu' },
  { value: 'vert', label: 'Vert' },
  { value: 'gris', label: 'Gris' },
  { value: 'tsm', label: 'TSM' },
]
const INDEX_OPTIONS = ['1.50', '1.56', '1.60', '1.67', '1.74']
const DIAMETER_OPTIONS = ['50', '55', '60', '65', '70', '75', '80', '85', '90']
const VISION_OPTIONS: { value: LensSheetVision; label: string }[] = [
  { value: 'loin', label: 'Loin' },
  { value: 'pres', label: 'Près' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'progressif', label: 'Progressif' },
]

type EyeKey = 'sphere' | 'cylinder' | 'axis' | 'addition' | 'prism' | 'base' | 'pd' | 'height'
type EyeValues = Record<EyeKey, string>
const emptyEye = (): EyeValues => ({ sphere: '', cylinder: '', axis: '', addition: '', prism: '', base: '', pd: '', height: '' })

export function LensOrderSheetPage() {
  const { saleId } = useParams<{ saleId: string }>()
  const { profile } = useAuth()
  const [category, setCategory] = useState<LensSheetCategory | ''>('')
  const [lensType, setLensType] = useState<LensSheetType | ''>('')
  const [material, setMaterial] = useState<LensSheetMaterial | ''>('')
  const [finish, setFinish] = useState<LensSheetFinish | ''>('')
  const [tintCategory, setTintCategory] = useState('')
  const [tintColor, setTintColor] = useState('')
  const [lensIndex, setLensIndex] = useState('')
  const [lensIndexOther, setLensIndexOther] = useState('')
  const [diameter, setDiameter] = useState('')
  const [diameterOther, setDiameterOther] = useState('')
  const [visionType, setVisionType] = useState<LensSheetVision | ''>('')
  const [fileNumber, setFileNumber] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [estimatedDelivery, setEstimatedDelivery] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [od, setOd] = useState<EyeValues>(emptyEye())
  const [og, setOg] = useState<EyeValues>(emptyEye())
  const [prefilled, setPrefilled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const { data: sale } = useQuery({
    queryKey: ['lens-sheet-sale', saleId],
    queryFn: async () => {
      const { data, error } = await supabase.from('sales').select('*, customers(first_name, last_name, customer_number)').eq('id', saleId!).single()
      if (error) throw error
      return data
    },
    enabled: !!saleId,
  })

  const { data: items } = useQuery({
    queryKey: ['lens-sheet-items', saleId],
    queryFn: async () => (await supabase.from('sale_items').select('*, products(name, sku)').eq('sale_id', saleId!)).data ?? [],
    enabled: !!saleId,
  })

  const { data: frameDetails } = useQuery({
    queryKey: ['lens-sheet-frame-details', items],
    queryFn: async () => {
      const frameItem = items!.find((it) => it.item_role === 'monture' && it.product_id)
      if (!frameItem?.product_id) return null
      const { data } = await supabase.from('frame_details').select('*').eq('product_id', frameItem.product_id).maybeSingle()
      return data
    },
    enabled: !!items,
  })

  const { data: prescription } = useQuery({
    queryKey: ['lens-sheet-prescription', sale?.prescription_id],
    queryFn: async () => (await supabase.from('prescriptions').select('*').eq('id', sale!.prescription_id!).single()).data,
    enabled: !!sale?.prescription_id,
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-for-lens-sheet'],
    queryFn: async () => (await supabase.from('suppliers').select('*').eq('is_active', true).order('name')).data ?? [],
  })

  const { data: existingSheet, refetch: refetchSheet } = useQuery({
    queryKey: ['lens-sheet-existing', saleId],
    queryFn: async () => (await supabase.from('lens_order_sheets').select('*').eq('sale_id', saleId!).maybeSingle()).data,
    enabled: !!saleId,
  })

  const frameItem = items?.find((it) => it.item_role === 'monture')

  // Load an existing sheet if one exists.
  useEffect(() => {
    if (!existingSheet) return
    setFileNumber(existingSheet.file_number)
    setOrderDate(existingSheet.order_date)
    setEstimatedDelivery(existingSheet.estimated_delivery_date ?? '')
    setCategory(existingSheet.category ?? '')
    setLensType(existingSheet.lens_type ?? '')
    setMaterial(existingSheet.material ?? '')
    setFinish(existingSheet.finish ?? '')
    setTintCategory(existingSheet.tint_category ?? '')
    setTintColor(existingSheet.tint_color ?? '')
    setLensIndex(existingSheet.lens_index ?? '')
    setLensIndexOther(existingSheet.lens_index_other ?? '')
    setDiameter(existingSheet.diameter ?? '')
    setDiameterOther(existingSheet.diameter_other ?? '')
    setVisionType(existingSheet.vision_type ?? '')
    setSupplierId(existingSheet.supplier_id ?? '')
    setNotes(existingSheet.notes ?? '')
    setOd({
      sphere: existingSheet.od_sphere?.toString() ?? '', cylinder: existingSheet.od_cylinder?.toString() ?? '',
      axis: existingSheet.od_axis?.toString() ?? '', addition: existingSheet.od_addition?.toString() ?? '',
      prism: existingSheet.od_prism?.toString() ?? '', base: existingSheet.od_base ?? '',
      pd: existingSheet.od_pd?.toString() ?? '', height: existingSheet.od_height?.toString() ?? '',
    })
    setOg({
      sphere: existingSheet.og_sphere?.toString() ?? '', cylinder: existingSheet.og_cylinder?.toString() ?? '',
      axis: existingSheet.og_axis?.toString() ?? '', addition: existingSheet.og_addition?.toString() ?? '',
      prism: existingSheet.og_prism?.toString() ?? '', base: existingSheet.og_base ?? '',
      pd: existingSheet.og_pd?.toString() ?? '', height: existingSheet.og_height?.toString() ?? '',
    })
  }, [existingSheet])

  // First time only: prefill file number from the sale, and OD/OG from the linked prescription.
  useEffect(() => {
    if (prefilled || existingSheet === undefined) return
    if (existingSheet) { setPrefilled(true); return }
    if (sale) setFileNumber(sale.sale_number)
    if (prescription) {
      setOd((prev) => ({
        ...prev,
        sphere: prescription.od_sphere?.toString() ?? '', cylinder: prescription.od_cylinder?.toString() ?? '',
        axis: prescription.od_axis?.toString() ?? '', addition: prescription.od_addition?.toString() ?? '',
        prism: prescription.od_prism?.toString() ?? '', base: prescription.od_base ?? '',
        pd: prescription.pd?.toString() ?? '', height: prescription.height?.toString() ?? '',
      }))
      setOg((prev) => ({
        ...prev,
        sphere: prescription.og_sphere?.toString() ?? '', cylinder: prescription.og_cylinder?.toString() ?? '',
        axis: prescription.og_axis?.toString() ?? '', addition: prescription.og_addition?.toString() ?? '',
        prism: prescription.og_prism?.toString() ?? '', base: prescription.og_base ?? '',
        pd: prescription.pd?.toString() ?? '', height: prescription.height?.toString() ?? '',
      }))
    }
    if (sale && (prescription || sale.prescription_id === null)) setPrefilled(true)
  }, [sale, prescription, existingSheet, prefilled])

  const lensSummary = useMemo(() => {
    const parts = [
      CATEGORY_OPTIONS.find((c) => c.value === category)?.label,
      LENS_TYPE_OPTIONS.find((t) => t.value === lensType)?.label,
      MATERIAL_OPTIONS.find((m) => m.value === material)?.label,
      FINISH_OPTIONS.find((f) => f.value === finish)?.label,
      lensIndex && `indice ${lensIndex === 'autre' ? lensIndexOther || '?' : lensIndex}`,
      diameter && `Ø ${diameter === 'autre' ? diameterOther || '?' : diameter}`,
    ].filter(Boolean)
    return parts.length ? parts.join(' · ') : 'Complétez les champs ci-dessous pour générer le résumé.'
  }, [category, lensType, material, finish, lensIndex, lensIndexOther, diameter, diameterOther])

  const num = (v: string) => (v.trim() === '' ? null : Number(v))

  const save = async () => {
    if (!profile || !saleId) return
    setSaving(true)
    setError(null)

    const payload = {
      sale_id: saleId,
      file_number: fileNumber || sale?.sale_number || '',
      order_date: orderDate,
      estimated_delivery_date: estimatedDelivery || null,
      category: category || null,
      lens_type: lensType || null,
      material: material || null,
      finish: finish || null,
      tint_category: finish === 'teinte' ? tintCategory || null : null,
      tint_color: finish === 'teinte' ? tintColor || null : null,
      lens_index: lensIndex || null,
      lens_index_other: lensIndex === 'autre' ? lensIndexOther || null : null,
      diameter: diameter || null,
      diameter_other: diameter === 'autre' ? diameterOther || null : null,
      vision_type: visionType || null,
      od_sphere: num(od.sphere), od_cylinder: num(od.cylinder), od_axis: num(od.axis), od_addition: num(od.addition),
      od_prism: num(od.prism), od_base: od.base || null, od_pd: num(od.pd), od_height: num(od.height),
      og_sphere: num(og.sphere), og_cylinder: num(og.cylinder), og_axis: num(og.axis), og_addition: num(og.addition),
      og_prism: num(og.prism), og_base: og.base || null, og_pd: num(og.pd), og_height: num(og.height),
      supplier_id: supplierId || null,
      notes: notes || null,
      created_by: profile.id,
    }

    const result = existingSheet
      ? await supabase.from('lens_order_sheets').update(payload).eq('id', existingSheet.id)
      : await supabase.from('lens_order_sheets').insert(payload)

    setSaving(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    setSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    refetchSheet()
  }

  if (!sale) return <p className="text-slate-400">Chargement…</p>

  const supplierName = suppliers?.find((s) => s.id === supplierId)?.name

  return (
    <div className="space-y-5">
      {/* Printed output is the compact A5 sheet below, not this editable
          screen view — a plain window.print() of the full editing form
          wastes space and cuts off across A4 pages. */}
      <style>{`@media print { @page { size: A5 portrait; margin: 9mm; } }`}</style>

      <div className="print:hidden">
        <Link to={`/sales/${saleId}`} className="text-sm text-brand-700 hover:underline dark:text-brand-400">&larr; Retour à la vente {sale.sale_number}</Link>
      </div>

      <div id="lens-sheet-edit" className="overflow-hidden rounded-xl border border-slate-200 print:hidden dark:border-stone-800">
        {/* Branded header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: MAROON }}>
          <div className="flex items-center gap-3 text-white">
            <Glasses size={22} />
            <div>
              <h1 className="text-lg font-semibold">Fiche technique verres</h1>
              <p className="text-sm text-white/80">
                {sale.customers ? `${sale.customers.first_name} ${sale.customers.last_name}` : ''} · Dossier {sale.sale_number}
              </p>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25">
              <Printer size={15} /> Imprimer
            </button>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium hover:bg-white/90" style={{ color: MAROON }}>
              <Save size={15} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>

        <div className="space-y-6 bg-white p-5 dark:bg-stone-900">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {savedAt && !error && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 print:hidden">Enregistré à {savedAt}.</div>}

          {/* General info */}
          <section>
            <SectionTitle>Informations générales</SectionTitle>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="N° de dossier">
                <input className="input" value={fileNumber} onChange={(e) => setFileNumber(e.target.value)} />
              </Field>
              <Field label="Date de commande">
                <input type="date" className="input" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
              </Field>
              <Field label="Livraison estimée">
                <input type="date" className="input" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} />
              </Field>
              <Field label="Catégorie">
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value as LensSheetCategory)}>
                  <option value="">—</option>
                  {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Vision">
                <div className="flex flex-wrap gap-2">
                  {VISION_OPTIONS.map((o) => (
                    <RadioPill key={o.value} label={o.label} checked={visionType === o.value} onClick={() => setVisionType(o.value)} />
                  ))}
                </div>
              </Field>
            </div>
          </section>

          {/* Lens spec */}
          <section>
            <SectionTitle>Spécifications du verre</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Type de verre">
                <select className="input" value={lensType} onChange={(e) => setLensType(e.target.value as LensSheetType)}>
                  <option value="">—</option>
                  {LENS_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Matériau">
                <select className="input" value={material} onChange={(e) => setMaterial(e.target.value as LensSheetMaterial)}>
                  <option value="">—</option>
                  {MATERIAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Finition">
                <select className="input" value={finish} onChange={(e) => setFinish(e.target.value as LensSheetFinish)}>
                  <option value="">—</option>
                  {FINISH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </div>

            {finish === 'teinte' && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-lg border border-dashed border-slate-300 p-3 dark:border-stone-700">
                <Field label="Catégorie de teinte">
                  <select className="input" value={tintCategory} onChange={(e) => setTintCategory(e.target.value)}>
                    <option value="">—</option>
                    {TINT_CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Couleur">
                  <select className="input" value={tintColor} onChange={(e) => setTintColor(e.target.value)}>
                    <option value="">—</option>
                    {TINT_COLOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Indice">
                <select className="input" value={lensIndex} onChange={(e) => setLensIndex(e.target.value)}>
                  <option value="">—</option>
                  {INDEX_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  <option value="autre">Autre</option>
                </select>
              </Field>
              {lensIndex === 'autre' && (
                <Field label="Préciser l'indice">
                  <input className="input" value={lensIndexOther} onChange={(e) => setLensIndexOther(e.target.value)} />
                </Field>
              )}
              <Field label="Diamètre">
                <select className="input" value={diameter} onChange={(e) => setDiameter(e.target.value)}>
                  <option value="">—</option>
                  {DIAMETER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  <option value="autre">Autre</option>
                </select>
              </Field>
              {diameter === 'autre' && (
                <Field label="Préciser le diamètre">
                  <input className="input" value={diameterOther} onChange={(e) => setDiameterOther(e.target.value)} />
                </Field>
              )}
            </div>

            <div className="mt-4 rounded-lg px-4 py-3 text-sm font-medium" style={{ backgroundColor: SAND, color: MAROON }}>
              Verre : {lensSummary}
            </div>
          </section>

          {/* OD / OG */}
          <section>
            <SectionTitle>Correction</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <EyeBlock title="Œil droit (OD)" values={od} onChange={setOd} />
              <EyeBlock title="Œil gauche (OG)" values={og} onChange={setOg} />
            </div>
          </section>

          {/* Supplier + notes */}
          <section>
            <SectionTitle>Fournisseur & notes</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Fournisseur de verres">
                <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">—</option>
                  {(suppliers ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Notes">
                <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Frame — read-only, pulled from the sale */}
          <section>
            <SectionTitle>Monture</SectionTitle>
            {frameItem ? (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: SAND, color: MAROON }}>
                <div className="font-semibold">{frameItem.description}</div>
                <div className="text-xs opacity-80">
                  {[frameDetails?.color, frameDetails?.size, frameDetails?.material].filter(Boolean).join(' · ') || 'Détails non renseignés'}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Aucune monture associée à ce dossier — vérifiez la vente {sale.sale_number}.</p>
            )}
          </section>

          <p className="text-xs text-slate-400">Dossier créé le {formatDate(sale.created_at)}.</p>
        </div>
      </div>

      {/* Compact A5 print sheet — dense, single-page layout built for a
          printer, not a scaled-down copy of the on-screen editing form. */}
      <div className="hidden print:block" style={{ fontSize: '9px', lineHeight: 1.4, color: '#1a1a1a' }}>
        <div className="flex items-baseline justify-between border-b-2 pb-1.5" style={{ borderColor: MAROON }}>
          <div>
            <div className="text-[14px] font-bold" style={{ color: MAROON }}>Fiche technique verres</div>
            <div className="text-[9px]">
              {sale.customers ? `${sale.customers.first_name} ${sale.customers.last_name}` : 'Client non renseigné'}
            </div>
          </div>
          <div className="text-right text-[8.5px]">
            <div>Dossier <strong>{fileNumber || sale.sale_number}</strong></div>
            <div>Commandé le {formatDate(orderDate)}</div>
            {estimatedDelivery && <div>Livraison prévue le {formatDate(estimatedDelivery)}</div>}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1 border-b pb-2" style={{ borderColor: '#ddd' }}>
          <PrintField label="Catégorie" value={labelOf(CATEGORY_OPTIONS, category)} />
          <PrintField label="Vision" value={labelOf(VISION_OPTIONS, visionType)} />
          <PrintField label="Fournisseur verres" value={supplierName} />
        </div>

        <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1 border-b pb-2" style={{ borderColor: '#ddd' }}>
          <PrintField label="Type de verre" value={labelOf(LENS_TYPE_OPTIONS, lensType)} />
          <PrintField label="Matériau" value={labelOf(MATERIAL_OPTIONS, material)} />
          <PrintField label="Finition" value={labelOf(FINISH_OPTIONS, finish)} />
          <PrintField label="Indice" value={lensIndex === 'autre' ? lensIndexOther : lensIndex} />
          <PrintField label="Diamètre" value={diameter === 'autre' ? diameterOther : diameter} />
          {finish === 'teinte' && (
            <PrintField label="Teinte" value={[tintCategory, labelOf(TINT_COLOR_OPTIONS, tintColor)].filter(Boolean).join(' · ')} />
          )}
        </div>

        <div className="mt-2 rounded px-2 py-1.5 text-[9px] font-semibold" style={{ backgroundColor: SAND, color: MAROON }}>
          Verre : {lensSummary}
        </div>

        <table className="mt-2.5 w-full border-collapse text-[8px]">
          <thead>
            <tr>
              <th className="border px-1 py-1" style={{ borderColor: '#ccc' }}></th>
              {['Sphère', 'Cyl.', 'Axe', 'Add.', 'Prisme', 'Base', 'DP', 'Hauteur'].map((h) => (
                <th key={h} className="border px-1 py-1 text-center font-medium" style={{ borderColor: '#ccc' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[{ label: 'OD', v: od }, { label: 'OG', v: og }].map((row) => (
              <tr key={row.label}>
                <td className="border px-1 py-1 font-semibold" style={{ borderColor: '#ccc' }}>{row.label}</td>
                {[row.v.sphere, row.v.cylinder, row.v.axis, row.v.addition, row.v.prism, row.v.base, row.v.pd, row.v.height].map((v, i) => (
                  <td key={i} className="border px-1 py-1 text-center" style={{ borderColor: '#ccc' }}>{v || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-2.5 rounded px-2 py-1.5 text-[9px]" style={{ backgroundColor: SAND, color: MAROON }}>
          <span className="font-semibold">Monture — </span>
          {frameItem ? (
            <>
              {frameItem.description}
              {[frameDetails?.color, frameDetails?.size, frameDetails?.material].filter(Boolean).length > 0 &&
                ` (${[frameDetails?.color, frameDetails?.size, frameDetails?.material].filter(Boolean).join(' · ')})`}
            </>
          ) : (
            'Aucune monture associée.'
          )}
        </div>

        {notes && (
          <div className="mt-2 text-[8.5px]">
            <span className="font-semibold">Notes : </span>{notes}
          </div>
        )}

        <div className="mt-5 flex items-end justify-between text-[8px] text-slate-500">
          <span>Dossier créé le {formatDate(sale.created_at)}</span>
          <span>Signature opticien : ________________________</span>
        </div>
      </div>
    </div>
  )
}

function labelOf<T extends string>(options: { value: T; label: string }[], value: T | ''): string {
  return options.find((o) => o.value === value)?.label ?? ''
}

function PrintField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-[7.5px] uppercase tracking-wide text-slate-500">{label}</span>{' '}
      <span className="font-semibold">{value || '—'}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b-2 pb-1 text-sm font-semibold" style={{ borderColor: MAROON, color: MAROON }}>
      {children}
    </h2>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function RadioPill({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
      style={checked ? { backgroundColor: MAROON, color: 'white' } : { backgroundColor: '#f1f5f9', color: '#334155' }}
    >
      {label}
    </button>
  )
}

function EyeBlock({ title, values, onChange }: { title: string; values: EyeValues; onChange: (v: EyeValues) => void }) {
  const fields: { key: EyeKey; label: string }[] = [
    { key: 'sphere', label: 'Sphère' },
    { key: 'cylinder', label: 'Cylindre' },
    { key: 'axis', label: 'Axe' },
    { key: 'addition', label: 'Addition' },
    { key: 'prism', label: 'Prisme' },
    { key: 'base', label: 'Base' },
    { key: 'pd', label: 'DP / écart' },
    { key: 'height', label: 'Hauteur' },
  ]
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-stone-800">
      <h3 className="mb-2 text-sm font-semibold" style={{ color: MAROON }}>{title}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="label text-xs">{f.label}</label>
            <input className="input" value={values[f.key]} onChange={(e) => onChange({ ...values, [f.key]: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  )
}
