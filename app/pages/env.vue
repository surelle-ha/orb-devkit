<template>
  <div class="devkit-root pb-28" style="touch-action:pan-y;">

    <!-- Header -->
    <div class="flex items-center justify-between px-5 pt-6 pb-3">
      <div>
        <p class="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase">orb devkit / env_manager</p>
        <h1 class="text-[22px] font-black text-zinc-50 tracking-tight mt-0.5 font-mono">
          <span :style="{ color: accent }">›</span> .env
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <!-- TCP sync status -->
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          :style="{ background: tcpConnected ? '#10b98118' : '#ef444418', border: `1px solid ${tcpConnected ? '#10b98133' : '#ef444433'}` }">
          <div :class="['w-1.5 h-1.5 rounded-full', tcpConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500']"></div>
          <span class="text-[10px] font-mono font-bold" :style="{ color: tcpConnected ? '#34d399' : '#f87171' }">
            {{ tcpConnected ? 'SYNCED' : 'OFFLINE' }}
          </span>
        </div>
        <button @click="showAddVar = true"
          class="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
          <Plus :size="17" class="text-zinc-300" :stroke-width="2" />
        </button>
      </div>
    </div>

    <!-- TCP Connect Banner (when offline) -->
    <div v-if="!tcpConnected" class="mx-4 mb-4 rounded-2xl overflow-hidden"
      style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.18);">
      <div class="flex items-center gap-3 px-4 py-3.5">
        <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
          <Unplug :size="18" class="text-rose-400" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-black text-rose-300 font-mono">VSCode not connected</p>
          <p class="text-[10px] font-mono text-zinc-600 mt-0.5">Install Orb DevKit extension → connect via TCP</p>
        </div>
        <button @click="connectTcp"
          class="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold active:scale-95 transition-all"
          style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.25);color:#f87171;">
          connect
        </button>
      </div>
    </div>

    <!-- TCP Connected Banner -->
    <div v-else class="mx-4 mb-4 rounded-2xl overflow-hidden"
      style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.18);">
      <div class="flex items-center gap-3 px-4 py-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <PlugZap :size="18" class="text-emerald-400" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-black text-emerald-300 font-mono">Live sync active</p>
          <p class="text-[10px] font-mono text-zinc-600 mt-0.5">127.0.0.1:{{ tcpPort }} · {{ envGroups.flatMap(g=>g.vars).length }} vars synced</p>
        </div>
        <button @click="triggerSync"
          class="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold active:scale-95 transition-all flex items-center gap-1.5"
          :style="{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }">
          <RefreshCw :size="10" :stroke-width="2.5" :class="syncing ? 'animate-spin' : ''" />
          sync
        </button>
      </div>
    </div>

    <!-- Filter / Search -->
    <div class="flex items-center gap-2 px-4 mb-3">
      <div class="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5"
        style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
        <Search :size="13" class="text-zinc-600 flex-shrink-0" :stroke-width="2" />
        <input v-model="search" placeholder="search vars…"
          class="flex-1 bg-transparent text-[12px] font-mono text-zinc-200 placeholder:text-zinc-700 outline-none" />
        <button v-if="search" @click="search = ''" class="text-zinc-700 active:text-zinc-500">
          <X :size="11" :stroke-width="2.5" />
        </button>
      </div>
      <!-- Group filter chips -->
      <div class="flex gap-1.5 overflow-x-auto scrollbar-hide">
        <button v-for="g in ['all', ...envGroups.map(g => g.name)]" :key="g"
          @click="activeGroup = g"
          :class="['flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all']"
          :style="activeGroup === g
            ? { background: accent + '20', border: `1px solid ${accent}44`, color: accent }
            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#52525b' }">
          {{ g }}
        </button>
      </div>
    </div>

    <!-- Env Var Groups -->
    <div v-if="filteredGroups.length === 0" class="mx-4 rounded-2xl flex flex-col items-center gap-3 py-12"
      style="border:2px dashed rgba(255,255,255,0.06);">
      <FileCode :size="28" class="text-zinc-700" :stroke-width="1.5" />
      <p class="text-[13px] font-mono text-zinc-600">{{ search ? 'no_results_found' : 'no_vars_yet' }}</p>
      <button @click="showAddVar = true"
        class="flex items-center gap-1.5 text-[11px] font-mono font-bold px-4 py-2 rounded-xl active:scale-95 transition-all"
        :style="{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }">
        <Plus :size="12" :stroke-width="2.5" /> add_var
      </button>
    </div>

    <div v-for="group in filteredGroups" :key="group.name" class="mb-3">
      <!-- Group header -->
      <div class="flex items-center justify-between px-5 pb-2">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full" :style="{ background: group.color }"></div>
          <p class="text-[10px] font-mono font-bold uppercase tracking-widest" :style="{ color: group.color + 'AA' }">
            {{ group.name }}
          </p>
          <span class="text-[9px] font-mono text-zinc-700">{{ group.vars.length }} vars</span>
        </div>
        <button @click="addVarToGroup(group.name)"
          class="text-[10px] font-mono text-zinc-700 active:text-zinc-400 transition-colors flex items-center gap-1">
          <Plus :size="10" :stroke-width="2.5" /> add
        </button>
      </div>

      <!-- Vars list -->
      <div class="mx-4 rounded-2xl overflow-hidden"
        style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
        <div v-for="(v, i) in group.vars" :key="v.id"
          :class="['flex items-center gap-3 px-4 py-3 transition-colors active:bg-white/5',
            i < group.vars.length - 1 ? 'border-b border-white/5' : '']">

          <!-- Key/type indicator -->
          <div class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            :style="{ background: group.color + '14', border: `1px solid ${group.color}28` }">
            <component :is="typeIcon(v.type)" :size="13" :style="{ color: group.color + 'CC' }" :stroke-width="2" />
          </div>

          <!-- Key name + value -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-[12px] font-mono font-bold text-zinc-200 truncate">{{ v.key }}</p>
              <span v-if="v.synced" class="text-[8px] font-mono text-emerald-500 flex-shrink-0">↑ synced</span>
              <span v-if="v.secret" class="text-[8px] font-mono text-amber-500 flex-shrink-0">🔒</span>
            </div>
            <p class="text-[10px] font-mono mt-0.5 truncate"
              :style="{ color: v.secret && !v.revealed ? '#52525b' : group.color + '88' }">
              {{ v.secret && !v.revealed ? '••••••••••••••••' : v.value || '(empty)' }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Reveal secret -->
            <button v-if="v.secret" @click="toggleReveal(v.id)"
              class="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
              style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.15);">
              <Eye v-if="!v.revealed" :size="12" style="color:#fbbf24" :stroke-width="2" />
              <EyeOff v-else :size="12" style="color:#fbbf24" :stroke-width="2" />
            </button>
            <!-- Copy -->
            <button @click="copyVar(v)"
              class="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
              style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
              <Copy :size="11" class="text-zinc-600" :stroke-width="2" />
            </button>
            <!-- Edit -->
            <button @click="editVar(v)"
              class="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
              :style="{ background: accent + '10', border: `1px solid ${accent}20` }">
              <Pencil :size="11" :style="{ color: accent + 'CC' }" :stroke-width="2" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pocket ENV Format Export -->
    <div class="px-5 pb-2 pt-2">
      <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">export</p>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
      style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
      <button @click="exportDotEnv"
        class="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition-colors border-b border-white/5">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          :style="{ background: accent + '14', border: `1px solid ${accent}28` }">
          <FileDown :size="17" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <div class="flex-1 text-left">
          <p class="text-[13px] font-black font-mono text-zinc-200">Export .env</p>
          <p class="text-[10px] font-mono text-zinc-600 mt-0.5">Copy all vars as .env format to clipboard</p>
        </div>
        <ArrowRight :size="14" class="text-zinc-700 flex-shrink-0" :stroke-width="2" />
      </button>
      <button @click="exportJson"
        class="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition-colors">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);">
          <Braces :size="17" style="color:#818cf8" :stroke-width="1.8" />
        </div>
        <div class="flex-1 text-left">
          <p class="text-[13px] font-black font-mono text-zinc-200">Export JSON</p>
          <p class="text-[10px] font-mono text-zinc-600 mt-0.5">Copy as JSON object to clipboard</p>
        </div>
        <ArrowRight :size="14" class="text-zinc-700 flex-shrink-0" :stroke-width="2" />
      </button>
    </div>

    <div class="h-4"></div>
  </div>

  <!-- ── Add / Edit Var Sheet ── -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showAddVar || editTarget"
        class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.7);backdrop-filter:blur(14px)"
        @click.self="closeSheet">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t overflow-hidden"
          style="background:#0c0c18;border-color:rgba(255,255,255,0.08);"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-3 px-5 pt-4">
            <div class="w-10 h-1 rounded-full self-center mb-1" style="background:rgba(255,255,255,0.08)"></div>
            <p class="text-[16px] font-black font-mono text-center text-zinc-100">
              {{ editTarget ? 'edit_var' : 'new_var' }}
            </p>

            <!-- Key input -->
            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">KEY</p>
              <input v-model="varForm.key" placeholder="VARIABLE_NAME"
                class="w-full rounded-xl px-4 py-3 text-[13px] font-mono font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);"
                @input="varForm.key = varForm.key.toUpperCase().replace(/[^A-Z0-9_]/g,'_')" />
            </div>

            <!-- Value input -->
            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">VALUE</p>
              <div class="flex items-center gap-2 rounded-xl px-4 py-3"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
                <input v-model="varForm.value"
                  :type="varForm.secret && !varForm.revealInForm ? 'password' : 'text'"
                  placeholder="your_value_here"
                  class="flex-1 bg-transparent text-[13px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none" />
                <button v-if="varForm.secret" @click="varForm.revealInForm = !varForm.revealInForm"
                  class="flex-shrink-0 active:opacity-60">
                  <Eye v-if="!varForm.revealInForm" :size="14" class="text-amber-500" :stroke-width="2" />
                  <EyeOff v-else :size="14" class="text-amber-500" :stroke-width="2" />
                </button>
              </div>
            </div>

            <!-- Group + Type row -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">GROUP</p>
                <div class="flex flex-col gap-1">
                  <button v-for="g in envGroups" :key="g.name"
                    @click="varForm.group = g.name"
                    :class="['flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-mono font-bold transition-all']"
                    :style="varForm.group === g.name
                      ? { background: g.color + '20', border: `1px solid ${g.color}44`, color: g.color }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }">
                    <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: g.color }"></div>
                    {{ g.name }}
                  </button>
                </div>
              </div>
              <div>
                <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">TYPE</p>
                <div class="flex flex-col gap-1">
                  <button v-for="t in varTypes" :key="t.value"
                    @click="varForm.type = t.value"
                    :class="['flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-mono font-bold transition-all']"
                    :style="varForm.type === t.value
                      ? { background: accent + '18', border: `1px solid ${accent}33`, color: accent }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }">
                    <component :is="t.icon" :size="11" :stroke-width="2" />
                    {{ t.label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Secret toggle -->
            <button @click="varForm.secret = !varForm.secret"
              :class="['flex items-center gap-3 px-4 py-3 rounded-xl border transition-all']"
              :style="varForm.secret
                ? { background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)' }
                : { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }">
              <Lock :size="15" :class="varForm.secret ? 'text-amber-400' : 'text-zinc-700'" :stroke-width="2" />
              <div class="flex-1 text-left">
                <p class="text-[12px] font-mono font-bold" :class="varForm.secret ? 'text-amber-300' : 'text-zinc-500'">
                  Mark as secret
                </p>
                <p class="text-[10px] font-mono text-zinc-700 mt-0.5">Value will be masked in the UI</p>
              </div>
              <div :class="['w-10 h-5 rounded-full transition-all relative flex-shrink-0',
                varForm.secret ? 'bg-amber-500' : 'bg-zinc-800']">
                <div :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                  varForm.secret ? 'left-5' : 'left-0.5']"></div>
              </div>
            </button>

            <!-- Action buttons -->
            <div class="flex gap-2 mt-1">
              <button v-if="editTarget" @click="deleteVar(editTarget.id)"
                class="w-10 h-12 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-all"
                style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);">
                <Trash2 :size="16" class="text-rose-500" :stroke-width="2" />
              </button>
              <button @click="saveVar" :disabled="!varForm.key.trim()"
                class="flex-1 py-3.5 rounded-xl text-[14px] font-black font-mono active:scale-[0.98] transition-all"
                :style="varForm.key.trim()
                  ? { background: accent, color: '#fff', boxShadow: `0 6px 20px ${accent}44` }
                  : { background: 'rgba(255,255,255,0.05)', color: '#3f3f46', border: '1px solid rgba(255,255,255,0.06)' }">
                {{ editTarget ? 'save_changes' : 'add_var' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Copy toast -->
  <Transition name="toast">
    <div v-if="toastMsg"
      class="fixed left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2 px-4 py-2.5 rounded-xl"
      style="top:calc(16px + env(safe-area-inset-top));background:rgba(12,12,24,0.95);border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(20px);">
      <div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
      <p class="text-[12px] font-mono font-bold text-zinc-200">{{ toastMsg }}</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  Plus, Search, X, Eye, EyeOff, Copy, Pencil, Trash2, Lock,
  FileDown, ArrowRight, Braces, RefreshCw, Unplug, PlugZap,
  FileCode, Link, Hash, ToggleLeft, AlignLeft,
} from 'lucide-vue-next'
import { settings, orbLog } from '../composables/useStore'

const accent = computed(() => settings.value.accentColor)

// ── TCP state ─────────────────────────────────────────────
const tcpConnected = ref(false)
const tcpPort      = ref(3131)
const syncing      = ref(false)

function connectTcp() {
  tcpConnected.value = true
  orbLog('TCP connected to VSCode')
}

async function triggerSync() {
  syncing.value = true
  await new Promise(r => setTimeout(r, 1200))
  syncing.value = false
  showToast('sync_complete · all vars pushed')
  orbLog('ENV vars synced to VSCode')
}

// ── Env data ──────────────────────────────────────────────
const ENV_STORAGE_KEY = 'orb_env_vars_v1'

interface EnvVar {
  id:       number
  key:      string
  value:    string
  type:     string
  group:    string
  secret:   boolean
  synced:   boolean
  revealed: boolean
}

interface EnvGroup {
  name:  string
  color: string
  vars:  EnvVar[]
}

const ENV_GROUPS = [
  { name: 'app',     color: '#8b5cf6' },
  { name: 'api',     color: '#06b6d4' },
  { name: 'db',      color: '#10b981' },
  { name: 'infra',   color: '#f59e0b' },
]

function loadVars(): EnvVar[] {
  try { const r = localStorage.getItem(ENV_STORAGE_KEY); if (r) return JSON.parse(r) } catch {}
  return [
    { id:1, key:'VITE_APP_NAME',    value:'Orb DevKit',           type:'string', group:'app',  secret:false, synced:true, revealed:false },
    { id:2, key:'VITE_API_URL',     value:'https://api.example.com', type:'url', group:'api',  secret:false, synced:true, revealed:false },
    { id:3, key:'DATABASE_URL',     value:'postgresql://localhost:5432/orb', type:'url', group:'db', secret:true, synced:false, revealed:false },
    { id:4, key:'API_SECRET_KEY',   value:'sk-abcdef1234567890',   type:'string', group:'api',  secret:true,  synced:false, revealed:false },
    { id:5, key:'ENABLE_DARK_MODE', value:'true',                  type:'bool',   group:'app',  secret:false, synced:true, revealed:false },
    { id:6, key:'MAX_CONNECTIONS',  value:'10',                    type:'number', group:'db',   secret:false, synced:true, revealed:false },
  ]
}

function saveVars(vars: EnvVar[]) {
  try { localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify(vars)) } catch {}
}

