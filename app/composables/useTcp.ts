// composables/useTcp.ts
// Shared TCP connection state so the navbar and dashboard stay in sync.

import { ref, watch } from 'vue'
import { orbLog } from './useStore'

const TCP_KEY = 'orb_tcp_connected_v1'

export const tcpConnected = ref(false)
export const tcpPort      = ref(3131)

// Restore persisted state
try {
  tcpConnected.value = localStorage.getItem(TCP_KEY) === 'true'
} catch {}

watch(tcpConnected, v => {
  try { localStorage.setItem(TCP_KEY, v ? 'true' : 'false') } catch {}
})

export function toggleTcp() {
  tcpConnected.value = !tcpConnected.value
  orbLog(tcpConnected.value ? `TCP started · 127.0.0.1:${tcpPort.value}` : 'TCP stopped')
}

export function connectTcp() {
  tcpConnected.value = true
  orbLog(`TCP connected · 127.0.0.1:${tcpPort.value}`)
}

export function disconnectTcp() {
  tcpConnected.value = false
  orbLog('TCP disconnected')
}