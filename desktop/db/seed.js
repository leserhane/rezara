// Fresh-install seed: reference data + the one admin account. Deliberately
// no demo customers/products/sales — a local install starts empty, per
// the store's decision to keep this edition separate from the cloud one
// and free of leftover test data.
//
// The admin password is stored here only as a bcrypt hash — irreversible,
// same as any real auth system — never as plaintext. Computed once via
// `node -e "console.log(require('bcryptjs').hashSync('...', 10))"`.

const crypto = require('crypto')

function uuid() { return crypto.randomUUID() }

const ADMIN_PASSWORD_HASH = '$2a$10$Vx18Trl8Wcl3jGEm3GC8Suzoi4xKTJcz9/fhV0CkteC.T3FheiOuW'

function seedIfEmpty(db) {
  const already = db.prepare('SELECT 1 FROM stores LIMIT 1').get()
  if (already) return

  const storeId = uuid()
  const adminRoleId = uuid()
  const opticienRoleId = uuid()
  const adminId = uuid()

  const txn = db.transaction(() => {
    db.prepare("INSERT INTO roles (id, key, name, description) VALUES (?,?,?,?)")
      .run(adminRoleId, 'admin', 'Administrateur', "Accès complet à l'application")
    db.prepare("INSERT INTO roles (id, key, name, description) VALUES (?,?,?,?)")
      .run(opticienRoleId, 'opticien', 'Opticien', 'Accès opérationnel quotidien')

    db.prepare(`
      INSERT INTO stores (id, name, address, phone, email, ice, currency, default_tax_rate)
      VALUES (?, 'Optimum Optic', 'Rabat, Maroc', '+212 5 00 00 00 00', 'contact@optimumoptic.com', '000000000000000', 'MAD', 20.00)
    `).run(storeId)

    db.prepare('INSERT INTO store_settings (store_id) VALUES (?)').run(storeId)

    const paymentMethods = [
      ['especes', 'Espèces'], ['carte', 'Carte bancaire'], ['virement', 'Virement'],
      ['cheque', 'Chèque'], ['mobile', 'Paiement mobile'], ['autre', 'Autre'],
    ]
    for (const [code, name] of paymentMethods) {
      db.prepare('INSERT INTO payment_methods (id, code, name) VALUES (?,?,?)').run(uuid(), code, name)
    }

    const expenseCategories = [
      'Loyer', 'Salaires', 'Fournisseurs', 'Électricité', 'Eau', 'Internet',
      'Marketing', 'Transport', 'Entretien', 'Matériel', 'Taxes', 'Autres',
    ]
    for (const name of expenseCategories) {
      db.prepare('INSERT INTO expense_categories (id, name) VALUES (?,?)').run(uuid(), name)
    }

    const productCategories = [
      ['Optique Homme', 'optique_homme'], ['Optique Femme', 'optique_femme'],
      ['Optique Enfant', 'optique_enfant'], ['Solaire Homme', 'solaire_homme'],
      ['Solaire Femme', 'solaire_femme'], ['Solaire Enfant', 'solaire_enfant'],
      ['Sport', 'sport'], ['Premium', 'premium'], ['Autres', 'autres'],
    ]
    for (const [name, groupKey] of productCategories) {
      db.prepare('INSERT INTO product_categories (id, name, group_key) VALUES (?,?,?)').run(uuid(), name, groupKey)
    }

    db.prepare(`
      INSERT INTO profiles (id, store_id, role_id, first_name, last_name, password_hash, max_discount_percent, is_active)
      VALUES (?, ?, ?, 'Abir', 'S.', ?, 100, 1)
    `).run(adminId, storeId, adminRoleId, ADMIN_PASSWORD_HASH)
  })
  txn()
}

module.exports = { seedIfEmpty }
