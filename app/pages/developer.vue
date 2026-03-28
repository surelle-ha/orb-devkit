<template>
  <div class="bg-slate-100 dark:bg-zinc-950 pb-28" style="touch-action:pan-y;">

    <!-- Header -->
    <div class="flex items-center gap-3 px-5 pt-6 pb-4">
      <button @click="navigate('more')"
        class="w-9 h-9 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-center active:scale-90 transition-transform">
        <ChevronLeft :size="18" class="text-slate-600 dark:text-zinc-300" :stroke-width="2.5" />
      </button>
      <div>
        <h2 class="text-2xl font-black text-rose-500 tracking-tight">Developer</h2>
        <p class="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Internal tools &amp; diagnostics</p>
      </div>
    </div>

    <!-- ══ PERFORMANCE MONITOR ══ -->
    <div class="px-5 pb-2 flex items-center justify-between">
      <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Performance</h3>
      <div class="flex items-center gap-2">
        <div class="w-1.5 h-1.5 rounded-full" :class="perfMonActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'"></div>
        <span class="text-[10px] font-bold" :class="perfMonActive ? 'text-emerald-400' : 'text-zinc-600'">
          {{ perfMonActive ? 'Live' : 'Paused' }}
        </span>
        <button @click="togglePerfMon"
          class="text-[10px] font-bold px-2 py-1 rounded-lg active:opacity-60"
          :style="{ background: settings.accentColor + '18', color: settings.accentColor }">
          {{ perfMonActive ? 'Pause' : 'Resume' }}
        </button>
      </div>
    </div>
    <div class="mx-4 mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
      <div class="grid grid-cols-4 gap-2 mb-4">
        <div v-for="stat in perfStats" :key="stat.label"
          class="rounded-xl p-2.5 flex flex-col gap-0.5"
          :style="{ background: stat.color + '12', border: '1px solid ' + stat.color + '33' }">
          <span class="text-[8px] font-bold uppercase tracking-widest" :style="{ color: stat.color + 'AA' }">{{ stat.label }}</span>
          <span class="text-[16px] font-black leading-none" :style="{ color: stat.color }">{{ stat.value }}</span>
          <span class="text-[8px] font-semibold text-zinc-600">{{ stat.sub }}</span>
        </div>
      </div>

      <!-- CPU graph -->
      <div class="mb-3">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">CPU Usage</span>
          <span class="text-[10px] font-black" :style="{ color: cpuColor }">{{ latestCpu }}%</span>
        </div>
        <div class="relative h-14 bg-zinc-900 rounded-xl overflow-hidden">
          <svg class="absolute inset-0 w-full h-full" preserveAspectRatio="none" :viewBox="`0 0 ${GRAPH_POINTS} 56`">
            <line v-for="y in [14,28,42]" :key="y" x1="0" :y1="y" :x2="GRAPH_POINTS" :y2="y" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
            <path :d="cpuFillPath" :fill="cpuColor + '22'" />
            <path :d="cpuLinePath" :stroke="cpuColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
            <circle v-if="cpuHistory.length" :cx="GRAPH_POINTS - 1" :cy="56 - (cpuHistory[cpuHistory.length-1] / 100 * 56)" r="2" :fill="cpuColor"/>
          </svg>
          <div class="absolute top-0 left-1.5 h-full flex flex-col justify-between py-0.5 pointer-events-none">
            <span class="text-[7px] font-bold text-zinc-700">100%</span>
            <span class="text-[7px] font-bold text-zinc-700">50%</span>
            <span class="text-[7px] font-bold text-zinc-700">0%</span>
          </div>
        </div>
      </div>

      <!-- JS Heap graph -->
      <div class="mb-3">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">JS Heap</span>
          <span class="text-[10px] font-black text-violet-400">{{ latestHeap }} MB</span>
        </div>
        <div class="relative h-14 bg-zinc-900 rounded-xl overflow-hidden">
          <svg class="absolute inset-0 w-full h-full" preserveAspectRatio="none" :viewBox="`0 0 ${GRAPH_POINTS} 56`">
            <line v-for="y in [14,28,42]" :key="y" x1="0" :y1="y" :x2="GRAPH_POINTS" :y2="y" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
            <path :d="heapFillPath" fill="rgba(139,92,246,0.12)"/>
            <path :d="heapLinePath" stroke="#8b5cf6" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
            <circle v-if="heapHistory.length" :cx="GRAPH_POINTS - 1" :cy="56 - (heapHistory[heapHistory.length-1] / heapMax * 56)" r="2" fill="#8b5cf6"/>
          </svg>
          <div class="absolute top-0 left-1.5 h-full flex flex-col justify-between py-0.5 pointer-events-none">
            <span class="text-[7px] font-bold text-zinc-700">{{ heapMax }}M</span>
            <span class="text-[7px] font-bold text-zinc-700">{{ Math.round(heapMax/2) }}M</span>
            <span class="text-[7px] font-bold text-zinc-700">0</span>
          </div>
        </div>
      </div>

      <!-- FPS graph -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Frame Rate</span>
          <span class="text-[10px] font-black" :style="{ color: fpsColor }">{{ latestFps }} fps</span>
        </div>
        <div class="relative h-14 bg-zinc-900 rounded-xl overflow-hidden">
          <svg class="absolute inset-0 w-full h-full" preserveAspectRatio="none" :viewBox="`0 0 ${GRAPH_POINTS} 56`">
            <line v-for="y in [14,28,42]" :key="y" x1="0" :y1="y" :x2="GRAPH_POINTS" :y2="y" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
            <path :d="fpsFillPath" :fill="fpsColor + '22'"/>
            <path :d="fpsLinePath" :stroke="fpsColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
            <circle v-if="fpsHistory.length" :cx="GRAPH_POINTS - 1" :cy="56 - (Math.min(fpsHistory[fpsHistory.length-1], 60) / 60 * 56)" r="2" :fill="fpsColor"/>
          </svg>
          <div class="absolute top-0 left-1.5 h-full flex flex-col justify-between py-0.5 pointer-events-none">
            <span class="text-[7px] font-bold text-zinc-700">60fps</span>
            <span class="text-[7px] font-bold text-zinc-700">30fps</span>
            <span class="text-[7px] font-bold text-zinc-700">0</span>
          </div>
        </div>
      </div>

      <p class="text-[9px] text-zinc-700 mt-3 leading-relaxed">
        CPU estimated via JS task timing. Heap via performance.memory.
      </p>
    </div>

    <!-- ══ STORAGE INSPECTOR ══ -->
    <div class="px-5 pb-2">
      <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Storage — tap to inspect</h3>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <button v-for="(row, i) in storageRows" :key="row.key"
        @click="openInspector(row)"
        :class="['w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-slate-50 dark:active:bg-zinc-800',
          i < storageRows.length - 1 ? 'border-b border-slate-100 dark:border-zinc-800/60' : '']">
        <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          row.exists ? 'bg-violet-50 dark:bg-violet-950/40' : 'bg-slate-100 dark:bg-zinc-800']">
          <component :is="row.icon" :size="17"
            :class="row.exists ? 'text-violet-500' : 'text-slate-400 dark:text-zinc-600'"
            :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-bold text-slate-700 dark:text-zinc-200">{{ row.label }}</p>
          <p class="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5 truncate">{{ row.key }}</p>
        </div>
        <div class="text-right flex-shrink-0">
          <p :class="['text-[12px] font-bold', row.exists ? 'text-violet-500' : 'text-slate-300 dark:text-zinc-700']">{{ row.size }}</p>
          <p class="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{{ row.count }}</p>
        </div>
        <ChevronRight :size="14" class="text-slate-300 dark:text-zinc-700 flex-shrink-0" :stroke-width="2" />
      </button>
    </div>

    <!-- ══ CONNECTION LOGS ══ -->
    <div class="px-5 pb-2">
      <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Connection Events</h3>
    </div>
    <div class="mx-4 mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden">
      <div class="max-h-48 overflow-y-auto p-3 space-y-1 font-mono text-[10px]" style="-webkit-overflow-scrolling:touch;">
        <div v-if="connectionLogs.length === 0" class="text-zinc-600 py-3 text-center">No connection events yet</div>
        <div v-for="(log, i) in connectionLogs" :key="i" class="flex items-start gap-2 leading-relaxed">
          <span class="text-zinc-600 flex-shrink-0">{{ log.ts }}</span>
          <span :class="['flex-shrink-0 font-bold w-8', log.level==='error'?'text-rose-400':log.level==='warn'?'text-amber-400':'text-emerald-400']">{{ log.level[0].toUpperCase() }}</span>
          <span class="text-zinc-300 break-all">{{ log.msg }}</span>
        </div>
      </div>
    </div>

    <!-- ══ ACTIONS ══ -->
    <div class="px-5 pb-2">
      <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Actions</h3>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">

      <!-- Reset All Data — now shows confirmation overlay -->
      <button @click="showResetConfirm = true" :disabled="busy"
        class="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800/60 active:bg-rose-50 dark:active:bg-rose-950/20 transition-colors disabled:opacity-50">
        <div class="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0"
          style="border:1px solid rgba(239,68,68,0.2);">
          <RotateCcw :size="19" :class="['text-rose-500', busy ? 'animate-spin' : '']" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-rose-500">Reset All Data</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{{ busy ? 'Wiping…' : 'Clears all data & shows onboarding' }}</p>
        </div>
        <ChevronRight :size="17" class="text-slate-300 dark:text-zinc-700" :stroke-width="2" />
      </button>

      <button @click="exportLogs"
        class="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800/60 active:bg-slate-50 dark:active:bg-zinc-800 transition-colors">
        <div class="w-11 h-11 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center flex-shrink-0"
          style="border:1px solid rgba(139,92,246,0.2);">
          <Download :size="19" class="text-violet-500" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">Export Logs</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Copy log to clipboard</p>
        </div>
      </button>

      <button @click="clearLogs"
        class="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800/60 active:bg-slate-50 dark:active:bg-zinc-800 transition-colors">
        <div class="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0"
          style="border:1px solid rgba(255,255,255,0.06);">
          <Trash2 :size="19" class="text-slate-500 dark:text-zinc-400" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">Clear Logs</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{{ persistedLogs.length }} entries stored</p>
        </div>
      </button>

      <button @click="testIdleLock"
        class="w-full flex items-center gap-3 px-4 py-3.5 active:bg-amber-50 dark:active:bg-amber-950/20 transition-colors">
        <div class="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0"
          style="border:1px solid rgba(245,158,11,0.2);">
          <Lock :size="19" class="text-amber-500" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-amber-500">Test Idle Lock</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
            {{ idleLockEnabled ? `Enabled · ${idleLockMinutes}min timeout` : 'Currently disabled in Settings' }}
          </p>
        </div>
        <ChevronRight :size="17" class="text-slate-300 dark:text-zinc-700" :stroke-width="2" />
      </button>
    </div>

    <!-- ══ LIVE LOG ══ -->
    <div class="px-5 pb-2 flex items-center justify-between">
      <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Live Log</h3>
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold text-violet-500">{{ persistedLogs.length }} entries</span>
        <span class="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">Persistent</span>
      </div>
    </div>
    <div class="mx-4 mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden">
      <div class="max-h-64 overflow-y-auto p-3 space-y-1" style="-webkit-overflow-scrolling:touch;">
        <div v-if="persistedLogs.length === 0" class="text-zinc-600 text-[11px] font-mono py-2 text-center">No logs yet</div>
        <div v-for="(log, i) in persistedLogs" :key="i" class="flex items-start gap-2 text-[10px] font-mono leading-relaxed">
          <span class="text-zinc-600 flex-shrink-0">{{ log.ts }}</span>
          <span :class="['flex-shrink-0 uppercase font-bold w-8', log.level==='error'?'text-rose-400':log.level==='warn'?'text-amber-400':'text-emerald-400']">{{ log.level }}</span>
          <span class="text-zinc-300 break-all">{{ log.msg }}</span>
        </div>
      </div>
    </div>

    <div v-if="resetOutput.length" class="mx-4 mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 p-3">
      <p v-for="line in resetOutput" :key="line" class="text-[10px] font-mono text-emerald-400 leading-relaxed">{{ line }}</p>
    </div>
  </div>

  <!-- ══ RESET ALL DATA CONFIRMATION OVERLAY ══ -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showResetConfirm"
        class="fixed inset-0 z-[500] flex items-end justify-center"
        style="background:rgba(0,0,0,0.78);backdrop-filter:blur(16px);"
        @click.self="showResetConfirm = false">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t px-5 pt-5"
          style="background:#150808;border-color:rgba(139,92,246,0.3);"
          :style="{ paddingBottom:'calc(40px + env(safe-area-inset-bottom))' }">
          <div class="w-10 h-1 rounded-full mx-auto mb-5" style="background:rgba(139,92,246,0.4)"></div>

          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center"
              style="background:linear-gradient(135deg,rgba(109,40,217,0.2),rgba(139,92,246,0.12));border:1px solid rgba(139,92,246,0.3)">
              <RotateCcw :size="26" style="color:#a78bfa" :stroke-width="1.8" />
            </div>
          </div>

          <p class="text-[18px] font-black text-center mb-2 text-zinc-100">Reset All Data?</p>
          <p class="text-[13px] text-center leading-relaxed mb-3 text-zinc-500">
            This will permanently erase all local data:
          </p>

          <!-- What gets deleted -->
          <div class="flex flex-col gap-1.5 mb-5 px-2">
            <div v-for="item in resetItems" :key="item" class="flex items-center gap-2.5">
              <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background:rgba(139,92,246,0.6)"></div>
              <p class="text-[12px] font-mono text-zinc-500">{{ item }}</p>
            </div>
          </div>

          <p class="text-[11px] font-mono text-purple-700 text-center mb-5">Cannot be undone. The app will reload after reset.</p>

          <button @click="executeReset"
            class="w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] mb-3 transition-all"
            style="background:linear-gradient(135deg,#4c1d95,#7c3aed);color:white;box-shadow:0 8px 32px rgba(109,40,217,0.4)">
            ⚠ Yes, Reset Everything
          </button>
          <button @click="showResetConfirm = false"
            class="w-full py-3.5 rounded-2xl text-[15px] font-bold active:scale-[0.98] text-zinc-400"
            style="background:rgba(139,92,246,0.08);">
            Cancel
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ STORAGE INSPECTOR MODAL ══ -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="inspector"
        class="fixed inset-0 z-[200] flex flex-col"
        style="background:rgba(0,0,0,0.7);backdrop-filter:blur(12px)">
        <div class="flex-shrink-0 flex items-center justify-between px-5 pt-6 pb-4"
          style="padding-top:calc(24px + env(safe-area-inset-top))">
          <div>
            <p class="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Storage Inspector</p>
            <h3 class="text-[18px] font-black text-white mt-0.5">{{ inspector.label }}</h3>
            <p class="text-[10px] font-mono text-zinc-500 mt-0.5">{{ inspector.key }} · {{ inspector.size }}</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex bg-zinc-800 rounded-xl p-0.5 gap-0.5">
              <button v-for="v in (['pretty','raw'] as const)" :key="v"
                @click="inspectorView = v"
                :class="['text-[11px] font-bold px-2.5 py-1.5 rounded-[8px] transition-all',
                  inspectorView===v?'bg-zinc-700 text-zinc-100':'text-zinc-500']">
                {{ v }}
              </button>
            </div>
            <button @click="inspector = null" class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center active:scale-90">
              <X :size="15" color="white" :stroke-width="2.5" />
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto px-4 pb-6" style="-webkit-overflow-scrolling:touch;">
          <div v-if="inspectorView === 'pretty'">
            <div v-if="inspector.parsedType === 'settings'"
              class="rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-3 space-y-2">
              <div v-for="(val, key) in inspector.parsed" :key="String(key)"
                class="flex items-center justify-between py-1.5 border-b border-zinc-800/60 last:border-0">
                <span class="text-[12px] font-bold text-zinc-400 capitalize">{{ key }}</span>
                <span class="text-[12px] font-mono text-violet-300">{{ String(val) }}</span>
              </div>
            </div>
            <div v-else-if="inspector.parsedType === 'array'" class="space-y-2">
              <div v-if="!inspector.parsed?.length" class="text-zinc-500 text-[13px] font-mono text-center py-8">Empty</div>
              <div v-for="(item, i) in inspector.parsed" :key="i"
                class="rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">#{{ i+1 }}</span>
                </div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <template v-for="(val, key) in item" :key="String(key)">
                    <span class="text-[10px] text-zinc-500 capitalize truncate">{{ key }}</span>
                    <span class="text-[10px] text-zinc-300 font-mono truncate">{{ String(val) }}</span>
                  </template>
                </div>
              </div>
            </div>
            <div v-else class="rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-3">
              <p class="text-[12px] font-mono text-zinc-300">{{ inspector.raw }}</p>
            </div>
          </div>
          <div v-else class="rounded-2xl bg-zinc-950 border border-zinc-800 p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-bold text-zinc-600 uppercase">Raw JSON</span>
              <button @click="copyRaw" class="flex items-center gap-1 text-[10px] font-bold text-violet-400 active:opacity-60">
                <Copy :size="11" :stroke-width="2" /> Copy
              </button>
            </div>
            <pre class="text-[10px] font-mono text-zinc-300 whitespace-pre-wrap break-all leading-relaxed overflow-x-auto">{{ inspector.prettyRaw }}</pre>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  ChevronLeft, ChevronRight, RotateCcw, Download, Trash2, X,
  Settings2, Key, Copy, Lock, FileCode2, ShieldCheck, BrainCircuit,
} from 'lucide-vue-next'
import { useNav } from '../composables/useNav'
import { appLogs, orbLog, settings } from '../composables/useStore'
import { useDevControl } from '../composables/useDevControl'
import { triggerLockNow } from '../composables/useIdleLock'

