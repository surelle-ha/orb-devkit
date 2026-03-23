// composables/useAiMemory.ts
// Persistent AI memory — key/value store the AI can read and write.
//
// SYNCED KEYS: Some keys are "live" — remembering them also updates the real
// app state (settings, profile DB) so there's one source of truth, not two.

import { ref, computed } from 'vue'
import { orbLog, saveSettings } from './useStore'

const MEMORY_KEY = 'orb_ai_memory_v1'
const MAX_MEMORIES = 100

export interface MemoryEntry {
  key:    string
  value:  string
  ts:     number
  source: 'ai' | 'user'
  synced?: boolean   // true = also updated real app state
}

// ── Synced key definitions ─────────────────────────────────
// When the AI sets one of these keys, we also push the value to the
// real part of the app it belongs to.
interface SyncedKeyDef {
  label:       string      // human-readable description shown in memory panel
  aliases:     string[]    // other keys the AI might use for the same thing
  normalize:   (raw: string) => string   // clean the value before storing
  apply:       (value: string) => void   // side-effect: update real app state
}

// Lazy-load DB to avoid crashing on web
let _setProfileFn: ((k: string, v: string) => Promise<void>) | null = null
async function setProfileDb(key: string, value: string) {
  if (!_setProfileFn) {
    try {
      const db = await import('./useDatabase')
      _setProfileFn = db.setProfile
    } catch { return }
  }
  await _setProfileFn(key, value).catch(() => {})
}

export const SYNCED_KEYS: Record<string, SyncedKeyDef> = {
  monthly_income: {
    label:   'Monthly Income',
    aliases: ['income', 'monthly_salary', 'salary', 'take_home', 'take_home_pay', 'monthly_pay'],
    normalize: (v) => {
      // Accept "20k", "20,000", "20000", "₱20,000"
      const n = parseFloat(v.replace(/[^0-9.]/g, '').replace(/,/g, ''))
      return isNaN(n) ? v : String(n)
    },
    apply: (value) => {
      // Update SQLite profile so onboarding data stays in sync
      setProfileDb('monthly_income', value)
      orbLog(`AI memory synced → SQLite profile: monthly_income = ${value}`)
    },
  },
  user_name: {
    label:   'Your Name',
    aliases: ['name', 'my_name', 'preferred_name', 'call_me'],
    normalize: (v) => v.trim(),
    apply: (value) => {
      saveSettings({ userName: value })
      setProfileDb('user_name', value)
      orbLog(`AI memory synced → settings: userName = ${value}`)
    },
  },
  monthly_budget: {
    label:   'Monthly Budget',
    aliases: ['budget', 'spending_limit', 'monthly_spending', 'monthly_limit'],
    normalize: (v) => {
      const n = parseFloat(v.replace(/[^0-9.]/g, '').replace(/,/g, ''))
      return isNaN(n) ? v : String(n)
    },
    apply: (value) => {
      setProfileDb('monthly_budget', value)
    },
  },
  savings_rate: {
    label:   'Savings Rate (%)',
    aliases: ['savings_percent', 'save_percent', 'saving_rate'],
    normalize: (v) => {
      const n = parseFloat(v.replace(/[^0-9.]/g, ''))
      return isNaN(n) ? v : String(Math.min(100, Math.max(0, n)))
    },
    apply: (value) => {
      setProfileDb('savings_rate', value)
    },
  },
  financial_goals: {
    label:   'Financial Goals',
    aliases: ['goals', 'goal', 'my_goal', 'financial_goal'],
    normalize: (v) => v.trim(),
    apply: (value) => {
      setProfileDb('financial_goals', value)
    },
  },
  employment: {
    label:   'Employment Type',
    aliases: ['work', 'job', 'employment_type', 'job_type', 'work_type'],
    normalize: (v) => v.trim().toLowerCase(),
    apply: (value) => {
      setProfileDb('employment', value)
    },
  },
  currency: {
    label:   'Currency Preference',
    aliases: ['preferred_currency'],
    normalize: (v) => v.trim().toUpperCase().slice(0, 3),
    apply: () => {
      // Currency changes need symbol lookup — too complex to do here.
      // User should use Settings page for currency. We just store the note.
    },
  },
}

