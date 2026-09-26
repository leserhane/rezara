// Local JS ports of the Postgres RPC functions (database/setup_supabase.sql)
// that the frontend calls via `.rpc(name, args)`. Faithful ports of the
// same business rules — discount authorization, stock guards, payment
// status transitions, invoice snapshots — just running synchronously
// against SQLite instead of as SECURITY DEFINER Postgres functions.
//
// There is no Supabase Auth locally, so `auth.uid()` becomes "the
// currently active profile" — set once via setActiveUser() when an
// optician picks their name or the admin logs in (see auth.js). Exactly
// one person operates the till at a time, which is the whole point of
// the name-picker flow, so a single module-level value is enough — no
// per-request identity to thread through.

const crypto = require('crypto')
const { coerceOut } = require('./queryEngine')
const { setActiveUser, getActiveUser, isAdmin, nextDocumentNumber } = require('./session')

function uuid() { return crypto.randomUUID() }
function now() { return new Date().toISOString() }
function today() { return new Date().toISOString().slice(0, 10) }
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100 }

function requireAuth() {
  if (!getActiveUser()) throw Object.assign(new Error('not_authenticated'), { code: '28000' })
}

function getProfile(db, id) {
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id)
  return row ? coerceOut(row) : null
}

function writeAuditLog(db, action, module, entityType, entityId, oldValue, newValue) {
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, module, entity_type, entity_id, old_value, new_value, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuid(), getActiveUser(), action, module, entityType, entityId, JSON.stringify(oldValue ?? null), JSON.stringify(newValue ?? null), now())
}

