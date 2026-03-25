// composables/useDevMode.ts
// Dev mode = daemon connected + extended logging + debug overlays.
// Toggling dev mode also connects/disconnects the daemon.
// Single source of truth — daemon connection is GATED by dev mode.

import { ref, watch } from 'vue'
import { orbLog } from './useStore'

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
    startDevTimer()
    orbLog('Dev mode enabled — daemon connections allowed')
    // Attempt daemon reconnect when dev mode turns on
    import('./useDaemon').then(({ connect, daemonInfo }) => {
      if (daemonInfo.value) {
        connect().catch(() => {})
      }
    })
  } else {
    // Disconnect daemon when dev mode turns off
    import('./useDaemon').then(({ disconnect }) => {
      disconnect()
    })
    stopDevTimer()
    orbLog('Dev mode disabled — daemon disconnected')
  }
}

// Seed timer if already active on load
if (devMode.value) startDevTimer()