const allVars = ref<EnvVar[]>(loadVars())

const envGroups = computed<EnvGroup[]>(() =>
  ENV_GROUPS.map(g => ({
    ...g,
    vars: allVars.value.filter(v => v.group === g.name),
  })).filter(g => g.vars.length > 0 || true) // show all groups
)

// ── Search / filter ───────────────────────────────────────
const search      = ref('')
const activeGroup = ref('all')

const filteredGroups = computed<EnvGroup[]>(() => {
  return envGroups.value
    .map(g => ({
      ...g,
      vars: g.vars.filter(v => {
        const matchGroup = activeGroup.value === 'all' || v.group === activeGroup.value
        const matchSearch = !search.value ||
          v.key.toLowerCase().includes(search.value.toLowerCase()) ||
          v.value.toLowerCase().includes(search.value.toLowerCase())
        return matchGroup && matchSearch
      }),
    }))
    .filter(g => g.vars.length > 0)
})

// ── Var types ─────────────────────────────────────────────
const varTypes = [
  { value:'string', label:'string', icon:AlignLeft },
  { value:'url',    label:'url',    icon:Link       },
  { value:'number', label:'number', icon:Hash       },
  { value:'bool',   label:'bool',   icon:ToggleLeft },
]

function typeIcon(type: string) {
  return varTypes.find(t => t.value === type)?.icon ?? AlignLeft
}

