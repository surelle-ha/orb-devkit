// composables/useDaemon.ts
// Orb Daemon client — connects to the desktop daemon over plain WebSocket (ws://)
// The daemon listens on port 3132 (tls_port + 1) for plain WS connections.
// IMPORTANT: Connections are only allowed when dev mode is ON.

import { ref, computed } from 'vue'
import { orbLog } from './useStore'
import { reloadDevices } from './useDevices'

// ──────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────

export interface DaemonInfo {
  host:           string
  port:           number
  fingerprint:    string
  token:          string
  v:              number
  daemonName?:    string
  daemonVersion?: string
}

export interface PairingPayload {
  host:        string
  port:        number
  token:       string
  fingerprint: string
  v:           number
}

export type DaemonStatus = 'disconnected' | 'connecting' | 'pairing' | 'connected' | 'error'

interface DaemonMessage {
  type:    string
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
let pingInterval:   ReturnType<typeof setInterval> | null = null
let reconnectTimer: ReturnType<typeof setTimeout>  | null = null
let seqCounter = 0

export const daemonStatus    = status
export const daemonError     = error
export const daemonConnected = computed(() => status.value === 'connected')
export const daemonLatency   = latencyMs

// ──────────────────────────────────────────────────────────
// DEV MODE GATE
// ──────────────────────────────────────────────────────────

function isDevModeOn(): boolean {
  try {
    return localStorage.getItem('orb_dev_mode_v1') === 'true'
  } catch { return false }
}

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
  payload:    PairingPayload,
  deviceName: string,
  deviceOs:   string,
): Promise<boolean> {
  // Pairing is always allowed (it's what establishes the connection)
  status.value = 'pairing'
  error.value  = null

  try {
    orbLog(`[Orb] Connecting to daemon at ${payload.host}:${payload.port}`)
    await openSocket(payload.host, payload.port)

    orbLog(`[Orb] Socket open — sending Pair message`)
    const reply = await sendAndWait({
      type:    'Pair',
      payload: { token: payload.token, device_name: deviceName, device_os: deviceOs },
    })

    if (reply.type === 'PairOk') {
      const daemonName    = String((reply.payload as any).daemon_name    ?? 'orb-daemon')
      const daemonVersion = String((reply.payload as any).daemon_version ?? '?')

      const info: DaemonInfo = {
        host:        payload.host,
        port:        payload.port,
        fingerprint: payload.fingerprint,
        token:       payload.token,
        v:           payload.v,
        daemonName,
        daemonVersion,
      }
      saveDaemonInfo(info)
      registerDaemonAsDevice(info)

      // Auto-enable dev mode on successful pairing
      try {
        localStorage.setItem('orb_dev_mode_v1', 'true')
      } catch {}

      status.value = 'connected'
      startPingLoop()
      orbLog(`[Orb] ✓ Paired with daemon: ${daemonName} v${daemonVersion}`, 'info')
      return true

    } else {
      const errMsg = String(
        (reply.payload as any).message ??
        (reply.payload as any).reason  ??
        'Pairing rejected by daemon'
      )
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
// DEVICE REGISTRY SYNC
// ──────────────────────────────────────────────────────────

const DEVICES_KEY = 'orb_devices_v1'

function registerDaemonAsDevice(info: DaemonInfo) {
  try {
    const raw  = localStorage.getItem(DEVICES_KEY)
    const list: any[] = raw ? JSON.parse(raw) : []
    const now  = new Date().toISOString()
    const id   = `daemon-${info.host}`

    const device = {
      id,
      name:      info.daemonName    ?? `orb-daemon @ ${info.host}`,
      os:        `Desktop  · v${info.daemonVersion ?? '?'}`,
      osVersion: info.daemonVersion ?? '',
      cpu:       'Connected via daemon',
      cores:     4,
      ramGb:     16,
      gpuName:   'N/A',
      gpuVram:   '0GB',
      ip:        info.host,
      port:      info.port,
      lastSeen:  now,
      online:    true,
    }

    const idx = list.findIndex((d: any) => d.id === id)
    if (idx >= 0) list[idx] = device
    else list.push(device)

    localStorage.setItem(DEVICES_KEY, JSON.stringify(list))
    orbLog(`[Orb] Device registered: ${device.name}`)
    reloadDevices()
  } catch (e: any) {
    orbLog(`[Orb] Failed to register device: ${e.message}`, 'warn')
  }
}

function markDaemonDeviceOffline() {
  try {
    const raw = localStorage.getItem(DEVICES_KEY)
    if (!raw || !daemonInfo.value) return
    const list: any[] = JSON.parse(raw)
    const id   = `daemon-${daemonInfo.value.host}`
    const d    = list.find((x: any) => x.id === id)
    if (d) {
      d.online   = false
      d.lastSeen = new Date().toISOString()
      localStorage.setItem(DEVICES_KEY, JSON.stringify(list))
      reloadDevices()
    }
  } catch {}
}

function updateDeviceLastSeen(info: DaemonInfo) {
  try {
    const raw = localStorage.getItem(DEVICES_KEY)
    if (!raw) return
    const list: any[] = JSON.parse(raw)
    const id = `daemon-${info.host}`
    const d  = list.find((x: any) => x.id === id)
    if (d) {
      d.online   = true
      d.lastSeen = new Date().toISOString()
      localStorage.setItem(DEVICES_KEY, JSON.stringify(list))
    }
  } catch {}
}

// ──────────────────────────────────────────────────────────
// CONNECTION — gated by dev mode
// ──────────────────────────────────────────────────────────

export async function connect(): Promise<void> {
  const info = daemonInfo.value
  if (!info) { error.value = 'Not paired — scan QR code first'; return }

  // GATE: only connect if dev mode is on
  if (!isDevModeOn()) {
    orbLog('[Orb] Connection blocked — dev mode is off', 'warn')
    return
  }

  if (isSocketAlive()) return
  if (status.value === 'connecting') return

  try {
    await openSocket(info.host, info.port)
    registerDaemonAsDevice(info)
    status.value = 'connected'
    startPingLoop()
    orbLog(`[Orb] Reconnected to daemon`)
  } catch (e: any) {
    error.value  = e.message
    status.value = 'error'
    markDaemonDeviceOffline()
    scheduleReconnect()
  }
}

function isSocketAlive(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN
}

function openSocket(host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws) { try { ws.close() } catch {} ws = null }

    status.value = 'connecting'
    const url = `ws://${host}:${port}/ws`
    orbLog(`[Orb] Opening WebSocket: ${url}`)

    let settled = false
    const settle = (err?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(connectTimeout)
      if (err) reject(err)
      else resolve()
    }

    const connectTimeout = setTimeout(() => {
      orbLog(`[Orb] Connection timed out (12s): ${url}`, 'error')
      try { socket.close() } catch {}
      settle(new Error(
        `Connection timed out — daemon not reachable at ${host}:${port}\n` +
        `1. Is orb-daemon running?  (cargo run -- start)\n` +
        `2. Same WiFi as your phone?\n` +
        `3. Port ${port} not firewalled?`
      ))
    }, 12000)

    const socket = new WebSocket(url)
    socket.binaryType = 'arraybuffer'

    socket.onopen = () => {
      orbLog(`[Orb] WebSocket opened: ${url}`)
      ws = socket
      settle()
    }

    socket.onmessage = (e) => handleMessage(e.data)

    socket.onclose = (e) => {
      if (!settled) {
        ws = null
        settle(new Error(closeCodeToReason(e.code, host, port)))
        return
      }
      if (ws === socket) {
        ws = null
        orbLog(`[Orb] Daemon disconnected (code=${e.code})`)
        status.value    = 'disconnected'
        latencyMs.value = null
        stopPingLoop()
        markDaemonDeviceOffline()
        // Only schedule reconnect if dev mode is still on
        if (isDevModeOn()) scheduleReconnect()
      }
    }

    socket.onerror = () => {
      orbLog(`[Orb] WS error for ${url}`, 'warn')
    }
  })
}

