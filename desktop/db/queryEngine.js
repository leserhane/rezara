// Executes query descriptors built by the frontend's local Supabase-shaped
// client (see frontend/src/lib/localSupabase.ts) against the local SQLite
// database. This is not a general SQL engine — it implements exactly the
// subset of the PostgREST query-builder surface actually used across the
// app (audited via grep: eq/neq/gt/gte/lt/lte/in/or/ilike/not/contains/
// order/limit/single/maybeSingle/select/insert/update/delete), so every
// existing page works against either backend without changes.

const crypto = require('crypto')
const { isAdmin, nextDocumentNumber } = require('./session')

// v_products/v_sales/v_sale_items in the cloud schema are Postgres views
// that null out cost/margin columns for non-admins via is_admin() inside
// the view definition. A SQLite view can't take a per-session parameter
// like that — and worse, a *registered SQL function* calling back into
// db.prepare() while the outer SELECT is still stepping through rows
// hits better-sqlite3's "database connection is busy" reentrancy limit.
// So these three are handled as views over the real table here: run the
// query against the real table, then null out the gated columns in JS
// before returning, once, after the statement has already finished.
const ADMIN_GATED_VIEWS = {
  v_products: { realTable: 'products', gatedColumns: ['purchase_price_ht', 'margin_amount', 'margin_percent'] },
  v_low_stock_products: { realTable: 'products', gatedColumns: ['purchase_price_ht', 'margin_amount', 'margin_percent'], extraWhere: 'quantity <= stock_min AND is_active = 1' },
  v_sales: { realTable: 'sales', gatedColumns: ['cost_total'] },
  v_sale_items: { realTable: 'sale_items', gatedColumns: ['unit_cost_ht', 'line_cost_total'] },
}

// Parent table -> { relationNameInSelectString: foreignKeyColumnOnParent }.
// Kept in lockstep with the FkTo<...> declarations in
// frontend/src/types/database.ts — that file is the source of truth for
// which embedded-relation calls the frontend actually makes.
const RELATIONS = {
  customer_notes: { profiles: 'created_by' },
  prescriptions: { customers: 'customer_id' },
  sales: { customers: 'customer_id' },
  sale_items: { products: 'product_id' },
  payments: { payment_methods: 'payment_method_id' },
  credits: { sales: 'sale_id', customers: 'customer_id' },
  cheques: { sales: 'sale_id', customers: 'customer_id' },
  inventories: { profiles: 'started_by' },
  inventory_items: { products: 'product_id' },
  cash_movements: { payment_methods: 'payment_method_id' },
  invoices: { customers: 'customer_id' },
  expenses: { expense_categories: 'category_id' },
  quotes: { customers: 'customer_id' },
  orders: { suppliers: 'supplier_id', customers: 'customer_id' },
  deliveries: { sales: 'sale_id' },
  appointments: { customers: 'customer_id' },
  lens_order_sheets: { suppliers: 'supplier_id' },
}

const BOOLEAN_COLUMNS = new Set(['is_active', 'is_read', 'is_system'])
const JSON_COLUMNS = new Set(['tags', 'categories'])

// Columns SQLite computes itself (GENERATED ALWAYS AS ...) — writing to
// them is rejected outright, so any accidental key in an insert/update
// payload is dropped rather than erroring the whole request.
const GENERATED_COLUMNS = new Set([
  'sale_price_ttc', 'margin_amount', 'margin_percent', 'difference',
  'line_total_ht', 'line_total_ttc', 'line_cost_total', 'line_margin',
  'amount_due', 'cash_difference', 'balance', 'amount_ttc',
])

// In the cloud schema these columns are filled by a BEFORE INSERT trigger
// (assign_*_number in database/setup_supabase.sql) that always overwrites
// any client-sent value — "numbers are automatic, not user-entered". sales/
// invoices/payments get theirs from inside the create_sale/record_payment
// RPCs instead (see rpcs.js), since those rows are never created via a raw
// table insert from the frontend.
const AUTO_NUMBERED_TABLES = {
  customers: { column: 'customer_number', docType: 'customer', yearScoped: false },
  quotes: { column: 'quote_number', docType: 'quote', yearScoped: true },
  orders: { column: 'order_number', docType: 'order', yearScoped: true },
  expenses: { column: 'expense_number', docType: 'expense', yearScoped: true },
}