// ---------------------------------------------------------------------
// apply_stock_movement
// ---------------------------------------------------------------------
function applyStockMovement(db, { p_product_id, p_type, p_quantity_change, p_reason = null, p_reference_type = null, p_reference_id = null }) {
  requireAuth()
  if (['ajustement', 'inventaire', 'entree'].includes(p_type) && !isAdmin(db)) {
    throw Object.assign(new Error('insufficient_privilege: only admin can add stock or adjust it manually'), { code: '42501' })
  }
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(p_product_id)
  if (!product) throw new Error(`product_not_found: ${p_product_id}`)

  const newQuantity = product.quantity + p_quantity_change
  if (newQuantity < 0) {
    throw Object.assign(new Error(`insufficient_stock: product ${product.name} has ${product.quantity} in stock, requested change ${p_quantity_change}`), { code: '23514' })
  }
  db.prepare('UPDATE products SET quantity = ? WHERE id = ?').run(newQuantity, p_product_id)

  const id = uuid()
  db.prepare(`
    INSERT INTO stock_movements (id, product_id, type, quantity_change, previous_quantity, new_quantity, reason, reference_type, reference_id, user_id, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, p_product_id, p_type, p_quantity_change, product.quantity, newQuantity, p_reason, p_reference_type, p_reference_id, getActiveUser(), now())
  return coerceOut(db.prepare('SELECT * FROM stock_movements WHERE id = ?').get(id))
}

// ---------------------------------------------------------------------
// create_sale
// ---------------------------------------------------------------------
function createSale(db, args) {
  requireAuth()
  const profile = getProfile(db, getActiveUser())
  if (!profile || !profile.is_active) throw Object.assign(new Error('inactive_or_unknown_profile'), { code: '28000' })
  const storeId = profile.store_id
  const items = args.p_items ?? []
  if (items.length === 0) throw new Error('sale_must_have_at_least_one_item')

  const discountAuthorizedBy = args.p_discount_authorized_by ?? null
  if (discountAuthorizedBy) {
    const authRow = db.prepare(`
      SELECT 1 FROM profiles p JOIN roles r ON r.id = p.role_id WHERE p.id = ? AND r.key = 'admin'
    `).get(discountAuthorizedBy)
    if (!authRow) throw Object.assign(new Error('discount_authorized_by_must_be_admin'), { code: '42501' })
  }

  const saleNumber = nextDocumentNumber(db, storeId, 'sale', true)
  const saleId = uuid()
  const cartDiscount = args.p_cart_discount_amount ?? 0

  db.prepare(`
    INSERT INTO sales (id, store_id, sale_number, customer_id, prescription_id, quote_id, optician_id, discount_amount, discount_authorized_by, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(saleId, storeId, saleNumber, args.p_customer_id, args.p_prescription_id ?? null, args.p_quote_id ?? null, getActiveUser(), cartDiscount, discountAuthorizedBy, now(), now())

  let subtotalHt = 0, itemsTax = 0, costTotal = 0
  const store = db.prepare('SELECT * FROM stores WHERE id = ?').get(storeId)

  for (const item of items) {
    const quantity = Number(item.quantity)
    if (!quantity || quantity <= 0) throw new Error('invalid_item_quantity')
    const itemRole = item.item_role ?? 'produit'
    const lineDiscount = Number(item.discount_amount) || 0
    let unitPriceHt, unitCostHt, taxRate, description

    if (item.product_id) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id)
      if (!product) throw new Error(`product_not_found: ${item.product_id}`)
      if (!product.is_active) throw new Error(`product_inactive: ${product.name}`)
      if (product.quantity < quantity) {
        throw new Error(`insufficient_stock_for_${product.name}: available ${product.quantity} requested ${quantity}`)
      }
      unitPriceHt = product.sale_price_ht
      unitCostHt = product.purchase_price_ht
      taxRate = product.tax_rate
      description = item.description ?? product.name
    } else {
      unitPriceHt = Number(item.unit_price_ht_override)
      if (unitPriceHt == null || Number.isNaN(unitPriceHt)) throw new Error('unit_price_ht_override_required_for_custom_line')
      unitCostHt = 0
      taxRate = item.tax_rate != null ? Number(item.tax_rate) : store.default_tax_rate
      description = item.description ?? 'Article'
    }

    db.prepare(`
      INSERT INTO sale_items (id, sale_id, product_id, item_role, description, quantity, unit_price_ht, unit_cost_ht, discount_amount, tax_rate)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(uuid(), saleId, item.product_id || null, itemRole, description, quantity, unitPriceHt, unitCostHt, lineDiscount, taxRate)

    if (item.product_id) {
      applyStockMovement(db, { p_product_id: item.product_id, p_type: 'vente', p_quantity_change: -quantity, p_reason: `Vente ${saleNumber}`, p_reference_type: 'sale', p_reference_id: saleId })
    }

    subtotalHt += round2(unitPriceHt * quantity - lineDiscount)
    itemsTax += round2((unitPriceHt * quantity - lineDiscount) * taxRate / 100)
    costTotal += round2(unitCostHt * quantity)
  }

  if (subtotalHt > 0 && !isAdmin(db)) {
    if ((cartDiscount / subtotalHt * 100) > profile.max_discount_percent && !discountAuthorizedBy) {
      throw Object.assign(new Error(`discount_exceeds_${profile.max_discount_percent}_percent_authorization_required`), { code: '42501' })
    }
  }

  const discountRatio = subtotalHt > 0 ? (subtotalHt - cartDiscount) / subtotalHt : 1
  const totalHt = round2(subtotalHt - cartDiscount)
  const taxAmount = round2(itemsTax * discountRatio)
  const totalTtc = round2(totalHt + taxAmount)
  const marginAmount = round2(totalHt - costTotal)
  const marginPercent = totalHt === 0 ? 0 : round2(marginAmount / totalHt * 100)
  const discountPercent = subtotalHt === 0 ? 0 : round2(cartDiscount / subtotalHt * 100)

  db.prepare(`
    UPDATE sales SET subtotal_ht=?, tax_amount=?, total_ht=?, total_ttc=?, cost_total=?, margin_amount=?, margin_percent=?, discount_percent=?, notes=?
    WHERE id = ?
  `).run(subtotalHt, taxAmount, totalHt, totalTtc, costTotal, marginAmount, marginPercent, discountPercent, args.p_notes ?? null, saleId)

  if ((args.p_deposit_amount ?? 0) > 0) {
    recordPayment(db, {
      p_sale_id: saleId, p_amount: args.p_deposit_amount, p_payment_type: 'acompte',
      p_payment_method_id: args.p_payment_method_id, p_cash_register_id: args.p_cash_register_id ?? null,
      p_notes: 'Acompte à la vente',
    })
  }

  const sale = coerceOut(db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId))

  const invoiceId = uuid()
  db.prepare(`
    INSERT INTO invoices (id, store_id, invoice_number, sale_id, customer_id, total_ht, tax_amount, total_ttc, amount_paid, amount_due, issued_by, issued_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(invoiceId, storeId, nextDocumentNumber(db, storeId, 'invoice', true), saleId, args.p_customer_id, sale.total_ht, sale.tax_amount, sale.total_ttc, sale.amount_paid, sale.amount_due, getActiveUser(), now())

  const saleItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId)
  for (const si of saleItems) {
    db.prepare(`
      INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price_ht, discount_amount, tax_rate, line_total_ht, line_total_ttc)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(uuid(), invoiceId, si.description, si.quantity, si.unit_price_ht, si.discount_amount, si.tax_rate, si.line_total_ht, si.line_total_ttc)
  }

  writeAuditLog(db, 'sale.create', 'sales', 'sale', saleId, null, sale)
  db.prepare(`
    INSERT INTO notifications (id, store_id, user_id, type, title, message, link, created_at)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(uuid(), storeId, null, 'nouvelle_vente', 'Nouvelle vente', `${sale.sale_number} — ${sale.total_ttc} MAD`, `/sales/${saleId}`, now())

  return coerceOut(db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId))
}

// ---------------------------------------------------------------------
// record_payment
// ---------------------------------------------------------------------
function recordPayment(db, { p_sale_id, p_amount, p_payment_type, p_payment_method_id, p_cash_register_id = null, p_reference = null, p_notes = null, p_credit_installment_id = null }) {
  requireAuth()
  if (p_amount <= 0) throw new Error('payment_amount_must_be_positive')

  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(p_sale_id)
  if (!sale) throw new Error(`sale_not_found: ${p_sale_id}`)
  if (sale.status === 'annule') throw new Error('cannot_pay_cancelled_sale')
  if (p_amount > sale.amount_due) throw new Error(`payment_exceeds_amount_due: due ${sale.amount_due} requested ${p_amount}`)

  const paymentId = uuid()
  db.prepare(`
    INSERT INTO payments (id, payment_number, sale_id, credit_installment_id, customer_id, payment_type, amount, payment_method_id, cash_register_id, reference, notes, user_id, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(paymentId, nextDocumentNumber(db, sale.store_id, 'payment', true), p_sale_id, p_credit_installment_id, sale.customer_id, p_payment_type, p_amount, p_payment_method_id, p_cash_register_id, p_reference, p_notes, getActiveUser(), now())

  const newAmountPaid = sale.amount_paid + p_amount
  const newStatus = newAmountPaid >= sale.total_ttc ? 'paye' : sale.amount_paid === 0 ? 'acompte' : 'partiellement_paye'
  db.prepare('UPDATE sales SET amount_paid = ?, status = ? WHERE id = ?').run(newAmountPaid, newStatus, p_sale_id)

  if (p_cash_register_id) {
    const movementType = p_payment_type === 'acompte' ? 'acompte' : p_payment_type === 'remboursement' ? 'remboursement' : 'solde'
    db.prepare(`
      INSERT INTO cash_movements (id, cash_register_id, type, amount, payment_method_id, reference_type, reference_id, user_id, notes, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(uuid(), p_cash_register_id, movementType, p_amount, p_payment_method_id, 'sale', p_sale_id, getActiveUser(), p_notes, now())
  }

  const updatedSale = coerceOut(db.prepare('SELECT * FROM sales WHERE id = ?').get(p_sale_id))
  db.prepare('UPDATE invoices SET amount_paid = ?, amount_due = ? WHERE sale_id = ?').run(updatedSale.amount_paid, updatedSale.amount_due, p_sale_id)

  writeAuditLog(db, 'payment.create', 'payments', 'sale', p_sale_id, sale, updatedSale)
  return updatedSale
}

// ---------------------------------------------------------------------
// open_cash_register / close_cash_register
// ---------------------------------------------------------------------
function openCashRegister(db, { p_opening_amount, p_notes = null }) {
  requireAuth()
  const profile = getProfile(db, getActiveUser())
  const already = db.prepare("SELECT 1 FROM cash_registers WHERE store_id = ? AND status = 'ouverte'").get(profile.store_id)
  if (already) throw new Error('a_cash_register_is_already_open_for_this_store')

  const id = uuid()
  db.prepare(`
    INSERT INTO cash_registers (id, store_id, opened_by, opening_amount, notes, opened_at, status)
    VALUES (?,?,?,?,?,?,'ouverte')
  `).run(id, profile.store_id, getActiveUser(), p_opening_amount, p_notes, now())
  db.prepare(`
    INSERT INTO cash_movements (id, cash_register_id, type, amount, user_id, notes, created_at)
    VALUES (?,?,?,?,?,?,?)
  `).run(uuid(), id, 'fond_ouverture', p_opening_amount, getActiveUser(), 'Fond de caisse', now())

  const register = coerceOut(db.prepare('SELECT * FROM cash_registers WHERE id = ?').get(id))
  writeAuditLog(db, 'cash_register.open', 'cash', 'cash_register', id, null, register)
  return register
}

function closeCashRegister(db, { p_cash_register_id, p_actual_cash, p_notes = null }) {
  requireAuth()
  const register = db.prepare('SELECT * FROM cash_registers WHERE id = ?').get(p_cash_register_id)
  if (!register) throw new Error('cash_register_not_found')
  if (register.status === 'cloturee' && !isAdmin(db)) {
    throw Object.assign(new Error('insufficient_privilege: register already closed'), { code: '42501' })
  }

  const movements = db.prepare(`
    SELECT cm.type as type, cm.amount as amount, pm.code as method_code
    FROM cash_movements cm LEFT JOIN payment_methods pm ON pm.id = cm.payment_method_id
    WHERE cm.cash_register_id = ?
  `).all(p_cash_register_id)

  let expectedCash = 0
  const totalsByMethod = {}
  for (const m of movements) {
    if (m.type === 'fond_ouverture') expectedCash += m.amount
    else if (m.method_code === 'especes' && ['vente', 'acompte', 'solde', 'entree'].includes(m.type)) expectedCash += m.amount
    else if (m.method_code === 'especes' && ['remboursement', 'depense', 'sortie'].includes(m.type)) expectedCash -= m.amount

    const key = m.method_code ?? 'especes'
    const sign = ['vente', 'acompte', 'solde', 'entree', 'fond_ouverture'].includes(m.type) ? 1 : -1
    totalsByMethod[key] = (totalsByMethod[key] ?? 0) + sign * m.amount
  }

  db.prepare(`
    UPDATE cash_registers SET status='cloturee', closed_by=?, closed_at=?, expected_cash=?, actual_cash=?, notes=coalesce(?, notes)
    WHERE id = ?
  `).run(getActiveUser(), now(), round2(expectedCash), p_actual_cash, p_notes, p_cash_register_id)

  const updated = coerceOut(db.prepare('SELECT * FROM cash_registers WHERE id = ?').get(p_cash_register_id))
  writeAuditLog(db, 'cash_register.close', 'cash', 'cash_register', p_cash_register_id, register, updated)
  return { register: updated, totals_by_method: totalsByMethod }
}

// ---------------------------------------------------------------------
// cancel_sale
// ---------------------------------------------------------------------
function cancelSale(db, { p_sale_id, p_reason }) {
  if (!isAdmin(db)) throw Object.assign(new Error('insufficient_privilege: only admin can cancel a sale'), { code: '42501' })
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(p_sale_id)
  if (!sale) throw new Error('sale_not_found')
  if (sale.status === 'annule') throw new Error('sale_already_cancelled')
  if (sale.amount_paid > 0) throw new Error('cannot_cancel_sale_with_payments_use_refund_first')

  const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ? AND product_id IS NOT NULL').all(p_sale_id)
  for (const item of items) {
    applyStockMovement(db, { p_product_id: item.product_id, p_type: 'retour_client', p_quantity_change: item.quantity, p_reason: `Annulation ${sale.sale_number}`, p_reference_type: 'sale', p_reference_id: p_sale_id })
  }

  db.prepare("UPDATE sales SET status='annule', cancelled_at=?, cancelled_by=?, cancel_reason=? WHERE id=?").run(now(), getActiveUser(), p_reason, p_sale_id)
  const updated = coerceOut(db.prepare('SELECT * FROM sales WHERE id = ?').get(p_sale_id))
  writeAuditLog(db, 'sale.cancel', 'sales', 'sale', p_sale_id, sale, updated)
  return updated
}

// ---------------------------------------------------------------------
// record_expense
// ---------------------------------------------------------------------
function recordExpense(db, args) {
  requireAuth()
  if (args.p_amount_ht <= 0) throw new Error('expense_amount_must_be_positive')
  const profile = getProfile(db, getActiveUser())

  if (args.p_cash_register_id) {
    if (!args.p_payment_method_id) throw new Error('payment_method_required_when_paying_from_cash_register')
    const register = db.prepare('SELECT * FROM cash_registers WHERE id = ?').get(args.p_cash_register_id)
    if (!register || register.status !== 'ouverte') throw new Error('cash_register_not_open')
  }

  const id = uuid()
  db.prepare(`
    INSERT INTO expenses (id, store_id, expense_number, category_id, supplier_id, expense_date, amount_ht, tax_amount, payment_method_id, receipt_url, user_id, comment, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, profile.store_id, nextDocumentNumber(db, profile.store_id, 'expense', true), args.p_category_id, args.p_supplier_id ?? null, args.p_expense_date ?? today(), args.p_amount_ht, args.p_tax_amount ?? 0, args.p_payment_method_id ?? null, args.p_receipt_url ?? null, getActiveUser(), args.p_comment ?? null, now())

  const expense = coerceOut(db.prepare('SELECT * FROM expenses WHERE id = ?').get(id))
  if (args.p_cash_register_id) {
    db.prepare(`
      INSERT INTO cash_movements (id, cash_register_id, type, amount, payment_method_id, reference_type, reference_id, user_id, notes, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(uuid(), args.p_cash_register_id, 'depense', expense.amount_ttc, args.p_payment_method_id, 'expense', id, getActiveUser(), args.p_comment ?? null, now())
  }
  writeAuditLog(db, 'expense.create', 'expenses', 'expense', id, null, expense)
  return expense
}

// ---------------------------------------------------------------------
// authorize_discount_override — locally, the admin's own password
// (checked against the seeded/updated profiles.password_hash) stands in
// for the cloud edition's "type an admin email + password" prompt.
// ---------------------------------------------------------------------
function authorizeDiscountOverride(db, { p_admin_email, p_admin_password }) {
  const bcrypt = require('bcryptjs')
  const admins = db.prepare(`
    SELECT p.* FROM profiles p JOIN roles r ON r.id = p.role_id WHERE r.key = 'admin' AND p.password_hash IS NOT NULL
  `).all()
  for (const admin of admins) {
    if (bcrypt.compareSync(p_admin_password, admin.password_hash)) return admin.id
  }
  throw Object.assign(new Error('invalid_credentials'), { code: '28P01' })
}

// ---------------------------------------------------------------------
// create_credit
// ---------------------------------------------------------------------
function createCredit(db, { p_sale_id, p_due_date, p_frequency, p_installments }) {
  requireAuth()
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(p_sale_id)
  if (!sale) throw new Error('sale_not_found')
  if (sale.amount_due <= 0) throw new Error('sale_has_no_outstanding_balance')
  const activeCredit = db.prepare("SELECT 1 FROM credits WHERE sale_id = ? AND status <> 'solde'").get(p_sale_id)
  if (activeCredit) throw new Error('sale_already_has_an_active_credit')

  const installmentsTotal = round2(p_installments.reduce((sum, i) => sum + Number(i.amount), 0))
  if (installmentsTotal !== round2(sale.amount_due)) {
    throw new Error(`installments_must_sum_to_amount_due: due ${sale.amount_due} installments_total ${installmentsTotal}`)
  }

  const creditId = uuid()
  db.prepare(`
    INSERT INTO credits (id, sale_id, customer_id, initial_amount, due_date, frequency, created_at)
    VALUES (?,?,?,?,?,?,?)
  `).run(creditId, p_sale_id, sale.customer_id, sale.amount_due, p_due_date, p_frequency, now())

  for (const installment of p_installments) {
    db.prepare('INSERT INTO credit_installments (id, credit_id, due_date, amount) VALUES (?,?,?,?)')
      .run(uuid(), creditId, installment.due_date, installment.amount)
  }

  db.prepare("UPDATE sales SET status = 'credit' WHERE id = ?").run(p_sale_id)
  const credit = coerceOut(db.prepare('SELECT * FROM credits WHERE id = ?').get(creditId))
  writeAuditLog(db, 'credit.create', 'credits', 'sale', p_sale_id, null, credit)
  return credit
}

// ---------------------------------------------------------------------
// convert_quote_to_sale
// ---------------------------------------------------------------------
function convertQuoteToSale(db, { p_quote_id, p_deposit_amount = 0, p_payment_method_id = null, p_cash_register_id = null }) {
  requireAuth()
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(p_quote_id)
  if (!quote) throw new Error('quote_not_found')
  if (quote.status === 'transforme') throw new Error('quote_already_converted')
  if (['refuse', 'expire'].includes(quote.status)) throw new Error(`quote_cannot_be_converted_in_status_${quote.status}`)

  const quoteItems = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(p_quote_id)
  if (quoteItems.length === 0) throw new Error('quote_has_no_items')

  const items = quoteItems.map((qi) => ({
    product_id: qi.product_id, item_role: qi.item_role, description: qi.description,
    quantity: qi.quantity, unit_price_ht_override: qi.product_id ? null : qi.unit_price_ht,
    discount_amount: qi.discount_amount,
  }))

  const sale = createSale(db, {
    p_customer_id: quote.customer_id, p_items: items, p_prescription_id: quote.prescription_id,
    p_quote_id, p_cart_discount_amount: quote.discount_amount, p_deposit_amount,
    p_payment_method_id, p_cash_register_id, p_notes: quote.notes,
  })

  db.prepare("UPDATE quotes SET status='transforme', converted_sale_id=? WHERE id=?").run(sale.id, p_quote_id)
  writeAuditLog(db, 'quote.convert', 'quotes', 'quote', p_quote_id, null, { sale_id: sale.id })
  return sale
}

// ---------------------------------------------------------------------
// update_quote_discount
// ---------------------------------------------------------------------
function updateQuoteDiscount(db, { p_quote_id, p_discount_amount }) {
  requireAuth()
  if (p_discount_amount < 0) throw new Error('discount_amount_must_be_non_negative')
  db.prepare('UPDATE quotes SET discount_amount = ? WHERE id = ?').run(p_discount_amount, p_quote_id)

  const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(p_quote_id)
  const subtotalHt = items.reduce((sum, i) => sum + i.line_total_ht, 0)
  const itemsTax = items.reduce((sum, i) => sum + (i.line_total_ttc - i.line_total_ht), 0)
  const ratio = subtotalHt > 0 ? (subtotalHt - p_discount_amount) / subtotalHt : 1
  const totalHt = round2(subtotalHt - p_discount_amount)
  const taxAmount = round2(itemsTax * ratio)
  db.prepare('UPDATE quotes SET subtotal_ht=?, tax_amount=?, total_ht=?, total_ttc=?, updated_at=? WHERE id=?')
    .run(subtotalHt, taxAmount, totalHt, round2(totalHt + taxAmount), now(), p_quote_id)

  return coerceOut(db.prepare('SELECT * FROM quotes WHERE id = ?').get(p_quote_id))
}

// ---------------------------------------------------------------------
// Cheques
// ---------------------------------------------------------------------
function recordChequePayment(db, { p_sale_id, p_cheques, p_cash_register_id = null, p_notes = null }) {
  requireAuth()
  if (!p_cheques || p_cheques.length < 1 || p_cheques.length > 5) throw new Error('cheque_count_must_be_between_1_and_5')

  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(p_sale_id)
  if (!sale) throw new Error(`sale_not_found: ${p_sale_id}`)
  const chequeMethod = db.prepare("SELECT * FROM payment_methods WHERE code = 'cheque'").get()
  if (!chequeMethod) throw new Error('cheque_payment_method_not_configured')

  let total = 0
  for (const c of p_cheques) {
    if (!c.amount || c.amount <= 0) throw new Error('each_cheque_amount_must_be_positive')
    if (!c.due_date) throw new Error('each_cheque_needs_a_due_date')
    total += Number(c.amount)
  }
  if (round2(total) > sale.amount_due) throw new Error(`cheque_total_exceeds_amount_due: due ${sale.amount_due} requested ${total}`)

  const updatedSale = recordPayment(db, {
    p_sale_id, p_amount: total, p_payment_type: total >= sale.amount_due ? 'solde' : 'acompte',
    p_payment_method_id: chequeMethod.id, p_cash_register_id, p_notes,
  })

  const payment = db.prepare('SELECT id FROM payments WHERE sale_id = ? AND payment_method_id = ? ORDER BY created_at DESC LIMIT 1').get(p_sale_id, chequeMethod.id)

  for (const c of p_cheques) {
    db.prepare(`
      INSERT INTO cheques (id, store_id, sale_id, customer_id, payment_id, cheque_number, bank_name, amount, due_date, created_by, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(uuid(), sale.store_id, p_sale_id, sale.customer_id, payment?.id ?? null, c.cheque_number || null, c.bank_name || null, c.amount, c.due_date, getActiveUser(), now())
  }

  writeAuditLog(db, 'cheque.record', 'cheques', 'sale', p_sale_id, null, { count: p_cheques.length, total })
  return updatedSale
}

function cashCheque(db, { p_cheque_id }) {
  requireAuth()
  const cheque = db.prepare('SELECT * FROM cheques WHERE id = ?').get(p_cheque_id)
  if (!cheque) throw new Error('cheque_not_found')
  if (cheque.status !== 'en_attente') throw new Error(`cheque_already_${cheque.status}`)
  db.prepare("UPDATE cheques SET status='encaisse', cashed_at=? WHERE id=?").run(now(), p_cheque_id)
  const updated = coerceOut(db.prepare('SELECT * FROM cheques WHERE id = ?').get(p_cheque_id))
  writeAuditLog(db, 'cheque.cash', 'cheques', 'cheque', p_cheque_id, null, updated)
  return updated
}

function rejectCheque(db, { p_cheque_id, p_reason = null }) {
  requireAuth()
  const cheque = db.prepare('SELECT * FROM cheques WHERE id = ?').get(p_cheque_id)
  if (!cheque) throw new Error('cheque_not_found')
  if (cheque.status !== 'en_attente') throw new Error(`cheque_already_${cheque.status}`)

  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(cheque.sale_id)
  const oldSale = { ...sale }
  const newAmountPaid = Math.max(sale.amount_paid - cheque.amount, 0)
  const newStatus = newAmountPaid <= 0 ? 'non_paye' : newAmountPaid >= sale.total_ttc ? 'paye' : 'partiellement_paye'
  db.prepare('UPDATE sales SET amount_paid=?, status=? WHERE id=?').run(newAmountPaid, newStatus, cheque.sale_id)
  const updatedSale = coerceOut(db.prepare('SELECT * FROM sales WHERE id = ?').get(cheque.sale_id))
  db.prepare('UPDATE invoices SET amount_paid=?, amount_due=? WHERE sale_id=?').run(updatedSale.amount_paid, updatedSale.amount_due, cheque.sale_id)

  db.prepare("UPDATE cheques SET status='rejete', reject_reason=? WHERE id=?").run(p_reason, p_cheque_id)
  writeAuditLog(db, 'cheque.reject', 'cheques', 'sale', cheque.sale_id, oldSale, updatedSale)
  return coerceOut(db.prepare('SELECT * FROM cheques WHERE id = ?').get(p_cheque_id))
}

// ---------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------
function startInventory(db, { p_notes = null }) {
  requireAuth()
  const profile = getProfile(db, getActiveUser())
  const inProgress = db.prepare("SELECT 1 FROM inventories WHERE store_id = ? AND status = 'en_cours'").get(profile.store_id)
  if (inProgress) throw new Error('inventory_already_in_progress: close or cancel it before starting a new one')

  const id = uuid()
  db.prepare(`
    INSERT INTO inventories (id, store_id, reference, started_by, notes, started_at)
    VALUES (?,?,?,?,?,?)
  `).run(id, profile.store_id, nextDocumentNumber(db, profile.store_id, 'inventaire', true), getActiveUser(), p_notes, now())

  const products = db.prepare('SELECT id, quantity FROM products WHERE store_id = ? AND is_active = 1').all(profile.store_id)
  for (const p of products) {
    db.prepare('INSERT INTO inventory_items (id, inventory_id, product_id, theoretical_quantity) VALUES (?,?,?,?)')
      .run(uuid(), id, p.id, p.quantity)
  }
  const inventory = coerceOut(db.prepare('SELECT * FROM inventories WHERE id = ?').get(id))
  writeAuditLog(db, 'inventory.start', 'inventories', 'inventory', id, null, inventory)
  return inventory
}

function validateInventory(db, { p_inventory_id }) {
  if (!isAdmin(db)) throw Object.assign(new Error('insufficient_privilege: only admin can validate an inventory'), { code: '42501' })
  const inventory = db.prepare('SELECT * FROM inventories WHERE id = ?').get(p_inventory_id)
  if (!inventory) throw new Error(`inventory_not_found: ${p_inventory_id}`)
  if (inventory.status !== 'en_cours') throw new Error(`inventory_already_${inventory.status}`)

  const items = db.prepare('SELECT * FROM inventory_items WHERE inventory_id = ? AND counted_quantity IS NOT NULL AND difference <> 0').all(p_inventory_id)
  for (const item of items) {
    applyStockMovement(db, { p_product_id: item.product_id, p_type: 'inventaire', p_quantity_change: item.difference, p_reason: `Inventaire ${inventory.reference}`, p_reference_type: 'inventory', p_reference_id: p_inventory_id })
  }

  db.prepare("UPDATE inventories SET status='valide', validated_by=?, validated_at=? WHERE id=?").run(getActiveUser(), now(), p_inventory_id)
  const updated = coerceOut(db.prepare('SELECT * FROM inventories WHERE id = ?').get(p_inventory_id))
  writeAuditLog(db, 'inventory.validate', 'inventories', 'inventory', p_inventory_id, null, updated)
  return updated
}

function cancelInventory(db, { p_inventory_id }) {
  if (!isAdmin(db)) throw Object.assign(new Error('insufficient_privilege: only admin can cancel an inventory'), { code: '42501' })
  const inventory = db.prepare('SELECT * FROM inventories WHERE id = ?').get(p_inventory_id)
  if (!inventory) throw new Error(`inventory_not_found: ${p_inventory_id}`)
  if (inventory.status !== 'en_cours') throw new Error(`inventory_already_${inventory.status}`)
  db.prepare("UPDATE inventories SET status='annule' WHERE id=?").run(p_inventory_id)
  const updated = coerceOut(db.prepare('SELECT * FROM inventories WHERE id = ?').get(p_inventory_id))
  writeAuditLog(db, 'inventory.cancel', 'inventories', 'inventory', p_inventory_id, null, updated)
  return updated
}

// ---------------------------------------------------------------------
// reallocate_invoice_item_prices
// ---------------------------------------------------------------------
function reallocateInvoiceItemPrices(db, { p_invoice_id, p_items }) {
  requireAuth()
  if (!p_items || p_items.length < 1) throw new Error('no_items_to_update')
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(p_invoice_id)
  if (!invoice) throw new Error(`invoice_not_found: ${p_invoice_id}`)

  let oldTotal = 0, newTotal = 0
  const lines = []
  for (const item of p_items) {
    const line = db.prepare('SELECT * FROM invoice_items WHERE id = ? AND invoice_id = ?').get(item.invoice_item_id, p_invoice_id)
    if (!line) throw new Error(`invoice_item_not_found_on_this_invoice: ${item.invoice_item_id}`)
    oldTotal += line.line_total_ttc
    const newPriceTtc = Number(item.new_price_ttc)
    if (newPriceTtc == null || Number.isNaN(newPriceTtc) || newPriceTtc < 0) throw new Error('new_price_ttc_must_be_zero_or_positive')
    newTotal += newPriceTtc
    lines.push({ line, newPriceTtc })
  }
  if (Math.abs(round2(newTotal - oldTotal)) > 0.01) {
    throw new Error(`reallocation_must_preserve_the_invoice_total: was ${oldTotal} now ${newTotal}`)
  }

  for (const { line, newPriceTtc } of lines) {
    const newLineTotalHt = round2(newPriceTtc / (1 + line.tax_rate / 100))
    const newUnitPriceHt = round2((newLineTotalHt + line.discount_amount) / line.quantity)
    db.prepare('UPDATE invoice_items SET unit_price_ht=?, line_total_ht=?, line_total_ttc=? WHERE id=?')
      .run(newUnitPriceHt, newLineTotalHt, newPriceTtc, line.id)
  }

  writeAuditLog(db, 'invoice.reallocate_prices', 'invoices', 'invoice', p_invoice_id, { total_ttc: oldTotal }, { total_ttc: newTotal })
  return coerceOut(invoice)
}

// ---------------------------------------------------------------------

const RPCS = {
  apply_stock_movement: applyStockMovement,
  create_sale: createSale,
  record_payment: recordPayment,
  open_cash_register: openCashRegister,
  close_cash_register: closeCashRegister,
  cancel_sale: cancelSale,
  record_expense: recordExpense,
  authorize_discount_override: authorizeDiscountOverride,
  create_credit: createCredit,
  convert_quote_to_sale: convertQuoteToSale,
  update_quote_discount: updateQuoteDiscount,
  record_cheque_payment: recordChequePayment,
  cash_cheque: cashCheque,
  reject_cheque: rejectCheque,
  start_inventory: startInventory,
  validate_inventory: validateInventory,
  cancel_inventory: cancelInventory,
  reallocate_invoice_item_prices: reallocateInvoiceItemPrices,
}

function callRpc(db, name, args) {
  const fn = RPCS[name]
  if (!fn) return { data: null, error: { message: `unknown RPC: ${name}` } }
  try {
    const result = db.transaction(() => fn(db, args ?? {}))()
    return { data: result, error: null }
  } catch (e) {
    return { data: null, error: { message: e.message, code: e.code } }
  }
}

module.exports = { callRpc, setActiveUser, getActiveUser, isAdmin, nextDocumentNumber }
