// composables/useDaemon.ts
// Orb Daemon client — connects to the desktop daemon over TCP (via Capacitor socket)
// Handles: discovery, pairing, keep-alive, data sync

import { ref, computed, watch } from 'vue'
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

const status = ref<DaemonStatus>('disconnected')
const error = ref<string | null>(null)
const daemonInfo = ref<DaemonInfo | null>(loadDaemonInfo())
const lastPong = ref<number | null>(null)
const latencyMs = ref<number | null>(null)

let socket: ReturnType<typeof useRawSocket> | null = null
let pingInterval: ReturnType<typeof setInterval> | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let seqCounter = 0

export const daemonStatus = status
export const daemonError = error
export const daemonConnected = computed(() => status.value === 'connected')
export const daemonLatency = latencyMs

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
    else localStorage.removeItem(DAEMON_KEY)
  } catch {}
  daemonInfo.value = info
}

// ──────────────────────────────────────────────────────────
// QR PAIRING
// ──────────────────────────────────────────────────────────

/** Parse the orb-pair:// URI scanned from the QR code */
export function parsePairingQR(raw: string): PairingPayload | null {
  try {
    const prefix = 'orb-pair://'
    if (!raw.startsWith(prefix)) return null
    const b64 = raw.slice(prefix.length)
    const json = atob(b64)
    return JSON.parse(json) as PairingPayload
  } catch { return null }
}

/** Complete pairing after scanning QR */
export async function completePairing(
  payload: PairingPayload,
  deviceName: string,
  deviceOs: string
): Promise<boolean> {
  status.value = 'pairing'
  error.value = null

  try {
    await connectToHost(payload.host, payload.port)

    const reply = await sendAndWait({
      type: 'Pair',
      payload: {
        token: payload.token,
        device_name: deviceName,
        device_os: deviceOs,
      },
    })

    if (reply.type === 'PairOk') {
      saveDaemonInfo({
        host: payload.host,
        port: payload.port,
        fingerprint: payload.fingerprint,
        token: payload.token,
        v: payload.v,
      })
      status.value = 'connected'
      startPingLoop()
      orbLog(`Paired with daemon: ${(reply.payload as any).daemon_name}`)
      return true
    } else {
      error.value = (reply.payload as any).message || 'Pairing rejected'
      status.value = 'error'
      disconnect()
      return false
    }
  } catch (e: any) {
    error.value = e.message || 'Connection failed'
    status.value = 'error'
    return false
  }
}

// ──────────────────────────────────────────────────────────
// CONNECTION
// ──────────────────────────────────────────────────────────

export async function connect(): Promise<void> {
  const info = daemonInfo.value
  if (!info) {
    error.value = 'Not paired — scan QR code first'
    return
  }
  await connectToHost(info.host, info.port)
}

async function connectToHost(host: string, port: number): Promise<void> {
  if (status.value === 'connected' || status.value === 'connecting') return

  status.value = 'connecting'
  orbLog(`Connecting to daemon ${host}:${port}`)

  socket = useRawSocket()
  await socket.connect(host, port)
  socket.onMessage(handleIncomingMessage)
  socket.onClose(() => {
    orbLog('Daemon connection closed')
    status.value = 'disconnected'
    stopPingLoop()
    scheduleReconnect()
  })
  socket.onError((msg: string) => {
    error.value = msg
    status.value = 'error'
    orbLog(`Daemon error: ${msg}`, 'error')
  })
}

export function disconnect(): void {
  stopPingLoop()
  if (reconnectTimer) clearTimeout(reconnectTimer)
  socket?.close()
  socket = null
  status.value = 'disconnected'
}

