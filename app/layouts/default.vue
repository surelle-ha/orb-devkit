<template>
  <div class="devkit-layout flex flex-col w-full max-w-[430px] mx-auto"
    style="height:100dvh;overflow:hidden;padding-top:env(safe-area-inset-top);">
    <div class="relative flex-1" style="overflow:hidden;min-height:0;">
      <Transition :name="transitionName">
        <div :key="activePage" class="page-wrap">
          <component :is="currentPage" />
        </div>
      </Transition>
    </div>

    <!-- Tab bar — visible on all pages except 'settings' and 'developer' -->
    <nav v-if="isTabPage" class="flex-shrink-0 flex items-center z-50"
      style="background:rgba(6,8,16,0.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,0.06);padding-bottom:calc(8px + env(safe-area-inset-bottom));">

      <button v-for="tab in leftTabs" :key="tab.id"
        class="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-1 active:scale-90 transition-transform"
        @click="navigate(tab.id)">
        <div :class="['w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200']"
          :style="activePage === tab.id
            ? { background: accent + '1E', border: `1px solid ${accent}44`, boxShadow: `0 0 14px ${accent}33` }
            : { background: 'transparent', border: '1px solid transparent' }">
          <component :is="tab.icon" :size="17"
            :style="activePage === tab.id ? { color: accent } : { color: '#3f3f46' }"
            :stroke-width="activePage === tab.id ? 2.2 : 1.8" />
        </div>
        <span class="text-[9px] font-mono font-bold"
          :style="activePage === tab.id ? { color: accent } : { color: '#3f3f46' }">
          {{ tab.label }}
        </span>
      </button>

      <!-- Center: Dev Mode orb button -->
      <div class="flex-1 flex flex-col items-center pt-1 pb-1">
        <button @click="onDevModePress"
          class="relative -mt-5 flex items-center justify-center active:scale-90 transition-all duration-200"
          style="width:52px;height:52px;border-radius:50%;">
          <div v-if="devMode" class="absolute inset-0 rounded-full dev-pulse-ring"
            :style="{ border: `1px solid ${accent}66` }"></div>
          <div class="w-full h-full rounded-full flex items-center justify-center"
            :style="devMode
              ? { background: `radial-gradient(circle at 38% 32%, #1a1a2e, #000)`, boxShadow: `0 0 0 3px #060810, 0 0 0 4.5px ${accent}88, 0 0 24px ${accent}66` }
              : { background: `radial-gradient(circle at 38% 32%, #18181b, #09090b)`, boxShadow: `0 0 0 3px #060810, 0 0 0 4.5px rgba(255,255,255,0.08)` }">
            <div v-if="devMode" class="absolute inset-0 rounded-full"
              :style="{ background: `radial-gradient(circle at 28% 26%, ${accent}2E 0%, transparent 55%)` }"></div>
            <Code2 v-if="devMode" :size="19" :style="{ color: accent, position: 'relative', zIndex: 1 }" :stroke-width="2.5" />
            <Code2 v-else :size="19" style="color:#3f3f46;position:relative;z-index:1" :stroke-width="1.8" />
          </div>
        </button>
        <span class="text-[9px] font-mono font-bold mt-1"
          :style="devMode ? { color: accent } : { color: '#3f3f46' }">
          {{ devMode ? 'dev·on' : 'dev·off' }}
        </span>
      </div>

      <!-- Right tabs: devices, tools -->
      <button v-for="tab in rightTabs" :key="tab.id"
        class="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-1 active:scale-90 transition-transform"
        @click="navigate(tab.id)">
        <div class="relative">
          <div :class="['w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200']"
            :style="activePage === tab.id
              ? { background: accent + '1E', border: `1px solid ${accent}44`, boxShadow: `0 0 14px ${accent}33` }
              : { background: 'transparent', border: '1px solid transparent' }">
            <component :is="tab.icon" :size="17"
              :style="activePage === tab.id ? { color: accent } : { color: '#3f3f46' }"
              :stroke-width="activePage === tab.id ? 2.2 : 1.8" />
          </div>
          <div v-if="tab.id === 'devices' && devMode && onlineCount > 0"
            class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 animate-pulse"
            style="border-color:#060810;"></div>
        </div>
        <span class="text-[9px] font-mono font-bold"
          :style="activePage === tab.id ? { color: accent } : { color: '#3f3f46' }">
          {{ tab.label }}
        </span>
      </button>
    </nav>
  </div>

  <!-- Dev mode confirm sheet -->
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="showDevConfirm"
        class="fixed inset-0 z-[400] flex items-end justify-center"
        style="background:rgba(0,0,0,0.7);backdrop-filter:blur(14px);"
        @click.self="showDevConfirm = false">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t px-5 pt-5"
          :style="{ background: '#0e0b1e', borderColor: accent + '33', paddingBottom: 'calc(40px + env(safe-area-inset-bottom))' }">
          <div class="w-10 h-1 rounded-full mx-auto mb-5" :style="{ background: accent + '44' }"></div>
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center"
              :style="{ background: accent + '18', border: `1px solid ${accent}33` }">
              <Code2 :size="26" :style="{ color: accent }" :stroke-width="1.8" />
            </div>
          </div>
          <p class="text-[18px] font-black text-center mb-2 text-zinc-100">
            {{ devMode ? 'Disable Dev Mode?' : 'Enable Dev Mode?' }}
          </p>
          <p class="text-[13px] text-center leading-relaxed mb-6 text-zinc-500">
            {{ devMode
              ? 'Disables TCP connection, extended logging and debug overlays.'
              : 'Enables TCP connection, device monitoring, hot reload and extended logging.' }}
          </p>
          <button @click="confirmToggle"
            class="w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] mb-3 transition-all"
            :style="{ background: accent, color: 'white', boxShadow: `0 8px 32px ${accent}44` }">
            {{ devMode ? 'Yes, disable' : 'Yes, enable dev mode' }}
          </button>
          <button @click="showDevConfirm = false"
            class="w-full py-3.5 rounded-2xl text-[15px] font-bold active:scale-[0.98] text-zinc-400 mb-2"
            :style="{ background: accent + '12' }">
            Cancel
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <AddTransactionSheet />
    <AiDownloadPill />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Home, FileCode2, MoreHorizontal, Monitor, Code2 } from 'lucide-vue-next'