const { navigate } = useNav()
const { resetAll }  = useDevControl()

const busy             = ref(false)
const resetOutput      = ref<string[]>([])
const showResetConfirm = ref(false)

const idleLockEnabled = computed(() => settings.value.idleLockEnabled)
const idleLockMinutes = computed(() => settings.value.idleLockMinutes)

// Items shown in the reset confirmation modal
const resetItems = [
  'ENV projects & variables',
  'Vault entries & master password',
  'AI prompts & usage history',
  'Focus session history & streak',
  'Daemon pairing & device list',
  'App settings & preferences',
  'Developer logs',
]

// ── Actions ────────────────────────────────────────────────
// Shows the confirmation overlay — does NOT reset directly
function handleReset() {
  showResetConfirm.value = true
}

// Called after user confirms in the overlay
async function executeReset() {
  showResetConfirm.value = false
  busy.value = true
  resetOutput.value = []
  try {
    resetOutput.value = await resetAll()
    setTimeout(() => window.location.reload(), 1500)
  } finally {
    busy.value = false
  }
}

// ── Persistent logs ────────────────────────────────────────
const LOGS_STORAGE_KEY = 'orb_dev_logs_v1'
const MAX_PERSISTED    = 500
interface PersistedLog { ts: string; level: 'info'|'warn'|'error'; msg: string }
const persistedLogs = ref<PersistedLog[]>([])

