// composables/useDevices.ts
// Manages the list of devices shown in devices.vue.
// Devices are written to localStorage by useDaemon.ts when pairing/connecting.
// This composable provides a reactive view over that stored list and refreshes
// it when the daemon updates it (via a storage event or explicit reload call).

import { ref, computed } from 'vue'
import { orbLog } from './useStore'

export const DEVICES_KEY = 'orb_devices_v1'

export interface Device {
  id:        string
  name:      string
  os:        string
  osVersion: string
  cpu:       string
  cores:     number
  ramGb:     number
  gpuName:   string
  gpuVram:   string
  ip:        string
  port:      number
  lastSeen:  string
  online:    boolean
}

// ── State ─────────────────────────────────────────────────

function readDevices(): Device[] {
  try {
    const r = localStorage.getItem(DEVICES_KEY)
    return r ? JSON.parse(r) : []
  } catch { return [] }
}

function saveDevices(list: Device[]) {
  try { localStorage.setItem(DEVICES_KEY, JSON.stringify(list)) } catch {}
}

export const devices    = ref<Device[]>(readDevices())
export const activeDeviceId = ref<string | null>(
  devices.value.find(d => d.online)?.id ?? devices.value[0]?.id ?? null
)

export const activeDevice  = computed(() =>
  devices.value.find(d => d.id === activeDeviceId.value) ?? null
)
export const onlineDevices = computed(() => devices.value.filter(d => d.online))

// ── Reload ─────────────────────────────────────────────────
// Called by useDaemon after it writes to localStorage so the
// reactive ref picks up the change within the same tab.

export function reloadDevices() {
  const fresh = readDevices()
  devices.value = fresh

  // Auto-select first online device if nothing selected
  if (!activeDeviceId.value || !fresh.find(d => d.id === activeDeviceId.value)) {
    activeDeviceId.value = fresh.find(d => d.online)?.id ?? fresh[0]?.id ?? null
  }
}

// Listen for cross-tab storage changes (e.g. daemon process writes via Capacitor)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === DEVICES_KEY) reloadDevices()
  })
}

// ── Actions ───────────────────────────────────────────────

export function selectDevice(id: string) {
  activeDeviceId.value = id
}

export function removeDevice(id: string) {
  devices.value = devices.value.filter(d => d.id !== id)
  saveDevices(devices.value)
  if (activeDeviceId.value === id) {
    activeDeviceId.value = devices.value[0]?.id ?? null
  }
  orbLog(`Device removed: ${id}`)
}