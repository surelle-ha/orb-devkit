/**
 * useOrbAI.ts — Legacy shim
 *
 * The original WebLLM/Transformers.js implementation has been replaced by the
 * native Android MediaPipe LLM plugin (useNativeLLM.ts).
 *
 * This file keeps the exported constants and re-exports from useNativeLLM so
 * any remaining imports don't break.
 */

export const AI_ENABLED_KEY = 'orb_ai_enabled_v1'
export const AI_SETUP_KEY   = 'orb_ai_setup_done_v1'

export function aiEnabled(): boolean {
  try { return localStorage.getItem(AI_ENABLED_KEY) !== 'false' } catch { return true }
}

export function setAiEnabled(on: boolean): void {
  try { localStorage.setItem(AI_ENABLED_KEY, on ? 'true' : 'false') } catch {}
}

export async function isModelCached(): Promise<boolean> {
  const { checkModelDownloaded } = await import('./useNativeLLM')
  const result = await checkModelDownloaded().catch(() => ({ downloaded: false }))
  return result.downloaded
}

// Re-export the composable under the old name so existing imports work
export { useNativeLLM as useOrbAI } from './useNativeLLM'