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

    <!-- Tab bar -->
    <nav v-if="isTabPage" class="flex-shrink-0 flex items-center z-50"
      style="background:rgba(6,8,16,0.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,0.06);padding-bottom:calc(8px + env(safe-area-inset-bottom));">

      <button v-for="tab in leftTabs" :key="tab.id"
        class="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-1 active:scale-90 transition-transform"
        @click="navigate(tab.id)">
        <div :class="['w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200']" :style="activePage === tab.id
          ? { background: accent + '1E', border: `1px solid ${accent}44`, boxShadow: `0 0 14px ${accent}33` }
          : { background: 'transparent', border: '1px solid transparent' }">
          <component :is="tab.icon" :size="17" :style="activePage === tab.id ? { color: accent } : { color: '#3f3f46' }"
            :stroke-width="activePage === tab.id ? 2.2 : 1.8" />
        </div>
        <span class="text-[9px] font-mono font-bold"
          :style="activePage === tab.id ? { color: accent } : { color: '#3f3f46' }">
          {{ tab.label }}
        </span>
      </button>

      <!-- Center: TCP Start/Stop button -->
      <div class="flex-1 flex flex-col items-center pt-1 pb-1">
        <button @click="toggleTcp"
          class="relative -mt-5 w-13 h-13 flex items-center justify-center active:scale-90 transition-all duration-200"
          style="width:52px;height:52px;border-radius:50%;">

          <div v-if="tcpConnected" class="absolute inset-0 rounded-full tcp-pulse-ring"
            :style="{ border: `1px solid ${accent}66` }"></div>

          <div class="w-full h-full rounded-full flex items-center justify-center"
            :style="tcpConnected
              ? { background: `radial-gradient(circle at 38% 32%, #1a1a2e, #000)`, boxShadow: `0 0 0 3px #060810, 0 0 0 4.5px ${accent}88, 0 0 24px ${accent}66` }
              : { background: `radial-gradient(circle at 38% 32%, #18181b, #09090b)`, boxShadow: `0 0 0 3px #060810, 0 0 0 4.5px rgba(255,255,255,0.08)` }">

            <div v-if="tcpConnected" class="absolute inset-0 rounded-full"
              :style="{ background: `radial-gradient(circle at 28% 26%, ${accent}2E 0%, transparent 55%)` }"></div>

            <Zap v-if="tcpConnected" :size="20" :style="{ color: accent, position: 'relative', zIndex: 1 }"
              :stroke-width="2.5" />
            <Zap v-else :size="20" style="color:#3f3f46;position:relative;z-index:1" :stroke-width="1.8" />
          </div>
        </button>
        <span class="text-[9px] font-mono font-bold mt-1"
          :style="tcpConnected ? { color: accent } : { color: '#3f3f46' }">
          {{ tcpConnected ? 'tcp·on' : 'tcp·off' }}
        </span>
      </div>

      <button v-for="tab in rightTabs" :key="tab.id"
        class="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-1 active:scale-90 transition-transform"
        @click="navigate(tab.id)">
        <div class="relative">
          <div :class="['w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200']" :style="activePage === tab.id
            ? { background: accent + '1E', border: `1px solid ${accent}44`, boxShadow: `0 0 14px ${accent}33` }
            : { background: 'transparent', border: '1px solid transparent' }">
            <component :is="tab.icon" :size="17"
              :style="activePage === tab.id ? { color: accent } : { color: '#3f3f46' }"
              :stroke-width="activePage === tab.id ? 2.2 : 1.8" />
          </div>
        </div>
        <span class="text-[9px] font-mono font-bold"
          :style="activePage === tab.id ? { color: accent } : { color: '#3f3f46' }">
          {{ tab.label }}
        </span>
      </button>
    </nav>
  </div>

  <Teleport to="body">
    <AddTransactionSheet />
    <AiDownloadPill />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Home, FileCode2, FlaskConical, MoreHorizontal, Zap } from 'lucide-vue-next'
import { useNav } from '../composables/useNav'
import { settings } from '../composables/useStore'
import { tcpConnected, toggleTcp } from '../composables/useTcp'

// Page imports
import Index    from '../pages/index.vue'
import Env      from '../pages/env.vue'
import More     from '../pages/more.vue'
import Settings from '../pages/settings.vue'
import Developer from '../pages/developer.vue'
import Prompts  from '../pages/prompts.vue'
import Passwords from '../pages/passwords.vue'
import Vibecode  from '../pages/vibecode.vue'

const { activePage, transitionName, navigate, TAB_ORDER } = useNav()
const accent = computed(() => settings.value.accentColor)

// ── Pages ─────────────────────────────────────────────────
const TAB_PAGES = new Set(['home', 'env', 'grocery', 'bills', 'more'])
const isTabPage = computed(() => TAB_PAGES.has(activePage.value))

const PAGE_MAP: Record<string, any> = {
  home:      Index,
  env:       Env,
  more:      More,
  settings:  Settings,
  developer: Developer,
  prompts:   Prompts,
  passwords: Passwords,
  vibecode:  Vibecode,
  // 'about' redirected to 'more' — no About.vue needed
  about:     More,
}
const currentPage = computed(() => PAGE_MAP[activePage.value] ?? More)

const leftTabs = [
  { id: 'home',  icon: Home,      label: 'home' },
  { id: 'env',   icon: FileCode2, label: 'env'  },
]
const rightTabs = [
  { id: 'more',      icon: MoreHorizontal, label: 'tools' },
  { id: 'developer', icon: FlaskConical,   label: 'dev'   },
]

function handlePop() {
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

* {
  -webkit-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none !important;
}
input, textarea {
  -webkit-user-select: text !important;
  user-select: text !important;
}

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.page-wrap {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  overflow-y: scroll; overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior-y: contain;
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

@keyframes tcp-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%       { opacity: 0;   transform: scale(1.22); }
}
.tcp-pulse-ring { animation: tcp-pulse 1.6s ease-in-out infinite; }
</style>