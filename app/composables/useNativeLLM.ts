// composables/useNativeLLM.ts
//
// Bridges Vue ↔ native Android LlmPlugin (Orb AI).
// Auto-activates when model finishes loading — no app restart needed.

import { ref, readonly } from 'vue'
import { registerPlugin } from '@capacitor/core'

// ── Native plugin interface ────────────────────────────────────────────────
interface LlmNativePlugin {
  loadModel():                     Promise<{ status: string }>
  setBackend(opts: { backend: 'CPU'|'GPU' }): Promise<{ backend: string; requiresReload: boolean }>
  getBackend():                    Promise<{ backend: string }>
  generate(o: { prompt: string }): Promise<void>
  isReady():                       Promise<{ ready: boolean }>
  isDownloaded():                  Promise<{ downloaded: boolean; partial: boolean; partialMB: number }>
  deleteModel():                   Promise<{ deleted: boolean }>
  addListener(event: string, cb: (data: any) => void): Promise<{ remove: () => void }>
}

const LlmNative = registerPlugin<LlmNativePlugin>('Llm', {
  web: {
    loadModel:    async () => ({ status: 'unavailable' }),
    setBackend:   async () => ({ backend: 'CPU', requiresReload: false }),
    getBackend:   async () => ({ backend: 'CPU' }),
    generate:     async () => {},
    isReady:      async () => ({ ready: false }),
    isDownloaded: async () => ({ downloaded: false, partial: false, partialMB: 0 }),
    deleteModel:  async () => ({ deleted: false }),
    addListener:  async () => ({ remove: () => {} }),
  },
})

// ── Singleton state ────────────────────────────────────────────────────────
const isReady      = ref(false)
const isLoading    = ref(false)
const isDownloaded = ref(false)
const progress     = ref(0)
const progressMsg  = ref('')
const error        = ref('')

const _listeners: Array<{ remove: () => void }> = []

function _removeAllListeners() {
  _listeners.forEach(l => l.remove())
  _listeners.length = 0
}

// ── Attach core listeners (called once on init) ───────────────────────────
async function _attachCoreListeners() {
  _removeAllListeners()

  const progressL = await LlmNative.addListener('llmProgress', (d: { message: string; pct: number }) => {
    progressMsg.value  = d.message
    progress.value     = d.pct
    isDownloaded.value = d.pct >= 88
  })
  _listeners.push(progressL)

  // llmReady fires when model is fully loaded — auto-activate without restart
  const readyL = await LlmNative.addListener('llmReady', (_d: { ready: boolean }) => {
    isLoading.value = false
    isReady.value   = true
    progress.value  = 100
    progressMsg.value = 'Orb AI is ready'
  })
  _listeners.push(readyL)

  const errorL = await LlmNative.addListener('llmError', (d: { message: string }) => {
    error.value     = d.message
    isLoading.value = false
    isReady.value   = false   // session torn down — needs reload
  })
  _listeners.push(errorL)
}

// ── checkModelDownloaded ───────────────────────────────────────────────────
export async function checkModelDownloaded(): Promise<{ downloaded: boolean; partial: boolean; partialMB: number }> {
  try {
    const result = await LlmNative.isDownloaded()
    isDownloaded.value = result.downloaded
    return result
  } catch {
    return { downloaded: false, partial: false, partialMB: 0 }
  }
}

// ── initModel ─────────────────────────────────────────────────────────────
// Starts background download + model load. Safe to call multiple times.
// Download runs in Android foreground service — survives app backgrounding.
export async function initNativeModel(
  onProgress?: (pct: number, msg: string) => void
): Promise<void> {
  if (isReady.value || isLoading.value) return

  isLoading.value   = true
  progress.value    = 0
  progressMsg.value = 'Starting…'
  error.value       = ''

  await _attachCoreListeners()

  // Optional per-call progress callback
  if (onProgress) {
    const l = await LlmNative.addListener('llmProgress', (d: { message: string; pct: number }) => {
      onProgress(d.pct, d.message)
    })
    _listeners.push(l)

    // Also forward llmReady to the callback at 100%
    const rl = await LlmNative.addListener('llmReady', () => {
      onProgress(100, 'Orb AI is ready')
    })
    _listeners.push(rl)
  }

  try {
    // loadModel returns when model is fully ready (download + load)
    await LlmNative.loadModel()
  } catch (e: any) {
    error.value     = e?.message ?? 'Unknown error'
    isLoading.value = false
    isReady.value   = false
    throw e
  }
}

// ── generate ──────────────────────────────────────────────────────────────
export async function generateNative(
  systemPrompt: string,
  userMessage:  string,
  history:      Array<{ role: 'user' | 'assistant'; content: string }>,
  onToken:      (token: string) => void
): Promise<string> {
  if (!isReady.value) throw new Error('Model not ready')

  // Orb AI prompt format
  let prompt = `<start_of_turn>system\n${systemPrompt}<end_of_turn>\n`
  for (const msg of history.slice(-4)) {
    prompt += `<start_of_turn>${msg.role === 'user' ? 'user' : 'model'}\n${msg.content}<end_of_turn>\n`
  }
  prompt += `<start_of_turn>user\n${userMessage}<end_of_turn>\n<start_of_turn>model\n`

  let fullResponse = ''

  const tokenL = await LlmNative.addListener('llmToken', (d: { token: string }) => {
    fullResponse += d.token
    onToken(d.token)
  })

  await new Promise<void>((resolve, reject) => {
    let doneL:  { remove: () => void }
    let errorL: { remove: () => void }
    const cleanup = () => { doneL?.remove(); errorL?.remove() }

    Promise.all([
      LlmNative.addListener('llmDone',  ()                       => { cleanup(); resolve() }),
      LlmNative.addListener('llmError', (d: { message: string }) => { cleanup(); reject(new Error(d.message)) }),
    ]).then(([d, e]) => { doneL = d; errorL = e })

    LlmNative.generate({ prompt }).catch(e => { cleanup(); reject(e) })
  })

  tokenL.remove()
  return fullResponse
}

// ── deleteModel ───────────────────────────────────────────────────────────
export async function deleteNativeModel(): Promise<void> {
  await LlmNative.deleteModel()
  isReady.value      = false
  isDownloaded.value = false
  isLoading.value    = false
  progress.value     = 0
  progressMsg.value  = ''
}

// ── Composable ────────────────────────────────────────────────────────────
// ── setAiBackend / getAiBackend ───────────────────────────────────────────
export async function setAiBackend(backend: 'CPU' | 'GPU'): Promise<void> {
  try {
    await LlmNative.setBackend({ backend })
    // Also persist in localStorage so the settings UI stays in sync
    try { localStorage.setItem('orb_ai_backend_v1', backend) } catch {}
  } catch (e) {
    console.warn('[OrbAI] setBackend failed:', e)
  }
}

export async function getAiBackend(): Promise<'CPU' | 'GPU'> {
  try {
    const r = await LlmNative.getBackend()
    return (r.backend === 'GPU' ? 'GPU' : 'CPU')
  } catch {
    return 'CPU'
  }
}

export function useNativeLLM() {
  return {
    isReady:      readonly(isReady),
    isLoading:    readonly(isLoading),
    isDownloaded: readonly(isDownloaded),
    progress:     readonly(progress),
    progressMsg:  readonly(progressMsg),
    error:        readonly(error),
    initModel:          initNativeModel,
    generate:           generateNative,
    checkModelDownloaded,
    deleteModel:        deleteNativeModel,
  }
}