// ── Reveal secrets ────────────────────────────────────────
function toggleReveal(id: number) {
  const v = allVars.value.find(v => v.id === id)
  if (v) v.revealed = !v.revealed
}

// ── Copy ──────────────────────────────────────────────────
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toastMsg.value = msg
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2000)
}

function copyVar(v: EnvVar) {
  navigator.clipboard?.writeText(v.value).then(() => {
    showToast(`copied: ${v.key}`)
    orbLog(`ENV copied: ${v.key}`)
  })
}

// ── Add / Edit sheet ──────────────────────────────────────
const showAddVar = ref(false)
const editTarget = ref<EnvVar | null>(null)

const varForm = reactive({
  key: '', value: '', type: 'string', group: 'app',
  secret: false, revealInForm: false,
})

function resetForm() {
  varForm.key = ''; varForm.value = ''; varForm.type = 'string'
  varForm.group = 'app'; varForm.secret = false; varForm.revealInForm = false
}

function closeSheet() {
  showAddVar.value = false
  editTarget.value = null
  resetForm()
}

function addVarToGroup(groupName: string) {
  varForm.group = groupName
  showAddVar.value = true
}

function editVar(v: EnvVar) {
  editTarget.value = v
  varForm.key = v.key
  varForm.value = v.value
  varForm.type = v.type
  varForm.group = v.group
  varForm.secret = v.secret
  varForm.revealInForm = false
}