function closeCodeToReason(code: number, host: string, port: number): string {
  if (code === 1006)
    return (
      `Cannot reach daemon at ${host}:${port}\n` +
      `1. Run: orb-daemon start\n` +
      `2. Same WiFi as your phone?\n` +
      `3. Firewall blocking port ${port}?`
    )
  if (code === 1015) return 'TLS error — use ws:// not wss://'
  return `Connection failed (code ${code}) — daemon offline or unreachable`
}

export function disconnect(): void {
  stopPingLoop()
  clearReconnectTimer()
  markDaemonDeviceOffline()
  closeSocket()
  status.value = 'disconnected'
}

export function unpair(): void {
  disconnect()
  saveDaemonInfo(null)
  orbLog('Unpaired from daemon')
}

function closeSocket() {
  if (ws) { try { ws.close() } catch {} ws = null }
}

function clearReconnectTimer() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
}

function scheduleReconnect() {
  clearReconnectTimer()
  if (!daemonInfo.value) return
  reconnectTimer = setTimeout(async () => {
    if (!isSocketAlive() && daemonInfo.value && isDevModeOn()) {
      orbLog('[Orb] Attempting reconnect…')
      await connect()
    }
  }, 5000)
}

// ──────────────────────────────────────────────────────────
// KEEP-ALIVE PING
// ──────────────────────────────────────────────────────────

