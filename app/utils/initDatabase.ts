// utils/initDatabase.ts
import { orbLog } from '~/composables/useStore'

export async function initDatabase(): Promise<void> {
  try {
    const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite')
    const sqlite = new SQLiteConnection(CapacitorSQLite)

    const db = await sqlite.createConnection('orb', false, 'no-encryption', 1, false)
    await db.open()

    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id        INTEGER PRIMARY KEY,
        name      TEXT    NOT NULL,
        amount    REAL    NOT NULL,
        category  TEXT    NOT NULL,
        accountId INTEGER,
        date      TEXT    NOT NULL,
        isoDate   TEXT    NOT NULL,
        creditTx  INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS accounts (
        id          INTEGER PRIMARY KEY,
        name        TEXT,
        bank        TEXT,
        type        TEXT,
        balance     REAL    DEFAULT 0,
        outstanding REAL    DEFAULT 0,
        spent       REAL    DEFAULT 0,
        gradient    TEXT,
        color       TEXT,
        last4       TEXT,
        currency    TEXT    DEFAULT 'USD'
      );
      CREATE TABLE IF NOT EXISTS bills (
        id        INTEGER PRIMARY KEY,
        name      TEXT    NOT NULL,
        amount    REAL    NOT NULL,
        dueDay    INTEGER NOT NULL,
        status    TEXT    NOT NULL DEFAULT 'pending',
        icon      TEXT    NOT NULL DEFAULT 'other',
        recurring INTEGER NOT NULL DEFAULT 1
      );
    `)

    await db.close()
    await sqlite.closeAllConnections()
    orbLog('SQLite database ready')
  } catch (e: any) {
    orbLog(`DB: ${e?.message ?? 'SQLite not available'}`, 'warn')
  }
}