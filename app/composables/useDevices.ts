// composables/useDevices.ts
// Manages the list of devices that have connected via TCP.
// In real usage the daemon would push device metadata over the socket.
// For now we simulate: when TCP connects, a device is "discovered".

import { ref, watch, computed } from 'vue'
import { tcpConnected, tcpPort } from './useTcp'
import { orbLog } from './useStore'

const DEVICES_KEY = 'orb_devices_v1'

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

const DEMO_DEVICES: Omit<Device, 'lastSeen' | 'online'>[] = [
  {
    id: 'dev-001',
    name: 'DEV-WORKSTATION',
    os: 'Windows 11 Pro',
    osVersion: '23H2',
    cpu: 'AMD Ryzen 9 7900X',
    cores: 12,
    ramGb: 32,
    gpuName: 'NVIDIA RTX 3060',
    gpuVram: '12GB',
    ip: '127.0.0.1',
    port: 3131,
  },
]

function loadDevices(): Device[] {
  try {
    const r = localStorage.getItem(DEVICES_KEY)
    if (r) return JSON.parse(r)
  } catch {}
  return []
}

function saveDevices(list: Device[]) {
  try { localStorage.setItem(DEVICES_KEY, JSON.stringify(list)) } catch {}
}

export const devices    = ref<Device[]>(loadDevices())
export const activeDeviceId = ref<string | null>(
  devices.value.find(d => d.online)?.id ?? devices.value[0]?.id ?? null
)

export const activeDevice = computed(() =>
  devices.value.find(d => d.id === activeDeviceId.value) ?? null
)

export const onlineDevices = computed(() => devices.value.filter(d => d.online))

export function selectDevice(id: string) {
  activeDeviceId.value = id
}

// When TCP connects → mark/add the demo device as online
watch(tcpConnected, (connected) => {
  if (connected) {
    const existing = devices.value.find(d => d.id === DEMO_DEVICES[0].id)
    const now = new Date().toISOString()
    if (existing) {
      existing.online   = true
      existing.lastSeen = now
      existing.port     = tcpPort.value
    } else {
      devices.value.push({
        ...DEMO_DEVICES[0],
        port:     tcpPort.value,
        lastSeen: now,
        online:   true,
      })
    }
    activeDeviceId.value = DEMO_DEVICES[0].id
    saveDevices(devices.value)
    orbLog(`Device online: ${DEMO_DEVICES[0].name}`)
  } else {
    // Mark all offline
    devices.value.forEach(d => { d.online = false })
    saveDevices(devices.value)
    orbLog('All devices offline')
  }
}, { immediate: true })

export function removeDevice(id: string) {
  devices.value = devices.value.filter(d => d.id !== id)
  if (activeDeviceId.value === id) {
    activeDeviceId.value = devices.value[0]?.id ?? null
  }
  saveDevices(devices.value)
}