function startPingLoop() {
  stopPingLoop()
  pingInterval = setInterval(async () => {
    if (!isSocketAlive()) {
      orbLog('[Orb] Ping: socket dead, reconnecting…', 'warn')
      status.value    = 'disconnected'
      latencyMs.value = null
      stopPingLoop()
      markDaemonDeviceOffline()
      if (isDevModeOn()) scheduleReconnect()
      return
    }

    const seq  = ++seqCounter
    const sent = Date.now()
    try {
      const reply = await sendAndWait({ type: 'Ping', payload: { seq } }, 5000)
      if (reply.type === 'Pong') {
        latencyMs.value = Date.now() - sent
        if (daemonInfo.value) updateDeviceLastSeen(daemonInfo.value)
      }
    } catch {
      latencyMs.value = null
      orbLog('[Orb] Ping timeout', 'warn')
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
  if (!isSocketAlive()) throw new Error('Not connected to daemon')
  for (const proj of projects) {
    for (const inst of proj.instances) {
      const vars = inst.vars.map(v => ({ key: v.key, value: v.value, type: v.type, secret: v.secret }))
      const payload = { project: proj.name, environment: inst.name, vars }
      const json = JSON.stringify({ type: 'SyncEnv', payload })
      ws!.send(json)
      orbLog(`Daemon: synced ${proj.name}/${inst.name} (${inst.vars.length} vars)`)
    }
  }
}

export async function syncSingleEnv(
  project:     string,
  environment: string,
  vars:        EnvVarLike[],
): Promise<void> {
  if (!isSocketAlive()) throw new Error('Not connected to daemon')
  const payload = { project, environment, vars: vars.map(v => ({ key: v.key, value: v.value, type: v.type, secret: v.secret })) }
  const json = JSON.stringify({ type: 'SyncEnv', payload })
  ws!.send(json)
  orbLog(`Daemon: synced ${project}/${environment} (${vars.length} vars)`)
}

export async function syncBlocklist(platforms: BlockedPlatformLike[]): Promise<void> {
  if (!isSocketAlive()) throw new Error('Not connected to daemon')
  const json = JSON.stringify({ type: 'SyncBlocklist', payload: { platforms } })
  ws!.send(json)
  orbLog(`Daemon: blocklist synced (${platforms.filter(p => p.enabled).length} active)`)
}

export async function syncVault(entries: VaultEntryLike[]): Promise<void> {
  if (!isSocketAlive()) throw new Error('Not connected to daemon')
  // Map to daemon's expected format
  const mapped = entries.map(e => ({
    id:                 e.id,
    service:            e.service,
    username:           e.username,
    encrypted_password: e.password, // daemon stores as-is, encryption is on-device
    category:           e.category,
    url:                e.url,
    notes:              e.notes,
  }))
  const json = JSON.stringify({ type: 'SyncVault', payload: { entries: mapped } })
  ws!.send(json)
  orbLog(`Daemon: vault synced (${entries.length} entries)`)
}

export async function triggerReload(target: string): Promise<void> {
  if (!isSocketAlive()) throw new Error('Not connected to daemon')
  const json = JSON.stringify({ type: 'TriggerReload', payload: { target } })
  ws!.send(json)
}

// ──────────────────────────────────────────────────────────
// LOW-LEVEL MESSAGING
// ──────────────────────────────────────────────────────────

const pendingReplies = new Map<number, {
  resolve: (msg: DaemonMessage) => void
  reject:  (e: Error) => void
  type:    string
}>()

function parseIncoming(data: ArrayBuffer | string): DaemonMessage | null {
  try {
    let json: string
    if (typeof data === 'string') {
      json = data
    } else {
      const view        = new DataView(data)
      const declaredLen = view.getUint32(0, false)
      json = (declaredLen + 4 === data.byteLength)
        ? new TextDecoder().decode(new Uint8Array(data, 4, declaredLen))
        : new TextDecoder().decode(data)
    }
    return JSON.parse(json) as DaemonMessage
  } catch (e: any) {
    orbLog(`[Orb] Message parse error: ${e.message}`, 'error')
    return null
  }
}

function handleMessage(data: ArrayBuffer | string) {
  const msg = parseIncoming(data)
  if (!msg) return

  if (status.value !== 'connected') status.value = 'connected'

  const entry = pendingReplies.entries().next().value
  if (entry) {
    const [key, { resolve, type }] = entry
    pendingReplies.delete(key)
    orbLog(`[Orb] ← ${msg.type} (reply to ${type})`)
    resolve(msg)
  } else {
    orbLog(`[Orb] ← ${msg.type} (unsolicited)`)
  }
}

function sendAndWait(
  msg:       { type: string; payload: Record<string, unknown> },
  timeoutMs = 10_000,
): Promise<DaemonMessage> {
  return new Promise((resolve, reject) => {
    if (!isSocketAlive()) {
      reject(new Error('WebSocket not open'))
      return
    }

    const seq  = ++seqCounter
    const json = JSON.stringify({ type: msg.type, payload: msg.payload })

    orbLog(`[Orb] → ${msg.type}`)
    try {
      ws!.send(json)
    } catch (e: any) {
      reject(new Error(`Send failed for ${msg.type}: ${e.message}`))
      return
    }

    pendingReplies.set(seq, { resolve, reject, type: msg.type })

    setTimeout(() => {
      if (pendingReplies.has(seq)) {
        pendingReplies.delete(seq)
        reject(new Error(`Timeout for ${msg.type} after ${timeoutMs}ms`))
      }
    }, timeoutMs)
  })
}

// ──────────────────────────────────────────────────────────
// TYPE HELPERS
// ──────────────────────────────────────────────────────────

interface EnvVarLike          { key: string; value: string; type: string; secret: boolean }
interface EnvInstanceLike     { name: string; type: string; vars: EnvVarLike[] }
interface EnvProject          { name: string; instances: EnvInstanceLike[] }
interface BlockedPlatformLike { id: string; name: string; domains: string[]; enabled: boolean }
interface VaultEntryLike      {
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