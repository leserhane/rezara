const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { setActiveUser } = require('./rpcs')

function uuid() { return crypto.randomUUID() }

function withRole(db, whereClause, params) {
  return db.prepare(`
    SELECT p.*, r.key as role_key FROM profiles p JOIN roles r ON r.id = p.role_id WHERE ${whereClause}
  `).get(...params)
}

function toProfileShape(row) {
  if (!row) return null
  const { role_key, password_hash, ...rest } = row
  return { ...rest, is_active: !!rest.is_active }
}

function listProfiles(db) {
  return db.prepare(`
    SELECT p.id, p.first_name, p.last_name, p.is_active, r.key as role_key
    FROM profiles p JOIN roles r ON r.id = p.role_id
    WHERE p.is_active = 1
    ORDER BY (r.key = 'admin') ASC, p.first_name COLLATE NOCASE
  `).all()
}

function pickOptician(db, profileId) {
  const profile = withRole(db, 'p.id = ?', [profileId])
  if (!profile) throw new Error('profile_not_found')
  if (profile.role_key === 'admin') throw new Error('admin_requires_password')
  setActiveUser(profile.id)
  return { profile: toProfileShape(profile), role_key: profile.role_key }
}

function adminLogin(db, profileId, password) {
  const profile = withRole(db, 'p.id = ?', [profileId])
  if (!profile || profile.role_key !== 'admin') throw new Error('not_an_admin')
  if (!profile.password_hash || !bcrypt.compareSync(password, profile.password_hash)) throw new Error('invalid_password')
  setActiveUser(profile.id)
  return { profile: toProfileShape(profile), role_key: profile.role_key }
}

function createProfile(db, { first_name, last_name, role_key, password, max_discount_percent }) {
  const role = db.prepare('SELECT id FROM roles WHERE key = ?').get(role_key)
  if (!role) throw new Error(`unknown_role: ${role_key}`)
  const store = db.prepare('SELECT id FROM stores LIMIT 1').get()
  const id = uuid()
  const passwordHash = password ? bcrypt.hashSync(password, 10) : null
  db.prepare(`
    INSERT INTO profiles (id, store_id, role_id, first_name, last_name, password_hash, max_discount_percent, is_active)
    VALUES (?,?,?,?,?,?,?,1)
  `).run(id, store.id, role.id, first_name, last_name, passwordHash, max_discount_percent ?? 10.0)
  return toProfileShape(db.prepare('SELECT * FROM profiles WHERE id = ?').get(id))
}

function signOut() {
  setActiveUser(null)
}

module.exports = { listProfiles, pickOptician, adminLogin, createProfile, signOut, toProfileShape }