function loadPersistedLogs() {
  try { const r = localStorage.getItem(LOGS_STORAGE_KEY); if (r) persistedLogs.value = JSON.parse(r) } catch {}
}
function savePersistedLogs() {
  try { localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(persistedLogs.value)) } catch {}
}
function appendToPersistedLogs(newLogs: typeof appLogs.value) {
  if (!newLogs.length) return
  const combined = [...newLogs, ...persistedLogs.value]
  const seen = new Set<string>()
  persistedLogs.value = combined
    .filter(l => { const k = l.ts + l.msg; if (seen.has(k)) return false; seen.add(k); return true })
    .slice(0, MAX_PERSISTED)
  savePersistedLogs()
}
watch(appLogs, (logs) => appendToPersistedLogs(logs), { deep: true })
onMounted(() => { loadPersistedLogs(); appendToPersistedLogs(appLogs.value) })
function clearLogs() { persistedLogs.value = []; appLogs.value.splice(0); savePersistedLogs() }

// ── Connection logs filter ─────────────────────────────────
const connectionLogs = computed(() =>
  persistedLogs.value.filter(log =>
    log.msg.includes('[Pairing]') ||
    log.msg.includes('[Orb]') ||
    log.msg.includes('daemon') ||
    log.msg.includes('WebSocket') ||
    log.msg.toLowerCase().includes('connect')
  )
)

