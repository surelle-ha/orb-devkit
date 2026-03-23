<template>
  <div class="flex flex-col" style="height:100%;position:relative;background:#09090b;">

    <!-- Ambient nebula -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute rounded-full" :style="nebula1"></div>
      <div class="absolute rounded-full" :style="nebula2"></div>
    </div>

    <!-- HEADER -->
    <div class="flex-shrink-0 flex items-center gap-3 px-4 py-3 z-10"
      style="background:rgba(9,9,11,0.6);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.07);">

      <button @click="navigate('home')"
        class="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
        style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);">
        <ChevronLeft :size="18" class="text-zinc-300" :stroke-width="2.5" />
      </button>

      <!-- Mini orb -->
      <div class="relative flex-shrink-0" style="width:38px;height:38px;">
        <div class="absolute inset-0 rounded-full" :style="miniGlow"></div>
        <div class="absolute rounded-full orb-spin-cw"  :style="miniRing1"></div>
        <div class="absolute rounded-full orb-spin-ccw" :style="miniRing2"></div>
        <div class="absolute rounded-full" :style="miniCore"></div>
        <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
          :style="{
            background: isTyping ? '#f59e0b' : aiMode === 'native' ? '#34d399' : aiMode === 'loading' ? '#f59e0b' : '#6366f1',
            borderColor:'#09090b'
          }"></div>
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-[15px] font-black text-white leading-none">Orb AI</p>
        <p class="text-[11px] font-medium mt-0.5" :style="{ color: accent + 'BB' }">
          {{ isTyping ? 'Thinking…' : aiModeLabel }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- AI mode badge -->
        <div class="flex items-center gap-1 px-2 py-1 rounded-full"
          :style="{ background: (aiMode==='native' ? '#10b981' : aiMode==='loading' ? '#f59e0b' : '#6366f1') + '18', border: '1px solid ' + (aiMode==='native' ? '#10b981' : aiMode==='loading' ? '#f59e0b' : '#6366f1') + '44' }">
          <Cpu v-if="aiMode==='native'"  :size="9" style="color:#10b981" :stroke-width="2" />
          <Wifi v-else-if="aiMode==='cloud'" :size="9" style="color:#6366f1" :stroke-width="2" />
          <span class="text-[9px] font-bold uppercase tracking-wide"
            :style="{ color: aiMode==='native' ? '#10b981' : aiMode==='loading' ? '#f59e0b' : '#818cf8' }">
            {{ aiMode === 'native' ? 'Local' : aiMode === 'loading' ? '…' : 'Cloud' }}
          </span>
        </div>

        <!-- Memory badge -->
        <button v-if="memoryList.length" @click="showMemoryPanel = !showMemoryPanel"
          class="flex items-center gap-1 px-2 py-1 rounded-full active:scale-90 transition-transform"
          :style="{ background: accent + '18', border: '1px solid ' + accent + '33' }">
          <Brain :size="10" :style="{ color: accent }" :stroke-width="2" />
          <span class="text-[9px] font-bold" :style="{ color: accent }">{{ memoryList.length }}</span>
        </button>

        <button @click="clearChat"
          class="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);">
          <Trash2 :size="14" class="text-zinc-500" :stroke-width="2" />
        </button>
      </div>
    </div>

    <!-- MEMORY PANEL (collapsible) -->
    <Transition name="slide-down">
      <div v-if="showMemoryPanel" class="flex-shrink-0 z-10 border-b border-white/5"
        style="background:rgba(20,15,30,0.95);max-height:220px;overflow-y:auto;">
        <div class="px-4 py-3">
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-bold uppercase tracking-widest" :style="{ color: accent }">Orb Remembers</p>
            <button @click="confirmForgetAll = true"
              class="text-[10px] font-bold text-rose-400 active:opacity-60">Clear all</button>
          </div>
          <div class="space-y-1.5">
            <div v-for="m in memoryList" :key="m.key"
              class="flex items-start gap-2 rounded-xl px-3 py-2"
              style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);">
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wide truncate">{{ m.key.replace(/_/g,' ') }}</p>
                <p class="text-[12px] text-zinc-300 font-medium mt-0.5 leading-snug">{{ m.value }}</p>
              </div>
              <button @click="forget(m.key)" class="flex-shrink-0 active:opacity-60 mt-0.5">
                <X :size="12" class="text-zinc-600" :stroke-width="2.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MESSAGES AREA -->
    <div ref="scrollEl"
      class="flex-1 overflow-y-auto px-4 py-5 space-y-4 z-10"
      style="overscroll-behavior:contain;-webkit-overflow-scrolling:touch;">

      <!-- WELCOME -->
      <div v-if="messages.length === 0" class="flex flex-col items-center gap-6 pt-8 pb-4">
        <div class="relative" style="width:100px;height:100px;">
          <div class="absolute rounded-full" :style="bigGlow"></div>
          <div class="absolute inset-0 rounded-full" :style="bigCore"></div>
        </div>
        <div class="text-center px-6">
          <p class="text-[22px] font-black text-white mb-2">Hey, I'm Orb!</p>
          <p class="text-[13px] leading-relaxed text-zinc-400">
            Ask me anything — or tell me to add transactions, track bills, or remember things for you.
          </p>
        </div>
        <!-- Capability chips -->
        <div class="flex flex-col gap-2 w-full">
          <p class="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Try asking me to…</p>
          <button v-for="chip in chips" :key="chip.text"
            @click="sendMessage(chip.text)"
            class="w-full text-left px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all active:scale-[0.97] flex items-center gap-3"
            :style="chipStyle">
            <span class="text-[16px]">{{ chip.emoji }}</span>
            <span :style="{ color: accent + 'DD' }">{{ chip.text }}</span>
          </button>
        </div>
      </div>

      <!-- MESSAGES -->
      <template v-else>
        <div v-for="(msg, i) in messages" :key="i"
          :class="['flex items-end gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start']">

          <!-- Orb avatar -->
          <div v-if="msg.role === 'assistant' || msg.role === 'tool_confirm'" class="flex-shrink-0 mb-0.5">
            <div class="w-7 h-7 rounded-full flex items-center justify-center"
              :style="{ background: accent + '1E', border: '1px solid ' + accent + '44' }">
              <div class="w-3 h-3 rounded-full"
                :style="{ background: 'radial-gradient(circle at 40% 35%, ' + accent + 'CC, ' + accent + '55)' }"></div>
            </div>
          </div>

          <!-- Tool confirmation card -->
          <div v-if="msg.role === 'tool_confirm'" class="max-w-[86%]">
            <div class="rounded-2xl rounded-bl-sm overflow-hidden"
              style="background:rgba(39,39,42,0.7);border:1px solid rgba(255,255,255,0.1);">
              <!-- Action header -->
              <div class="px-4 pt-3 pb-2 border-b border-white/5">
                <div class="flex items-center gap-2 mb-1">
                  <div class="w-5 h-5 rounded-md flex items-center justify-center"
                    :style="{ background: toolActionColor(msg.toolCall?.fn) + '22' }">
                    <component :is="toolActionIcon(msg.toolCall?.fn)" :size="11"
                      :style="{ color: toolActionColor(msg.toolCall?.fn) }" :stroke-width="2.5" />
                  </div>
                  <p class="text-[11px] font-bold uppercase tracking-wide"
                    :style="{ color: toolActionColor(msg.toolCall?.fn) }">
                    {{ toolActionLabel(msg.toolCall?.fn) }}
                  </p>
                </div>
                <p class="text-[13px] text-zinc-200 leading-snug">{{ msg.content }}</p>
              </div>
              <!-- Args preview -->
              <div class="px-4 py-2 space-y-1">
                <div v-for="(val, key) in msg.toolCall?.args" :key="key"
                  class="flex items-center justify-between gap-3">
                  <span class="text-[10px] font-bold text-zinc-600 uppercase tracking-wide">{{ String(key) }}</span>
                  <span class="text-[12px] font-semibold text-zinc-300">{{ formatArgValue(key, val) }}</span>
                </div>
                <!-- Sync note for remember_fact -->
                <div v-if="msg.toolCall?.fn === 'remember_fact' && syncDescription(msg.toolCall?.args?.key)"
                  class="flex items-center gap-1.5 pt-1 mt-1 border-t border-white/5">
                  <div class="w-3 h-3 rounded-full flex-shrink-0" style="background:#06b6d422;border:1px solid #06b6d444;">
                    <div class="w-full h-full rounded-full" style="background:#06b6d4;transform:scale(0.5);"></div>
                  </div>
                  <span class="text-[11px] text-cyan-400/70 font-medium">{{ syncDescription(msg.toolCall?.args?.key) }}</span>
                </div>
              </div>
              <!-- Buttons -->
              <div v-if="msg.status === 'pending'" class="flex gap-2 px-4 pb-3 pt-1">
                <button @click="executeToolCall(msg)"
                  class="flex-1 py-2.5 rounded-xl text-[13px] font-black text-white active:scale-[0.97] transition-all"
                  :style="{ background: toolActionColor(msg.toolCall?.fn), boxShadow: '0 4px 12px ' + toolActionColor(msg.toolCall?.fn) + '44' }">
                  Confirm
                </button>
                <button @click="cancelToolCall(msg)"
                  class="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-zinc-400 active:scale-[0.97]"
                  style="background:rgba(255,255,255,0.06);">
                  Cancel
                </button>
              </div>
              <!-- Executed state -->
              <div v-else class="flex items-center gap-2 px-4 pb-3 pt-1">
                <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  :style="{ background: msg.status === 'done' ? '#10b981' : '#ef4444' }">
                  <Check v-if="msg.status === 'done'" :size="11" color="white" :stroke-width="3" />
                  <X v-else :size="11" color="white" :stroke-width="3" />
                </div>
                <p class="text-[12px] font-semibold"
                  :class="msg.status === 'done' ? 'text-emerald-400' : 'text-zinc-500'">
                  {{ msg.status === 'done' ? msg.resultMsg : 'Cancelled' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Regular message bubble -->
          <div v-else class="max-w-[82%] px-4 py-3 text-[14px] leading-relaxed"
            :class="msg.role === 'user'
              ? 'rounded-2xl rounded-br-sm text-white font-medium'
              : 'rounded-2xl rounded-bl-sm font-normal'"
            :style="msg.role === 'user'
              ? { background: accent, boxShadow: '0 4px 20px ' + accent + '44' }
              : bubbleAssistantStyle">
            {{ msg.content }}
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="isTyping" class="flex items-end gap-2 justify-start">
          <div class="flex-shrink-0 mb-0.5">
            <div class="w-7 h-7 rounded-full flex items-center justify-center"
              :style="{ background: accent + '1E', border: '1px solid ' + accent + '44' }">
              <div class="w-3 h-3 rounded-full"
                :style="{ background: 'radial-gradient(circle at 40% 35%, ' + accent + 'CC, ' + accent + '55)' }"></div>
            </div>
          </div>
          <div class="px-4 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5" :style="bubbleAssistantStyle">
            <div class="w-2 h-2 rounded-full chat-dot-1" :style="{ background: accent }"></div>
            <div class="w-2 h-2 rounded-full chat-dot-2" :style="{ background: accent }"></div>
            <div class="w-2 h-2 rounded-full chat-dot-3" :style="{ background: accent }"></div>
          </div>
        </div>
      </template>
    </div>

    <!-- INPUT BAR -->
    <div class="flex-shrink-0 px-4 pb-4 pt-3 z-10"
      style="background:rgba(9,9,11,0.55);backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,0.07);">
      <div class="flex items-end gap-2">
        <div class="flex-1 min-h-[46px] rounded-2xl px-4 py-3 transition-all" :style="inputContainerStyle">
          <textarea
            ref="inputEl"
            v-model="inputText"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
            @keydown.enter.prevent="handleEnter"
            placeholder="Ask Orb anything…"
            rows="1"
            class="w-full bg-transparent text-[14px] font-medium text-white placeholder:text-zinc-600 outline-none resize-none leading-snug"
            style="max-height:100px;overflow-y:auto;"
          ></textarea>
        </div>
        <button @click="submitInput"
          :disabled="!inputText.trim() || isTyping"
          class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          :style="sendBtnStyle">
          <ArrowUp :size="18" color="white" :stroke-width="2.5" />
        </button>
      </div>
    </div>
  </div>

  <!-- Forget-all confirm -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="confirmForgetAll"
        class="fixed inset-0 z-[400] flex items-end justify-center"
        style="background:rgba(0,0,0,0.6);backdrop-filter:blur(12px)"
        @click.self="confirmForgetAll = false">
        <div class="w-full max-w-[430px] bg-zinc-900 rounded-t-[28px] px-5 pt-5 pb-10 border-t border-zinc-800">
          <div class="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4"></div>
          <p class="text-[17px] font-black text-white text-center mb-1">Forget everything?</p>
          <p class="text-[13px] text-zinc-400 text-center mb-6">Orb will forget all {{ memoryList.length }} saved memories.</p>
          <button @click="forgetAll(); confirmForgetAll = false; showMemoryPanel = false"
            class="w-full py-4 rounded-2xl bg-rose-500 text-white text-[15px] font-black active:scale-[0.98] mb-3">
            Yes, Forget All
          </button>
          <button @click="confirmForgetAll = false"
            class="w-full py-3.5 rounded-2xl bg-zinc-800 text-zinc-300 text-[14px] font-bold active:scale-[0.98]">
            Cancel
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { ChevronLeft, Trash2, ArrowUp, Check, X, Brain, Plus, Receipt, CreditCard, ShoppingCart, Zap, Bookmark, Cpu, Wifi } from 'lucide-vue-next'
import { useNav } from '../composables/useNav'
import {
  settings, totalBalance, totalIncome, totalExpenses,
  spendingByCategory, recentTx, transactions,
  addTx, addBill, markBillPaid, deleteBill,
  bills, TXNS_KEY, CARDS_KEY,
} from '../composables/useStore'
import {
  aiMemory, memoryList, remember, recall, forget, forgetAll, memoriesAsPromptContext, syncDescription, resolveKey,
} from '../composables/useAiMemory'
import { useNativeLLM, generateNative } from '../composables/useNativeLLM'

const { navigate } = useNav()
const accent = computed(() => settings.value.accentColor)
const sym    = computed(() => settings.value.currencySymbol)

// ── Native AI state ───────────────────────────────────────
const { isReady: nativeReady, isLoading: nativeLoading, initModel } = useNativeLLM()

// Auto-init native model when chat opens if downloaded but not yet ready
onMounted(async () => {
  if (!nativeReady.value && !nativeLoading.value) {
    try { await initModel() } catch {}
  }
})

// Reactive: if native becomes ready mid-conversation, show a status update
watch(nativeReady, (ready) => {
  if (ready && messages.value.length > 0) {
    // Replace any "cloud mode" status silently — just update the header dot
  }
})

const aiMode = computed((): 'native' | 'cloud' | 'loading' => {
  if (nativeReady.value)   return 'native'
  if (nativeLoading.value) return 'loading'
  return 'cloud'
})

const aiModeLabel = computed(() => {
  if (aiMode.value === 'native')  return 'Private · On-device'
  if (aiMode.value === 'loading') return 'Loading model…'
  return 'Cloud mode'
})

// ── Style objects ─────────────────────────────────────────
const nebula1 = computed(() => ({
  width:'320px', height:'320px', top:'-80px', left:'-60px',
  background: 'radial-gradient(circle, ' + accent.value + '1A 0%, transparent 65%)',
  filter: 'blur(40px)',
}))
const nebula2 = computed(() => ({
  width:'280px', height:'280px', bottom:'-40px', right:'-60px',
  background: 'radial-gradient(circle, ' + accent.value + '12 0%, transparent 60%)',
  filter: 'blur(50px)',
}))
const miniGlow    = computed(() => ({ borderRadius:'50%', boxShadow: '0 0 16px 4px ' + accent.value + '33', pointerEvents:'none' }))
const miniRing1   = computed(() => ({ inset:'-5px', borderRadius:'50%', border:'1px solid ' + accent.value + '55', pointerEvents:'none' }))
const miniRing2   = computed(() => ({ inset:'-10px', borderRadius:'50%', border:'0.5px solid ' + accent.value + '2A', pointerEvents:'none' }))
const miniCore    = computed(() => ({ inset:'1px', borderRadius:'50%', background:'radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 55%,#000 100%)', boxShadow:'inset 0 0 14px rgba(0,0,0,1), 0 0 0 1px ' + accent.value + '44' }))
const bigGlow     = computed(() => ({ inset:'-20px', borderRadius:'50%', background:'radial-gradient(circle, ' + accent.value + '2A 0%, transparent 65%)', filter:'blur(16px)' }))
const bigCore     = computed(() => ({ borderRadius:'50%', background:'radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 55%,#000 100%)', boxShadow:'inset 0 0 28px rgba(0,0,0,1), 0 0 0 1px ' + accent.value + '55, 0 0 36px ' + accent.value + '33' }))
const chipStyle   = computed(() => ({ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(8px)' }))
const bubbleAssistantStyle = computed(() => ({ background:'rgba(39,39,42,0.55)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(228,228,231,0.95)' }))
const inputFocused = ref(false)
const inputContainerStyle = computed(() => ({
  background: inputFocused.value ? 'rgba(39,39,42,0.7)' : 'rgba(39,39,42,0.5)',
  backdropFilter:'blur(12px)', border: inputFocused.value ? '1px solid ' + accent.value + '66' : '1px solid rgba(255,255,255,0.08)',
}))
const sendBtnStyle = computed(() => {
  const active = inputText.value.trim() && !isTyping.value
  return { background: active ? accent.value : 'rgba(39,39,42,0.6)', border: active ? 'none' : '1px solid rgba(255,255,255,0.08)', opacity: active ? '1' : '0.45', boxShadow: active ? '0 4px 20px ' + accent.value + '44' : 'none' }
})

// ── Tool helpers ─────────────────────────────────────────
function toolActionLabel(fn?: string) {
  const map: Record<string,string> = { add_transaction:'Add Transaction', add_bill:'Add Bill', mark_bill_paid:'Mark Bill Paid', delete_transaction:'Delete Transaction', remember_fact:'Remember', }
  return map[fn ?? ''] ?? fn ?? 'Action'
}
function toolActionColor(fn?: string) {
  const map: Record<string,string> = { add_transaction:'#8b5cf6', add_bill:'#f59e0b', mark_bill_paid:'#10b981', delete_transaction:'#ef4444', remember_fact:'#06b6d4', }
  return map[fn ?? ''] ?? accent.value
}
function toolActionIcon(fn?: string) {
  const map: Record<string,any> = { add_transaction:Plus, add_bill:Zap, mark_bill_paid:Check, delete_transaction:Trash2, remember_fact:Bookmark, }
  return map[fn ?? ''] ?? Plus
}
function formatArgValue(key: any, val: any): string {
  const k = String(key)
  if (k === 'amount') return sym.value + Math.abs(Number(val)).toLocaleString()
  if (k === 'accountId' && val != null) {
    try {
      const cards = JSON.parse(localStorage.getItem(CARDS_KEY) ?? '[]')
      const card  = cards.find((c: any) => c.id === val)
      return card?.name ?? String(val)
    } catch { return String(val) }
  }
  if (val === null || val === undefined) return '—'
  return String(val)
}

// ── Message types ─────────────────────────────────────────
interface ToolCall { fn: string; args: Record<string,any> }
interface Message {
  role:     'user' | 'assistant' | 'tool_confirm'
  content:  string
  toolCall?: ToolCall
  status?:  'pending' | 'done' | 'cancelled'
  resultMsg?: string
}

const messages   = ref<Message[]>([])
const isTyping   = ref(false)
const inputText  = ref('')
const scrollEl   = ref<HTMLElement | null>(null)
const inputEl    = ref<HTMLTextAreaElement | null>(null)
const showMemoryPanel    = ref(false)
const confirmForgetAll   = ref(false)

const chips = [
  { emoji:'💰', text: 'Add ₱500 grocery expense' },
  { emoji:'📋', text: 'Show my spending summary' },
  { emoji:'💡', text: 'Remember my monthly budget is ₱20,000' },
  { emoji:'✅', text: 'What bills are overdue?' },
]

function scrollToBottom() {
  nextTick(() => { if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight })
}
function clearChat() { messages.value = [] }
function handleEnter(e: KeyboardEvent) { if (!e.shiftKey) submitInput() }

async function submitInput() {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return
  inputText.value = ''
  await sendMessage(text)
}

// ── Tool execution ─────────────────────────────────────────
async function executeToolCall(msg: Message) {
  if (!msg.toolCall) return
  const { fn, args } = msg.toolCall
  try {
    let resultMsg = ''
    if (fn === 'add_transaction') {
      addTx({
        name:      args.name,
        amount:    Number(args.amount),
        category:  args.category ?? 'Other',
        accountId: args.accountId ?? null,
      })
      const sign = Number(args.amount) > 0 ? '+' : '−'
      resultMsg = `${sign}${sym.value}${Math.abs(Number(args.amount)).toLocaleString()} added as "${args.name}"`
    }
    else if (fn === 'add_bill') {
      addBill({ name: args.name, amount: Number(args.amount), dueDay: Number(args.dueDay ?? 1), icon: args.icon ?? 'other', recurring: args.recurring ?? false })
      resultMsg = `Bill "${args.name}" (${sym.value}${Number(args.amount).toLocaleString()}) added`
    }
    else if (fn === 'mark_bill_paid') {
      const bill = bills.value.find(b => b.name.toLowerCase().includes(String(args.name).toLowerCase()))
      if (bill) { markBillPaid(bill.id); resultMsg = `"${bill.name}" marked as paid` }
      else resultMsg = `Could not find bill matching "${args.name}"`
    }
    else if (fn === 'delete_transaction') {
      const tx = transactions.value.find(t => t.id === Number(args.id) || t.name.toLowerCase().includes(String(args.name ?? '').toLowerCase()))
      if (tx) {
        transactions.value = transactions.value.filter(t => t.id !== tx.id)
        try { localStorage.setItem(TXNS_KEY, JSON.stringify(transactions.value)) } catch {}
        resultMsg = `Deleted "${tx.name}"`
      } else resultMsg = 'Transaction not found'
    }
    else if (fn === 'remember_fact') {
      remember(args.key, args.value, 'ai')
      resultMsg = `Remembered: ${args.value}`
    }

    msg.status    = 'done'
    msg.resultMsg = resultMsg
    scrollToBottom()

    // Let AI follow-up
    await followUp(resultMsg, msg.toolCall)
  } catch (e: any) {
    msg.status    = 'done'
    msg.resultMsg = 'Error: ' + (e?.message ?? 'unknown')
  }
}

function cancelToolCall(msg: Message) {
  msg.status = 'cancelled'
  messages.value.push({ role: 'assistant', content: 'No problem — I cancelled that. Anything else?' })
  scrollToBottom()
}

async function followUp(resultMsg: string, toolCall: ToolCall) {
  isTyping.value = true
  scrollToBottom()
  const reply = await callApi([
    ...conversationForApi(),
    { role: 'user', content: `[SYSTEM: Tool "${toolCall.fn}" was executed. Result: ${resultMsg}. Confirm this to the user warmly in one sentence.]` },
  ])
  isTyping.value = false
  messages.value.push({ role: 'assistant', content: reply })
  scrollToBottom()
}

// ── Streaming token buffer for native ─────────────────────
const streamingBuffer = ref('')
const isStreaming     = ref(false)

// ── API call — native first, cloud fallback ───────────────
/**
 * Try native model first. Falls back to Anthropic cloud if:
 *   - model not ready
 *   - native throws an error
 * This means the chat ALWAYS works regardless of model state.
 */
async function callAI(msgs: Array<{role:string;content:string}>): Promise<string> {
  const sys     = buildSystemPrompt()
  const last    = msgs[msgs.length - 1]?.content ?? ''
  const history = msgs.slice(0, -1) as Array<{role:'user'|'assistant';content:string}>

  // ── Try native ──────────────────────────────────────────
  if (nativeReady.value) {
    try {
      streamingBuffer.value = ''
      isStreaming.value     = true
      const result = await generateNative(sys, last, history, (token) => {
        streamingBuffer.value += token
      })
      isStreaming.value = false
      streamingBuffer.value = ''
      return result
    } catch (e: any) {
      console.warn('[OrbChat] Native generation failed, falling back to cloud:', e?.message)
      isStreaming.value     = false
      streamingBuffer.value = ''
      // Fall through to cloud
    }
  }

  // ── Cloud fallback ──────────────────────────────────────
  return callCloudApi(msgs)
}

async function callCloudApi(msgs: Array<{role:string;content:string}>): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system:     buildSystemPrompt(),
      messages:   msgs.map(m => ({ role: m.role, content: m.content })),
    }),
  })
  if (!response.ok) throw new Error('API ' + response.status)
  const data = await response.json()
  return data.content?.find((b: any) => b.type === 'text')?.text ?? ''
}

