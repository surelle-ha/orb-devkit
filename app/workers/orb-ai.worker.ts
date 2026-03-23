/**
 * orb-ai.worker.ts
 * Transformers.js — browser Cache Storage with persistence request.
 * env.useBrowserCache = true already stores files in Cache Storage correctly.
 * We just need to call storage.persist() so Android doesn't evict it.
 */
import { pipeline, env, TextStreamer } from '@huggingface/transformers'

// Let Transformers.js use its built-in Cache Storage (the correct approach)
env.useBrowserCache  = true
env.allowLocalModels = false

// Request durable storage so Android WebView doesn't evict cached model files
async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist) {
      const persisted = await navigator.storage.persist()
      console.log('[Orb AI] Persistent storage:', persisted ? 'granted' : 'denied')
    }
  } catch { /* non-fatal */ }
}

let pipe: any = null

const fileLoaded: Record<string, number> = {}
const fileTotal:  Record<string, number> = {}

self.onmessage = async (event: MessageEvent) => {
  const { type, payload, id } = event.data

  // ── Check if model is already cached ──────────────────────
  if (type === 'check_cache') {
    try {
      const keys = await caches.keys()
      const has  = keys.some(k => k.toLowerCase().includes('transformers'))
      // Also check if any cache has actual entries
      if (has) {
        for (const key of keys) {
          if (!key.toLowerCase().includes('transformers')) continue
          const cache = await caches.open(key)
          const reqs  = await cache.keys()
          if (reqs.length > 0) {
            self.postMessage({ type: 'cache_status', cached: true })
            return
          }
        }
      }
      self.postMessage({ type: 'cache_status', cached: false })
    } catch {
      self.postMessage({ type: 'cache_status', cached: false })
    }
    return
  }

  // ── Load model ─────────────────────────────────────────────
  if (type === 'load') {
    // Request persistent storage before download starts
    await requestPersistentStorage()

    // Reset progress tracking
    Object.keys(fileLoaded).forEach(k => delete fileLoaded[k])
    Object.keys(fileTotal).forEach(k => delete fileTotal[k])

    try {
      pipe = await pipeline('text-generation', 'onnx-community/Llama-3.2-1B-Instruct', {
        dtype:  'q4f16',
        device: 'wasm',
        progress_callback: (info: any) => {
          if (!info) return

          if (info.status === 'initiate') {
            fileLoaded[info.file] = 0
            fileTotal[info.file]  = info.total ?? 0

          } else if (info.status === 'downloading' || info.status === 'progress') {
            fileLoaded[info.file] = info.loaded ?? 0
            if (info.total) fileTotal[info.file] = info.total
            const totalBytes  = Object.values(fileTotal).reduce((a: number, b: number) => a + b, 0)
            const loadedBytes = Object.values(fileLoaded).reduce((a: number, b: number) => a + b, 0)
            const pct = totalBytes > 0 ? Math.min(94, Math.round((loadedBytes / totalBytes) * 100)) : 0
            self.postMessage({ type: 'progress', pct, msg: `Downloading… ${pct}%` })

          } else if (info.status === 'done') {
            fileLoaded[info.file] = fileTotal[info.file] ?? 0
            const totalBytes  = Object.values(fileTotal).reduce((a: number, b: number) => a + b, 0)
            const loadedBytes = Object.values(fileLoaded).reduce((a: number, b: number) => a + b, 0)
            const pct = totalBytes > 0 ? Math.min(94, Math.round((loadedBytes / totalBytes) * 100)) : 94
            self.postMessage({ type: 'progress', pct, msg: `Loaded ${info.file ?? 'file'}` })
          }
        },
      })

      self.postMessage({ type: 'ready' })

    } catch (e: any) {
      self.postMessage({ type: 'error', message: e?.message ?? 'Failed to load model' })
    }

  // ── Generate ───────────────────────────────────────────────
  } else if (type === 'generate') {
    if (!pipe) {
      self.postMessage({ type: 'generate_error', id, message: 'Model not loaded' })
      return
    }

    try {
      const { messages, maxTokens = 120 } = payload

      const streamer = new TextStreamer(pipe.tokenizer, {
        skip_prompt:         true,
        skip_special_tokens: true,
        callback_function: (token: string) => {
          self.postMessage({ type: 'generate_token', id, token })
        },
      })

      await pipe(messages, {
        max_new_tokens:   maxTokens,
        temperature:      0.7,
        do_sample:        true,
        return_full_text: false,
        streamer,
      })

      self.postMessage({ type: 'generate_done', id })

    } catch (e: any) {
      self.postMessage({ type: 'generate_error', id, message: e?.message ?? 'Generation failed' })
    }
  }
}