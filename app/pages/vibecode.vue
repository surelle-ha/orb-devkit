<template>
  <div class="devkit-root pb-28" style="touch-action:pan-y;">

    <!-- Header -->
    <div class="flex items-center gap-3 px-5 pt-6 pb-4">
      <button @click="navigate('more')"
        class="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
        style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
        <ChevronLeft :size="18" class="text-zinc-300" :stroke-width="2.5" />
      </button>
      <div class="flex-1">
        <p class="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase">orb devkit / focus</p>
        <h1 class="text-[22px] font-black text-zinc-50 tracking-tight mt-0.5 font-mono">
          <span :style="{ color: accent }">›</span> vibecode_rx
        </h1>
      </div>
    </div>

    <!-- Session card -->
    <div class="mx-4 mb-4 rounded-3xl overflow-hidden relative"
      :style="sessionActive
        ? { background: `linear-gradient(135deg, #0a0f1a, ${accent}22)`, border: `1px solid ${accent}44`, boxShadow: `0 0 40px ${accent}22` }
        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }">

      <div v-if="sessionActive" class="absolute inset-0 pointer-events-none rounded-3xl"
        :style="{ boxShadow: `inset 0 0 40px ${accent}18` }"></div>

      <div class="flex flex-col items-center px-6 py-8 gap-5">

        <!-- Timer ring -->
        <div class="relative" style="width:140px;height:140px;">
          <svg class="absolute inset-0" viewBox="0 0 140 140" style="transform:rotate(-90deg)">
            <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8" />
            <circle cx="70" cy="70" r="60" fill="none" :stroke="accent" stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="`${2 * Math.PI * 60}`"
              :stroke-dashoffset="`${2 * Math.PI * 60 * (1 - timerProgress)}`"
              style="transition:stroke-dashoffset 1s linear;" />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-[32px] font-black font-mono" :style="{ color: sessionActive ? accent : '#3f3f46' }">
              {{ formattedTime }}
            </span>
            <span class="text-[10px] font-mono uppercase tracking-widest"
              :style="{ color: sessionActive ? accent + '88' : '#27272a' }">
              {{ sessionActive ? 'focus session' : 'ready' }}
            </span>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-3">
          <div class="flex gap-1.5" v-if="!sessionActive">
            <button v-for="d in durations" :key="d.value"
              @click="selectedDuration = d.value"
              class="px-3 py-2 rounded-xl text-[12px] font-mono font-bold transition-all active:scale-90"
              :style="selectedDuration === d.value
                ? { background: accent + '20', border: `1px solid ${accent}44`, color: accent }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }">
              {{ d.label }}
            </button>
          </div>

          <button @click="sessionActive ? stopSession() : startSession()"
            class="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[14px] font-black font-mono active:scale-95 transition-all"
            :style="sessionActive
              ? { background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171' }
              : { background: accent, color:'#fff', boxShadow:`0 8px 24px ${accent}44` }">
            <component :is="sessionActive ? StopCircle : PlayCircle" :size="18" :stroke-width="2" />
            {{ sessionActive ? 'stop' : 'start_session' }}
          </button>
        </div>

        <!-- Status bar -->
        <div v-if="sessionActive" class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl"
          style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
          <div class="w-2 h-2 rounded-full animate-pulse" :style="{ background: accent }"></div>
          <div class="flex-1">
            <p class="text-[12px] font-mono font-bold" :style="{ color: accent }">session_active</p>
            <p class="text-[10px] font-mono text-zinc-600 mt-0.5">{{ blockedCount }} AI platforms blocked</p>
          </div>
          <span class="text-[12px] font-mono font-bold text-emerald-400">{{ completedToday }}× today</span>
        </div>
      </div>
    </div>

    <!-- Blocklist -->
    <div class="px-5 pb-2 flex items-center justify-between">
      <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">ai_blocklist</p>
      <span class="text-[10px] font-mono font-bold"
        :style="{ color: accent }">{{ enabledBlocks.length }} active</span>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
      style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
      <div v-for="(platform, i) in platforms" :key="platform.id"
        :class="['flex items-center gap-3 px-4 py-3.5 transition-colors',
          i < platforms.length - 1 ? 'border-b border-white/5' : '']">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[20px]"
          style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
          {{ platform.icon }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-bold font-mono text-zinc-200">{{ platform.name }}</p>
          <p class="text-[10px] font-mono text-zinc-600 mt-0.5 truncate">{{ platform.domains.join(', ') }}</p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span v-if="sessionActive && platform.enabled"
            class="text-[9px] font-mono font-bold px-2 py-1 rounded"
            style="background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.2);">
            blocked
          </span>
          <button @click="togglePlatform(platform.id)"
            class="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
            :style="{ background: platform.enabled ? accent : '' }"
            :class="!platform.enabled ? 'bg-zinc-800' : ''">
            <div :class="['absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all',
              platform.enabled ? 'left-5' : 'left-0.5']"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Sessions history -->
    <div class="px-5 pb-2">
      <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">session_history</p>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
      style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
      <div v-if="!sessionHistory.length" class="px-4 py-6 text-center">
        <p class="text-[12px] font-mono text-zinc-700">no_sessions_yet</p>
      </div>
      <div v-else v-for="(s, i) in sessionHistory.slice(0, 6)" :key="i"
        :class="['flex items-center gap-3 px-4 py-3',
          i < Math.min(sessionHistory.length, 6) - 1 ? 'border-b border-white/5' : '']">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          :style="{ background: accent + '12', border: `1px solid ${accent}20` }">
          <CheckCircle :size="15" :style="{ color: accent }" :stroke-width="2" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[12px] font-mono font-bold text-zinc-300">{{ s.duration }}min session</p>
          <p class="text-[10px] font-mono text-zinc-600 mt-0.5">{{ s.date }}</p>
        </div>
        <span class="text-[10px] font-mono" :style="{ color: accent }">+{{ s.duration }}m</span>
      </div>
    </div>

    <!-- Total focus time -->
    <div class="mx-4 mb-4 rounded-2xl px-5 py-4 flex items-center gap-4"
      :style="{ background: accent + '08', border: `1px solid ${accent}20` }">
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        :style="{ background: accent + '18', border: `1px solid ${accent}33` }">
        <Brain :size="20" :style="{ color: accent }" :stroke-width="1.8" />
      </div>
      <div class="flex-1">
        <p class="text-[12px] font-mono text-zinc-400">total_focus_time</p>
        <p class="text-[22px] font-black font-mono mt-0.5" :style="{ color: accent }">{{ totalFocusHours }}h {{ totalFocusMinutes }}m</p>
      </div>
      <div class="text-right">
        <p class="text-[10px] font-mono text-zinc-600">streak</p>
        <p class="text-[18px] font-black font-mono" :style="{ color: accent }">{{ streak }}🔥</p>
      </div>
    </div>

    <DaemonStatusPill
      :visible="true"
      :show-sync="true"
      :on-sync="daemonSyncBlocklist"
      @open-pair="navigate('devices')"
    />

    <div class="h-4"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { ChevronLeft, PlayCircle, StopCircle, CheckCircle, Brain } from 'lucide-vue-next'