// Keep old name for follow-up calls
async function callApi(msgs: Array<{role:string;content:string}>): Promise<string> {
  return callAI(msgs)
}

function buildSystemPrompt(): string {
  const bal  = totalBalance.value
  const inc  = totalIncome.value
  const exp  = totalExpenses.value
  const cats = spendingByCategory.value.slice(0,5).map(c => c.category + ': ' + sym.value + c.total.toLocaleString()).join(', ')
  const recent = recentTx.value.slice(0,5).map(t => `[id:${t.id}] ${t.name} (${t.category}): ${t.amount > 0 ? '+' : ''}${sym.value}${Math.abs(t.amount).toLocaleString()}`).join('; ')
  const billsList = bills.value.slice(0,5).map(b => `${b.name} (${sym.value}${b.amount}) status:${b.status}`).join('; ')
  const name = settings.value.userName || 'the user'
  const mem  = memoriesAsPromptContext()

  // Load cards for account matching
  let accountsList = ''
  try {
    const cards = JSON.parse(localStorage.getItem(CARDS_KEY) ?? '[]')
    accountsList = cards.slice(0,8).map((c: any) => `id:${c.id} name:"${c.name}" type:${c.type}`).join('; ')
  } catch {}

  return `You are Orb, a friendly and capable personal finance AI assistant.
User: ${name} | Currency: ${settings.value.currency} (${sym.value})
Balance: ${sym.value}${bal.toLocaleString()} | Income: ${sym.value}${inc.toLocaleString()} | Expenses: ${sym.value}${exp.toLocaleString()}
Top spending: ${cats || 'none'}
Recent transactions: ${recent || 'none'}
Bills: ${billsList || 'none'}
Accounts: ${accountsList || 'none'}${mem ? '\n\nWhat Orb remembers:\n' + mem : ''}

You can perform real actions by responding with a JSON tool call instead of plain text.
ONLY use a tool call when the user is clearly asking you to DO something.
For questions, analysis, or advice — reply normally.

Tool call format (respond ONLY with this JSON, nothing else, when using a tool):
{"tool":"add_transaction","args":{"name":"Grocery","amount":-500,"category":"Groceries","accountId":null}}
{"tool":"add_transaction","args":{"name":"Salary","amount":50000,"category":"Income","accountId":123}}
{"tool":"add_bill","args":{"name":"Netflix","amount":399,"dueDay":15,"icon":"tv2","recurring":true}}
{"tool":"mark_bill_paid","args":{"name":"Netflix"}}
{"tool":"delete_transaction","args":{"id":1234567890}}
{"tool":"remember_fact","args":{"key":"monthly_budget","value":"20000"}}

Rules:
- Income = positive amount. Expense = negative amount.
- Always confirm the account by matching the user's description to the accounts list above.
- If the user says "cash" or no account, use accountId: null.
- For remember_fact: key should be snake_case, value should be the exact fact to remember.
- NEVER say you added something without actually outputting the tool JSON.
- Keep plain-text replies to 2–4 sentences. Be warm and direct.`
}