import { useNav } from '../composables/useNav'
import { settings } from '../composables/useStore'
import { devMode, toggleDevMode } from '../composables/useDevMode'
import { onlineDevices } from '../composables/useDevices'

import Index     from '../pages/index.vue'
import Env       from '../pages/env.vue'
import More      from '../pages/more.vue'
import Settings  from '../pages/settings.vue'
import Developer from '../pages/developer.vue'
import Prompts   from '../pages/prompts.vue'
import Passwords from '../pages/passwords.vue'
import Vibecode  from '../pages/vibecode.vue'
import Devices   from '../pages/devices.vue'

const { activePage, transitionName, navigate, TAB_ORDER } = useNav()
const accent      = computed(() => settings.value.accentColor)
const onlineCount = computed(() => onlineDevices.value.length)

const showDevConfirm = ref(false)
function onDevModePress()  { showDevConfirm.value = true }
function confirmToggle()   { showDevConfirm.value = false; toggleDevMode() }

// ── Tab bar visibility ─────────────────────────────────────
// Show the bottom nav on all pages EXCEPT purely internal/settings pages.
// passwords, vibecode, prompts are sub-tools but should keep the nav
// so users can quickly jump to other sections without going back first.
const NO_NAV_PAGES = new Set(['settings', 'developer', 'about'])
const isTabPage = computed(() => !NO_NAV_PAGES.has(activePage.value))

const PAGE_MAP: Record<string, any> = {
  home: Index, env: Env, more: More, settings: Settings,
  developer: Developer, prompts: Prompts, passwords: Passwords,
  vibecode: Vibecode, devices: Devices, about: More,
}
const currentPage = computed(() => PAGE_MAP[activePage.value] ?? More)

const leftTabs  = [
  { id: 'home', icon: Home,      label: 'home' },
  { id: 'env',  icon: FileCode2, label: 'env'  },
]
const rightTabs = [
  { id: 'devices', icon: Monitor,        label: 'devices' },
  { id: 'more',    icon: MoreHorizontal, label: 'tools'   },
]

function handlePop() {
  const TAB_PAGES = new Set(['home', 'env', 'more', 'devices'])
  const idx = TAB_ORDER.indexOf(activePage.value)
  if (idx > 0) navigate(TAB_ORDER[idx - 1])
  else if (!TAB_PAGES.has(activePage.value)) navigate('more')
  history.pushState({ page: activePage.value }, '')
}
onMounted(() => {
  history.pushState({ page: activePage.value }, '')
  window.addEventListener('popstate', handlePop)
})
onUnmounted(() => window.removeEventListener('popstate', handlePop))
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
.devkit-layout { background: #060810; }
.font-mono { font-family: 'JetBrains Mono', 'Courier New', monospace !important; }
* { -webkit-user-select: none !important; user-select: none !important; -webkit-touch-callout: none !important; }
input, textarea { -webkit-user-select: text !important; user-select: text !important; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.page-wrap {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  overflow-y: scroll; overflow-x: hidden;
  -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior-y: contain;
}
.page-wrap::-webkit-scrollbar { display: none; }
.slide-left-enter-active, .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active {
  transition: transform .28s cubic-bezier(.35,0,.15,1), opacity .28s ease;
}
.slide-left-enter-from  { transform: translateX(100%);  opacity: 0; }
.slide-left-leave-to    { transform: translateX(-20%);  opacity: 0; }
.slide-right-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-right-leave-to   { transform: translateX(20%);   opacity: 0; }
@keyframes dev-pulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:0;transform:scale(1.22)} }
.dev-pulse-ring { animation: dev-pulse 1.6s ease-in-out infinite; }
.sheet-fade-enter-active,.sheet-fade-leave-active { transition: opacity .25s ease; }
.sheet-fade-enter-from,.sheet-fade-leave-to { opacity: 0; }
</style>