// composables/useDevMode.ts
// Dev mode = TCP connected + extended logging + debug overlays.
// Toggling dev mode also toggles TCP. Single source of truth.

import { ref, watch } from 'vue'
import { orbLog } from './useStore'
import { tcpConnected, tcpPort, toggleTcp } from './useTcp'

const DEV_MODE_KEY = 'orb_dev_mode_v1'

export const devMode = ref(false)
export const devSessionStart = ref(Date.now())
export const devSessionTime  = ref('00:00')

let devTimer: ReturnType<typeof setInterval> | null = null

// Restore persisted state
try {
  devMode.value = localStorage.getItem(DEV_MODE_KEY) === 'true'
} catch {}

function startDevTimer() {
  if (devTimer) clearInterval(devTimer)
  devSessionStart.value = Date.now()
  devTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - devSessionStart.value) / 1000)
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0')
    const s = (elapsed % 60).toString().padStart(2, '0')
    devSessionTime.value = `${m}:${s}`
  }, 1000)
}

function stopDevTimer() {
  if (devTimer) { clearInterval(devTimer); devTimer = null }
  devSessionTime.value = '00:00'
}

export function toggleDevMode() {
  devMode.value = !devMode.value
  try { localStorage.setItem(DEV_MODE_KEY, devMode.value ? 'true' : 'false') } catch {}

  if (devMode.value) {
    // Enable TCP if not already on
    if (!tcpConnected.value) toggleTcp()
    startDevTimer()
    orbLog('Dev mode enabled')
  } else {
    // Disconnect TCP when dev mode turns off
    if (tcpConnected.value) toggleTcp()
    stopDevTimer()
    orbLog('Dev mode disabled')
  }
}

// Keep TCP state in sync: if TCP is killed externally, reflect in dev mode
watch(tcpConnected, (connected) => {
  if (!connected && devMode.value) {
    devMode.value = false
    try { localStorage.setItem(DEV_MODE_KEY, 'false') } catch {}
    stopDevTimer()
  }
})

// Seed timer if already active on load
if (devMode.value) startDevTimer()