function saveVar() {
  if (!varForm.key.trim()) return
  if (editTarget.value) {
    const v = allVars.value.find(v => v.id === editTarget.value!.id)
    if (v) {
      v.key = varForm.key; v.value = varForm.value; v.type = varForm.type
      v.group = varForm.group; v.secret = varForm.secret; v.synced = false
    }
    orbLog(`ENV updated: ${varForm.key}`)
  } else {
    const newVar: EnvVar = {
      id:       Date.now(),
      key:      varForm.key, value: varForm.value,
      type:     varForm.type, group: varForm.group,
      secret:   varForm.secret, synced: false, revealed: false,
    }
    allVars.value.push(newVar)
    orbLog(`ENV added: ${varForm.key}`)
  }
  saveVars(allVars.value)
  closeSheet()
  showToast(editTarget.value ? 'var_updated' : 'var_added')
}

function deleteVar(id: number) {
  const v = allVars.value.find(v => v.id === id)
  allVars.value = allVars.value.filter(v => v.id !== id)
  saveVars(allVars.value)
  closeSheet()
  showToast(`deleted: ${v?.key}`)
  orbLog(`ENV deleted: ${v?.key}`)
}

// ── Export ────────────────────────────────────────────────
function exportDotEnv() {
  const lines = allVars.value.map(v => `${v.key}=${v.value}`).join('\n')
  navigator.clipboard?.writeText(lines).then(() => showToast('.env copied to clipboard'))
  orbLog('ENV exported as .env format')
}

function exportJson() {
  const obj = Object.fromEntries(allVars.value.map(v => [v.key, v.value]))
  navigator.clipboard?.writeText(JSON.stringify(obj, null, 2)).then(() => showToast('JSON copied to clipboard'))
  orbLog('ENV exported as JSON')
}
</script>

<style scoped>
.devkit-root { background:#060810; min-height:100%; }
.scrollbar-hide::-webkit-scrollbar { display:none; }
.scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
.sheet-enter-active,.sheet-leave-active { transition:opacity .28s ease; }
.sheet-enter-active>div,.sheet-leave-active>div { transition:transform .32s cubic-bezier(.32,1.1,.64,1); }
.sheet-enter-from,.sheet-leave-to { opacity:0; }
.sheet-enter-from>div,.sheet-leave-to>div { transform:translateY(100%); }
.toast-enter-active { transition:all .3s cubic-bezier(0.34,1.1,0.64,1); }
.toast-leave-active { transition:all .2s ease; }
.toast-enter-from { opacity:0; transform:translate(-50%,-12px) scale(0.92); }
.toast-leave-to { opacity:0; transform:translate(-50%,-6px) scale(0.96); }
</style>