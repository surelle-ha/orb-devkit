<template>
  <div class="bg-slate-100 dark:bg-zinc-950 pb-28" style="touch-action:pan-y;">

    <!-- Save toast -->
    <Transition name="toast">
      <div v-if="toastVisible"
        class="fixed left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl"
        :style="{ top:'calc(16px + env(safe-area-inset-top))', background: accent, maxWidth:'320px', width:'calc(100vw - 32px)' }">
        <Check :size="15" color="white" :stroke-width="3" class="flex-shrink-0" />
        <p class="text-white text-[13px] font-bold">Profile saved!</p>
      </div>
    </Transition>

    <!-- Header -->
    <div class="flex items-center gap-3 px-5 pt-6 pb-4">
      <button @click="navigate('more')"
        class="w-9 h-9 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-center active:scale-90 transition-transform">
        <ChevronLeft :size="18" class="text-slate-600 dark:text-zinc-300" :stroke-width="2.5" />
      </button>
      <div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Profile</h2>
        <p class="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Your personal details</p>
      </div>
    </div>

    <!-- Avatar card -->
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <div class="flex items-center gap-4 px-4 py-4">
        <div class="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-[26px] flex-shrink-0"
          :style="{ background: accent, boxShadow: `0 4px 20px ${accent}55` }">
          {{ userInitial }}
        </div>
        <div class="flex-1 min-w-0">
          <template v-if="!editingName">
            <p class="text-[17px] font-black text-slate-900 dark:text-zinc-50">{{ settings.userName || 'Add your name' }}</p>
            <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Tap ✏ to edit</p>
          </template>
          <template v-else>
            <input v-model="nameInput" ref="nameInputEl" type="text" placeholder="Your name…" maxlength="32"
              @keydown.enter="saveName"
              class="w-full bg-transparent text-[17px] font-black text-slate-900 dark:text-zinc-50 outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-600" />
            <p class="text-[10px] text-slate-400 mt-0.5">Tap ✓ to save</p>
          </template>
        </div>
        <template v-if="!editingName">
          <button @click="startEditName" class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center active:scale-90 transition-transform">
            <Pencil :size="15" class="text-slate-500 dark:text-zinc-400" :stroke-width="2" />
          </button>
        </template>
        <template v-else>
          <div class="flex gap-1.5">
            <button @click="saveName" class="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform" :style="{ background: `${accent}20` }">
              <Check :size="15" :style="{ color: accent }" :stroke-width="2.5" />
            </button>
            <button @click="cancelName" class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center active:scale-90 transition-transform">
              <X :size="15" class="text-slate-500 dark:text-zinc-400" :stroke-width="2" />
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- ── Personal Info ── -->
    <div class="px-5 pb-2">
      <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Personal Info</h3>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <div class="px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800/60">
        <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-2.5">Age Range</p>
        <div class="grid grid-cols-4 gap-2">
          <button v-for="opt in ageOptions" :key="opt.value"
            @click="updateField('age_range', opt.value)"
            :class="['flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-[11px] font-bold',
              profile.age_range === opt.value
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300'
                : 'border-transparent bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400']">
            <span class="text-[16px]">{{ opt.emoji }}</span>
            {{ opt.label }}
          </button>
        </div>
      </div>
      <div class="px-4 py-3.5">
        <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-2.5">Employment</p>
        <div class="grid grid-cols-2 gap-2">
          <button v-for="opt in employmentOptions" :key="opt.value"
            @click="updateField('employment', opt.value)"
            :class="['flex items-center gap-2 p-3 rounded-xl border-2 transition-all',
              profile.employment === opt.value
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
                : 'border-transparent bg-slate-50 dark:bg-zinc-800']">
            <span class="text-[18px]">{{ opt.emoji }}</span>
            <span :class="['text-[12px] font-bold', profile.employment === opt.value ? 'text-violet-600 dark:text-violet-300' : 'text-slate-600 dark:text-zinc-300']">{{ opt.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Income ── -->
    <div class="px-5 pb-2">
      <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Income</h3>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm px-4 py-3.5">
      <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Monthly Income</p>
      <div class="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3 border-2 border-transparent focus-within:border-violet-500 transition-colors">
        <span class="text-[18px] font-black text-violet-500">{{ sym }}</span>
        <input :value="incomeDisplay" @input="onIncomeInput" inputmode="decimal" placeholder="0"
          class="flex-1 bg-transparent text-[20px] font-black text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-700 outline-none" />
        <span class="text-[12px] text-slate-400 dark:text-zinc-500">/ month</span>
      </div>
    </div>

    <!-- ── Financial Goals ── -->
    <div class="px-5 pb-2">
      <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Financial Goals</h3>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm px-4 py-3.5">
      <div class="flex flex-col gap-2">
        <button v-for="opt in goalOptions" :key="opt.value"
          @click="toggleGoal(opt.value)"
          :class="['flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all',
            selectedGoals.includes(opt.value)
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
              : 'border-transparent bg-slate-50 dark:bg-zinc-800']">
          <div :class="['w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
            selectedGoals.includes(opt.value) ? 'bg-violet-500 border-violet-500' : 'border-slate-300 dark:border-zinc-600']">
            <Check v-if="selectedGoals.includes(opt.value)" :size="11" color="white" :stroke-width="3" />
          </div>
          <span :class="['text-[13px] font-semibold', selectedGoals.includes(opt.value) ? 'text-violet-600 dark:text-violet-300' : 'text-slate-600 dark:text-zinc-300']">{{ opt.label }}</span>
        </button>
      </div>
    </div>

    <!-- ── Habits ── -->
    <div class="px-5 pb-2">
      <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Habits</h3>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm px-4 py-3.5">
      <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-2.5">Biggest Challenge</p>
      <div class="grid grid-cols-2 gap-2">
        <button v-for="opt in challengeOptions" :key="opt.value"
          @click="updateField('biggest_challenge', opt.value)"
          :class="['flex items-center gap-2 p-3 rounded-xl border-2 transition-all',
            profile.biggest_challenge === opt.value
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
              : 'border-transparent bg-slate-50 dark:bg-zinc-800']">
          <span class="text-[18px]">{{ opt.emoji }}</span>
          <span :class="['text-[11px] font-bold leading-tight', profile.biggest_challenge === opt.value ? 'text-violet-600 dark:text-violet-300' : 'text-slate-600 dark:text-zinc-300']">{{ opt.label }}</span>
        </button>
      </div>
    </div>

    <!-- ── Savings & Investing ── -->
    <div class="px-5 pb-2">
      <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Savings & Investing</h3>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm px-4 py-3.5">
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Savings Rate</p>
          <span class="text-[16px] font-black text-violet-500">{{ profile.savings_rate ?? 0 }}%</span>
        </div>
        <input type="range" min="0" max="60" step="5" v-model="profile.savings_rate"
          @change="saveProfile"
          class="w-full h-1.5" style="-webkit-appearance:none;appearance:none;background:#e2e8f0;border-radius:99px;" />
        <div class="flex justify-between mt-1.5">
          <span class="text-[10px] text-slate-400 dark:text-zinc-600">0%</span>
          <span class="text-[10px] text-slate-400 dark:text-zinc-600">60%</span>
        </div>
      </div>
      <div>
        <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide mb-2.5">Risk Tolerance</p>
        <div class="grid grid-cols-2 gap-2">
          <button v-for="opt in riskOptions" :key="opt.value"
            @click="updateField('risk_tolerance', opt.value)"
            :class="['flex items-center gap-2 p-3 rounded-xl border-2 transition-all',
              profile.risk_tolerance === opt.value
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
                : 'border-transparent bg-slate-50 dark:bg-zinc-800']">
            <span class="text-[18px]">{{ opt.emoji }}</span>
            <span :class="['text-[11px] font-bold leading-tight', profile.risk_tolerance === opt.value ? 'text-violet-600 dark:text-violet-300' : 'text-slate-600 dark:text-zinc-300']">{{ opt.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Save button -->
    <div class="px-4 mb-4">
      <button @click="saveProfile"
        class="w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] transition-all text-white shadow-lg"
        :style="{ background: accent, boxShadow: `0 8px 24px ${accent}44` }">
        Save Profile
      </button>
    </div>

    <div class="h-4"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, nextTick } from 'vue'
import { ChevronLeft, Pencil, Check, X } from 'lucide-vue-next'
import { settings, saveSettings, orbLog } from '../composables/useStore'
import { useNav } from '../composables/useNav'

const { navigate } = useNav()
const accent = computed(() => settings.value.accentColor)
const sym    = computed(() => settings.value.currencySymbol)
const userInitial = computed(() => (settings.value.userName || 'O').charAt(0).toUpperCase())

// ── Toast ─────────────────────────────────────────────────
const toastVisible = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast() {
  if (toastTimer) clearTimeout(toastTimer)
  toastVisible.value = true
  toastTimer = setTimeout(() => { toastVisible.value = false }, 2200)
}

// ── Load profile ──────────────────────────────────────────
const PROFILE_KEY = 'orb_profile_v1'
function loadProfile() {
  try { const r = localStorage.getItem(PROFILE_KEY); if (r) return JSON.parse(r) } catch {}
  return {}
}
function persistProfile(data: any) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(data)) } catch {}
}

