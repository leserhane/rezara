import clsx from 'clsx'

const STYLES: Record<string, string> = {
  // sale status
  paye: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  acompte: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  partiellement_paye: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  non_paye: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  credit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  annule: 'bg-slate-100 text-slate-500 dark:bg-stone-800 dark:text-stone-400',
  // order status
  creee: 'bg-slate-100 text-slate-700 dark:bg-stone-800 dark:text-stone-300',
  verres_commandes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  en_attente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  recue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  montage: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  controle: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  prete: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  client_informe: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  livree: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  // register
  ouverte: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  cloturee: 'bg-slate-100 text-slate-500 dark:bg-stone-800 dark:text-stone-400',
}

const LABELS: Record<string, string> = {
  paye: 'Payé',
  acompte: 'Acompte',
  partiellement_paye: 'Partiellement payé',
  non_paye: 'Non payé',
  credit: 'Crédit',
  annule: 'Annulé',
  creee: 'Créée',
  verres_commandes: 'Verres commandés',
  en_attente: 'En attente',
  recue: 'Reçue',
  montage: 'Montage',
  controle: 'Contrôle',
  prete: 'Prête',
  client_informe: 'Client informé',
  livree: 'Livrée',
  ouverte: 'Ouverte',
  cloturee: 'Clôturée',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('badge', STYLES[status] ?? 'bg-slate-100 text-slate-600')}>
      {LABELS[status] ?? status}
    </span>
  )
}
