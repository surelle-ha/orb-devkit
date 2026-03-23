<template>
  <div class="bg-slate-100 dark:bg-zinc-950 pb-28" style="touch-action:pan-y;">

    <!-- Header -->
    <div class="flex items-center gap-3 px-5 pt-6 pb-4">
      <button @click="navigate('more')"
        class="w-9 h-9 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-center active:scale-90 transition-transform">
        <ChevronLeft :size="18" class="text-slate-600 dark:text-zinc-300" :stroke-width="2.5" />
      </button>
      <div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">About</h2>
        <p class="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Orb Finance · v1.0</p>
      </div>
    </div>

    <!-- Hero orb card -->
    <div class="mx-4 mb-5 rounded-3xl overflow-hidden relative"
      :style="{ background:'#09090b', boxShadow: `0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px ${accent}22` }">

      <!-- Nebula -->
      <div class="absolute inset-0 pointer-events-none"
        :style="{ background: `radial-gradient(ellipse at 50% 40%, ${accent}38 0%, transparent 65%)` }"></div>

      <div class="relative flex flex-col items-center py-10 px-6">
        <!-- Animated Orb -->
        <div class="relative mb-6" style="width:96px;height:96px;">
          <div class="absolute inset-0 rounded-full about-ring-a"
            :style="{ border: `1px solid ${accent}55` }"></div>
          <div class="absolute rounded-full about-ring-b"
            :style="{ inset: '-10px', border: `0.5px solid ${accent}25` }"></div>
          <div class="absolute rounded-full about-ring-c"
            :style="{ inset: '-20px', border: `0.5px solid ${accent}12` }"></div>
          <div class="absolute inset-0 rounded-full"
            style="background:radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 55%,#000 100%);"
            :style="{ boxShadow: `inset 0 0 24px rgba(0,0,0,1), 0 0 0 1px ${accent}44, 0 0 36px ${accent}22` }"></div>
          <div class="absolute inset-0 rounded-full"
            :style="{ background: `radial-gradient(circle at 28% 26%, ${accent}22 0%, transparent 55%)` }"></div>
        </div>

        <p class="text-[11px] font-bold uppercase tracking-[0.3em] mb-2" :style="{ color: accent }">Your Financial Universe</p>
        <h1 class="text-[32px] font-black text-white leading-none tracking-tight mb-1">Orb Finance</h1>
        <p class="text-[14px] text-zinc-500 font-medium">Version 1.0.0</p>
      </div>
    </div>

    <!-- Developer info -->
    <div class="px-5 pb-2">
      <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Developer</h3>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <div class="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-zinc-800/60">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          :style="{ background: accent + '18' }">
          <User :size="19" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <div>
          <p class="text-[13px] font-bold text-slate-800 dark:text-zinc-100">Developer</p>
          <p class="text-[15px] font-black text-slate-900 dark:text-zinc-50">Surelle-ha</p>
        </div>
      </div>
      <div class="flex items-center gap-3 px-4 py-4">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          :style="{ background: accent + '18' }">
          <Building2 :size="19" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <div>
          <p class="text-[13px] font-bold text-slate-800 dark:text-zinc-100">Organization</p>
          <p class="text-[15px] font-black text-slate-900 dark:text-zinc-50">Orb Finance</p>
        </div>
      </div>
    </div>


    <!-- Built with love footer -->
    <div class="flex flex-col items-center gap-2 py-6 px-8">
      <div class="h-px w-full bg-slate-200 dark:bg-zinc-800"></div>
      <p class="text-[12px] text-slate-400 dark:text-zinc-600 text-center mt-3 font-medium leading-relaxed">
        Built with ♥ by <span class="font-bold" :style="{ color: accent }">Surelle-ha</span><br>
        for <span class="font-bold text-slate-600 dark:text-zinc-300">Orb Finance</span>
      </p>
      <p class="text-[10px] text-slate-300 dark:text-zinc-700 text-center mt-1">
        © {{ year }} Orb Finance. All rights reserved.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import { settings } from '../composables/useStore'
import { useNav }   from '../composables/useNav'

const { navigate } = useNav()
const accent = computed(() => settings.value.accentColor)
const year   = new Date().getFullYear()

</script>

<style scoped>
@keyframes about-spin-cw  { from{transform:rotate(0deg)}   to{transform:rotate(360deg)}  }
@keyframes about-spin-ccw { from{transform:rotate(360deg)} to{transform:rotate(0deg)}    }
.about-ring-a { animation: about-spin-cw  10s linear infinite; }
.about-ring-b { animation: about-spin-ccw 16s linear infinite; }
.about-ring-c { animation: about-spin-cw  28s linear infinite; }
</style>