const profile = reactive<Record<string, any>>({
  age_range: '', employment: '', monthly_income: '',
  financial_goals: [], biggest_challenge: '',
  savings_rate: 0, risk_tolerance: '',
  ...loadProfile(),
})

const selectedGoals = computed<string[]>(() =>
  Array.isArray(profile.financial_goals) ? profile.financial_goals : []
)

function updateField(key: string, value: string) {
  profile[key] = value
  saveProfile()
}

function toggleGoal(value: string) {
  const goals = [...selectedGoals.value]
  const idx = goals.indexOf(value)
  if (idx > -1) goals.splice(idx, 1)
  else          goals.push(value)
  profile.financial_goals = goals
  saveProfile()
}

function saveProfile() {
  persistProfile({ ...profile })
  orbLog('Profile saved')
  showToast()
}

// ── Name editing ──────────────────────────────────────────
const editingName  = ref(false)
const nameInput    = ref('')
const nameInputEl  = ref<HTMLInputElement | null>(null)

function startEditName() {
  nameInput.value = settings.value.userName
  editingName.value = true
  nextTick(() => nameInputEl.value?.focus())
}
function saveName() {
  const n = nameInput.value.trim()
  if (n.length > 0) { saveSettings({ userName: n }); orbLog(`Name changed to ${n}`); showToast() }
  editingName.value = false
}
function cancelName() { editingName.value = false }

