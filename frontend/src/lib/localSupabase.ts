// Local-edition drop-in replacement for '@/lib/supabase' — same shape
// (`.from(table)` query builder, `.rpc(name, args)`), so every page
// component built against the real supabase-js client keeps working
// unchanged. Every call is sent over IPC to the Electron main process
// (see desktop/db/queryEngine.js), which runs it against the local
// SQLite database. Vite resolves this file in place of the real one only
// when building with `--mode local` (see vite.config.ts).

type Filter = { col: string; op: string; value?: unknown }
type QueryResult<T = unknown> = { data: T; error: { message: string } | null; count?: number }

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
    return window.__local.query(this.d).then(onfulfilled, onrejected)
  }
}

export const supabase = {
  from(table: string) {
    return new LocalQueryBuilder(table)
  },
  rpc(name: string, args?: Record<string, unknown>) {
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
