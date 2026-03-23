<template>
  <div class="bg-slate-100 dark:bg-zinc-950 pb-28" style="touch-action:pan-y;">

    <div class="px-5 pt-6 pb-4">
      <h2 class="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">More</h2>
    </div>

    <!-- Quick-nav cards: Accounts · Bills · Grocery -->
    <div class="grid grid-cols-3 gap-3 px-4 mb-5">
      <button v-for="card in navCards" :key="card.label"
        @click="navigate(card.page)"
        class="flex flex-col items-center gap-2 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm py-4 active:scale-95 transition-transform">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center" :style="{ background: accent + '18' }">
          <component :is="card.icon" :size="20" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <span class="text-[12px] font-bold text-slate-700 dark:text-zinc-200">{{ card.label }}</span>
      </button>
    </div>

    <!-- Tools -->
    <div class="px-5 pb-2">
      <h3 class="text-[13px] font-bold text-slate-500 dark:text-zinc-400">Tools</h3>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <button v-for="(tool, i) in tools" :key="tool.label"
        @click="navigate(tool.page)"
        :class="['w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-slate-50 dark:active:bg-zinc-800',
          i < tools.length - 1 ? 'border-b border-slate-100 dark:border-zinc-800/60' : '']">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          :style="{ background: tool.highlight ? accent + '20' : accent + '18' }">
          <component :is="tool.icon" :size="19" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">{{ tool.label }}</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">{{ tool.sub }}</p>
        </div>
        <div v-if="tool.badge" class="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black mr-1"
          :style="{ background: accent + '20', color: accent }">{{ tool.badge }}</div>
        <ChevronRight :size="17" class="text-slate-300 dark:text-zinc-700 flex-shrink-0" :stroke-width="2" />
      </button>
    </div>

    <!-- Developer -->
    <div class="px-5 pb-2">
      <h3 class="text-[11px] font-bold text-rose-400 dark:text-rose-500 uppercase tracking-widest">Developer</h3>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <button @click="navigate('developer')"
        class="w-full flex items-center gap-3 px-4 py-3.5 active:bg-rose-50 dark:active:bg-rose-950/20 transition-colors">
        <div class="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0">
          <FlaskConical :size="19" class="text-rose-500" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-rose-500">Developer Tools</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Logs, reset, diagnostics</p>
        </div>
        <ChevronRight :size="17" class="text-slate-300 dark:text-zinc-700" :stroke-width="2" />
      </button>
    </div>

    <!-- Orb Finance card — taps to About page -->
    <button @click="navigate('about')"
      class="mx-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm px-4 py-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
      style="width:calc(100% - 32px)">
      <div class="relative flex-shrink-0" style="width:40px;height:40px;">
        <div class="absolute inset-0 rounded-full" :style="orbCardRing"></div>
        <div class="absolute rounded-full" :style="orbCardCore"></div>
      </div>
      <div class="flex-1 text-left">
        <p class="text-[14px] font-black text-slate-800 dark:text-zinc-100">Orb Finance</p>
        <p class="text-[11px] text-slate-400 dark:text-zinc-500">Your Financial Universe · v1.0</p>
      </div>
      <ChevronRight :size="15" class="text-slate-300 dark:text-zinc-700 flex-shrink-0" :stroke-width="2" />
    </button>

    <div class="h-4"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ChevronRight, ArrowLeftRight, Settings, FlaskConical,
  CreditCard, Zap, ShoppingCart, User, Dice5,
} from 'lucide-vue-next'
import { settings } from '../composables/useStore'
import { useNav }   from '../composables/useNav'

const { navigate } = useNav()
const accent = computed(() => settings.value.accentColor)

const orbCardRing = computed(() => ({
  border: `1px solid ${accent.value}80`,
  animation: 'orb-cw 8s linear infinite',
}))
const orbCardCore = computed(() => ({
  inset: '7px',
  background: 'radial-gradient(circle at 40% 35%,#18181b 0%,#09090b 60%,#000 100%)',
  boxShadow: `0 0 10px 2px ${accent.value}66`,
}))

const navCards = [
  { icon: CreditCard,   label: 'Accounts', page: 'cards'    },
  { icon: Zap,          label: 'Bills',    page: 'bills'    },
  { icon: ShoppingCart, label: 'Grocery',  page: 'grocery'  },
]

const tools = [
  { icon: User,          label: 'Profile',             sub: 'Personal info & financial details',   page: 'profile',     highlight: false, badge: null  },
  { icon: ArrowLeftRight,label: 'Transaction History', sub: 'Browse all past transactions',        page: 'transactions',highlight: false, badge: null  },
  { icon: Dice5,         label: 'Buy or Not to Buy?',  sub: 'AI-powered purchase decision helper', page: 'randomizer',  highlight: true,  badge: 'New' },
  { icon: Settings,      label: 'Settings',            sub: 'Preferences & appearance',            page: 'settings',    highlight: false, badge: null  },
]
</script>

<style scoped>
@keyframes orb-cw { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
</style>