function uuid() {
  return crypto.randomUUID()
}

function coerceOut(row) {
  if (!row) return row
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    if (BOOLEAN_COLUMNS.has(k)) out[k] = !!v
    else if (JSON_COLUMNS.has(k) && typeof v === 'string') {
      try { out[k] = JSON.parse(v) } catch { out[k] = v }
    } else out[k] = v
  }
  return out
}

function coerceIn(row) {
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    if (GENERATED_COLUMNS.has(k)) continue
    if (v === undefined) continue
    if (JSON_COLUMNS.has(k)) out[k] = JSON.stringify(v ?? [])
    else if (typeof v === 'boolean') out[k] = v ? 1 : 0
    else out[k] = v
  }
  return out
}

function parseSelect(selectStr) {
  const str = (selectStr || '*').trim()
  const parts = []
  let depth = 0
  let current = ''
  for (const ch of str) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) { parts.push(current.trim()); current = '' }
    else current += ch
  }
  if (current.trim()) parts.push(current.trim())

  const columns = []
  const relations = []
  for (const part of parts) {
    const m = part.match(/^(\w+)\(([^)]*)\)$/)
    if (m) relations.push({ name: m[1], columns: m[2].split(',').map((s) => s.trim()).filter(Boolean) })
    else if (part) columns.push(part)
  }
  return { columns: columns.length ? columns : ['*'], relations }
}

// Postgrest's .or('a.ilike.%x%,b.eq.5') mini-language: comma-separated
// "column.operator.value" clauses, OR'd together.
function buildOrClause(orString, params) {
  const clauses = orString.split(',').map((c) => c.trim()).filter(Boolean)
  const sqlParts = []
  for (const clause of clauses) {
    const [col, op, ...rest] = clause.split('.')
    const value = rest.join('.')
    if (op === 'ilike' || op === 'like') { sqlParts.push(`"${col}" LIKE ?`); params.push(toParam(value)) }
    else if (op === 'eq') { sqlParts.push(`"${col}" = ?`); params.push(toParam(value)) }
    else if (op === 'neq') { sqlParts.push(`"${col}" != ?`); params.push(toParam(value)) }
    else if (op === 'is' && value === 'null') { sqlParts.push(`"${col}" IS NULL`) }
    else if (op === 'is' && value === 'not.null') { sqlParts.push(`"${col}" IS NOT NULL`) }
    else { sqlParts.push(`"${col}" = ?`); params.push(toParam(value)) }
  }
  return sqlParts.length ? `(${sqlParts.join(' OR ')})` : '1=1'
}

// better-sqlite3 refuses to bind raw JS booleans ("SQLite3 can only bind
// ... booleans are not supported") — the frontend's query builder passes
// through whatever JS value a page calls .eq(col, true/false) with (e.g.
// .eq('is_active', true)), so every param must be normalized here before
// it reaches db.prepare(...).all()/run().
function toParam(v) {
  return typeof v === 'boolean' ? (v ? 1 : 0) : v
}