function conversationForApi() {
  return messages.value
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as 'user'|'assistant', content: m.content }))
}

// (cloud API moved to callCloudApi above)

// ── Parse tool call from AI response ─────────────────────
function parseToolCall(text: string): ToolCall | null {
  const trimmed = text.trim()
  // Look for JSON object starting with {"tool":
  const match = trimmed.match(/\{[\s\S]*"tool"\s*:[\s\S]*\}/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0])
    if (parsed.tool && parsed.args) return { fn: parsed.tool, args: parsed.args }
  } catch {}
  return null
}

function describeToolCall(toolCall: ToolCall): string {
  const { fn, args } = toolCall
  if (fn === 'add_transaction') {
    const amt = Number(args.amount)
    const type = amt > 0 ? 'income' : 'expense'
    return `Add ${type} of ${sym.value}${Math.abs(amt).toLocaleString()} as "${args.name}"${args.category ? ' ('+args.category+')' : ''}${args.accountId ? ' to account' : ' (cash)'}?`
  }
  if (fn === 'add_bill') return `Add bill "${args.name}" for ${sym.value}${Number(args.amount).toLocaleString()} due on day ${args.dueDay}${args.recurring ? ' (monthly)' : ''}?`
  if (fn === 'mark_bill_paid') return `Mark "${args.name}" bill as paid?`
  if (fn === 'delete_transaction') return `Delete transaction${args.name ? ' "'+args.name+'"' : ''}?`
  if (fn === 'remember_fact') return `Remember: "${args.value}"?`
  return 'Perform this action?'
}

