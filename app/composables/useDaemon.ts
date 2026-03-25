// composables/useDaemon.ts
// Orb Daemon client — connects to the desktop daemon over WebSocket
// Uses ws:// (plain) for LAN connections since the daemon uses a self-signed
// cert that mobile browsers reject. LAN-only, so plain WS is acceptable.

import { ref, computed } from 'vue'
import { orbLog } from './useStore'

// ──────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────

export interface DaemonInfo {
  host: string
  port: number
  fingerprint: string
  token: string
  v: number
}

export interface PairingPayload {
  host: string
  port: number
  token: string
  fingerprint: string
  v: number
}

export type DaemonStatus = 'disconnected' | 'connecting' | 'pairing' | 'connected' | 'error'

interface DaemonMessage {
  type: string
  payload: Record<string, unknown>
}

// ──────────────────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────────────────

const DAEMON_KEY = 'orb_daemon_v1'

const status     = ref<DaemonStatus>('disconnected')
const error      = ref<string | null>(null)
const daemonInfo = ref<DaemonInfo | null>(loadDaemonInfo())
const latencyMs  = ref<number | null>(null)

let ws:             WebSocket | null = null
let pingInterval:   ReturnType<typeof setInterval>  | null = null
let reconnectTimer: ReturnType<typeof setTimeout>   | null = null
let seqCounter = 0

export const daemonStatus    = status
export const daemonError     = error
export const daemonConnected = computed(() => status.value === 'connected')
export const daemonLatency   = latencyMs

// ──────────────────────────────────────────────────────────
// PERSISTENCE
// ──────────────────────────────────────────────────────────

function loadDaemonInfo(): DaemonInfo | null {
  try {
    const r = localStorage.getItem(DAEMON_KEY)
    return r ? JSON.parse(r) : null
  } catch { return null }
}

function saveDaemonInfo(info: DaemonInfo | null) {
  try {
    if (info) localStorage.setItem(DAEMON_KEY, JSON.stringify(info))
    else      localStorage.removeItem(DAEMON_KEY)
  } catch {}
  daemonInfo.value = info
}

// ──────────────────────────────────────────────────────────
// QR PAIRING
// ──────────────────────────────────────────────────────────

export function parsePairingQR(raw: string): PairingPayload | null {
  try {
    const prefix = 'orb-pair://'
    if (!raw.startsWith(prefix)) return null
    const b64  = raw.slice(prefix.length)
    const json = atob(b64)
    return JSON.parse(json) as PairingPayload
  } catch { return null }
}

export async function completePairing(
  payload: PairingPayload,
  deviceName: string,
  deviceOs: string,
): Promise<boolean> {
  status.value = 'pairing'
  error.value  = null

  try {
    await openSocket(payload.host, payload.port)

    const reply = await sendAndWait({
      type: 'Pair',
      payload: { token: payload.token, device_name: deviceName, device_os: deviceOs },
    })

    if (reply.type === 'PairOk') {
      saveDaemonInfo({
        host:        payload.host,
        port:        payload.port,
        fingerprint: payload.fingerprint,
        token:       payload.token,
        v:           payload.v,
      })
      status.value = 'connected'
      startPingLoop()
      orbLog(`Paired with daemon: ${(reply.payload as any).daemon_name}`)
      return true
    } else {
      error.value  = (reply.payload as any).message || 'Pairing rejected'
      status.value = 'error'
      closeSocket()
      return false
    }
  } catch (e: any) {
    error.value  = e.message || 'Connection failed'
    status.value = 'error'
    return false
  }
}

// ──────────────────────────────────────────────────────────
// CONNECTION
// ──────────────────────────────────────────────────────────

export async function connect(): Promise<void> {
  const info = daemonInfo.value
  if (!info) { error.value = 'Not paired — scan QR code first'; return }
  if (status.value === 'connected' || status.value === 'connecting') return
  try {
    await openSocket(info.host, info.port)
    status.value = 'connected'
    startPingLoop()
  } catch (e: any) {
    error.value  = e.message
    status.value = 'error'
    scheduleReconnect()
  }
}

