<template>
  <Transition name="lock-fade">
    <div v-if="isLocked"
      class="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style="backdrop-filter:blur(28px) brightness(0.35);background:rgba(0,0,0,0.55);">

      <!-- Orb — accent-colored -->
      <div class="relative mb-8" style="width:72px;height:72px;">
        <div class="absolute inset-0 rounded-full lock-ring-a"
          :style="{ border: `1px solid ${accent}80` }"></div>
        <div class="absolute rounded-full lock-ring-b"
          :style="{ inset: '4px', border: `0.5px solid ${accent}55` }"></div>
        <div class="absolute rounded-full lock-ring-c"
          :style="{ inset: '10px', boxShadow: `0 0 20px 6px ${accent}66, 0 0 40px 10px ${accent}33` }"></div>
        <div class="absolute rounded-full"
          style="inset:10px;background:radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 55%,#000 100%);box-shadow:inset 0 0 16px rgba(0,0,0,1);"></div>
      </div>

      <div class="flex flex-col items-center gap-3 px-8 text-center mb-10">
        <div class="flex items-center gap-2 mb-1">
          <Lock :size="16" :style="{ color: accent }" :stroke-width="2" />
          <span class="text-[12px] font-bold uppercase tracking-widest" :style="{ color: accent }">Orb is locked</span>
        </div>
        <p class="text-[22px] font-black text-white leading-tight">Session paused</p>
        <p class="text-[13px] text-zinc-400 font-medium leading-relaxed">
          You were away for a while. Tap anywhere to continue.
        </p>
      </div>

      <button @click="unlock"
        class="flex items-center gap-2 px-7 py-4 rounded-2xl text-white text-[15px] font-black shadow-xl active:scale-95 transition-all"
        :style="{ background: accent, boxShadow: `0 8px 32px ${accent}55` }">
        <Unlock :size="17" :stroke-width="2.5" />
        Resume Session
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Lock, Unlock } from 'lucide-vue-next'
import { isLocked, unlock } from '../composables/useIdleLock'
import { settings } from '../composables/useStore'

const accent = computed(() => settings.value.accentColor)
</script>

<style scoped>
.lock-fade-enter-active { transition:opacity 0.5s ease, backdrop-filter 0.5s ease; }
.lock-fade-leave-active { transition:opacity 0.4s ease; }
.lock-fade-enter-from, .lock-fade-leave-to { opacity:0; }

@keyframes lock-spin-cw  { from{transform:rotate(0deg)}   to{transform:rotate(360deg)}  }
@keyframes lock-spin-ccw { from{transform:rotate(360deg)} to{transform:rotate(0deg)}    }

.lock-ring-a { animation:lock-spin-cw  8s linear infinite; }
.lock-ring-b { animation:lock-spin-ccw 12s linear infinite; }
.lock-ring-c { border-radius:50%; }
</style>