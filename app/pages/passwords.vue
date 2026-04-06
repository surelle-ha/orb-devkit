<template>
  <div class="devkit-root pb-28" style="touch-action:pan-y;">

    <!-- Header — only shown when unlocked -->
    <template v-if="vaultUnlocked">
      <div class="flex items-center gap-3 px-5 pt-6 pb-4">
        <button @click="navigate('more')"
          class="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
          style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
          <ChevronLeft :size="18" class="text-zinc-300" :stroke-width="2.5" />
        </button>
        <div class="flex-1">
          <p class="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase">orb devkit / security</p>
          <h1 class="text-[22px] font-black text-zinc-50 tracking-tight mt-0.5 font-mono">
            <span :style="{ color: accent }">›</span> vault
          </h1>
        </div>
        <button @click="openAddSheet"
          class="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          :style="{ background: accent + '18', border: `1px solid ${accent}33` }">
          <Plus :size="17" :style="{ color: accent }" :stroke-width="2" />
        </button>
      </div>
    </template>

    <!-- Lock screen — matches ENV manager layout exactly -->
    <div v-if="!vaultUnlocked" class="flex flex-col items-center justify-center min-h-[100dvh] px-8 gap-6">
      <div class="relative">
        <div class="w-20 h-20 rounded-3xl flex items-center justify-center"
          :style="{ background: accent + '18', border: `1px solid ${accent}33` }">
          <ShieldCheck :size="32" :style="{ color: accent }" :stroke-width="1.5" />
        </div>
        <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
          :style="{ background: accent, border: '2px solid #060810' }">
          <Lock :size="11" style="color:#000" :stroke-width="3" />
        </div>
      </div>

      <div class="text-center">
        <p class="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase mb-1">orb devkit / security</p>
        <h1 class="text-[22px] font-black text-zinc-50 tracking-tight font-mono">
          <span :style="{ color: accent }">›</span> Secret vault
        </h1>
        <p class="text-[12px] font-mono text-zinc-500 mt-2 leading-relaxed">
          Shared vault password required.<br>Same password as your ENV manager.
        </p>
      </div>

      <div class="w-full max-w-[340px] flex flex-col gap-3">
        <div class="flex items-center gap-2 rounded-2xl px-4 py-3.5"
          :class="unlockError ? 'border-2 border-rose-500/60 bg-rose-950/20' : ''"
          :style="!unlockError ? { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' } : {}">
          <Lock :size="15" :class="unlockError ? 'text-rose-400' : 'text-zinc-600'" :stroke-width="2" class="flex-shrink-0" />
          <input v-model="masterInput" :type="showMaster ? 'text' : 'password'" placeholder="Vault master password..."
            autocomplete="current-password" @keydown.enter="unlockVault"
            class="flex-1 bg-transparent text-[14px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none" />
          <button @click="showMaster = !showMaster" class="text-zinc-700 flex-shrink-0 active:text-zinc-400">
            <Eye v-if="!showMaster" :size="14" :stroke-width="2" />
            <EyeOff v-else :size="14" :stroke-width="2" />
          </button>
        </div>
        <p v-if="unlockError" class="text-[12px] font-bold text-rose-400 text-center -mt-1">{{ unlockError }}</p>
        <button @click="unlockVault"
          class="w-full py-4 rounded-2xl text-[15px] font-black font-mono active:scale-[0.98] transition-all"
          :style="{ background: accent, color: '#fff', boxShadow: `0 8px 24px ${accent}44` }">
          Unlock Vault
        </button>
        <p v-if="!hasMasterSet" class="text-[11px] font-mono text-zinc-600 text-center leading-relaxed">
          No vault password set yet. Enter one below to create it<br>
          <span class="text-zinc-500">(shared with ENV manager)</span>
        </p>
        <button v-if="!hasMasterSet" @click="unlockVault"
          class="w-full py-3 rounded-2xl text-[13px] font-bold font-mono active:scale-[0.98] transition-all"
          :style="{ background: accent + '14', border: `1px solid ${accent}25`, color: accent }">
          Set Password & Continue
        </button>
      </div>
    </div>

    <!-- Unlocked: stats + entries -->
    <template v-if="vaultUnlocked">
      <!-- Stats -->
      <div class="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
        <div v-for="stat in vaultStats" :key="stat.label"
          class="flex-shrink-0 flex flex-col gap-0.5 px-3.5 py-2.5 rounded-2xl"
          :style="{ background: stat.color + '12', border: `1px solid ${stat.color}25` }">
          <span class="text-[18px] font-black font-mono" :style="{ color: stat.color }">{{ stat.value }}</span>
          <span class="text-[9px] font-mono uppercase tracking-widest" :style="{ color: stat.color + '88' }">{{ stat.label }}</span>
        </div>
        <button @click="lockVault"
          class="flex-shrink-0 flex flex-col items-center justify-center gap-0.5 px-3.5 py-2.5 rounded-2xl active:scale-95 transition-all"
          style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);">
          <Lock :size="16" class="text-rose-400" :stroke-width="2" />
          <span class="text-[9px] font-mono text-rose-400 uppercase tracking-widest">lock</span>
        </button>
      </div>

      <!-- Search + Category filter -->
      <div class="flex items-center gap-2 mx-4 mb-3 rounded-xl px-3 py-2.5"
        style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
        <Search :size="13" class="text-zinc-600 flex-shrink-0" :stroke-width="2" />
        <input v-model="search" placeholder="search vault…"
          class="flex-1 bg-transparent text-[12px] font-mono text-zinc-200 placeholder:text-zinc-700 outline-none" />
        <button v-if="search" @click="search = ''" class="text-zinc-700 active:text-zinc-400">
          <X :size="11" :stroke-width="2.5" />
        </button>
      </div>

      <div class="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-hide">
        <button v-for="cat in ['all', ...vaultCategories]" :key="cat" @click="activeCategory = cat"
          class="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all" :style="activeCategory === cat
            ? { background: accent + '20', border: `1px solid ${accent}44`, color: accent }
            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#52525b' }">
          {{ cat }}
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="filteredEntries.length === 0" class="mx-4 flex flex-col items-center gap-3 py-16 rounded-2xl"
        style="border:2px dashed rgba(255,255,255,0.06);">
        <ShieldCheck :size="32" class="text-zinc-700" :stroke-width="1.5" />
        <p class="text-[13px] font-mono text-zinc-600">{{ search ? 'no_results' : 'vault_empty' }}</p>
        <button @click="openAddSheet"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-mono font-bold active:scale-95 transition-all"
          :style="{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }">
          <Plus :size="12" :stroke-width="2.5" /> add_entry
        </button>
      </div>

      <!-- Entries -->
      <div v-else class="flex flex-col gap-2 px-4">
        <div v-for="entry in filteredEntries" :key="entry.id" class="rounded-2xl overflow-hidden"
          :style="{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }">
          <div class="flex items-center gap-3 px-4 py-3.5">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[18px]"
              :style="{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }">
              {{ entry.favicon || '🔑' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[13px] font-black font-mono text-zinc-100 truncate">{{ entry.service }}</p>
              <p class="text-[11px] font-mono text-zinc-500 truncate">{{ entry.username }}</p>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <button @click="copyUsername(entry)"
                class="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);"
                title="Copy username">
                <User :size="11" class="text-zinc-600" :stroke-width="2" />
              </button>
              <button @click="copyPassword(entry)"
                class="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                :style="{ background: accent + '10', border: `1px solid ${accent}20` }" title="Copy password">
                <Key :size="11" :style="{ color: accent + 'CC' }" :stroke-width="2" />
              </button>
              <button @click="editEntry(entry)"
                class="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
                <Pencil :size="11" class="text-zinc-600" :stroke-width="2" />
              </button>
            </div>
          </div>
          <div class="border-t border-white/5 px-4 py-2.5 flex items-center gap-2">
            <Key :size="11" class="text-zinc-700 flex-shrink-0" :stroke-width="2" />
            <p class="flex-1 text-[11px] font-mono truncate"
              :class="revealedIds.has(entry.id) ? 'text-zinc-300' : 'text-zinc-700'">
              {{ revealedIds.has(entry.id) ? entry.password : '•'.repeat(Math.min(entry.password.length, 16)) }}
            </p>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span v-if="entry.category" class="text-[9px] font-mono px-1.5 py-0.5 rounded"
                :style="{ background: accent + '12', color: accent }">{{ entry.category }}</span>
              <button @click="toggleReveal(entry.id)" class="active:opacity-60">
                <Eye v-if="!revealedIds.has(entry.id)" :size="12" class="text-zinc-600" :stroke-width="2" />
                <EyeOff v-else :size="12" class="text-zinc-600" :stroke-width="2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div class="h-4"></div>
  </div>

  <!-- Add/Edit Sheet — swipe down to close -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showSheet && vaultUnlocked" class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.75);backdrop-filter:blur(14px);" @click.self="closeSheet">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t overflow-hidden"
          style="background:#0c0c18;border-color:rgba(255,255,255,0.08);"
          :style="[{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }, sheetStyle]"
          @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
          <div class="flex flex-col gap-3 px-5 pt-4 max-h-[88vh] overflow-y-auto pb-2">
            <div class="w-10 h-1 rounded-full self-center mb-1" style="background:rgba(255,255,255,0.08)"></div>
            <p class="text-[16px] font-black font-mono text-center text-zinc-100">
              {{ editTarget ? 'edit_entry' : 'new_entry' }}
            </p>

            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">SERVICE / SITE</p>
              <input v-model="form.service" placeholder="e.g. GitHub"
                class="w-full rounded-xl px-4 py-3 text-[13px] font-mono font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
            </div>

            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">USERNAME / EMAIL</p>
              <input v-model="form.username" placeholder="you@example.com" autocomplete="off"
                class="w-full rounded-xl px-4 py-3 text-[13px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
            </div>

            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">PASSWORD</p>
              <div class="flex gap-2">
                <div class="flex-1 flex items-center gap-2 rounded-xl px-4 py-3"
                  style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
                  <input v-model="form.password" :type="showFormPwd ? 'text' : 'password'" placeholder="••••••••••••"
                    autocomplete="new-password"
                    class="flex-1 bg-transparent text-[13px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none" />
                  <button @click="showFormPwd = !showFormPwd" class="text-zinc-700 active:text-zinc-400 flex-shrink-0">
                    <Eye v-if="!showFormPwd" :size="14" :stroke-width="2" />
                    <EyeOff v-else :size="14" :stroke-width="2" />
                  </button>
                </div>
                <button @click="generatePassword"
                  class="px-3 rounded-xl text-[11px] font-mono font-bold active:scale-95 transition-all flex-shrink-0"
                  :style="{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }">
                  gen
                </button>
              </div>
            </div>

            <div v-if="form.password" class="flex items-center gap-2">
              <div class="flex gap-1 flex-1">
                <div v-for="i in 4" :key="i" class="flex-1 h-1 rounded-full transition-all"
                  :style="{ background: i <= pwdStrength.level ? pwdStrength.color : 'rgba(255,255,255,0.1)' }"></div>
              </div>
              <span class="text-[10px] font-mono" :style="{ color: pwdStrength.color }">{{ pwdStrength.label }}</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">URL (optional)</p>
                <input v-model="form.url" placeholder="https://…"
                  class="w-full rounded-xl px-4 py-3 text-[12px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none"
                  style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
              </div>
              <div>
                <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">CATEGORY</p>
                <div class="flex flex-col gap-1">
                  <button v-for="c in vaultCategories" :key="c" @click="form.category = c"
                    class="px-3 py-2 rounded-lg text-[11px] font-mono font-bold transition-all text-left"
                    :style="form.category === c
                      ? { background: accent + '18', border: `1px solid ${accent}33`, color: accent }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }">
                    {{ c }}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">NOTES (optional)</p>
              <textarea v-model="form.notes" rows="2" placeholder="Additional notes…"
                class="w-full rounded-xl px-4 py-3 text-[12px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none resize-none"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
            </div>

            <div class="flex gap-2 mt-1">
              <button v-if="editTarget" @click="deleteEntry(editTarget.id)"
                class="w-10 h-12 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95"
                style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);">
                <Trash2 :size="16" class="text-rose-500" :stroke-width="2" />
              </button>
              <button @click="saveEntry" :disabled="!form.service.trim() || !form.password.trim()"
                class="flex-1 py-3.5 rounded-xl text-[14px] font-black font-mono active:scale-[0.98] transition-all"
                :style="form.service.trim() && form.password.trim()
                  ? { background: accent, color: '#fff', boxShadow: `0 6px 20px ${accent}44` }
                  : { background: 'rgba(255,255,255,0.05)', color: '#3f3f46', border: '1px solid rgba(255,255,255,0.06)' }">
                {{ editTarget ? 'save_changes' : 'add_entry' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Toast -->
  <Transition name="toast">
    <div v-if="toastMsg" class="fixed left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2 px-4 py-2.5 rounded-xl"
      style="top:calc(16px + env(safe-area-inset-top));background:rgba(12,12,24,0.95);border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(20px);">
      <div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
      <p class="text-[12px] font-mono font-bold text-zinc-200">{{ toastMsg }}</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  ChevronLeft, Plus, Search, X, Eye, EyeOff,
  Lock, Key, User, Pencil, Trash2, ShieldCheck,
} from 'lucide-vue-next'
import { settings, orbLog } from '../composables/useStore'
import { useNav } from '../composables/useNav'
import { useDaemon } from '~/composables/useDaemon'
import { useSwipeDown } from '~/composables/useSwipeDown'

const { navigate } = useNav()
const accent = computed(() => settings.value.accentColor)
const { connected: daemonConnected, syncVault } = useDaemon()

const { sheetStyle, onTouchStart, onTouchMove, onTouchEnd } = useSwipeDown(() => closeSheet())

async function daemonSyncVault() {
  if (!daemonConnected.value || !vaultUnlocked.value) return
  await syncVault(
    entries.value.map(e => ({
      id: e.id, service: e.service, username: e.username, password: e.password,
      category: e.category, url: e.url, notes: e.notes,
    }))
  ).catch(() => { })
}

// ── Vault lock state ──────────────────────────────────────
const VAULT_KEY = 'orb_vault_entries_v1'
const VAULT_MASTER_KEY = 'orb_vault_master_v1'

const vaultUnlocked = ref(false)
const masterInput = ref('')
const showMaster = ref(false)
const unlockError = ref('')
const hasMasterSet = ref(!!localStorage.getItem(VAULT_MASTER_KEY))

async function sha256(text: string) {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function unlockVault() {
  if (!masterInput.value.trim()) {
    unlockError.value = 'Enter a password'
    return
  }
  const hash = await sha256(masterInput.value.trim())
  const stored = localStorage.getItem(VAULT_MASTER_KEY)
  if (!stored) {
    localStorage.setItem(VAULT_MASTER_KEY, hash)
    hasMasterSet.value = true
    vaultUnlocked.value = true
    loadEntries()
    unlockError.value = ''
    orbLog('Vault master password set (shared with ENV manager)')
  } else if (hash === stored) {
    vaultUnlocked.value = true
    loadEntries()
    unlockError.value = ''
    orbLog('Vault unlocked')
  } else {
    unlockError.value = 'Incorrect master password'
  }
  masterInput.value = ''
}

function lockVault() {
  vaultUnlocked.value = false
  masterInput.value = ''
  unlockError.value = ''
  orbLog('Vault locked')
}

// ── Entries ───────────────────────────────────────────────
interface VaultEntry {
  id: number; service: string; username: string; password: string
  url: string; category: string; notes: string; favicon: string; createdAt: string
}

const vaultCategories = ['work', 'personal', 'dev', 'finance', 'social']

function getFavicon(service: string): string {
  const map: Record<string, string> = {
    github: '🐙', google: '🔵', apple: '🍎', twitter: '🐦', x: '𝕏',
    facebook: '📘', instagram: '📸', linkedin: '💼', discord: '💬',
    slack: '💬', aws: '☁️', vercel: '▲', figma: '🎨', notion: '📝',
    stripe: '💳', paypal: '💸', netflix: '📺', spotify: '🎵',
  }
  const key = service.toLowerCase()
  for (const [k, v] of Object.entries(map)) { if (key.includes(k)) return v }
  return service.slice(0, 1).toUpperCase()
}

const entries = ref<VaultEntry[]>([])
const revealedIds = ref(new Set<number>())

function loadEntries() {
  try { const r = localStorage.getItem(VAULT_KEY); if (r) entries.value = JSON.parse(r); else entries.value = [] }
  catch { entries.value = [] }
}
function saveEntries() {
  try { localStorage.setItem(VAULT_KEY, JSON.stringify(entries.value)) } catch { }
}

const search = ref('')
const activeCategory = ref('all')

const filteredEntries = computed(() =>
  entries.value.filter(e => {
    const matchCat = activeCategory.value === 'all' || e.category === activeCategory.value
    const q = search.value.toLowerCase()
    const matchSearch = !q || e.service.toLowerCase().includes(q) || e.username.toLowerCase().includes(q)
    return matchCat && matchSearch
  })
)

const vaultStats = computed(() => [
  { label: 'entries', value: entries.value.length, color: accent.value },
  { label: 'work', value: entries.value.filter(e => e.category === 'work').length, color: '#60a5fa' },
  { label: 'personal', value: entries.value.filter(e => e.category === 'personal').length, color: '#34d399' },
  { label: 'dev', value: entries.value.filter(e => e.category === 'dev').length, color: '#a78bfa' },
])

function toggleReveal(id: number) {
  if (revealedIds.value.has(id)) revealedIds.value.delete(id)
  else revealedIds.value.add(id)
}

function copyUsername(e: VaultEntry) {
  navigator.clipboard?.writeText(e.username).then(() => showToast(`copied: ${e.service} username`))
}
function copyPassword(e: VaultEntry) {
  navigator.clipboard?.writeText(e.password).then(() => showToast(`copied: ${e.service} password`))
}

// ── Add/Edit sheet ────────────────────────────────────────
const showSheet = ref(false)
const editTarget = ref<VaultEntry | null>(null)
const showFormPwd = ref(false)

const form = reactive({ service: '', username: '', password: '', url: '', category: 'personal', notes: '' })

function openAddSheet() {
  if (!vaultUnlocked.value) return
  editTarget.value = null
  Object.assign(form, { service: '', username: '', password: '', url: '', category: 'personal', notes: '' })
  showFormPwd.value = false
  showSheet.value = true
}
function editEntry(e: VaultEntry) {
  editTarget.value = e
  Object.assign(form, { service: e.service, username: e.username, password: e.password, url: e.url, category: e.category, notes: e.notes })
  showFormPwd.value = false
  showSheet.value = true
}
function closeSheet() { showSheet.value = false; editTarget.value = null }

function saveEntry() {
  if (!form.service.trim() || !form.password.trim()) return
  if (editTarget.value) {
    const e = entries.value.find(e => e.id === editTarget.value!.id)
    if (e) Object.assign(e, { ...form, favicon: getFavicon(form.service) })
    orbLog(`Vault entry updated: ${form.service}`)
  } else {
    entries.value.unshift({ id: Date.now(), ...form, favicon: getFavicon(form.service), createdAt: new Date().toISOString() })
    orbLog(`Vault entry added: ${form.service}`)
  }
  saveEntries(); daemonSyncVault(); closeSheet()
  showToast(editTarget.value ? 'entry_updated' : 'entry_added')
}

function deleteEntry(id: number) {
  const e = entries.value.find(e => e.id === id)
  entries.value = entries.value.filter(e => e.id !== id)
  saveEntries(); daemonSyncVault(); closeSheet()
  showToast(`deleted: ${e?.service}`)
}

// ── Password generator ────────────────────────────────────
function generatePassword() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  form.password = Array.from(crypto.getRandomValues(new Uint8Array(20)))
    .map(b => charset[b % charset.length]).join('')
  showFormPwd.value = true
}

const pwdStrength = computed(() => {
  const p = form.password; if (!p) return { level: 0, color: '#3f3f46', label: '' }
  let score = 0
  if (p.length >= 8) score++; if (p.length >= 12) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++; if (/[^A-Za-z0-9]/.test(p)) score++
  if (score <= 1) return { level: 1, color: '#ef4444', label: 'weak' }
  if (score <= 2) return { level: 2, color: '#fb923c', label: 'fair' }
  if (score <= 3) return { level: 3, color: '#fbbf24', label: 'good' }
  return { level: 4, color: '#34d399', label: 'strong' }
})

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
.devkit-root {
  background: #060810;
  min-height: 100%;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity .28s ease;
}

.sheet-enter-active>div,
.sheet-leave-active>div {
  transition: transform .32s cubic-bezier(.32, 1.1, .64, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from>div,
.sheet-leave-to>div {
  transform: translateY(100%);
}

.toast-enter-active {
  transition: all .3s cubic-bezier(0.34, 1.1, 0.64, 1);
}

.toast-leave-active {
  transition: all .2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -12px) scale(0.92);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -6px) scale(0.96);
}
</style>