/**
 * Open a plain WebSocket to the daemon.
 * We use ws:// because the daemon's self-signed TLS cert is rejected
 * by mobile browsers (CertificateUnknown). Plain WS is fine for LAN use.
 *
 * The daemon's ws_bridge.rs already handles both binary frames and the
 * 4-byte length-prefixed framing — we just connect to /ws on the same port.
 */
function openSocket(host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    closeSocket(false) // close any existing socket without clearing reconnect

    status.value = 'connecting'
    orbLog(`Connecting to daemon ws://${host}:${port}/ws`)

    // ws:// — plain WebSocket, no TLS. Required because:
    // 1. The daemon uses a self-signed cert → wss:// fails with CertificateUnknown
    // 2. This is a LAN-only connection (192.168.x.x / 127.0.0.1) — plain WS is safe
    const socket = new WebSocket(`ws://${host}:${port}/ws`)
    socket.binaryType = 'arraybuffer'

    const timeout = setTimeout(() => {
      socket.close()
      reject(new Error(`Connection timed out (ws://${host}:${port})`))
    }, 8000)

    socket.onopen = () => {
      clearTimeout(timeout)
      ws = socket
      orbLog(`WebSocket connected to ${host}:${port}`)
      resolve()
    }

    socket.onmessage = (e) => handleMessage(e.data)

    socket.onclose = (e) => {
      clearTimeout(timeout)
      if (ws === socket) {
        ws = null
        if (status.value === 'connected') {
          orbLog(`Daemon disconnected (code ${e.code})`)
          status.value = 'disconnected'
          stopPingLoop()
          scheduleReconnect()
        }
      }
    }

    socket.onerror = () => {
      clearTimeout(timeout)
      const msg = `Could not connect to ws://${host}:${port} — is the daemon running?`
      error.value = msg
      if (status.value === 'connecting') reject(new Error(msg))
    }
  })
}

export function disconnect(): void {
  stopPingLoop()
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  closeSocket()
  status.value = 'disconnected'
}

export function unpair(): void {
  disconnect()
  saveDaemonInfo(null)
  orbLog('Unpaired from daemon')
}

function closeSocket(clearStatus = true) {
  if (ws) {
    try { ws.close() } catch {}
    ws = null
  }
  if (clearStatus && status.value !== 'disconnected') {
    status.value = 'disconnected'
  }
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(async () => {
    if (daemonInfo.value && status.value === 'disconnected') {
      orbLog('Reconnecting to daemon…')
      await connect()
    }
  }, 5000)
}

// ──────────────────────────────────────────────────────────
// KEEP-ALIVE
// ──────────────────────────────────────────────────────────

function startPingLoop() {
  stopPingLoop()
  pingInterval = setInterval(async () => {
    if (status.value !== 'connected') return
    const seq  = ++seqCounter
    const sent = Date.now()
    try {
      const reply = await sendAndWait({ type: 'Ping', payload: { seq } }, 5000)
      if (reply.type === 'Pong') {
        latencyMs.value = Date.now() - sent
      }
    } catch {
      latencyMs.value = null
    }
  }, 10_000)
}

function stopPingLoop() {
  if (pingInterval) { clearInterval(pingInterval); pingInterval = null }
}

// ──────────────────────────────────────────────────────────
// DATA SYNC
// ──────────────────────────────────────────────────────────

export async function syncEnvs(projects: EnvProject[]): Promise<void> {
  ensureConnected()
  for (const proj of projects) {
    for (const inst of proj.instances) {
      await sendAndWait({
        type: 'SyncEnv',
        payload: {
          project:     proj.name,
          environment: inst.name,
          vars:        inst.vars.map(v => ({ key: v.key, value: v.value, type: v.type, secret: v.secret })),
        },
      })
      orbLog(`Daemon: synced ${proj.name}/${inst.name} (${inst.vars.length} vars)`)
    }
  }
}

