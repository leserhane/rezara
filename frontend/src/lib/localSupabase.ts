// Local-edition drop-in replacement for '@/lib/supabase' — same shape
// (`.from(table)` query builder, `.rpc(name, args)`), so every page
// component built against the real supabase-js client keeps working
// unchanged. Every call is sent over IPC to the Electron main process
// (see desktop/db/queryEngine.js), which runs it against the local
// SQLite database. Vite resolves this file in place of the real one only
// when building with `--mode local` (see vite.config.ts).

type Filter = { col: string; op: string; value?: unknown }
type QueryResult<T = unknown> = { data: T; error: { message: string } | null; count?: number }

// Opticians aren't accounts — there's no persistent "logged in optician"
// session. While the app is in the unattributed "Opticien" shell (see
// LocalAuthContext.enterOpticianShell), profile.id holds this sentinel
// placeholder instead of a real profile id. LocalAuthContext registers
// opticianGate.request with a function that opens the scrolling
// name-picker modal and resolves with the chosen profile (or null if
// cancelled) — every single time a create-action needs to know who's
// actually doing it, fresh, with no memory between actions.
export const UNPICKED_OPTICIAN_ID = '00000000-0000-0000-0000-000000000000'

interface PickedProfile { id: string; store_id: string; max_discount_percent: number }

export const opticianGate: {
  active: boolean
  request: (() => Promise<PickedProfile | null>) | null
} = { active: false, request: null }

// RPCs excluded from the automatic "pick an optician, run, revert" gate:
// authorize_discount_override doesn't use the active user at all (it
// checks an admin's own password), and create_sale needs its own gate in
// NewSalePage.tsx so it can check the *picked* optician's discount limit
// before submitting (and reuse that same pick across a retry after an
// admin override), rather than picking blind and finding out after. Pages
// that resolve their own pick this way call window.__local.rpc(...)
// directly for any follow-up RPC of the same action (see NewSalePage's
// record_cheque_payment, NewQuotePage's update_quote_discount) so it isn't
// asked a second time by this generic wrapper.
const RPC_GATE_EXCLUDED = new Set(['authorize_discount_override', 'create_sale'])

function containsUnpickedId(values: unknown): boolean {
  if (Array.isArray(values)) return values.some(containsUnpickedId)
  if (values && typeof values === 'object') return Object.values(values as Record<string, unknown>).some((v) => v === UNPICKED_OPTICIAN_ID)
  return values === UNPICKED_OPTICIAN_ID
}

// Replaces the sentinel anywhere it appears in an insert/update payload
// with the just-picked optician's real id.
function substituteUnpickedId(values: unknown, realId: string): unknown {
  if (Array.isArray(values)) return values.map((v) => substituteUnpickedId(v, realId))
  if (values && typeof values === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(values as Record<string, unknown>)) {
      out[k] = v === UNPICKED_OPTICIAN_ID ? realId : v
    }
    return out
  }
  return values
}

declare global {
  interface Window {
    __local: {
      query: (descriptor: unknown) => Promise<QueryResult>
      rpc: (name: string, args: unknown) => Promise<QueryResult>
      listProfiles: () => Promise<unknown[]>
      pickOptician: (id: string) => Promise<QueryResult>
      adminLogin: (id: string, password: string) => Promise<QueryResult>
      createProfile: (payload: unknown) => Promise<QueryResult>
      signOut: () => Promise<{ error: null }>
      getActiveProfile: () => Promise<unknown>
    }
  }
}

class LocalQueryBuilder implements PromiseLike<QueryResult> {
  private d: {
    table: string
    action: 'select' | 'insert' | 'update' | 'delete'
    columns?: string
    values?: unknown
    filters: Filter[]
    order?: { column: string; ascending: boolean }
    limitN?: number
    single?: boolean
    maybeSingle?: boolean
    count?: string
    head?: boolean
  }

  constructor(table: string) {
    this.d = { table, action: 'select', filters: [] }
  }

  select(columns?: string, opts?: { count?: string; head?: boolean }) {
    this.d.columns = columns
    if (opts?.count) this.d.count = opts.count
    if (opts?.head) this.d.head = opts.head
    return this
  }
  insert(values: unknown) { this.d.action = 'insert'; this.d.values = values; return this }
  update(values: unknown) { this.d.action = 'update'; this.d.values = values; return this }
  delete() { this.d.action = 'delete'; return this }

  eq(col: string, value: unknown) { this.d.filters.push({ col, op: 'eq', value }); return this }
  neq(col: string, value: unknown) { this.d.filters.push({ col, op: 'neq', value }); return this }
  gt(col: string, value: unknown) { this.d.filters.push({ col, op: 'gt', value }); return this }
  gte(col: string, value: unknown) { this.d.filters.push({ col, op: 'gte', value }); return this }
  lt(col: string, value: unknown) { this.d.filters.push({ col, op: 'lt', value }); return this }
  lte(col: string, value: unknown) { this.d.filters.push({ col, op: 'lte', value }); return this }
  in(col: string, values: unknown[]) { this.d.filters.push({ col, op: 'in', value: values }); return this }
  ilike(col: string, pattern: string) { this.d.filters.push({ col, op: 'ilike', value: pattern }); return this }
  contains(col: string, values: unknown[]) { this.d.filters.push({ col, op: 'contains', value: values }); return this }
  or(clauseString: string) { this.d.filters.push({ col: '', op: 'or', value: clauseString }); return this }
  not(col: string, _operator: 'is', _value: null) { this.d.filters.push({ col, op: 'not_is_null' }); return this }

  order(column: string, opts?: { ascending?: boolean }) { this.d.order = { column, ascending: opts?.ascending !== false }; return this }
  limit(n: number) { this.d.limitN = n; return this }
  single() { this.d.single = true; return this }
  maybeSingle() { this.d.maybeSingle = true; return this }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute(): Promise<QueryResult> {
    // Any insert/update whose payload still carries the "no optician
    // picked yet" sentinel (i.e. a page just used profile.id/store_id as
    // normal, without resolving its own pick first) needs a name before it
    // can go out — this covers every create-action automatically, with no
    // per-table list to keep in sync. A page that already resolved its own
    // pick (NewSalePage, NewQuotePage) builds its payload with the real id
    // from the start, so its payload never contains the sentinel and this
    // never fires for it.
    if (opticianGate.active && (this.d.action === 'insert' || this.d.action === 'update') && containsUnpickedId(this.d.values)) {
      const picked = opticianGate.request ? await opticianGate.request() : null
      if (!picked) return { data: null, error: { message: "Sélection de l'opticien annulée." } }
      this.d.values = substituteUnpickedId(this.d.values, picked.id)
    }
    return window.__local.query(this.d)
  }
}

export const supabase = {
  from(table: string) {
    return new LocalQueryBuilder(table)
  },
  async rpc(name: string, args?: Record<string, unknown>) {
    if (opticianGate.active && !RPC_GATE_EXCLUDED.has(name)) {
      const picked = opticianGate.request ? await opticianGate.request() : null
      if (!picked) return { data: null, error: { message: "Sélection de l'opticien annulée." } }
      await window.__local.pickOptician(picked.id)
      const result = await window.__local.rpc(name, args ?? {})
      await window.__local.signOut()
      return result
    }
    return window.__local.rpc(name, args ?? {})
  },
  // No realtime push in the local edition (single process, single
  // machine) — NotificationBell's live-update subscription becomes a
  // harmless no-op; its initial .from('notifications').select() load
  // still works normally.
  channel(_name: string) {
    const chan = { on: () => chan, subscribe: () => chan }
    return chan
  },
  removeChannel(_channel: unknown) {},
}