// ── Main send ─────────────────────────────────────────────
async function sendMessage(text: string) {
  messages.value.push({ role: 'user', content: text })
  scrollToBottom()
  isTyping.value = true

  try {
    const reply = await callAI(conversationForApi())
    isTyping.value = false

    const toolCall = parseToolCall(reply)
    if (toolCall) {
      // Show confirmation card instead of raw message
      messages.value.push({
        role:     'tool_confirm',
        content:  describeToolCall(toolCall),
        toolCall,
        status:   'pending',
      })
    } else {
      messages.value.push({ role: 'assistant', content: reply || localReply(text) })
    }
  } catch {
    isTyping.value = false
    messages.value.push({ role: 'assistant', content: localReply(text) })
  }
  scrollToBottom()
}

function localReply(q: string): string {
  const l = q.toLowerCase()
  const s = sym.value
  const top = spendingByCategory.value[0]
  if (l.includes('balance'))
    return 'Your balance is ' + s + totalBalance.value.toLocaleString() + '.'
  if (l.includes('spend') || l.includes('most'))
    return top ? 'Top spending: ' + top.category + ' at ' + s + top.total.toLocaleString() + '.' : 'No expenses yet.'
  if (l.includes('overdue')) {
    const od = bills.value.filter(b => b.status === 'overdue')
    return od.length ? 'Overdue: ' + od.map(b => b.name).join(', ') : 'No overdue bills!'
  }
  return 'Your balance is ' + s + totalBalance.value.toLocaleString() + '. Ask me anything or tell me to add a transaction!'
}
</script>