function buildWhere(filters) {
  const clauses = []
  const params = []
  for (const f of filters) {
    const col = `"${f.col}"`
    switch (f.op) {
      case 'eq': clauses.push(`${col} = ?`); params.push(toParam(f.value)); break
      case 'neq': clauses.push(`${col} != ?`); params.push(toParam(f.value)); break
      case 'gt': clauses.push(`${col} > ?`); params.push(toParam(f.value)); break
      case 'gte': clauses.push(`${col} >= ?`); params.push(toParam(f.value)); break
      case 'lt': clauses.push(`${col} < ?`); params.push(toParam(f.value)); break
      case 'lte': clauses.push(`${col} <= ?`); params.push(toParam(f.value)); break
      case 'ilike': clauses.push(`${col} LIKE ?`); params.push(toParam(f.value)); break
      case 'in': {
        const arr = f.value.length ? f.value : ['__none__']
        clauses.push(`${col} IN (${arr.map(() => '?').join(',')})`)
        params.push(...arr.map(toParam))
        break
      }
      case 'not_is_null': clauses.push(`${col} IS NOT NULL`); break
      case 'is_null': clauses.push(`${col} IS NULL`); break
      case 'contains': {
        // JSON array column contains all given values (tags/categories).
        for (const v of f.value) {
          clauses.push(`EXISTS (SELECT 1 FROM json_each(${col}) WHERE json_each.value = ?)`)
          params.push(toParam(v))
        }
        break
      }
      case 'or': clauses.push(buildOrClause(f.value, params)); break
      default: break
    }
  }
  return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params }
}

function fetchRelations(db, table, rows) {
  const relDefs = RELATIONS[table]
  if (!relDefs || rows.length === 0) return
  for (const [relName, fkCol] of Object.entries(relDefs)) {
    const ids = [...new Set(rows.map((r) => r[fkCol]).filter((v) => v != null))]
    if (ids.length === 0) { for (const r of rows) r[relName] = null; continue }
    const placeholders = ids.map(() => '?').join(',')
    const related = db.prepare(`SELECT * FROM "${relName}" WHERE id IN (${placeholders})`).all(...ids)
    const map = new Map(related.map((r) => [r.id, coerceOut(r)]))
    for (const r of rows) r[relName] = r[fkCol] != null ? (map.get(r[fkCol]) ?? null) : null
  }
}

function projectColumns(row, columns, relations) {
  if (columns.includes('*')) {
    const out = { ...row }
    for (const rel of relations) out[rel.name] = row[rel.name]
    return out
  }
  const out = {}
  for (const c of columns) {
    const alias = c.includes(':') ? c.split(':')[0].trim() : c
    const src = c.includes(':') ? c.split(':')[1].trim() : c
    out[alias] = row[src]
  }
  for (const rel of relations) {
    if (!row[rel.name]) { out[rel.name] = row[rel.name]; continue }
    if (rel.columns.length === 0) out[rel.name] = row[rel.name]
    else {
      const sub = {}
      for (const c of rel.columns) sub[c] = row[rel.name][c]
      out[rel.name] = sub
    }
  }
  return out
}

function runQuery(db, q) {
  try {
    if (q.action === 'select') return runSelect(db, q)
    if (q.action === 'insert') return runInsert(db, q)
    if (q.action === 'update') return runUpdate(db, q)
    if (q.action === 'delete') return runDelete(db, q)
    return { data: null, error: { message: `unsupported action: ${q.action}` } }
  } catch (e) {
    return { data: null, error: { message: e.message } }
  }
}

function runSelect(db, q) {
  const { columns, relations } = parseSelect(q.columns)
  const { sql: whereSql, params } = buildWhere(q.filters)

  const gatedView = ADMIN_GATED_VIEWS[q.table]
  const realTable = gatedView ? gatedView.realTable : q.table
  const extraWhereSql = gatedView?.extraWhere
    ? (whereSql ? `${whereSql} AND ${gatedView.extraWhere}` : `WHERE ${gatedView.extraWhere}`)
    : whereSql

  if (q.count === 'exact' && q.head) {
    const row = db.prepare(`SELECT COUNT(*) as c FROM "${realTable}" ${extraWhereSql}`).get(...params)
    return { data: null, error: null, count: row.c }
  }

  let orderSql = ''
  let jsSortRelationCol = null
  if (q.order) {
    const m = q.order.column.match(/^(\w+)\((\w+)\)$/)
    if (m) jsSortRelationCol = { relation: m[1], col: m[2] }
    else orderSql = ` ORDER BY "${q.order.column}" ${q.order.ascending === false ? 'DESC' : 'ASC'}`
  }
  const limitSql = q.limitN != null ? ` LIMIT ${Number(q.limitN)}` : ''

  let rows = db.prepare(`SELECT * FROM "${realTable}" ${extraWhereSql}${orderSql}${limitSql}`).all(...params)
  rows = rows.map(coerceOut)
  if (gatedView && !isAdmin(db)) {
    for (const row of rows) for (const col of gatedView.gatedColumns) row[col] = null
  }
  if (relations.length) fetchRelations(db, realTable, rows)

  if (jsSortRelationCol) {
    rows.sort((a, b) => {
      const av = a[jsSortRelationCol.relation]?.[jsSortRelationCol.col] ?? ''
      const bv = b[jsSortRelationCol.relation]?.[jsSortRelationCol.col] ?? ''
      return av < bv ? -1 : av > bv ? 1 : 0
    })
  }

  const projected = rows.map((r) => projectColumns(r, columns, relations))

  if (q.single) {
    if (projected.length !== 1) return { data: null, error: projected.length === 0 ? { message: 'no rows found' } : { message: 'multiple rows found' } }
    return { data: projected[0], error: null }
  }
  if (q.maybeSingle) {
    if (projected.length > 1) return { data: null, error: { message: 'multiple rows found' } }
    return { data: projected[0] ?? null, error: null }
  }
  return { data: projected, error: null }
}

