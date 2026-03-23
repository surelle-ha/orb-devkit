// composables/useDevControl.ts
import { ref } from 'vue'
import { orbLog } from './useStore'

export const resetLog = ref<string[]>([])

function log(msg: string) {
  resetLog.value.push(msg)
  orbLog(msg, msg.includes('failed') || msg.includes('Error') ? 'error' : 'info')
}

export async function resetAll(): Promise<string[]> {
  resetLog.value = []
  log('Starting full data reset…')

  try {
    const keys = Object.keys(localStorage)
    keys.forEach(k => localStorage.removeItem(k))
    log(`localStorage cleared (${keys.length} keys) ✓`)
  } catch (e: any) { log(`localStorage failed: ${e?.message}`) }

  try { sessionStorage.clear(); log('sessionStorage cleared ✓') } catch {}

  try {
    const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite')
    const sqlite = new SQLiteConnection(CapacitorSQLite)
    const db = await sqlite.createConnection('orb', false, 'no-encryption', 1, false)
    await db.open()
    for (const t of ['transactions','budgets','goals','user_profile']) {
      await db.execute(`DELETE FROM ${t};`)
      log(`SQLite table cleared: ${t}`)
    }
    await db.close()
    await sqlite.closeAllConnections()
    log('SQLite wiped ✓')
  } catch (e: any) { log(`SQLite: ${e?.message ?? 'not available (web)'}`) }

  try {
    const dbs = await indexedDB.databases?.()
    if (dbs?.length) {
      await Promise.all(dbs.map(d => new Promise<void>((res, rej) => {
        if (!d.name) return res()
        const r = indexedDB.deleteDatabase(d.name)
        r.onsuccess = () => { log(`IndexedDB deleted: ${d.name}`); res() }
        r.onerror   = () => rej(r.error)
      })))
      log('IndexedDB wiped ✓')
    }
  } catch { log('IndexedDB enum not supported') }

  log('✅ Reset complete — reloading in 1.5s')
  return [...resetLog.value]
}

export function useDevControl() {
  if (typeof window !== 'undefined') {
    (window as any).__orbReset = resetAll
  }
  return { resetAll, resetLog }
}