<style scoped>
.orb-spin-cw  { animation: chat-cw  9s  linear infinite; transform-origin: center center; }
.orb-spin-ccw { animation: chat-ccw 15s linear infinite; transform-origin: center center; }
@keyframes chat-cw  { from{transform:rotate(0deg)}   to{transform:rotate(360deg)}  }
@keyframes chat-ccw { from{transform:rotate(0deg)}   to{transform:rotate(-360deg)} }
@keyframes chat-bounce { 0%,80%,100%{transform:translateY(0);opacity:0.35} 40%{transform:translateY(-5px);opacity:1} }
.chat-dot-1 { animation:chat-bounce 1.2s ease-in-out 0s   infinite; }
.chat-dot-2 { animation:chat-bounce 1.2s ease-in-out 0.2s infinite; }
.chat-dot-3 { animation:chat-bounce 1.2s ease-in-out 0.4s infinite; }
.slide-down-enter-active,.slide-down-leave-active { transition: all 0.28s ease; overflow:hidden; }
.slide-down-enter-from,.slide-down-leave-to { max-height:0; opacity:0; }
.slide-down-enter-to,.slide-down-leave-from { max-height:300px; opacity:1; }
.fade-enter-active,.fade-leave-active { transition:opacity .25s ease; }
.fade-enter-from,.fade-leave-to { opacity:0; }
</style>