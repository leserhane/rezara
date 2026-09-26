const path = require('path')
const fs = require('fs')
const { app } = require('electron')
const Database = require('better-sqlite3')
const { SCHEMA_SQL } = require('./schema')
const { seedIfEmpty } = require('./seed')

let db = null

function getDbPath() {
  const dir = app.getPath('userData')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'optimum-optic.db')
}

function initDb() {
  if (db) return db
  db = new Database(getDbPath())
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA_SQL)
  seedIfEmpty(db)
  return db
}

function getDb() {
  if (!db) throw new Error('database not initialized')
  return db
}

module.exports = { initDb, getDb, getDbPath }
