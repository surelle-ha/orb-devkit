<template>
  <div class="devkit-root pb-28" style="touch-action:pan-y;">

    <div class="px-5 pt-6 pb-4">
      <p class="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase">orb devkit / tools</p>
      <h1 class="text-[22px] font-black text-zinc-50 tracking-tight mt-0.5 font-mono">
        <span :style="{ color: accent }">›</span> more
      </h1>
    </div>

    <!-- Quick-nav cards -->
    <div class="grid grid-cols-3 gap-3 px-4 mb-5">
      <button v-for="card in navCards" :key="card.label"
        @click="navigate(card.page)"
        class="flex flex-col items-center gap-2 rounded-2xl py-4 active:scale-95 transition-transform"
        style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center" :style="{ background: accent + '14', border: `1px solid ${accent}25` }">
          <component :is="card.icon" :size="20" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <span class="text-[12px] font-mono font-bold text-zinc-400">{{ card.label }}</span>
      </button>
    </div>

    <!-- Tools -->
    <div class="px-5 pb-2">
      <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">tools</p>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
      style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
      <button v-for="(tool, i) in tools" :key="tool.label"
        @click="navigate(tool.page)"
        :class="['w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-white/5',
          i < tools.length - 1 ? 'border-b border-white/5' : '']">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          :style="{ background: accent + '12', border: `1px solid ${accent}20` }">
          <component :is="tool.icon" :size="19" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-black font-mono text-zinc-100">{{ tool.label }}</p>
          <p class="text-[11px] font-mono text-zinc-600 mt-0.5">{{ tool.sub }}</p>
        </div>
        <div v-if="tool.badge"
          class="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black font-mono mr-1"
          :style="{ background: accent + '18', color: accent }">
          {{ tool.badge }}
        </div>
        <ChevronRight :size="15" class="text-zinc-700 flex-shrink-0" :stroke-width="2" />
      </button>
    </div>

    <!-- Developer -->
    <div class="px-5 pb-2">
      <p class="text-[10px] font-mono text-rose-500 uppercase tracking-widest">developer</p>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
      style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
      <button @click="navigate('developer')"
        class="w-full flex items-center gap-3 px-4 py-3.5 active:bg-rose-500/5 transition-colors">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.18);">
          <FlaskConical :size="19" class="text-rose-500" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-black font-mono text-rose-400">Developer Tools</p>
          <p class="text-[11px] font-mono text-zinc-600 mt-0.5">Logs, reset, diagnostics, perf monitor</p>
        </div>
        <ChevronRight :size="15" class="text-zinc-700 flex-shrink-0" :stroke-width="2" />
      </button>
    </div>

    <!-- Orb Tech card -->
    <button @click="navigate('about')"
      class="mx-4 rounded-2xl px-4 py-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
      style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);width:calc(100% - 32px);">
      <div class="relative flex-shrink-0" style="width:40px;height:40px;">
        <div class="absolute inset-0 rounded-full" :style="orbCardRing"></div>
        <div class="absolute rounded-full" :style="orbCardCore"></div>
      </div>
      <div class="flex-1 text-left">
        <p class="text-[14px] font-black font-mono text-zinc-100">Orb Tech</p>
        <p class="text-[11px] font-mono text-zinc-600">Developer Toolkit · v1.0</p>
      </div>
      <ChevronRight :size="15" class="text-zinc-700 flex-shrink-0" :stroke-width="2" />
    </button>

    <div class="h-4"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ChevronRight, FlaskConical,
  Wifi, Settings, FileCode2, Network,
} from 'lucide-vue-next'
import { settings }  from '../composables/useStore'
import { useNav }    from '../composables/useNav'

const { navigate } = useNav()
const accent = computed(() => settings.value.accentColor)

const orbCardRing = computed(() => ({
  border: `1px solid ${accent.value}80`,
  animation: 'orb-cw 8s linear infinite',
  borderRadius: '50%',
}))
const orbCardCore = computed(() => ({
  inset: '7px',
  background: 'radial-gradient(circle at 40% 35%,#18181b 0%,#09090b 60%,#000 100%)',
  boxShadow: `0 0 10px 2px ${accent.value}66`,
  borderRadius: '50%',
}))

const navCards = [
  { icon: FileCode2, label: '.env',     page: 'env'       },
  { icon: Wifi,      label: 'speedtest', page: 'more'     },
  { icon: Network,   label: 'tcp',       page: 'more'     },
]

const tools = [
  { icon: Settings,  label: 'Settings', sub: 'Preferences & appearance', page: 'settings', badge: null  },
]
</script>

<style scoped>
.devkit-root { background:#060810; min-height:100%; }
@keyframes orb-cw { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
</style>