import { settings, orbLog } from '../composables/useStore'
import { useNav } from '../composables/useNav'
import { useDaemon } from '~/composables/useDaemon'
import DaemonStatusPill from '~/components/DaemonStatusPill.vue'

const { navigate } = useNav()
const accent = computed(() => settings.value.accentColor)
const { connected: daemonConnected, syncBlocklist } = useDaemon()

async function daemonSyncBlocklist() {
  if (!daemonConnected.value) return
  await syncBlocklist(platforms.value).catch(() => {})
}

// ── Platforms ─────────────────────────────────────────────
const PLATFORMS_KEY = 'orb_vibecode_platforms_v1'
const HISTORY_KEY   = 'orb_vibecode_history_v1'

interface Platform { id: string; name: string; icon: string; domains: string[]; enabled: boolean }

const defaultPlatforms: Platform[] = [
  { id: 'chatgpt',    name: 'ChatGPT',      icon: '🤖', domains: ['chat.openai.com', 'chatgpt.com'], enabled: true  },
  { id: 'claude',     name: 'Claude',       icon: '🔮', domains: ['claude.ai'],                      enabled: true  },
  { id: 'gemini',     name: 'Gemini',       icon: '♊', domains: ['gemini.google.com'],               enabled: true  },
  { id: 'copilot',    name: 'Copilot',      icon: '🪟', domains: ['copilot.microsoft.com'],           enabled: true  },
  { id: 'perplexity', name: 'Perplexity',   icon: '🔍', domains: ['perplexity.ai'],                  enabled: true  },
  { id: 'grok',       name: 'Grok',         icon: '𝕏',  domains: ['grok.x.ai'],                      enabled: false },
  { id: 'cursor',     name: 'Cursor',       icon: '⌨️', domains: ['cursor.sh', 'cursor.com'],        enabled: false },
  { id: 'v0',         name: 'v0 by Vercel', icon: '▲',  domains: ['v0.dev'],                         enabled: false },
]