// Build reverse alias map: alias → canonical key
const ALIAS_MAP: Record<string, string> = {}
for (const [canonical, def] of Object.entries(SYNCED_KEYS)) {
  ALIAS_MAP[canonical] = canonical
  for (const alias of def.aliases) ALIAS_MAP[alias] = canonical
}

/** Resolve an AI-provided key to its canonical form */
export function resolveKey(raw: string): string {
  const clean = raw.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 60)
  return ALIAS_MAP[clean] ?? clean
}

// ── Core store ─────────────────────────────────────────────
function loadMemory(): Record<string, MemoryEntry> {
  try { const r = localStorage.getItem(MEMORY_KEY); if (r) return JSON.parse(r) } catch {}
  return {}
}
function saveMemory(m: Record<string, MemoryEntry>) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(m)) } catch {}
}

export const aiMemory = ref<Record<string, MemoryEntry>>(loadMemory())

export const memoryList = computed(() =>
  Object.values(aiMemory.value).sort((a, b) => b.ts - a.ts)
)

/** Store or update a memory entry — also syncs to real app state if key is special */
export function remember(rawKey: string, rawValue: string, source: 'ai' | 'user' = 'ai') {
  const canonical = resolveKey(rawKey)
  const syncDef   = SYNCED_KEYS[canonical]
  const value     = syncDef ? syncDef.normalize(rawValue) : rawValue.slice(0, 500)
  const synced    = !!syncDef

  aiMemory.value[canonical] = { key: canonical, value, ts: Date.now(), source, synced }

  // Prune oldest if over limit
  const entries = Object.entries(aiMemory.value).sort((a, b) => b[1].ts - a[1].ts)
  if (entries.length > MAX_MEMORIES) {
    aiMemory.value = Object.fromEntries(entries.slice(0, MAX_MEMORIES))
  }

  saveMemory(aiMemory.value)
  orbLog(`AI memory saved: [${canonical}] = "${value.slice(0, 60)}"${synced ? ' (synced)' : ''}`)

  // Apply side-effects AFTER saving
  if (syncDef) syncDef.apply(value)

  return { canonical, value, synced, syncDef }
}

/** Recall a memory entry */
export function recall(rawKey: string): string | null {
  const canonical = resolveKey(rawKey)
  return aiMemory.value[canonical]?.value ?? null
}

/** Delete a memory entry */
export function forget(rawKey: string) {
  const canonical = resolveKey(rawKey)
  delete aiMemory.value[canonical]
  saveMemory(aiMemory.value)
  orbLog(`AI memory deleted: [${canonical}]`)
}

/** Clear all AI memories */
export function forgetAll() {
  aiMemory.value = {}
  saveMemory(aiMemory.value)
  orbLog('AI memory cleared')
}

/**
 * Format all memories as a compact block for the system prompt.
 * Synced keys show their human-readable label.
 */
export function memoriesAsPromptContext(): string {
  const entries = memoryList.value
  if (!entries.length) return ''
  return entries.map(e => {
    const label = SYNCED_KEYS[e.key]?.label ?? e.key.replace(/_/g, ' ')
    return `• ${label}: ${e.value}${e.synced ? ' [synced to app]' : ''}`
  }).join('\n')
}

/**
 * Human-readable sync description shown in the confirmation card.
 * e.g. "Updates your monthly income in profile & spending insights"
 */
export function syncDescription(rawKey: string): string | null {
  const canonical = resolveKey(rawKey)
  const def = SYNCED_KEYS[canonical]
  if (!def) return null
  const descriptions: Record<string, string> = {
    monthly_income:  'Updates your monthly income in your profile',
    user_name:       'Updates your display name throughout the app',
    monthly_budget:  'Saves your monthly budget target to your profile',
    savings_rate:    'Updates your savings rate in your profile',
    financial_goals: 'Updates your financial goals in your profile',
    employment:      'Updates your employment type in your profile',
    currency:        'Noted — change currency in Settings for full effect',
  }
  return descriptions[canonical] ?? `Updates "${def.label}" in your profile`
}