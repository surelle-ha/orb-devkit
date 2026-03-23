// composables/useDark.ts
import { ref, watch } from 'vue'

export type DarkMode = 'light' | 'dark' | 'system' | 'adaptive'
const STORAGE_KEY = 'orb_dark_mode'

function readMode(): DarkMode {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s === 'light' || s === 'dark' || s === 'system' || s === 'adaptive') return s
  } catch {}
  return 'system'
}

function resolveIsDark(mode: DarkMode): boolean {
  if (mode === 'dark')   return true
  if (mode === 'light')  return false
  if (mode === 'adaptive') {
    const h = new Date().getHours()
    return h < 6 || h >= 20
  }
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches } catch {}
  return false
}

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}

const mode   = ref<DarkMode>('system')
const isDark = ref(false)

let adaptiveTimer = 0

function startAdaptiveTimer() {
  clearInterval(adaptiveTimer)
  adaptiveTimer = window.setInterval(() => {
    if (mode.value === 'adaptive') {
      const next = resolveIsDark('adaptive')
      if (next !== isDark.value) {
        isDark.value = next
        applyDark(next)
      }
    }
  }, 60_000)
}

watch(mode, (m) => {
  isDark.value = resolveIsDark(m)
  applyDark(isDark.value)
  try { localStorage.setItem(STORAGE_KEY, m) } catch {}
})

let mqlCleanup: (() => void) | null = null
watch(mode, (m) => {
  mqlCleanup?.()
  mqlCleanup = null
  if (m === 'system') {
    try {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        isDark.value = e.matches
        applyDark(e.matches)
      }
      mql.addEventListener('change', handler)
      mqlCleanup = () => mql.removeEventListener('change', handler)
    } catch {}
  }
}, { immediate: true })

export function useDark() {
  function initDark() {
    mode.value   = readMode()
    isDark.value = resolveIsDark(mode.value)
    applyDark(isDark.value)
    startAdaptiveTimer()
  }

  function setMode(m: DarkMode) {
    mode.value = m
  }

  function toggleDark() {
    setMode(isDark.value ? 'light' : 'dark')
  }

  return { isDark, mode, setMode, toggleDark, initDark }
}