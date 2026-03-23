// composables/usePin.ts
// In-app PIN security: set/verify PIN, security question for reset.
// PIN is stored as SHA-256 hash — never in plaintext.

import { ref, readonly, computed } from 'vue'

const PIN_KEY      = 'orb_pin_hash_v1'
const PIN_META_KEY = 'orb_pin_meta_v1'

export interface PinMeta {
  hint:             string   // security question
  answerHash:       string   // SHA-256 of lowercase-trimmed answer
  enabled:          boolean
}

// ── SHA-256 helper ─────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const enc  = new TextEncoder()
  const buf  = await crypto.subtle.digest('SHA-256', enc.encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── State ─────────────────────────────────────────────────
const isPinLocked = ref(false)
const _pinMeta    = ref<PinMeta | null>(null)

function loadMeta(): PinMeta | null {
  try { const r = localStorage.getItem(PIN_META_KEY); if (r) return JSON.parse(r) } catch {}
  return null
}
function saveMeta(m: PinMeta) {
  try { localStorage.setItem(PIN_META_KEY, JSON.stringify(m)) } catch {}
  _pinMeta.value = m
}

// Load on module init
_pinMeta.value = loadMeta()

export const pinMeta    = readonly(_pinMeta)
export const pinEnabled = computed(() => !!_pinMeta.value?.enabled)

// ── Public API ────────────────────────────────────────────

/** Set (or change) the PIN and security question. */
export async function setPin(
  pin: string,
  hint: string,
  answer: string,
): Promise<void> {
  const pinHash    = await sha256(pin.trim())
  const answerHash = await sha256(answer.trim().toLowerCase())
  localStorage.setItem(PIN_KEY, pinHash)
  saveMeta({ hint, answerHash, enabled: true })
}

/** Verify a PIN attempt. Returns true if correct. */
export async function verifyPin(attempt: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_KEY)
  if (!stored) return true  // no PIN set, always pass
  const hash = await sha256(attempt.trim())
  return hash === stored
}

/** Verify security answer for PIN reset. */
export async function verifyAnswer(answer: string): Promise<boolean> {
  const meta = loadMeta()
  if (!meta) return false
  const hash = await sha256(answer.trim().toLowerCase())
  return hash === meta.answerHash
}

/** Disable / remove PIN entirely. */
export function removePin(): void {
  localStorage.removeItem(PIN_KEY)
  const m = loadMeta()
  if (m) {
    m.enabled = false
    saveMeta(m)
  }
  _pinMeta.value = null
  isPinLocked.value = false
}

/** Called when app comes to foreground / after idle — if PIN enabled, lock. */
export function lockWithPin(): void {
  if (pinEnabled.value) isPinLocked.value = true
}

/** Called after successful PIN entry. */
export function unlockPin(): void {
  isPinLocked.value = false
}

export { isPinLocked }