function runInsert(db, q) {
  const rowsIn = Array.isArray(q.values) ? q.values : [q.values]
  const inserted = []
  const txn = db.transaction(() => {
    for (const raw of rowsIn) {
      const row = coerceIn(raw)
      if (!row.id) row.id = uuid()
      const autoNumber = AUTO_NUMBERED_TABLES[q.table]
      if (autoNumber) row[autoNumber.column] = nextDocumentNumber(db, row.store_id, autoNumber.docType, autoNumber.yearScoped)
      const cols = Object.keys(row)
      const placeholders = cols.map(() => '?').join(',')
      db.prepare(`INSERT INTO "${q.table}" (${cols.map((c) => `"${c}"`).join(',')}) VALUES (${placeholders})`)
        .run(...cols.map((c) => row[c]))
      inserted.push(row.id)
    }
  })
  txn()

  const placeholders = inserted.map(() => '?').join(',')
  let rows = db.prepare(`SELECT * FROM "${q.table}" WHERE id IN (${placeholders})`).all(...inserted).map(coerceOut)
  const { columns, relations } = parseSelect(q.columns)
  if (relations.length) fetchRelations(db, q.table, rows)
  const projected = rows.map((r) => projectColumns(r, columns, relations))

  if (q.single) return projected.length === 1 ? { data: projected[0], error: null } : { data: null, error: { message: 'insert did not return exactly one row' } }
  if (q.maybeSingle) return { data: projected[0] ?? null, error: null }
  return { data: projected, error: null }
}

function runUpdate(db, q) {
  const row = coerceIn(q.values)
  const cols = Object.keys(row)
  if (cols.length === 0) return { data: [], error: null }
  const { sql: whereSql, params } = buildWhere(q.filters)
  const setSql = cols.map((c) => `"${c}" = ?`).join(',')
  db.prepare(`UPDATE "${q.table}" SET ${setSql} ${whereSql}`).run(...cols.map((c) => row[c]), ...params)

  if (!q.columns) return { data: null, error: null }
  let rows = db.prepare(`SELECT * FROM "${q.table}" ${whereSql}`).all(...params).map(coerceOut)
  const { columns, relations } = parseSelect(q.columns)
  if (relations.length) fetchRelations(db, q.table, rows)
  const projected = rows.map((r) => projectColumns(r, columns, relations))
  if (q.single) return projected.length === 1 ? { data: projected[0], error: null } : { data: null, error: { message: 'update did not return exactly one row' } }
  if (q.maybeSingle) return { data: projected[0] ?? null, error: null }
  return { data: projected, error: null }
}

function runDelete(db, q) {
  const { sql: whereSql, params } = buildWhere(q.filters)
  db.prepare(`DELETE FROM "${q.table}" ${whereSql}`).run(...params)
  return { data: null, error: null }
}

module.exports = { runQuery, uuid, coerceOut, coerceIn }
