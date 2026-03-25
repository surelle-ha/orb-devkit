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
    orbLog(`[Orb] Connecting to daemon at ${payload.host}:${payload.port}`)
    await openSocket(payload.host, payload.port)

    orbLog(`[Orb] Socket open — sending Pair message`)
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
      const daemonName = (reply.payload as any).daemon_name
      orbLog(`[Orb] ✓ Paired with daemon: ${daemonName}`, 'info')
      return true
    } else {
      const errMsg = (reply.payload as any).message || 'Pairing rejected by daemon'
      orbLog(`[Orb] ✗ Pairing rejected: ${errMsg}`, 'error')
      error.value  = errMsg
      status.value = 'error'
      closeSocket()
      return false
    }
  } catch (e: any) {
    const errMsg = e.message || 'Connection failed'
    orbLog(`[Orb] ✗ Pairing error: ${errMsg}`, 'error')
    error.value  = errMsg
    status.value = 'error'
    closeSocket()
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
 *
 * ANDROID FIX: On Android, WebSocket errors fire in this order:
 *   1. onerror  (with no useful info, just an Event)
 *   2. onclose  (with a close code, sometimes 1006 "abnormal closure")
 *
 * If we reject immediately on onerror, we get a race with onclose that
 * causes double-rejection. Instead we:
 *   - Set a "settled" flag so only the first rejection/resolve wins
 *   - Use a single timeout as the final backstop
 *   - Log the close code to help diagnose network issues
 */
function openSocket(host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    closeSocket(false) // close any existing socket without clearing reconnect

    status.value = 'connecting'
    const url = `ws://${host}:${port}/ws`
    orbLog(`[Orb] Opening WebSocket: ${url}`)

    let settled = false

    const settle = (err?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(connectTimeout)
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    }

    const socket = new WebSocket(url)
    socket.binaryType = 'arraybuffer'

    // Hard timeout — if neither onopen nor onclose fires within 10s, bail
    const connectTimeout = setTimeout(() => {
      orbLog(`[Orb] Connection timed out after 10s (${url})`, 'error')
      socket.close()
      settle(new Error(`Connection timed out — is the daemon running at ${host}:${port}?`))
    }, 10000)

    socket.onopen = () => {
      orbLog(`[Orb] WebSocket opened to ${url}`)
      ws = socket
      settle() // resolve — success
    }

    socket.onmessage = (e) => handleMessage(e.data)

    socket.onclose = (e) => {
      // If we never opened, this is a connection failure
      if (!settled) {
        const reason = closeCodeToReason(e.code, host, port)
        orbLog(`[Orb] ✗ WebSocket closed before open (code ${e.code}): ${reason}`, 'error')
        ws = null
        settle(new Error(reason))
        return
      }

      // Was previously connected, now disconnected
      if (ws === socket) {
        ws = null
        orbLog(`[Orb] Daemon disconnected (code ${e.code})`)
        status.value = 'disconnected'
        stopPingLoop()
        scheduleReconnect()
      }
    }

    socket.onerror = (_event) => {
      // On Android, onerror fires before onclose with no useful detail.
      // We log it but DON'T reject here — let onclose handle the rejection
      // so we get the close code (e.g. 1006 = network unreachable).
      orbLog(`[Orb] WebSocket error event for ${url} — waiting for close event`, 'warn')
    }
  })
}

/**
 * Convert WebSocket close codes into human-readable messages.
 */
function closeCodeToReason(code: number, host: string, port: number): string {
  switch (code) {
    case 1000: return 'Connection closed normally'
    case 1001: return 'Server going away'
    case 1002: return 'Protocol error'
    case 1003: return 'Unsupported data'
    case 1005: return 'No status code'
    case 1006:
      return `Cannot reach daemon at ${host}:${port} — make sure:\n` +
             `1. orb-daemon is running (cargo run -- start)\n` +
             `2. Port ${port} is not blocked by a firewall\n` +
             `3. Your phone and PC are on the same WiFi network`
    case 1007: return 'Invalid message data'
    case 1008: return 'Policy violation'
    case 1009: return 'Message too large'
    case 1011: return 'Server error'
    case 1015: return 'TLS handshake failed'
    default:   return `Connection failed (code ${code}) — daemon may be offline or unreachable`
  }
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
      reject(new Error('WebSocket not open — cannot send message'))
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
        reject(new Error(`Timeout waiting for daemon reply to ${msg.type} (${timeoutMs}ms)`))
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