export async function syncSingleEnv(
  project: string,
  environment: string,
  vars: EnvVarLike[],
): Promise<void> {
  ensureConnected()
  await sendAndWait({ type: 'SyncEnv', payload: { project, environment, vars } })
  orbLog(`Daemon: synced ${project}/${environment}`)
}

export async function syncBlocklist(platforms: BlockedPlatformLike[]): Promise<void> {
  ensureConnected()
  await sendAndWait({ type: 'SyncBlocklist', payload: { platforms } })
  orbLog(`Daemon: blocklist synced (${platforms.filter(p => p.enabled).length} active)`)
}

export async function syncVault(entries: VaultEntryLike[]): Promise<void> {
  ensureConnected()
  await sendAndWait({ type: 'SyncVault', payload: { entries } })
  orbLog(`Daemon: vault synced (${entries.length} entries)`)
}

export async function triggerReload(target: string): Promise<void> {
  ensureConnected()
  await sendAndWait({ type: 'TriggerReload', payload: { target } })
}

// ──────────────────────────────────────────────────────────
// LOW-LEVEL MESSAGING
// ──────────────────────────────────────────────────────────

const pendingReplies = new Map<number, {
  resolve: (msg: DaemonMessage) => void
  reject:  (e: Error) => void
}>()

function handleMessage(data: ArrayBuffer | string) {
  try {
    let json: string
    if (typeof data === 'string') {
      json = data
    } else {
      // Strip optional 4-byte length prefix
      const view = new DataView(data)
      const declaredLen = view.getUint32(0, false)
      if (declaredLen + 4 === data.byteLength) {
        json = new TextDecoder().decode(new Uint8Array(data, 4, declaredLen))
      } else {
        json = new TextDecoder().decode(data)
      }
    }

    const msg = JSON.parse(json) as DaemonMessage

    // Mark as connected on any valid message
    if (status.value !== 'connected') status.value = 'connected'

    // Resolve the oldest pending reply
    const entry = pendingReplies.entries().next().value
    if (entry) {
      const [key, { resolve }] = entry
      pendingReplies.delete(key)
      resolve(msg)
    }
  } catch (e: any) {
    orbLog(`Daemon parse error: ${e.message}`, 'error')
  }
}

function sendAndWait(
  msg: { type: string; payload: Record<string, unknown> },
  timeoutMs = 10_000,
): Promise<DaemonMessage> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket not open'))
      return
    }

    const seq  = ++seqCounter
    const json = JSON.stringify({ type: msg.type, payload: msg.payload })

    // Send as plain JSON text — the daemon's ws_bridge handles both text and binary
    ws.send(json)

    pendingReplies.set(seq, { resolve, reject })

    setTimeout(() => {
      if (pendingReplies.has(seq)) {
        pendingReplies.delete(seq)
        reject(new Error(`Timeout waiting for reply to ${msg.type}`))
      }
    }, timeoutMs)
  })
}

function ensureConnected() {
  if (status.value !== 'connected') throw new Error('Not connected to daemon')
}

// ──────────────────────────────────────────────────────────
// TYPE HELPERS
// ──────────────────────────────────────────────────────────

interface EnvVarLike      { key: string; value: string; type: string; secret: boolean }
interface EnvInstanceLike { name: string; type: string; vars: EnvVarLike[] }
interface EnvProject      { name: string; instances: EnvInstanceLike[] }
interface BlockedPlatformLike { id: string; name: string; domains: string[]; enabled: boolean }
interface VaultEntryLike  {
  id: number; service: string; username: string; password: string
  category: string; url: string; notes: string
}

// ──────────────────────────────────────────────────────────
// PUBLIC COMPOSABLE
// ──────────────────────────────────────────────────────────

export function useDaemon() {
  return {
    status:     daemonStatus,
    connected:  daemonConnected,
    error:      daemonError,
    latency:    daemonLatency,
    daemonInfo,
    connect,
    disconnect,
    unpair,
    completePairing,
    parsePairingQR,
    syncEnvs,
    syncSingleEnv,
    syncBlocklist,
    syncVault,
    triggerReload,
  }
}