// ── Performance monitor ────────────────────────────────────
const GRAPH_POINTS       = 60
const SAMPLE_INTERVAL_MS = 1000

const cpuHistory  = ref<number[]>([])
const heapHistory = ref<number[]>([])
const fpsHistory  = ref<number[]>([])
const perfMonActive = ref(true)

let perfTimer: ReturnType<typeof setInterval> | null = null
let fpsRaf    = 0
let fpsFrames = 0
let fpsLastTs = 0

function measureFps(ts: number) {
  if (fpsLastTs === 0) fpsLastTs = ts
  fpsFrames++
  if (ts - fpsLastTs >= 1000) {
    pushHistory(fpsHistory, Math.round(fpsFrames * 1000 / (ts - fpsLastTs)))
    fpsFrames = 0; fpsLastTs = ts
  }
  if (perfMonActive.value) fpsRaf = requestAnimationFrame(measureFps)
}

function estimateCpu(): number {
  const t0 = performance.now()
  let x = 0
  for (let i = 0; i < 50_000; i++) x += Math.sqrt(i)
  const elapsed = performance.now() - t0
  return Math.min(100, Math.round((elapsed / 2) * 15 + (Math.random() * 4)))
}

function getHeapMb(): number {
  const mem = (performance as any).memory
  if (!mem) return 0
  return Math.round(mem.usedJSHeapSize / 1024 / 1024)
}

