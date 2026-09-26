// Shared "who is acting right now" state — extracted to its own module so
// both queryEngine.js (admin-gated column masking) and rpcs.js (business
// rule checks) can read it without requiring each other.

let currentUserId = null
function setActiveUser(id) { currentUserId = id }
function getActiveUser() { return currentUserId }

function isAdmin(db) {
  if (!currentUserId) return false
  const row = db.prepare(`
    SELECT r.key FROM profiles p JOIN roles r ON r.id = p.role_id WHERE p.id = ?
  `).get(currentUserId)
  return row?.key === 'admin'
}

// Ports next_document_number() from database/setup_supabase.sql. Shared here
// (rather than living in rpcs.js) so queryEngine.js's runInsert can also
// call it for the tables whose numbers are assigned by a BEFORE INSERT
// trigger in the cloud schema (customers/quotes/orders/expenses) instead of
// inside an RPC — importing rpcs.js from queryEngine.js would be circular,
// since rpcs.js itself imports queryEngine.js for coerceOut.
function nextDocumentNumber(db, storeId, docType, yearScoped = true) {
  const settings = db.prepare('SELECT * FROM store_settings WHERE store_id = ?').get(storeId)
  if (!settings) throw new Error(`store_settings not found for store ${storeId}`)
  const prefixByType = {
    customer: settings.customer_number_prefix, sale: settings.sale_number_prefix,
    quote: settings.quote_number_prefix, order: settings.order_number_prefix,
    payment: settings.payment_number_prefix, invoice: settings.invoice_number_prefix,
    expense: settings.expense_number_prefix,
  }
  const prefix = prefixByType[docType] ?? docType.toUpperCase()
  const year = yearScoped ? new Date().getFullYear() : 0

  const existing = db.prepare('SELECT last_value FROM document_sequences WHERE store_id = ? AND doc_type = ? AND year = ?').get(storeId, docType, year)
  const next = (existing?.last_value ?? 0) + 1
  if (existing) db.prepare('UPDATE document_sequences SET last_value = ? WHERE store_id = ? AND doc_type = ? AND year = ?').run(next, storeId, docType, year)
  else db.prepare('INSERT INTO document_sequences (store_id, doc_type, year, last_value) VALUES (?,?,?,?)').run(storeId, docType, year, next)

  const padded = String(next).padStart(6, '0')
  return yearScoped ? `${prefix}-${year}-${padded}` : `${prefix}-${padded}`
}

module.exports = { setActiveUser, getActiveUser, isAdmin, nextDocumentNumber }
