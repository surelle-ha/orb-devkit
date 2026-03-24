<template>
  <div class="devkit-root pb-28" style="touch-action:pan-y;">

    <!-- Header -->
    <div class="flex items-center gap-3 px-5 pt-6 pb-4">
      <button @click="navigate('home')"
        class="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
        style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
        <ChevronLeft :size="18" class="text-zinc-300" :stroke-width="2.5" />
      </button>
      <div class="flex-1">
        <p class="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase">orb devkit / ai_tools</p>
        <h1 class="text-[22px] font-black text-zinc-50 tracking-tight mt-0.5 font-mono">
          <span :style="{ color: accent }">›</span> prompt_mgr
        </h1>
      </div>
      <button @click="openAddSheet"
        class="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
        :style="{ background: accent + '18', border: `1px solid ${accent}33` }">
        <Plus :size="17" :style="{ color: accent }" :stroke-width="2" />
      </button>
    </div>

    <!-- Stats bar -->
    <div class="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
      <div v-for="stat in stats" :key="stat.label"
        class="flex-shrink-0 flex flex-col gap-0.5 px-3.5 py-2.5 rounded-2xl"
        :style="{ background: stat.color + '12', border: `1px solid ${stat.color}25` }">
        <span class="text-[18px] font-black font-mono" :style="{ color: stat.color }">{{ stat.value }}</span>
        <span class="text-[9px] font-mono uppercase tracking-widest" :style="{ color: stat.color + '88' }">{{ stat.label }}</span>
      </div>
    </div>

    <!-- Category filter -->
    <div class="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
      <button v-for="cat in ['all', ...categories]" :key="cat"
        @click="activeCategory = cat"
        class="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95"
        :style="activeCategory === cat
          ? { background: accent + '20', border: `1px solid ${accent}44`, color: accent }
          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#52525b' }">
        {{ cat }}
      </button>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-2 mx-4 mb-4 rounded-xl px-3 py-2.5"
      style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
      <Search :size="13" class="text-zinc-600 flex-shrink-0" :stroke-width="2" />
      <input v-model="search" placeholder="search prompts…"
        class="flex-1 bg-transparent text-[12px] font-mono text-zinc-200 placeholder:text-zinc-700 outline-none" />
      <button v-if="search" @click="search = ''" class="text-zinc-700 active:text-zinc-400">
        <X :size="11" :stroke-width="2.5" />
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="filteredPrompts.length === 0" class="mx-4 flex flex-col items-center gap-3 py-16 rounded-2xl"
      style="border:2px dashed rgba(255,255,255,0.06);">
      <BrainCircuit :size="32" class="text-zinc-700" :stroke-width="1.5" />
      <p class="text-[13px] font-mono text-zinc-600">{{ search ? 'no_results' : 'no_prompts_yet' }}</p>
      <button @click="openAddSheet"
        class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-mono font-bold active:scale-95 transition-all"
        :style="{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }">
        <Plus :size="12" :stroke-width="2.5" /> add_prompt
      </button>
    </div>

    <!-- Prompts list -->
    <div v-else class="flex flex-col gap-2.5 px-4">
      <div v-for="p in filteredPrompts" :key="p.id"
        class="rounded-2xl overflow-hidden transition-all active:scale-[0.99]"
        :style="{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)` }">

        <!-- Header row -->
        <div class="flex items-center gap-3 px-4 pt-3.5 pb-2">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :style="{ background: categoryColor(p.category) + '18', border: `1px solid ${categoryColor(p.category)}28` }">
            <component :is="categoryIcon(p.category)" :size="16"
              :style="{ color: categoryColor(p.category) }" :stroke-width="1.8" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-black font-mono text-zinc-100 truncate">{{ p.title }}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                :style="{ background: categoryColor(p.category) + '15', color: categoryColor(p.category) }">
                {{ p.category }}
              </span>
              <span class="text-[9px] font-mono text-zinc-700">{{ p.model }}</span>
              <span v-if="p.pinned" class="text-[9px] font-mono text-amber-500">📌 pinned</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button @click="togglePin(p.id)"
              class="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all"
              :style="p.pinned
                ? { background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.25)' }
                : { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }">
              <Pin :size="11" :class="p.pinned ? 'text-amber-400' : 'text-zinc-600'" :stroke-width="2" />
            </button>
            <button @click="copyPrompt(p)"
              class="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all"
              style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
              <Copy :size="11" class="text-zinc-600" :stroke-width="2" />
            </button>
            <button @click="editPrompt(p)"
              class="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all"
              :style="{ background: accent + '10', border: `1px solid ${accent}20` }">
              <Pencil :size="11" :style="{ color: accent + 'CC' }" :stroke-width="2" />
            </button>
          </div>
        </div>

        <!-- Prompt preview -->
        <div class="px-4 pb-3">
          <p class="text-[11px] font-mono text-zinc-500 leading-relaxed line-clamp-2">{{ p.body }}</p>
        </div>

        <!-- Variables chips -->
        <div v-if="p.variables.length" class="flex flex-wrap gap-1.5 px-4 pb-3">
          <span v-for="v in p.variables" :key="v"
            class="text-[9px] font-mono font-bold px-2 py-1 rounded-lg"
            :style="{ background: accent + '12', border: `1px solid ${accent}25`, color: accent }">
            {{ '{' + v + '}' }}
          </span>
        </div>

        <!-- Run bar -->
        <div class="border-t border-white/5 px-4 py-2.5 flex items-center gap-2">
          <span class="text-[9px] font-mono text-zinc-700 flex-1">used {{ p.useCount }}× · {{ p.lastUsed ?? 'never' }}</span>
          <button @click="runPrompt(p)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold active:scale-95 transition-all"
            :style="{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }">
            <Play :size="10" :stroke-width="2.5" fill="currentColor" /> run
          </button>
        </div>
      </div>
    </div>

    <div class="h-4"></div>
  </div>

  <!-- Add/Edit Sheet -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showSheet"
        class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.75);backdrop-filter:blur(14px);"
        @click.self="closeSheet">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t overflow-hidden"
          style="background:#0c0c18;border-color:rgba(255,255,255,0.08);"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-3 px-5 pt-4 max-h-[88vh] overflow-y-auto pb-2">
            <div class="w-10 h-1 rounded-full self-center mb-1" style="background:rgba(255,255,255,0.08)"></div>
            <p class="text-[16px] font-black font-mono text-center text-zinc-100">
              {{ editTarget ? 'edit_prompt' : 'new_prompt' }}
            </p>

            <!-- Title -->
            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">TITLE</p>
              <input v-model="form.title" placeholder="Prompt title…"
                class="w-full rounded-xl px-4 py-3 text-[13px] font-mono font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
            </div>

            <!-- Category + Model row -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">CATEGORY</p>
                <div class="flex flex-col gap-1">
                  <button v-for="c in categories" :key="c" @click="form.category = c"
                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-mono font-bold transition-all"
                    :style="form.category === c
                      ? { background: categoryColor(c) + '20', border: `1px solid ${categoryColor(c)}44`, color: categoryColor(c) }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }">
                    <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ background: categoryColor(c) }"></div>
                    {{ c }}
                  </button>
                </div>
              </div>
              <div>
                <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">MODEL</p>
                <div class="flex flex-col gap-1">
                  <button v-for="m in models" :key="m" @click="form.model = m"
                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-mono font-bold transition-all"
                    :style="form.model === m
                      ? { background: accent + '18', border: `1px solid ${accent}33`, color: accent }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }">
                    {{ m }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Body -->
            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">
                PROMPT BODY <span class="text-zinc-700 normal-case">· use {variable} for dynamic parts</span>
              </p>
              <textarea v-model="form.body" rows="5" placeholder="Write your prompt here…&#10;Use {variable_name} for dynamic parts."
                class="w-full rounded-xl px-4 py-3 text-[12px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none resize-none leading-relaxed"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
            </div>

            <!-- Detected variables -->
            <div v-if="detectedVars.length" class="flex flex-wrap gap-1.5">
              <span class="text-[9px] font-mono text-zinc-600 mr-1">vars:</span>
              <span v-for="v in detectedVars" :key="v"
                class="text-[9px] font-mono font-bold px-2 py-1 rounded-lg"
                :style="{ background: accent + '12', border: `1px solid ${accent}25`, color: accent }">
                {{ '{' + v + '}' }}
              </span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 mt-1">
              <button v-if="editTarget" @click="deletePrompt(editTarget.id)"
                class="w-10 h-12 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95"
                style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);">
                <Trash2 :size="16" class="text-rose-500" :stroke-width="2" />
              </button>
              <button @click="savePrompt" :disabled="!form.title.trim() || !form.body.trim()"
                class="flex-1 py-3.5 rounded-xl text-[14px] font-black font-mono active:scale-[0.98] transition-all"
                :style="form.title.trim() && form.body.trim()
                  ? { background: accent, color: '#fff', boxShadow: `0 6px 20px ${accent}44` }
                  : { background: 'rgba(255,255,255,0.05)', color: '#3f3f46', border: '1px solid rgba(255,255,255,0.06)' }">
                {{ editTarget ? 'save_changes' : 'add_prompt' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Run overlay (variable substitution) -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="runTarget"
        class="fixed inset-0 z-[300] flex items-end justify-center"
        style="background:rgba(0,0,0,0.75);backdrop-filter:blur(14px);"
        @click.self="runTarget = null">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t overflow-hidden"
          style="background:#0c0c18;border-color:rgba(255,255,255,0.08);"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-3 px-5 pt-4 max-h-[88vh] overflow-y-auto pb-2">
            <div class="w-10 h-1 rounded-full self-center mb-1" style="background:rgba(255,255,255,0.08)"></div>
            <p class="text-[16px] font-black font-mono text-center text-zinc-100">run_prompt</p>
            <p class="text-[12px] font-mono text-zinc-500 text-center -mt-1">{{ runTarget?.title }}</p>

            <!-- Variable inputs -->
            <div v-if="runTarget?.variables.length" class="flex flex-col gap-2">
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest px-1">FILL VARIABLES</p>
              <div v-for="v in runTarget.variables" :key="v">
                <p class="text-[9px] font-mono text-zinc-600 mb-1 px-1">{{ '{' + v + '}' }}</p>
                <input v-model="runVars[v]" :placeholder="v"
                  class="w-full rounded-xl px-4 py-3 text-[13px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none"
                  style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
              </div>
            </div>

            <!-- Preview -->
            <div class="rounded-xl p-3.5" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-2">PREVIEW</p>
              <p class="text-[12px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">{{ computedPrompt }}</p>
            </div>

            <button @click="copyFinalPrompt"
              class="w-full py-3.5 rounded-xl text-[14px] font-black font-mono active:scale-[0.98] transition-all"
              :style="{ background: accent, color: '#fff', boxShadow: `0 6px 20px ${accent}44` }">
              Copy Prompt
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Toast -->
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
  ChevronLeft, Plus, Search, X, Copy, Pencil, Trash2,
  Pin, Play, BrainCircuit, Code2, Zap, MessageSquare, BookOpen, TestTube2,
} from 'lucide-vue-next'
import { settings, orbLog } from '../composables/useStore'
import { useNav } from '../composables/useNav'

const { navigate } = useNav()
const accent = computed(() => settings.value.accentColor)

// ── Data ──────────────────────────────────────────────────
const PROMPTS_KEY = 'orb_prompts_v1'

interface Prompt {
  id:        number
  title:     string
  body:      string
  category:  string
  model:     string
  variables: string[]
  pinned:    boolean
  useCount:  number
  lastUsed:  string | null
}

const categories = ['coding', 'writing', 'debug', 'review', 'other']
const models      = ['gpt-4o', 'claude', 'gemini', 'llama']

function catColor(c: string): string {
  const map: Record<string, string> = {
    coding: '#34d399', writing: '#60a5fa', debug: '#f87171',
    review: '#fb923c', other: '#a78bfa',
  }
  return map[c] ?? '#8b5cf6'
}
function categoryColor(c: string) { return catColor(c) }
function categoryIcon(c: string) {
  const map: Record<string, any> = {
    coding: Code2, writing: BookOpen, debug: TestTube2,
    review: MessageSquare, other: Zap,
  }
  return map[c] ?? Zap
}

function loadPrompts(): Prompt[] {
  try { const r = localStorage.getItem(PROMPTS_KEY); if (r) return JSON.parse(r) } catch {}
  return [
    { id:1, title:'Fix TypeScript Error', body:'I have a TypeScript error: {error}\n\nHere is the code:\n```{language}\n{code}\n```\n\nPlease fix it and explain why.', category:'debug', model:'claude', variables:['error','language','code'], pinned:true, useCount:12, lastUsed:'2d ago' },
    { id:2, title:'Write Unit Tests', body:'Write comprehensive unit tests for the following {language} function:\n\n```{language}\n{code}\n```\n\nUse {framework} framework. Cover edge cases.', category:'coding', model:'gpt-4o', variables:['language','code','framework'], pinned:false, useCount:8, lastUsed:'1w ago' },
    { id:3, title:'Code Review', body:'Please review this {language} code for:\n- Security issues\n- Performance problems\n- Best practices\n- Readability\n\n```{language}\n{code}\n```', category:'review', model:'claude', variables:['language','code'], pinned:true, useCount:5, lastUsed:'3d ago' },
    { id:4, title:'Explain Concept', body:'Explain {concept} to me like I\'m a senior developer who hasn\'t used it before. Include practical examples and when to use vs avoid it.', category:'writing', model:'gpt-4o', variables:['concept'], pinned:false, useCount:3, lastUsed:'5d ago' },
  ]
}

function savePrompts(list: Prompt[]) {
  try { localStorage.setItem(PROMPTS_KEY, JSON.stringify(list)) } catch {}
}

const allPrompts = ref<Prompt[]>(loadPrompts())

// ── Filters ───────────────────────────────────────────────
const search         = ref('')
const activeCategory = ref('all')

const filteredPrompts = computed(() => {
  return allPrompts.value
    .filter(p => {
      const matchCat = activeCategory.value === 'all' || p.category === activeCategory.value
      const q = search.value.toLowerCase()
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
})

// ── Stats ─────────────────────────────────────────────────
const stats = computed(() => [
  { label: 'prompts',   value: allPrompts.value.length,                                             color: accent.value },
  { label: 'pinned',    value: allPrompts.value.filter(p => p.pinned).length,                       color: '#fbbf24'    },
  { label: 'total_runs', value: allPrompts.value.reduce((s, p) => s + p.useCount, 0),               color: '#34d399'    },
  { label: 'models',    value: new Set(allPrompts.value.map(p => p.model)).size,                    color: '#60a5fa'    },
])

// ── Sheet form ────────────────────────────────────────────
const showSheet  = ref(false)
const editTarget = ref<Prompt | null>(null)

const form = reactive({
  title: '', body: '', category: 'coding', model: 'claude',
})

const detectedVars = computed(() => {
  const matches = form.body.match(/\{([^}]+)\}/g) ?? []
  return [...new Set(matches.map(m => m.slice(1, -1)))]
})

function openAddSheet() {
  editTarget.value = null
  form.title = ''; form.body = ''; form.category = 'coding'; form.model = 'claude'
  showSheet.value = true
}

function editPrompt(p: Prompt) {
  editTarget.value = p
  form.title = p.title; form.body = p.body; form.category = p.category; form.model = p.model
  showSheet.value = true
}

function closeSheet() { showSheet.value = false; editTarget.value = null }

function savePrompt() {
  if (!form.title.trim() || !form.body.trim()) return
  const variables = [...new Set((form.body.match(/\{([^}]+)\}/g) ?? []).map(m => m.slice(1,-1)))]
  if (editTarget.value) {
    const p = allPrompts.value.find(p => p.id === editTarget.value!.id)
    if (p) { p.title = form.title; p.body = form.body; p.category = form.category; p.model = form.model; p.variables = variables }
    orbLog(`Prompt updated: ${form.title}`)
  } else {
    allPrompts.value.unshift({
      id: Date.now(), title: form.title, body: form.body,
      category: form.category, model: form.model, variables,
      pinned: false, useCount: 0, lastUsed: null,
    })
    orbLog(`Prompt added: ${form.title}`)
  }
  savePrompts(allPrompts.value)
  closeSheet()
  showToast(editTarget.value ? 'prompt_updated' : 'prompt_added')
}

function deletePrompt(id: number) {
  const p = allPrompts.value.find(p => p.id === id)
  allPrompts.value = allPrompts.value.filter(p => p.id !== id)
  savePrompts(allPrompts.value)
  closeSheet()
  showToast(`deleted: ${p?.title}`)
  orbLog(`Prompt deleted: ${p?.title}`)
}

function togglePin(id: number) {
  const p = allPrompts.value.find(p => p.id === id)
  if (p) { p.pinned = !p.pinned; savePrompts(allPrompts.value) }
}

function copyPrompt(p: Prompt) {
  navigator.clipboard?.writeText(p.body).then(() => showToast(`copied: ${p.title}`))
  orbLog(`Prompt copied: ${p.title}`)
}

// ── Run ───────────────────────────────────────────────────
const runTarget = ref<Prompt | null>(null)
const runVars   = ref<Record<string, string>>({})

function runPrompt(p: Prompt) {
  runTarget.value = p
  runVars.value = Object.fromEntries(p.variables.map(v => [v, '']))
}

const computedPrompt = computed(() => {
  if (!runTarget.value) return ''
  let out = runTarget.value.body
  for (const [k, v] of Object.entries(runVars.value)) {
    out = out.replaceAll(`{${k}}`, v || `{${k}}`)
  }
  return out
})

function copyFinalPrompt() {
  navigator.clipboard?.writeText(computedPrompt.value).then(() => {
    const p = runTarget.value
    if (p) { p.useCount++; p.lastUsed = 'just now'; savePrompts(allPrompts.value) }
    showToast('prompt copied!')
    orbLog(`Prompt run: ${p?.title}`)
    runTarget.value = null
  })
}

// ── Toast ─────────────────────────────────────────────────
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toastMsg.value = msg
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2000)
}
</script>

<style scoped>
.devkit-root { background:#060810; min-height:100%; }
.scrollbar-hide::-webkit-scrollbar { display:none; }
.scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
.line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
.sheet-enter-active,.sheet-leave-active { transition:opacity .28s ease; }
.sheet-enter-active>div,.sheet-leave-active>div { transition:transform .32s cubic-bezier(.32,1.1,.64,1); }
.sheet-enter-from,.sheet-leave-to { opacity:0; }
.sheet-enter-from>div,.sheet-leave-to>div { transform:translateY(100%); }
.toast-enter-active { transition:all .3s cubic-bezier(0.34,1.1,0.64,1); }
.toast-leave-active { transition:all .2s ease; }
.toast-enter-from { opacity:0; transform:translate(-50%,-12px) scale(0.92); }
.toast-leave-to { opacity:0; transform:translate(-50%,-6px) scale(0.96); }
</style>