function pushHistory(arr: typeof cpuHistory, val: number) {
  arr.value = [...arr.value.slice(-(GRAPH_POINTS - 1)), val]
}

function samplePerf() {
  if (!perfMonActive.value) return
  pushHistory(cpuHistory, estimateCpu())
  pushHistory(heapHistory, getHeapMb())
}

function startPerfMon() {
  if (perfTimer) clearInterval(perfTimer)
  fpsFrames = 0; fpsLastTs = 0
  fpsRaf = requestAnimationFrame(measureFps)
  perfTimer = setInterval(samplePerf, SAMPLE_INTERVAL_MS)
}
function stopPerfMon() {
  if (perfTimer) { clearInterval(perfTimer); perfTimer = null }
  if (fpsRaf)    { cancelAnimationFrame(fpsRaf); fpsRaf = 0 }
}
function togglePerfMon() {
  perfMonActive.value = !perfMonActive.value
  if (perfMonActive.value) startPerfMon()
  else stopPerfMon()
}

onMounted(startPerfMon)
onUnmounted(stopPerfMon)

const latestCpu  = computed(() => cpuHistory.value[cpuHistory.value.length - 1] ?? 0)
const latestHeap = computed(() => heapHistory.value[heapHistory.value.length - 1] ?? 0)
const latestFps  = computed(() => fpsHistory.value[fpsHistory.value.length - 1] ?? 0)
const heapMax    = computed(() => Math.max(...heapHistory.value, 32))
const cpuColor   = computed(() => latestCpu.value > 70 ? '#f87171' : latestCpu.value > 40 ? '#fb923c' : '#34d399')
const fpsColor   = computed(() => latestFps.value < 20 ? '#f87171' : latestFps.value < 45 ? '#fb923c' : '#34d399')

