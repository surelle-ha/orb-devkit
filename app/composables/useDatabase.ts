import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'
import { ref, readonly } from 'vue'

const sqlite  = new SQLiteConnection(CapacitorSQLite)
let   db: SQLiteDBConnection | null = null
const ready   = ref(false)
const DB_NAME = 'orb'
const DB_VER  = 1

const MIGRATIONS = `
  CREATE TABLE IF NOT EXISTS user_profile (
    id          INTEGER PRIMARY KEY,
    key         TEXT    NOT NULL UNIQUE,
    value       TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    amount      REAL    NOT NULL,
    category    TEXT    NOT NULL DEFAULT 'Other',
    note        TEXT,
    tx_date     TEXT    NOT NULL DEFAULT (date('now')),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS budgets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category    TEXT    NOT NULL UNIQUE,
    monthly_cap REAL    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS goals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    label       TEXT    NOT NULL,
    target      REAL    NOT NULL,
    saved       REAL    NOT NULL DEFAULT 0,
    icon        TEXT,
    color       TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_tx_date     ON transactions(tx_date);
  CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category);
`

export async function initDatabase(): Promise<void> {
  if (ready.value) return
  const consistent = await sqlite.checkConnectionsConsistency()
  const isConn     = (await sqlite.isConnection(DB_NAME, false)).result
  if (consistent.result && isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false)
  } else {
    db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VER, false)
  }
  await db.open()
  for (const stmt of MIGRATIONS.split(';').map(s => s.trim()).filter(Boolean)) {
    await db.execute(stmt + ';')
  }
  ready.value = true
}

function assertReady(): SQLiteDBConnection {
  if (!db || !ready.value) throw new Error('[Orb DB] Not initialized.')
  return db
}

export async function setProfile(key: string, value: string): Promise<void> {
  const conn = assertReady()
  await conn.run(
    `INSERT INTO user_profile (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value]
  )
}

export async function getProfile(key: string): Promise<string | null> {
  const conn = assertReady()
  const res  = await conn.query(`SELECT value FROM user_profile WHERE key = ?`, [key])
  return res.values?.[0]?.value ?? null
}

export async function getAllProfile(): Promise<Record<string, string>> {
  const conn   = assertReady()
  const res    = await conn.query(`SELECT key, value FROM user_profile`)
  const result: Record<string, string> = {}
  for (const row of res.values ?? []) result[row.key] = row.value
  return result
}

export async function isOnboardingDone(): Promise<boolean> {
  const val = await getProfile('onboarding_done')
  return val === 'true'
}

export async function markOnboardingDone(): Promise<void> {
  await setProfile('onboarding_done', 'true')
}

export interface Transaction {
  id?:         number
  name:        string
  amount:      number
  category:    string
  note?:       string
  tx_date?:    string
  created_at?: string
}

export async function addTransaction(tx: Transaction): Promise<number> {
  const conn = assertReady()
  const res  = await conn.run(
    `INSERT INTO transactions (name, amount, category, note, tx_date) VALUES (?, ?, ?, ?, ?)`,
    [tx.name, tx.amount, tx.category, tx.note ?? null, tx.tx_date ?? new Date().toISOString().split('T')[0]]
  )
  return res.changes?.lastId ?? 0
}

export async function getTransactions(limit = 50, offset = 0): Promise<Transaction[]> {
  const conn = assertReady()
  const res  = await conn.query(
    `SELECT * FROM transactions ORDER BY tx_date DESC, created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  )
  return res.values ?? []
}

export interface Budget { id?: number; category: string; monthly_cap: number }

export async function setBudget(category: string, cap: number): Promise<void> {
  const conn = assertReady()
  await conn.run(
    `INSERT INTO budgets (category, monthly_cap) VALUES (?, ?)
     ON CONFLICT(category) DO UPDATE SET monthly_cap = excluded.monthly_cap`,
    [category, cap]
  )
}

export async function getBudgets(): Promise<Budget[]> {
  const conn = assertReady()
  const res  = await conn.query(`SELECT * FROM budgets ORDER BY category`)
  return res.values ?? []
}

export interface Goal { id?: number; label: string; target: number; saved: number; icon?: string; color?: string }

export async function addGoal(g: Goal): Promise<number> {
  const conn = assertReady()
  const res  = await conn.run(
    `INSERT INTO goals (label, target, saved, icon, color) VALUES (?, ?, ?, ?, ?)`,
    [g.label, g.target, g.saved ?? 0, g.icon ?? null, g.color ?? null]
  )
  return res.changes?.lastId ?? 0
}

export async function getGoals(): Promise<Goal[]> {
  const conn = assertReady()
  const res  = await conn.query(`SELECT * FROM goals ORDER BY created_at DESC`)
  return res.values ?? []
}

export async function updateGoalSaved(id: number, saved: number): Promise<void> {
  const conn = assertReady()
  await conn.run(`UPDATE goals SET saved = ? WHERE id = ?`, [saved, id])
}

export const dbReady = readonly(ready)