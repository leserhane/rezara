import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Cake, PhoneMissed, UserX, Target, type LucideIcon } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/format'
import { fetchUpcomingBirthdays, fetchUnfollowedNoShows, fetchInactiveCustomers, fetchStaleProspects } from '@/lib/crmFollowUps'

export function FollowUpsPage() {
  const birthdaysQuery = useQuery({ queryKey: ['crm-birthdays'], queryFn: () => fetchUpcomingBirthdays() })
  const noShowsQuery = useQuery({ queryKey: ['crm-no-shows'], queryFn: fetchUnfollowedNoShows })
  const inactiveQuery = useQuery({ queryKey: ['crm-inactive'], queryFn: () => fetchInactiveCustomers() })
  const prospectsQuery = useQuery({ queryKey: ['crm-prospects'], queryFn: () => fetchStaleProspects() })

  const totalActionable =
    (birthdaysQuery.data?.length ?? 0) + (noShowsQuery.data?.length ?? 0) + (inactiveQuery.data?.length ?? 0) + (prospectsQuery.data?.length ?? 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Suivis</h1>
        <p className="text-sm text-slate-500">
          {totalActionable > 0 ? `${totalActionable} client(s) à recontacter.` : 'Rien à signaler pour le moment.'}
        </p>
      </div>

      <FollowUpSection icon={Cake} title="Anniversaires (14 prochains jours)" empty="Aucun anniversaire à venir." count={birthdaysQuery.data?.length ?? 0}>
        {(birthdaysQuery.data ?? []).map((c) => (
          <FollowUpRow key={c.id} to={`/clients/${c.id}`} name={`${c.first_name} ${c.last_name}`} phone={c.phone}
            detail={c.daysUntil === 0 ? "Aujourd'hui" : `Dans ${c.daysUntil} jour(s)`} />
        ))}
      </FollowUpSection>

      <FollowUpSection icon={PhoneMissed} title="Rendez-vous manqués à recontacter" empty="Aucun rendez-vous manqué en attente de relance." count={noShowsQuery.data?.length ?? 0}>
        {(noShowsQuery.data ?? []).map((a) => (
          <FollowUpRow key={a.id} to={`/clients/${a.customer_id}`}
            name={a.customers ? `${a.customers.first_name} ${a.customers.last_name}` : '—'}
            phone={a.customers?.phone ?? null}
            detail={`Absent le ${formatDateTime(a.scheduled_at)}${a.reason ? ` — ${a.reason}` : ''}`} />
        ))}
      </FollowUpSection>

      <FollowUpSection icon={UserX} title="Clients inactifs (18 mois+)" empty="Aucun client inactif." count={inactiveQuery.data?.length ?? 0}>
        {(inactiveQuery.data ?? []).map((s) => (
          <FollowUpRow key={s.customer_id} to={`/clients/${s.customer_id}`}
            name={s.customer ? `${s.customer.first_name} ${s.customer.last_name}` : '—'}
            phone={s.customer?.phone ?? null}
            detail={`Dernier achat le ${formatDate(s.last_purchase_at)}`} />
        ))}
      </FollowUpSection>

      <FollowUpSection icon={Target} title="Prospects à relancer" empty="Aucun prospect en attente de relance." count={prospectsQuery.data?.length ?? 0}>
        {(prospectsQuery.data ?? []).map((c) => (
          <FollowUpRow key={c.id} to={`/clients/${c.id}`} name={`${c.first_name} ${c.last_name}`} phone={c.phone}
            detail={`Étiqueté prospect depuis le ${formatDate(c.created_at)}, aucun achat`} />
        ))}
      </FollowUpSection>
    </div>
  )
}

function FollowUpSection({
  icon: Icon, title, empty, count, children,
}: { icon: LucideIcon; title: string; empty: string; count: number; children: ReactNode }) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><Icon size={16} /> {title}</h2>
      <div className="space-y-1">
        {children}
        {count === 0 && <p className="px-2 py-4 text-center text-sm text-slate-400">{empty}</p>}
      </div>
    </div>
  )
}

function FollowUpRow({ to, name, phone, detail }: { to: string; name: string; phone: string | null; detail: string }) {
  return (
    <Link to={to} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-sand-50 dark:hover:bg-stone-800">
      <span className="font-medium text-slate-900 dark:text-white">{name}</span>
      <span className="text-slate-500">{detail}</span>
      <span className="text-xs text-slate-400">{phone ?? '—'}</span>
    </Link>
  )
}