function loadPlatforms(): Platform[] {
  try {
    const r = localStorage.getItem(PLATFORMS_KEY)
    if (r) {
      const saved = JSON.parse(r) as Platform[]
      return defaultPlatforms.map(d => ({ ...d, enabled: saved.find(s => s.id === d.id)?.enabled ?? d.enabled }))
    }
  } catch {}
  return defaultPlatforms
}
function savePlatforms() {
  try { localStorage.setItem(PLATFORMS_KEY, JSON.stringify(platforms.value)) } catch {}
}

const platforms     = ref<Platform[]>(loadPlatforms())
const enabledBlocks = computed(() => platforms.value.filter(p => p.enabled))
const blockedCount  = computed(() => enabledBlocks.value.length)

function togglePlatform(id: string) {
  const p = platforms.value.find(p => p.id === id)
  if (p) { p.enabled = !p.enabled; savePlatforms() }
  daemonSyncBlocklist()
}

// ── Session timer ─────────────────────────────────────────
const durations = [
  { label: '25m', value: 25 },
  { label: '45m', value: 45 },
  { label: '60m', value: 60 },
  { label: '90m', value: 90 },
]

const selectedDuration = ref(25)
const sessionActive    = ref(false)
const secondsLeft      = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const timerProgress = computed(() => {
  const total = selectedDuration.value * 60
  return 1 - (secondsLeft.value / total)
})

const formattedTime = computed(() => {
  const m = Math.floor(secondsLeft.value / 60).toString().padStart(2, '0')
  const s = (secondsLeft.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

function startSession() {
  secondsLeft.value  = selectedDuration.value * 60
  sessionActive.value = true
  orbLog(`Vibecode session started: ${selectedDuration.value}min`)
  daemonSyncBlocklist()
  timerInterval = setInterval(() => {
    if (secondsLeft.value <= 0) completeSession()
    else secondsLeft.value--
  }, 1000)
}

function stopSession() {
  clearInterval(timerInterval ?? undefined); timerInterval = null
  sessionActive.value = false
  orbLog('Vibecode session stopped early')
}

function completeSession() {
  clearInterval(timerInterval ?? undefined); timerInterval = null
  sessionActive.value = false; secondsLeft.value = 0
  const now = new Date()
  sessionHistory.value.unshift({
    duration: selectedDuration.value,
    date: now.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    completedAt: now.toISOString(),
  })
  saveHistory()
  orbLog(`Vibecode session completed: ${selectedDuration.value}min`)
}

onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })

// ── History ───────────────────────────────────────────────
interface SessionRecord { duration: number; date: string; completedAt: string }

function loadHistory(): SessionRecord[] {
  try { const r = localStorage.getItem(HISTORY_KEY); if (r) return JSON.parse(r) } catch {}
  return []
}
function saveHistory() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(sessionHistory.value)) } catch {}
}

const sessionHistory = ref<SessionRecord[]>(loadHistory())

const completedToday = computed(() => {
  const today = new Date().toDateString()
  return sessionHistory.value.filter(s => new Date(s.completedAt).toDateString() === today).length
})

const totalMinutes      = computed(() => sessionHistory.value.reduce((s, r) => s + r.duration, 0))
const totalFocusHours   = computed(() => Math.floor(totalMinutes.value / 60))
const totalFocusMinutes = computed(() => totalMinutes.value % 60)
const streak = computed(() => {
  const days = new Set(sessionHistory.value.map(s => new Date(s.completedAt).toDateString()))
  let count = 0
  const d = new Date()
  while (days.has(d.toDateString())) { count++; d.setDate(d.getDate() - 1) }
  return count
})
</script>

<style scoped>
.devkit-root { background:#060810; min-height:100%; }
</style>