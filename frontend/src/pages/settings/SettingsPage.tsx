import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Store, StoreSettings, Profile, Role } from '@/types/database'

export function SettingsPage() {
  const [tab, setTab] = useState<'store' | 'users'>('store')

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Paramètres</h1>
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {[{ key: 'store', label: 'Magasin' }, { key: 'users', label: 'Utilisateurs' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === t.key ? 'border-brand-700 text-brand-700 dark:text-brand-400' : 'border-transparent text-slate-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'store' ? <StoreSettingsTab /> : <UsersTab />}
    </div>
  )
}

function StoreSettingsTab() {
  const { profile } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    supabase.from('stores').select('*').eq('id', profile.store_id).single().then(({ data }) => setStore(data))
    supabase.from('store_settings').select('*').eq('store_id', profile.store_id).single().then(({ data }) => setSettings(data))
  }, [profile])

  if (!store || !settings) return <p className="text-slate-400">Chargement…</p>

  const saveStore = async () => {
    setSaving(true)
    await supabase.from('stores').update({
      name: store.name, address: store.address, phone: store.phone, email: store.email,
      website: store.website, ice: store.ice, identifiant_fiscal: store.identifiant_fiscal,
      rc: store.rc, patente: store.patente, currency: store.currency, default_tax_rate: store.default_tax_rate,
    }).eq('id', store.id)
    await supabase.from('store_settings').update({
      opticien_max_discount_percent: settings.opticien_max_discount_percent,
      vip_bronze_threshold: settings.vip_bronze_threshold,
      vip_silver_threshold: settings.vip_silver_threshold,
      vip_gold_threshold: settings.vip_gold_threshold,
      vip_platinum_threshold: settings.vip_platinum_threshold,
      inactive_customer_months: settings.inactive_customer_months,
    }).eq('store_id', settings.store_id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div className="card space-y-4 p-4">
        <h2 className="text-sm font-semibold">Informations du magasin</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom" value={store.name} onChange={(v) => setStore({ ...store, name: v })} />
          <Field label="Téléphone" value={store.phone ?? ''} onChange={(v) => setStore({ ...store, phone: v })} />
          <Field label="Email" value={store.email ?? ''} onChange={(v) => setStore({ ...store, email: v })} />
          <Field label="Site web" value={store.website ?? ''} onChange={(v) => setStore({ ...store, website: v })} />
          <Field label="Adresse" value={store.address ?? ''} onChange={(v) => setStore({ ...store, address: v })} />
          <Field label="Devise" value={store.currency} onChange={(v) => setStore({ ...store, currency: v })} />
          <Field label="ICE" value={store.ice ?? ''} onChange={(v) => setStore({ ...store, ice: v })} />
          <Field label="Identifiant fiscal" value={store.identifiant_fiscal ?? ''} onChange={(v) => setStore({ ...store, identifiant_fiscal: v })} />
          <Field label="RC" value={store.rc ?? ''} onChange={(v) => setStore({ ...store, rc: v })} />
          <Field label="Patente" value={store.patente ?? ''} onChange={(v) => setStore({ ...store, patente: v })} />
          <Field label="TVA par défaut (%)" value={String(store.default_tax_rate)} onChange={(v) => setStore({ ...store, default_tax_rate: Number(v) || 0 })} />
        </div>
      </div>

      <div className="card space-y-4 p-4">
        <h2 className="text-sm font-semibold">Règles commerciales</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Remise max. opticien par défaut (%)" value={String(settings.opticien_max_discount_percent)} onChange={(v) => setSettings({ ...settings, opticien_max_discount_percent: Number(v) || 0 })} />
          <Field label="Client inactif après (mois)" value={String(settings.inactive_customer_months)} onChange={(v) => setSettings({ ...settings, inactive_customer_months: Number(v) || 0 })} />
          <Field label="Seuil VIP Silver (MAD)" value={String(settings.vip_silver_threshold)} onChange={(v) => setSettings({ ...settings, vip_silver_threshold: Number(v) || 0 })} />
          <Field label="Seuil VIP Gold (MAD)" value={String(settings.vip_gold_threshold)} onChange={(v) => setSettings({ ...settings, vip_gold_threshold: Number(v) || 0 })} />
          <Field label="Seuil VIP Platinum (MAD)" value={String(settings.vip_platinum_threshold)} onChange={(v) => setSettings({ ...settings, vip_platinum_threshold: Number(v) || 0 })} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={saveStore} disabled={saving} className="btn-primary">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        {saved && <span className="text-sm text-emerald-600">Enregistré ✓</span>}
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function UsersTab() {
  const { data: users, refetch } = useQuery({
    queryKey: ['profiles-all'],
    queryFn: async () => (await supabase.from('profiles').select('*').order('created_at')).data as Profile[],
  })
  const { data: roles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: async () => (await supabase.from('roles').select('*')).data as Role[],
  })

  const updateProfile = async (id: string, patch: Partial<Profile>) => {
    await supabase.from('profiles').update(patch).eq('id', id)
    refetch()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400">
        Pour créer un nouvel utilisateur, invitez-le depuis le tableau de bord Supabase (Authentication → Users), puis assignez-lui un rôle ici.
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Remise max.</th>
              <th className="px-4 py-3">Actif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">{u.first_name} {u.last_name}</td>
                <td className="px-4 py-3">
                  <select className="input" value={u.role_id} onChange={(e) => updateProfile(u.id, { role_id: e.target.value })}>
                    {(roles ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number" className="input w-24" value={u.max_discount_percent}
                    onChange={(e) => updateProfile(u.id, { max_discount_percent: Number(e.target.value) || 0 })}
                  />
                </td>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={u.is_active} onChange={(e) => updateProfile(u.id, { is_active: e.target.checked })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
