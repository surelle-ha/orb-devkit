// composables/useIdleLock.ts
import { ref, watch } from 'vue'
import { settings } from './useStore'

export const isLocked = ref(false)

let idleTimer: ReturnType<typeof setTimeout> | null = null

const ACTIVITY_EVENTS = ['pointerdown','pointermove','keydown','scroll','touchstart']

function clearTimer() {
  if (idleTimer !== null) { clearTimeout(idleTimer); idleTimer = null }
}

function resetTimer() {
  if (!settings.value.idleLockEnabled) return
  clearTimer()
  const ms = (settings.value.idleLockMinutes ?? 5) * 60_000
  idleTimer = setTimeout(() => { isLocked.value = true }, ms)
}

export function unlock() {
  isLocked.value = false
  resetTimer()
}

let _initialized = false
export function initIdleLock() {
  if (_initialized) return
  _initialized = true

  const handler = () => {
    if (isLocked.value) return
    resetTimer()
  }
  ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handler, { passive: true }))

  watch(
    () => [settings.value.idleLockEnabled, settings.value.idleLockMinutes],
    () => {
      if (!settings.value.idleLockEnabled) {
        clearTimer()
        isLocked.value = false
      } else {
        resetTimer()
      }
    },
    { immediate: true }
  )
}

export function triggerLockNow() {
  isLocked.value = true
}