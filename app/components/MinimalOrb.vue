<template>
  <!-- Glassmorphism balance card -->
  <div class="mx-4 rounded-3xl overflow-hidden relative"
    style="backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);"
    :style="{
      background: isDark
        ? 'rgba(15,15,20,0.55)'
        : 'rgba(255,255,255,0.45)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)'}`,
      boxShadow: isDark
        ? `0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px ${accent}18`
        : `0 8px 32px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset, 0 0 0 1px ${accent}20`,
    }">

    <!-- Ambient colour bleed top-right -->
    <div class="absolute top-0 right-0 w-40 h-40 pointer-events-none rounded-full"
      :style="{
        background: `radial-gradient(circle at 80% 0%, ${accent}28 0%, transparent 65%)`,
        filter: 'blur(18px)',
      }"></div>

    <!-- Subtle bottom-left glow -->
    <div class="absolute bottom-0 left-0 w-32 h-24 pointer-events-none rounded-full"
      :style="{
        background: `radial-gradient(circle at 10% 100%, ${accent}14 0%, transparent 70%)`,
        filter: 'blur(14px)',
      }"></div>

    <!-- Top row: label + hide toggle -->
    <div class="relative flex items-center justify-between px-5 pt-4 pb-0 z-10">
      <div class="flex items-center gap-1.5">
        <!-- Mini orb -->
        <div class="relative flex-shrink-0" style="width:20px;height:20px;">
          <div class="absolute inset-0 rounded-full"
            :style="{ background: `radial-gradient(circle, ${accent}44 0%, transparent 70%)`, filter:'blur(3px)' }"></div>
          <div class="absolute rounded-full"
            style="inset:3px;background:radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 60%,#000 100%);"
            :style="{ boxShadow: `0 0 6px 1px ${accent}66, inset 0 0 6px rgba(0,0,0,0.9)` }"></div>
          <div class="absolute rounded-full" style="inset:3px;"
            :style="{ background: `radial-gradient(circle at 28% 26%, ${accent}30 0%, transparent 60%)` }"></div>
        </div>
        <p class="text-[10px] font-bold uppercase tracking-[0.22em]"
          :style="{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }">Total Balance</p>
      </div>
      <button @click="$emit('toggleVisibility')" class="active:scale-90 transition-transform p-1">
        <Eye    v-if="showBalance" :size="14"
          :class="isDark ? 'text-zinc-600' : 'text-slate-400'" :stroke-width="2" />
        <EyeOff v-else             :size="14"
          :class="isDark ? 'text-zinc-600' : 'text-slate-400'" :stroke-width="2" />
      </button>
    </div>

    <!-- Balance row -->
    <div class="relative z-10 flex items-baseline gap-1.5 px-5 pt-2 pb-1">
      <span class="text-[16px] font-black flex-shrink-0" :style="{ color: accent }">{{ sym }}</span>
      <span class="text-[38px] font-black tracking-tight leading-none"
        :class="totalBalance < 0 ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-900'">
        {{ showBalance ? formatAmount(Math.abs(totalBalance)) : '•••,•••' }}
      </span>
      <span v-if="totalBalance < 0 && showBalance"
        class="text-[11px] font-bold text-rose-400 mb-0.5 flex-shrink-0">deficit</span>
    </div>

    <!-- Glassmorphism divider -->
    <div class="relative z-10 mx-5 h-px"
      :style="{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }"></div>

    <!-- Income / Expense pills -->
    <div class="relative z-10 flex px-4 py-3 gap-2">

      <!-- Income pill -->
      <div class="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl"
        style="backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);"
        :style="{
          background: isDark ? 'rgba(52,211,153,0.10)' : 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.20)',
        }">
        <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style="background:rgba(16,185,129,0.15);">
          <TrendingUp :size="12" class="text-emerald-500" :stroke-width="2.5" />
        </div>
        <div class="min-w-0">
          <p class="text-[9px] font-bold uppercase tracking-wide" style="color:rgba(52,211,153,0.6)">In</p>
          <p class="text-[13px] font-black text-emerald-500 truncate">{{ sym }}{{ formatAmount(totalIncome) }}</p>
        </div>
      </div>

      <!-- Expense pill -->
      <div class="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl"
        style="backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);"
        :style="{
          background: isDark ? 'rgba(244,63,94,0.10)' : 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.20)',
        }">
        <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style="background:rgba(239,68,68,0.12);">
          <TrendingDown :size="12" class="text-rose-500" :stroke-width="2.5" />
        </div>
        <div class="min-w-0">
          <p class="text-[9px] font-bold uppercase tracking-wide" style="color:rgba(244,63,94,0.6)">Out</p>
          <p class="text-[13px] font-black text-rose-500 truncate">{{ sym }}{{ formatAmount(totalExpenses) }}</p>
        </div>
      </div>
    </div>

    <!-- Chat hint footer -->
    <button @click="$emit('openChat')"
      class="relative z-10 w-full flex items-center justify-center gap-2 px-5 py-2.5 transition-all active:opacity-60"
      :style="{
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
      }">
      <div class="w-1.5 h-1.5 rounded-full animate-pulse" :style="{ background: accent }"></div>
      <span class="text-[11px] font-bold" :style="{ color: accent + '99' }">Tap to ask Orb AI</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-vue-next'
import { settings, totalBalance, totalIncome, totalExpenses } from '../composables/useStore'
import { useDark } from '../composables/useDark'

defineProps<{ showBalance: boolean }>()
defineEmits<{ toggleVisibility: []; openChat: [] }>()

const { isDark }  = useDark()
const accent      = computed(() => settings.value.accentColor)
const sym         = computed(() => settings.value.currencySymbol)

function formatAmount(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (abs / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  return abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
</script>