export function unpair(): void {
  disconnect()
  saveDaemonInfo(null)
  orbLog('Unpaired from daemon')
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(async () => {
    if (daemonInfo.value && status.value === 'disconnected') {
      orbLog('Reconnecting to daemon...')
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
    const seq = ++seqCounter
    const sent = Date.now()
    try {
      const reply = await sendAndWait({ type: 'Ping', payload: { seq } }, 5000)
      if (reply.type === 'Pong') {
        lastPong.value = Date.now()
        latencyMs.value = Date.now() - sent
      }
    } catch {
      // Ping timed out
      latencyMs.value = null
    }
  }, 10_000)
}

function stopPingLoop() {
  if (pingInterval) clearInterval(pingInterval)
  pingInterval = null
}

// ──────────────────────────────────────────────────────────
// DATA SYNC
// ──────────────────────────────────────────────────────────

/** Sync all ENV projects from the app store to the daemon */
export async function syncEnvs(projects: EnvProject[]): Promise<void> {
  ensureConnected()
  for (const proj of projects) {
    for (const inst of proj.instances) {
      await sendAndWait({
        type: 'SyncEnv',
        payload: {
          project: proj.name,
          environment: inst.name,
          vars: inst.vars.map((v) => ({
            key: v.key,
            value: v.value,
            type: v.type,
            secret: v.secret,
          })),
        },
      })
      orbLog(`Daemon: synced ${proj.name}/${inst.name} (${inst.vars.length} vars)`)
    }
  }
}

/** Sync a single ENV project/environment */
export async function syncSingleEnv(
  project: string,
  environment: string,
  vars: EnvVarLike[]
): Promise<void> {
  ensureConnected()
  await sendAndWait({
    type: 'SyncEnv',
    payload: { project, environment, vars },
  })
  orbLog(`Daemon: synced ${project}/${environment}`)
}

/** Sync the AI platform blocklist */
export async function syncBlocklist(platforms: BlockedPlatformLike[]): Promise<void> {
  ensureConnected()
  await sendAndWait({
    type: 'SyncBlocklist',
    payload: { platforms },
  })
  orbLog(`Daemon: blocklist synced (${platforms.filter((p) => p.enabled).length} active)`)
}

/** Sync vault entries (passwords stay encrypted client-side) */
export async function syncVault(entries: VaultEntryLike[]): Promise<void> {
  ensureConnected()
  await sendAndWait({
    type: 'SyncVault',
    payload: { entries },
  })
  orbLog(`Daemon: vault synced (${entries.length} entries)`)
}

/** Trigger a hot-reload on the desktop side */
export async function triggerReload(target: string): Promise<void> {
  ensureConnected()
  await sendAndWait({
    type: 'TriggerReload',
    payload: { target },
  })
}

// ──────────────────────────────────────────────────────────
// LOW-LEVEL MESSAGING
// ──────────────────────────────────────────────────────────

const pendingReplies = new Map<
  number,
  { resolve: (msg: DaemonMessage) => void; reject: (e: Error) => void }
>()

function handleIncomingMessage(data: ArrayBuffer) {
  try {
    // Strip 4-byte length prefix
    const view = new DataView(data)
    const len = view.getUint32(0, false) // big-endian
    const json = new TextDecoder().decode(new Uint8Array(data, 4, len))
    const msg = JSON.parse(json) as DaemonMessage

    // Resolve pending if this is a reply
    const pending = pendingReplies.values().next().value
    if (pending) {
      const [key] = pendingReplies.entries().next().value
      pendingReplies.delete(key)
      pending.resolve(msg)
    }

    // Update connected status on any message
    if (status.value !== 'connected') {
      status.value = 'connected'
    }
  } catch (e: any) {
    orbLog(`Daemon message parse error: ${e.message}`, 'error')
  }
}

function sendAndWait(
  msg: { type: string; payload: Record<string, unknown> },
  timeoutMs = 10_000
): Promise<DaemonMessage> {
  return new Promise((resolve, reject) => {
    if (!socket || status.value === 'disconnected') {
      reject(new Error('Not connected to daemon'))
      return
    }

    const seq = ++seqCounter
    pendingReplies.set(seq, { resolve, reject })

    const json = JSON.stringify({ type: msg.type, payload: msg.payload })
    const encoded = new TextEncoder().encode(json)
    const frame = new ArrayBuffer(4 + encoded.byteLength)
    const view = new DataView(frame)
    view.setUint32(0, encoded.byteLength, false)
    new Uint8Array(frame, 4).set(encoded)

    socket!.send(frame)

    setTimeout(() => {
      if (pendingReplies.has(seq)) {
        pendingReplies.delete(seq)
        reject(new Error(`Timeout waiting for reply to ${msg.type}`))
      }
    }, timeoutMs)
  })
}

function ensureConnected() {
  if (status.value !== 'connected') {
    throw new Error('Not connected to daemon')
  }
}

// ──────────────────────────────────────────────────────────
// RAW SOCKET (Capacitor-compatible)
// ──────────────────────────────────────────────────────────

function useRawSocket() {
  let ws: WebSocket | null = null
  let messageHandler: ((data: ArrayBuffer) => void) | null = null
  let closeHandler: (() => void) | null = null
  let errorHandler: ((msg: string) => void) | null = null

  // NOTE: In production with Capacitor, use @capacitor-community/tcp-socket
  // or a custom plugin. Here we use WebSocket as the web-compatible fallback.
  // The daemon should also expose a WebSocket endpoint (ws://host:3131/ws)
  // for browser/web compatibility alongside the raw TCP+TLS port.

  return {
    connect(host: string, port: number): Promise<void> {
      return new Promise((resolve, reject) => {
        try {
          // Try WebSocket first (web/Capacitor web)
          ws = new WebSocket(`wss://${host}:${port}/ws`)
          ws.binaryType = 'arraybuffer'

          ws.onopen = () => resolve()
          ws.onmessage = (e) => messageHandler?.(e.data)
          ws.onclose = () => closeHandler?.()
          ws.onerror = (e) => {
            errorHandler?.('WebSocket error')
            reject(new Error('WebSocket connection failed'))
          }
        } catch (e: any) {
          reject(e)
        }
      })
    },

    send(data: ArrayBuffer) {
      ws?.send(data)
    },

    close() {
      ws?.close()
      ws = null
    },

    onMessage(cb: (data: ArrayBuffer) => void) {
      messageHandler = cb
    },

    onClose(cb: () => void) {
      closeHandler = cb
    },

    onError(cb: (msg: string) => void) {
      errorHandler = cb
    },
  }
}

// ──────────────────────────────────────────────────────────
// TYPE HELPERS (mirror app store types)
// ──────────────────────────────────────────────────────────

interface EnvVarLike {
  key: string
  value: string
  type: string
  secret: boolean
}

interface EnvInstanceLike {
  name: string
  type: string
  vars: EnvVarLike[]
}

interface EnvProject {
  name: string
  instances: EnvInstanceLike[]
}

interface BlockedPlatformLike {
  id: string
  name: string
  domains: string[]
  enabled: boolean
}

interface VaultEntryLike {
  id: number
  service: string
  username: string
  password: string
  category: string
  url: string
  notes: string
}

// ──────────────────────────────────────────────────────────
// PUBLIC COMPOSABLE
// ──────────────────────────────────────────────────────────

export function useDaemon() {
  return {
    status: daemonStatus,
    connected: daemonConnected,
    error: daemonError,
    latency: daemonLatency,
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