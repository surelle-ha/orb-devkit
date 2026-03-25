<template>
  <div>
    <SplashScreen v-if="phase === 'splash'" @done="onSplashDone" />
    <template v-else>
      <Transition name="app-fade">
        <div v-if="appVisible" class="contents">
          <NuxtLayout><NuxtPage /></NuxtLayout>
        </div>
      </Transition>
      <IdleLockScreen />
      <PinLockScreen />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import SplashScreen   from '~/components/SplashScreen.vue'
import IdleLockScreen from '~/components/IdleLockScreen.vue'
import PinLockScreen  from '~/components/PinLockScreen.vue'
import { useDark }    from '~/composables/useDark'
import { initIdleLock } from '~/composables/useIdleLock'
import { settings }   from '~/composables/useStore'
import { pinEnabled, lockWithPin } from '~/composables/usePin'
import { initDatabase } from '~/utils/initDatabase'
import { useDaemon } from '~/composables/useDaemon'
import { App as CapApp } from '@capacitor/app'

type Phase = 'splash' | 'app'
const phase      = ref<Phase>('splash')
const appVisible = ref(false)

const { initDark } = useDark()
initDark()

// ── Accent color injection ─────────────────────────────────
let accentStyleEl: HTMLStyleElement | null = null

function buildAccentCSS(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `
:root { --accent: ${hex}; --accent-r: ${r}; --accent-g: ${g}; --accent-b: ${b}; }
.bg-violet-50, .dark\\:bg-violet-950\\/40 { background-color: rgba(${r},${g},${b},0.08) !important; }
.bg-violet-100 { background-color: rgba(${r},${g},${b},0.15) !important; }
.bg-violet-400 { background-color: rgba(${r},${g},${b},0.75) !important; }
.bg-violet-500 { background-color: rgba(${r},${g},${b},1)    !important; }
.bg-violet-600 { background-color: rgba(${r},${g},${b},0.88) !important; }
.bg-violet-500\\/10 { background-color: rgba(${r},${g},${b},0.10) !important; }
.bg-violet-500\\/20 { background-color: rgba(${r},${g},${b},0.20) !important; }
.bg-violet-500\\/30 { background-color: rgba(${r},${g},${b},0.30) !important; }
.bg-violet-950\\/40 { background-color: rgba(${r},${g},${b},0.08) !important; }
.text-violet-300 { color: rgba(${r},${g},${b},0.75) !important; }
.text-violet-400 { color: rgba(${r},${g},${b},0.85) !important; }
.text-violet-500 { color: rgba(${r},${g},${b},1)    !important; }
.text-violet-600 { color: rgba(${r},${g},${b},0.88) !important; }
.border-violet-500       { border-color: rgba(${r},${g},${b},1)    !important; }
.border-violet-500\\/20  { border-color: rgba(${r},${g},${b},0.20) !important; }
.border-violet-500\\/25  { border-color: rgba(${r},${g},${b},0.25) !important; }
.ring-violet-400  { --tw-ring-color: rgba(${r},${g},${b},0.8) !important; }
.ring-violet-500  { --tw-ring-color: rgba(${r},${g},${b},1)   !important; }
.shadow-violet-500\\/25 { --tw-shadow-color: rgba(${r},${g},${b},0.25) !important; }
.shadow-violet-500\\/30 { --tw-shadow-color: rgba(${r},${g},${b},0.30) !important; }
.shadow-violet-500\\/40 { --tw-shadow-color: rgba(${r},${g},${b},0.40) !important; }
.accent-violet-500 { accent-color: rgba(${r},${g},${b},1) !important; }
.from-violet-500 { --tw-gradient-from: rgba(${r},${g},${b},1) !important; }
.to-violet-600   { --tw-gradient-to:   rgba(${r},${g},${b},0.85) !important; }
  `.trim()
}

function injectAccent(hex: string) {
  if (typeof document === 'undefined') return
  if (!accentStyleEl) {
    accentStyleEl = document.createElement('style')
    accentStyleEl.id = 'orb-accent'
    document.head.appendChild(accentStyleEl)
  }
  accentStyleEl.textContent = buildAccentCSS(hex)
}

injectAccent(settings.value.accentColor)
watch(() => settings.value.accentColor, hex => injectAccent(hex))

onMounted(async () => {
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {}
  initDatabase().catch(e => console.warn('[Orb] DB init:', e))

  // Reconnect to daemon when app comes to foreground
  const { connect: daemonConnect, daemonInfo } = useDaemon()
  CapApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive && daemonInfo.value) {
      daemonConnect().catch(() => {})
    }
  })
  // Initial connect attempt
  if (daemonInfo.value) daemonConnect().catch(() => {})
})

async function onSplashDone() {
  await enterApp()
}

async function enterApp() {
  phase.value = 'app'
  initIdleLock()
  if (pinEnabled.value) lockWithPin()
  await nextTick()
  setTimeout(() => { appVisible.value = true }, 40)
}
</script>

<style>
.app-fade-enter-active {
  transition: opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}
.app-fade-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.995);
}
.app-fade-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>