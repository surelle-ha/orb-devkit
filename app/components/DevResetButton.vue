<template>
  <div class="flex flex-col gap-2">

    <!-- Log panel (appears after reset) -->
    <div v-if="resetLog.length"
      class="mx-4 max-h-40 overflow-y-auto bg-zinc-950 rounded-2xl p-3.5 text-[10px] font-mono text-emerald-400 border border-zinc-800"
    >
      <p v-for="line in resetLog" :key="line" class="leading-relaxed">{{ line }}</p>
    </div>

    <!-- Reset row — same style as Tools rows -->
    <div class="mx-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <button
        @click="handleReset"
        :disabled="busy"
        class="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-rose-50 dark:active:bg-rose-950/20 transition-colors disabled:opacity-50"
      >
        <div class="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0">
          <RotateCcw :size="19" class="text-rose-500" :stroke-width="1.8" :class="busy ? 'animate-spin' : ''" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">Reset All Data</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
            {{ busy ? 'Wiping data…' : 'Clears SQLite, storage & cache' }}
          </p>
        </div>
        <ChevronRight :size="17" class="text-slate-300 dark:text-zinc-700 flex-shrink-0" :stroke-width="2" />
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RotateCcw, ChevronRight } from 'lucide-vue-next'
import { useDevControl } from '~/composables/useDevControl'

const { resetAll, resetLog } = useDevControl()
const busy = ref(false)

async function handleReset() {
  busy.value = true
  try {
    await resetAll()
    setTimeout(() => window.location.reload(), 1800)
  } finally {
    busy.value = false
  }
}
</script>