import { supabase } from '@/lib/supabase'

const MS_PER_DAY = 86_400_000

// Days from today (0) to the next occurrence of a given month/day,
// wrapping to next year once it's passed — used to find birthdays
// coming up in the next N days regardless of what year someone was born.
export function daysUntilNextAnniversary(birthDate: string): number {
  const today = new Date()
  const bd = new Date(birthDate)
  let next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate())
  if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    next = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate())
  }
  return Math.round((next.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / MS_PER_DAY)
}

export async function fetchUpcomingBirthdays(withinDays = 14) {
  const { data, error } = await supabase.from('customers').select('id, first_name, last_name, phone, birth_date').not('birth_date', 'is', null)
  if (error) throw error
  return data
    .map((c) => ({ ...c, daysUntil: daysUntilNextAnniversary(c.birth_date!) }))
    .filter((c) => c.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

export async function fetchUnfollowedNoShows() {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, customer_id, scheduled_at, reason, customers(first_name, last_name, phone)')
    .eq('status', 'absent')
    .order('scheduled_at', { ascending: false })
    .limit(50)
  if (error) throw error
  const customerIds = [...new Set(data.map((a) => a.customer_id))]
  const { data: notes } = customerIds.length
    ? await supabase.from('customer_notes').select('customer_id, created_at').in('customer_id', customerIds)
    : { data: [] as { customer_id: string; created_at: string }[] }
  return data.filter((a) => !(notes ?? []).some((n) => n.customer_id === a.customer_id && n.created_at > a.scheduled_at))
}

// v_customer_stats is a view with no FK Postgres/PostgREST can embed
// through, so customer names are joined in client-side.
export async function fetchInactiveCustomers(inactiveDays = 540) {
  const { data, error } = await supabase
    .from('v_customer_stats')
    .select('*')
    .not('last_purchase_at', 'is', null)
    .order('last_purchase_at', { ascending: true })
    .limit(30)
  if (error) throw error
  const inactive = data.filter((s) => (Date.now() - new Date(s.last_purchase_at!).getTime()) / MS_PER_DAY > inactiveDays)
  const ids = inactive.map((s) => s.customer_id)
  const { data: customers } = ids.length
    ? await supabase.from('customers').select('id, first_name, last_name, phone').in('id', ids)
    : { data: [] as { id: string; first_name: string; last_name: string; phone: string | null }[] }
  const customerMap = new Map((customers ?? []).map((c) => [c.id, c]))
  return inactive.map((s) => ({ ...s, customer: customerMap.get(s.customer_id) ?? null }))
}

export async function fetchStaleProspects(olderThanDays = 14) {
  const { data, error } = await supabase.from('customers').select('id, first_name, last_name, phone, created_at').contains('tags', ['Prospect'])
  if (error) throw error
  const cutoff = new Date(Date.now() - olderThanDays * MS_PER_DAY).toISOString()
  const older = data.filter((c) => c.created_at < cutoff)
  if (older.length === 0) return []
  const ids = older.map((c) => c.id)
  const { data: stats } = await supabase.from('v_customer_stats').select('customer_id, purchase_count').in('customer_id', ids)
  const withoutPurchase = new Set((stats ?? []).filter((s) => s.purchase_count === 0).map((s) => s.customer_id))
  return older.filter((c) => withoutPurchase.has(c.id))
}