// ── Income input ──────────────────────────────────────────
const incomeDisplay = computed(() => {
  const raw = String(profile.monthly_income || '').replace(/,/g,'')
  if (!raw) return ''
  const parts = raw.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,',')
  return parts.join('.')
})
function onIncomeInput(e: Event) {
  const el = e.target as HTMLInputElement
  let cleaned = el.value.replace(/[^0-9.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  profile.monthly_income = cleaned
  saveProfile()
}

const ageOptions = [
  { value:'18-24', label:'18–24', emoji:'🌱' },
  { value:'25-34', label:'25–34', emoji:'🚀' },
  { value:'35-44', label:'35–44', emoji:'💼' },
  { value:'45+',   label:'45+',   emoji:'🏆' },
]
const employmentOptions = [
  { value:'employed',  label:'Employed',  emoji:'🏢' },
  { value:'freelance', label:'Freelance',  emoji:'💻' },
  { value:'business',  label:'Business',  emoji:'🏪' },
  { value:'student',   label:'Student',   emoji:'🎓' },
]
const goalOptions = [
  { value:'emergency_fund', label:'Build emergency fund' },
  { value:'debt_payoff',    label:'Pay off debt'         },
  { value:'savings',        label:'Grow savings'         },
  { value:'investment',     label:'Start investing'      },
  { value:'big_purchase',   label:'Save for big purchase'},
  { value:'retirement',     label:'Plan for retirement'  },
]
const challengeOptions = [
  { value:'overspending', label:'Overspending',   emoji:'💸' },
  { value:'no_budget',    label:'No budget plan', emoji:'📊' },
  { value:'impulse',      label:'Impulse buying', emoji:'🛒' },
  { value:'debt',         label:'Managing debt',  emoji:'📉' },
]
const riskOptions = [
  { value:'conservative', label:'Conservative', emoji:'🏦' },
  { value:'moderate',     label:'Moderate',     emoji:'⚖️' },
  { value:'aggressive',   label:'Aggressive',   emoji:'📈' },
  { value:'unsure',       label:'Not sure yet', emoji:'🤔' },
]
</script>

<style scoped>
.toast-enter-active { transition: all .35s cubic-bezier(0.34,1.1,0.64,1); }
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from   { opacity:0; transform:translate(-50%,-20px) scale(0.92); }
.toast-leave-to     { opacity:0; transform:translate(-50%,-8px) scale(0.96); }
</style>