function buildPath(values: number[], max: number, height = 56, fill = false): string {
  if (values.length < 2) return ''
  const pts = values.map((v, i) => {
    const x = (i / (GRAPH_POINTS - 1)) * GRAPH_POINTS
    const y = height - (Math.min(v, max) / max * height)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const line = 'M ' + pts.join(' L ')
  if (!fill) return line
  const first = pts[0].split(',')
  const last  = pts[pts.length - 1].split(',')
  return line + ` L ${last[0]},${height} L ${first[0]},${height} Z`
}
const cpuLinePath  = computed(() => buildPath(cpuHistory.value, 100))
const cpuFillPath  = computed(() => buildPath(cpuHistory.value, 100, 56, true))
const heapLinePath = computed(() => buildPath(heapHistory.value, heapMax.value))
const heapFillPath = computed(() => buildPath(heapHistory.value, heapMax.value, 56, true))
const fpsLinePath  = computed(() => buildPath(fpsHistory.value, 60))
const fpsFillPath  = computed(() => buildPath(fpsHistory.value, 60, 56, true))

const perfStats = computed(() => [
  { label: 'CPU',  value: latestCpu.value + '%',   sub: 'estimated',  color: cpuColor.value  },
  { label: 'Heap', value: latestHeap.value + 'M',  sub: 'JS heap',    color: '#8b5cf6'       },
  { label: 'FPS',  value: String(latestFps.value), sub: 'frame rate', color: fpsColor.value  },
  { label: 'Logs', value: String(persistedLogs.value.length), sub: 'entries', color: '#60a5fa' },
])

// ── Storage inspector ──────────────────────────────────────
const LS_KEY_META = [
  { key: 'orb_settings_v1',        label: 'App Settings',  icon: Settings2,    type: 'settings' },
  { key: 'orb_env_vars_v1',        label: 'ENV Variables', icon: FileCode2,    type: 'array'    },
  { key: 'orb_vault_entries_v1',   label: 'Vault Entries', icon: ShieldCheck,  type: 'array'    },
  { key: 'orb_prompts_v1',         label: 'AI Prompts',    icon: BrainCircuit, type: 'array'    },
  { key: 'orb_pin_meta_v1',        label: 'PIN Metadata',  icon: Key,          type: 'settings' },
  { key: 'orb_dev_logs_v1',        label: 'Dev Logs',      icon: Lock,         type: 'array'    },
]

function getStorageRow(meta: typeof LS_KEY_META[0]) {
  try {
    const raw = localStorage.getItem(meta.key)
    if (!raw) return { ...meta, exists: false, size: '0 B', count: 'empty', raw: null }
    const bytes = new Blob([raw]).size
    const sizeStr = bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`
    let count = ''
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) count = `${parsed.length} items`
      else if (typeof parsed === 'object') count = `${Object.keys(parsed).length} keys`
      else count = String(parsed)
    } catch { count = raw.slice(0, 20) }
    return { ...meta, exists: true, size: sizeStr, count, raw }
  } catch { return { ...meta, exists: false, size: 'N/A', count: 'error', raw: null } }
}
const storageRows = computed(() => LS_KEY_META.map(getStorageRow))

interface InspectorData { key: string; label: string; size: string; raw: string | null; prettyRaw: string; parsedType: string; parsed: any }
const inspector     = ref<InspectorData | null>(null)
const inspectorView = ref<'pretty'|'raw'>('pretty')

function openInspector(row: ReturnType<typeof getStorageRow>) {
  if (!row.raw) { orbLog(`Inspector: ${row.label} is empty`); return }
  let parsed: any = null, parsedType = row.type, prettyRaw = row.raw
  try {
    parsed = JSON.parse(row.raw)
    prettyRaw = JSON.stringify(parsed, null, 2)
    if (Array.isArray(parsed)) parsedType = 'array'
  } catch { parsed = row.raw; parsedType = 'flag' }
  inspector.value = { key: row.key, label: row.label, size: row.size, raw: row.raw, prettyRaw, parsedType, parsed }
  inspectorView.value = 'pretty'
}
function copyRaw() {
  if (!inspector.value?.prettyRaw) return
  navigator.clipboard?.writeText(inspector.value.prettyRaw).then(() => orbLog('Raw JSON copied'))
}

// ── Other actions ──────────────────────────────────────────
function testIdleLock() { orbLog('Dev: idle lock triggered manually'); triggerLockNow() }

function exportLogs() {
  const txt = persistedLogs.value.map(l => `[${l.ts}] ${l.level.toUpperCase()} ${l.msg}`).join('\n')
  navigator.clipboard?.writeText(txt)
    .then(() => orbLog('Logs copied'))
    .catch(() => orbLog('Copy failed', 'warn'))
}
</script>

<style scoped>
.sheet-enter-active, .sheet-leave-active { transition: opacity .3s ease; }
.sheet-enter-from, .sheet-leave-to       { opacity: 0; }
.sheet-enter-active > div, .sheet-leave-active > div { transition: transform .32s cubic-bezier(.32,1.1,.64,1); }
.sheet-enter-from > div, .sheet-leave-to > div       { transform: translateY(100%); }
</style>