import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toCsv, downloadCsv, type ExportColumn } from '@/lib/csvExport'

interface ExportConfig {
  key: string
  label: string
  table: string
  select: string
  orderBy: string
  columns: ExportColumn[]
}

const EXPORTS: ExportConfig[] = [
  {
    key: 'clients', label: 'Clients', table: 'customers', select: '*', orderBy: 'created_at',
    columns: [
      { key: 'customer_number', label: 'N° client' },
      { key: 'first_name', label: 'Prénom' },
      { key: 'last_name', label: 'Nom' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'whatsapp', label: 'WhatsApp' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Adresse' },
      { key: 'birth_date', label: 'Date de naissance' },
      { key: 'gender', label: 'Genre' },
      { key: 'notes', label: 'Notes' },
      { key: 'created_at', label: 'Créé le' },
    ],
  },
  {
    key: 'prescriptions', label: 'Ordonnances', table: 'prescriptions', orderBy: 'prescription_date',
    select: '*, customers(first_name,last_name,customer_number)',
    columns: [
      { key: 'customers', label: 'Client' },
      { key: 'prescription_date', label: 'Date' },
      { key: 'doctor_name', label: 'Médecin' },
      { key: 'valid_until', label: "Valide jusqu'au" },
      { key: 'od_sphere', label: 'OD Sphère' }, { key: 'od_cylinder', label: 'OD Cylindre' },
      { key: 'od_axis', label: 'OD Axe' }, { key: 'od_addition', label: 'OD Addition' },
      { key: 'og_sphere', label: 'OG Sphère' }, { key: 'og_cylinder', label: 'OG Cylindre' },
      { key: 'og_axis', label: 'OG Axe' }, { key: 'og_addition', label: 'OG Addition' },
      { key: 'pd', label: 'DP' }, { key: 'height', label: 'Hauteur' },
      { key: 'correction_type', label: 'Type de correction' },
    ],
  },
  {
    key: 'products', label: 'Produits', table: 'products', orderBy: 'name',
    select: '*, brands(name), product_categories(name), suppliers(name)',
    columns: [
      { key: 'sku', label: 'Référence' },
      { key: 'name', label: 'Nom' },
      { key: 'type', label: 'Type' },
      { key: 'brands', label: 'Marque' },
      { key: 'product_categories', label: 'Catégorie' },
      { key: 'suppliers', label: 'Fournisseur' },
      { key: 'barcode', label: 'Code-barres' },
      { key: 'purchase_price_ht', label: 'Achat HT' },
      { key: 'sale_price_ht', label: 'Vente HT' },
      { key: 'sale_price_ttc', label: 'Vente TTC' },
      { key: 'tax_rate', label: 'TVA %' },
      { key: 'quantity', label: 'Stock' },
      { key: 'stock_min', label: 'Stock min' },
      { key: 'is_active', label: 'Actif' },
    ],
  },
  {
    key: 'suppliers', label: 'Fournisseurs', table: 'suppliers', select: '*', orderBy: 'name',
    columns: [
      { key: 'name', label: 'Nom' },
      { key: 'contact_name', label: 'Contact' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Adresse' },
      { key: 'categories', label: 'Types' },
      { key: 'payment_terms', label: 'Conditions de paiement' },
      { key: 'average_lead_time_days', label: 'Délai moyen (j)' },
      { key: 'is_active', label: 'Actif' },
    ],
  },
  {
    key: 'sales', label: 'Ventes', table: 'sales', orderBy: 'created_at',
    select: '*, customers(first_name,last_name,customer_number)',
    columns: [
      { key: 'sale_number', label: 'N° vente' },
      { key: 'customers', label: 'Client' },
      { key: 'created_at', label: 'Date' },
      { key: 'subtotal_ht', label: 'Sous-total HT' },
      { key: 'discount_amount', label: 'Remise' },
      { key: 'tax_amount', label: 'TVA' },
      { key: 'total_ht', label: 'Total HT' },
      { key: 'total_ttc', label: 'Total TTC' },
      { key: 'cost_total', label: 'Coût' },
      { key: 'margin_amount', label: 'Marge' },
      { key: 'margin_percent', label: 'Marge %' },
      { key: 'amount_paid', label: 'Payé' },
      { key: 'amount_due', label: 'Restant dû' },
      { key: 'status', label: 'Statut' },
    ],
  },
  {
    key: 'quotes', label: 'Devis', table: 'quotes', orderBy: 'created_at',
    select: '*, customers(first_name,last_name,customer_number)',
    columns: [
      { key: 'quote_number', label: 'N° devis' },
      { key: 'customers', label: 'Client' },
      { key: 'created_at', label: 'Date' },
      { key: 'status', label: 'Statut' },
      { key: 'subtotal_ht', label: 'Sous-total HT' },
      { key: 'discount_amount', label: 'Remise' },
      { key: 'tax_amount', label: 'TVA' },
      { key: 'total_ht', label: 'Total HT' },
      { key: 'total_ttc', label: 'Total TTC' },
      { key: 'valid_until', label: "Valide jusqu'au" },
    ],
  },
  {
    key: 'invoices', label: 'Factures', table: 'invoices', orderBy: 'issued_at',
    select: '*, customers(first_name,last_name,customer_number)',
    columns: [
      { key: 'invoice_number', label: 'N° facture' },
      { key: 'customers', label: 'Client' },
      { key: 'issued_at', label: 'Émise le' },
      { key: 'total_ht', label: 'Total HT' },
      { key: 'tax_amount', label: 'TVA' },
      { key: 'total_ttc', label: 'Total TTC' },
      { key: 'amount_paid', label: 'Payé' },
      { key: 'amount_due', label: 'Restant dû' },
    ],
  },
  {
    key: 'credits', label: 'Crédits', table: 'credits', orderBy: 'created_at',
    select: '*, customers(first_name,last_name,customer_number), sales(sale_number)',
    columns: [
      { key: 'customers', label: 'Client' },
      { key: 'sales', label: 'Vente' },
      { key: 'initial_amount', label: 'Montant initial' },
      { key: 'paid_amount', label: 'Payé' },
      { key: 'balance', label: 'Solde' },
      { key: 'due_date', label: 'Échéance' },
      { key: 'frequency', label: 'Fréquence' },
      { key: 'status', label: 'Statut' },
      { key: 'created_at', label: 'Créé le' },
    ],
  },
  {
    key: 'expenses', label: 'Dépenses', table: 'expenses', orderBy: 'expense_date',
    select: '*, expense_categories(name), suppliers(name)',
    columns: [
      { key: 'expense_number', label: 'N° dépense' },
      { key: 'expense_categories', label: 'Catégorie' },
      { key: 'suppliers', label: 'Fournisseur' },
      { key: 'expense_date', label: 'Date' },
      { key: 'amount_ht', label: 'Montant HT' },
      { key: 'tax_amount', label: 'TVA' },
      { key: 'amount_ttc', label: 'Montant TTC' },
      { key: 'comment', label: 'Commentaire' },
    ],
  },
  {
    key: 'appointments', label: 'Rendez-vous', table: 'appointments', orderBy: 'scheduled_at',
    select: '*, customers(first_name,last_name,customer_number)',
    columns: [
      { key: 'customers', label: 'Client' },
      { key: 'scheduled_at', label: 'Date/heure' },
      { key: 'reason', label: 'Motif' },
      { key: 'status', label: 'Statut' },
      { key: 'notes', label: 'Notes' },
    ],
  },
]

export function ExportDataTab() {
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [busyAll, setBusyAll] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const runExport = async (cfg: ExportConfig) => {
    setBusyKey(cfg.key)
    setErrors((prev) => ({ ...prev, [cfg.key]: '' }))
    // Each config's table/select/orderBy is a fixed literal defined above,
    // not user input — the `any` here is only to work around the typed
    // client's per-table `.from()` overloads, which don't support a
    // generic table-name-driven export loop like this one.
    const { data, error } = await (supabase.from(cfg.table as any).select(cfg.select).order(cfg.orderBy, { ascending: false }) as any)
    setBusyKey(null)
    if (error) {
      setErrors((prev) => ({ ...prev, [cfg.key]: error.message }))
      return
    }
    const csv = toCsv((data ?? []) as Record<string, unknown>[], cfg.columns)
    downloadCsv(`${cfg.key}-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  const exportAll = async () => {
    setBusyAll(true)
    for (const cfg of EXPORTS) {
      await runExport(cfg)
      // A short pause between downloads — browsers can silently drop
      // several file downloads fired back-to-back from the same click.
      await new Promise((resolve) => setTimeout(resolve, 350))
    }
    setBusyAll(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400">
        Exportez les données du magasin au format CSV (compatible Excel / Google Sheets), pour une sauvegarde ou une
        analyse externe. Chaque export contient l'ensemble des enregistrements actuels.
      </div>

      <div className="card p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Exporter toutes les données</h2>
          <button onClick={exportAll} disabled={busyAll || !!busyKey} className="btn-primary">
            {busyAll ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {busyAll ? 'Export en cours…' : 'Tout exporter (CSV)'}
          </button>
        </div>
        <p className="text-xs text-slate-400">Télécharge un fichier CSV séparé pour chacune des catégories ci-dessous.</p>
      </div>

      <div className="card divide-y divide-sand-100 dark:divide-stone-800">
        {EXPORTS.map((cfg) => (
          <div key={cfg.key} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="text-sm font-medium">{cfg.label}</div>
              {errors[cfg.key] && <div className="text-xs text-red-600">{errors[cfg.key]}</div>}
            </div>
            <button
              onClick={() => runExport(cfg)}
              disabled={busyAll || !!busyKey}
              className="btn-secondary shrink-0"
            >
              {busyKey === cfg.key ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
