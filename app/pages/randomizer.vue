<template>
  <div class="bg-slate-100 dark:bg-zinc-950 pb-28" style="touch-action:pan-y;">

    <!-- Header -->
    <div class="flex items-center gap-3 px-5 pt-6 pb-4">
      <button @click="navigate('more')"
        class="w-9 h-9 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-center active:scale-90 transition-transform">
        <ChevronLeft :size="18" class="text-slate-600 dark:text-zinc-300" :stroke-width="2.5" />
      </button>
      <div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Buy or Not?</h2>
        <p class="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">Your impulsive purchase decider</p>
      </div>
    </div>

    <!-- Info banner -->
    <div class="mx-4 mb-4 rounded-2xl px-4 py-3 flex items-start gap-3"
      :style="{ background: accent + '12', border: `1px solid ${accent}25` }">
      <Info :size="16" :style="{ color: accent, marginTop: '1px' }" :stroke-width="2" class="flex-shrink-0" />
      <p class="text-[12px] font-medium leading-relaxed text-slate-600 dark:text-zinc-400">
        Fill in your purchase details. Toggle <span class="font-bold" :style="{ color: accent }">AI Decide</span> to let Orb analyse your finances, or leave it off for a truly random coin-flip.
      </p>
    </div>

    <!-- Form card -->
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">

      <!-- Item name -->
      <div class="px-4 pt-4 pb-3.5 border-b border-slate-100 dark:border-zinc-800/60">
        <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">What do you want to buy?</p>
        <input v-model="form.item" placeholder="e.g. New headphones, sneakers…"
          class="w-full bg-slate-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 border-2 border-transparent focus:border-violet-500 outline-none transition-colors" />
      </div>

      <!-- Price — formatted with commas -->
      <div class="px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800/60">
        <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Price</p>
        <div class="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 rounded-xl px-4 py-3 border-2 border-transparent focus-within:border-violet-500 transition-colors">
          <span class="text-[18px] font-black text-violet-500">{{ sym }}</span>
          <input
            :value="priceDisplay"
            @input="onPriceInput"
            @keydown="onPriceKeydown"
            inputmode="decimal"
            placeholder="0.00"
            class="flex-1 bg-transparent text-[20px] font-black text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-700 outline-none" />
        </div>
      </div>

      <!-- Reason -->
      <div class="px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800/60">
        <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Why do you want it?</p>
        <textarea v-model="form.reason" placeholder="I need it because…" rows="2"
          class="w-full bg-slate-50 dark:bg-zinc-800 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 border-2 border-transparent focus:border-violet-500 outline-none transition-colors resize-none"></textarea>
      </div>

      <!-- Category -->
      <div class="px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800/60">
        <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Category</p>
        <div class="flex flex-wrap gap-2">
          <button v-for="cat in categories" :key="cat"
            @click="form.category = cat"
            :class="['px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all',
              form.category === cat
                ? 'text-white border-transparent'
                : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400']"
            :style="form.category === cat ? { background: accent, borderColor: accent } : {}">
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- AI Decide toggle -->
      <div class="px-4 py-3.5">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <Sparkles :size="16"
                :style="{ color: aiIsReady ? accent : aiIsLoading ? '#f59e0b' : '#71717a' }"
                :stroke-width="2" />
              <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">AI Decide</p>
              <!-- AI state badge -->
              <span v-if="aiIsLoading"
                class="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                style="background:rgba(245,158,11,0.12);color:#f59e0b;">LOADING</span>
              <span v-else-if="!aiIsReady"
                class="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                style="background:rgba(113,113,122,0.1);color:#71717a;">OFFLINE</span>
            </div>
            <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 ml-6">
              {{ form.useAI
                ? (aiIsReady ? 'Orb AI analyses your balance, spending & goals' : aiIsLoading ? 'Using cloud AI until on-device loads' : 'Using Anthropic cloud AI as fallback')
                : '🎲 Randomized — pure coin flip, no data used' }}
            </p>
          </div>
          <button @click="form.useAI = !form.useAI"
            class="w-12 h-6 rounded-full transition-all relative flex-shrink-0 ml-3"
            :style="{ background: form.useAI ? accent : '' }"
            :class="!form.useAI ? 'bg-slate-200 dark:bg-zinc-700' : ''">
            <div :class="['absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all', form.useAI ? 'left-6' : 'left-0.5']"></div>
          </button>
        </div>
        <!-- Context banners -->
        <p v-if="!form.useAI" class="mt-2.5 text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2 border border-amber-200 dark:border-amber-800/40">
          🎲 AI is OFF — the decision is completely random with no financial analysis.
        </p>
        <p v-else-if="form.useAI && !aiIsReady && !aiIsLoading" class="mt-2.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2">
          On-device AI not loaded — will use Anthropic cloud API. Enable in Settings for fully private analysis.
        </p>
      </div>
    </div>

    <!-- Decide button -->
    <div class="px-4 mb-6">
      <button @click="decide" :disabled="!canDecide || isThinking"
        class="w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        :style="canDecide && !isThinking ? { background: accent, color: 'white', boxShadow: `0 8px 24px ${accent}44` } : {}"
        :class="!canDecide || isThinking ? 'bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600' : ''">
        <Loader2 v-if="isThinking" :size="20" class="animate-spin" />
        <Dice5 v-else-if="!form.useAI" :size="20" />
        <Sparkles v-else :size="20" />
        {{ isThinking ? 'Thinking…' : form.useAI ? 'Ask Orb AI' : 'Flip the Coin' }}
      </button>
    </div>

    <!-- History (no result overlay here — keeps the list clean) -->
    <div v-if="history.length > 0" class="px-5 pb-2 flex items-center justify-between">
      <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">History</h3>
      <button @click="history.length = 0" class="text-[11px] font-bold text-rose-400 active:opacity-60">Clear</button>
    </div>
    <div v-if="history.length > 0" class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <div v-for="(h, i) in history.slice(0, 5)" :key="i"
        :class="['flex items-center gap-3 px-4 py-3.5', i < Math.min(4, history.length - 1) ? 'border-b border-slate-100 dark:border-zinc-800/60' : '']">
        <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[18px]">
          {{ h.verdict === 'BUY' ? '✅' : '🚫' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-bold text-slate-800 dark:text-zinc-100 truncate">{{ h.item }}</p>
          <p class="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{{ h.price ? sym + parseFloat(h.price).toLocaleString() : 'No price' }} · {{ h.isAI ? 'AI' : 'Random' }}</p>
        </div>
        <span :class="['text-[12px] font-black', h.verdict === 'BUY' ? 'text-emerald-500' : 'text-rose-500']">{{ h.verdict }}</span>
      </div>
    </div>

    <div class="h-4"></div>
  </div>

  <!-- ── Result overlay (full-screen, dismissable) ── -->
  <Teleport to="body">
    <Transition name="result-overlay">
      <div v-if="result"
        class="fixed inset-0 z-[300] flex flex-col items-end justify-end"
        style="background:rgba(0,0,0,0.6);backdrop-filter:blur(12px)"
        @click.self="dismissResult">

        <div class="w-full max-w-[430px] mx-auto rounded-t-[28px] overflow-hidden shadow-2xl"
          :style="{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }">

          <!-- Verdict banner -->
          <div class="px-6 pt-8 pb-5 flex flex-col items-center text-center"
            :style="result.verdict === 'BUY'
              ? 'background:linear-gradient(135deg,#064e3b,#065f46)'
              : 'background:linear-gradient(135deg,#450a0a,#7f1d1d)'">

            <div class="text-[56px] mb-3 verdict-bounce">{{ result.verdict === 'BUY' ? '✅' : '🚫' }}</div>

            <p class="text-[11px] font-bold uppercase tracking-[0.25em] mb-1"
              :class="result.verdict === 'BUY' ? 'text-emerald-300/60' : 'text-rose-300/60'">
              {{ result.isAI ? 'Orb AI says' : 'The coin says' }}
            </p>
            <p class="text-[38px] font-black leading-none tracking-tight"
              :class="result.verdict === 'BUY' ? 'text-emerald-300' : 'text-rose-300'">
              {{ result.verdict === 'BUY' ? 'GO FOR IT' : 'SKIP IT' }}
            </p>

            <p v-if="form.item" class="text-[14px] mt-2 font-semibold"
              :class="result.verdict === 'BUY' ? 'text-emerald-400/70' : 'text-rose-400/70'">
              {{ form.item }}
              <span v-if="form.priceRaw"> · {{ sym }}{{ parseFloat(form.priceRaw).toLocaleString() }}</span>
            </p>
          </div>

          <!-- Reasoning -->
          <div class="bg-zinc-950 px-5 py-4">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                :style="{ background: accent + '20', border: `1px solid ${accent}40` }">
                <component :is="result.isAI ? Sparkles : Dice5" :size="14" :style="{ color: accent }" :stroke-width="2" />
              </div>
              <div>
                <p class="text-[12px] font-bold uppercase tracking-widest mb-1.5" :style="{ color: accent + 'BB' }">
                  {{ result.isAI ? 'AI Reasoning' : 'Random Note' }}
                </p>
                <p class="text-[13px] text-zinc-300 leading-relaxed font-medium">{{ result.reasoning }}</p>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="bg-zinc-900 px-5 py-3.5 flex gap-2">
            <button @click="decide"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold bg-zinc-800 text-zinc-300 active:bg-zinc-700 transition-colors">
              <RotateCcw :size="14" :stroke-width="2" /> Try Again
            </button>
            <button @click="reset"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold text-white active:opacity-80 transition-colors"
              :style="{ background: accent }">
              <Plus :size="14" :stroke-width="2" /> New Item
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ChevronLeft, Info, Sparkles, Dice5, Loader2, RotateCcw, X, Plus } from 'lucide-vue-next'
import { useNav } from '../composables/useNav'
import { settings, totalBalance, totalIncome, totalExpenses, spendingByCategory } from '../composables/useStore'
import { useNativeLLM } from '../composables/useNativeLLM'

const { navigate } = useNav()
const accent = computed(() => settings.value.accentColor)
const sym    = computed(() => settings.value.currencySymbol)

// Native AI (primary) — cloud API is the fallback
const { isReady: aiIsReady, isLoading: aiIsLoading, generate: nativeGenerate } = useNativeLLM()

// ── Form ──────────────────────────────────────────────────
const form = reactive({
  item: '', priceRaw: '', reason: '', category: 'Want',
  useAI: false,
})

const categories = ['Want', 'Need', 'Investment', 'Gift', 'Subscription', 'Luxury']
const canDecide  = computed(() => form.item.trim().length > 0)

// ── Price formatting ───────────────────────────────────────
const priceDisplay = computed(() => {
  const raw = form.priceRaw
  if (!raw) return ''
  const parts = raw.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
})

function onPriceInput(e: Event) {
  const el = e.target as HTMLInputElement
  let cleaned = el.value.replace(/[^0-9.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1)
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  form.priceRaw = cleaned
  el.value = priceDisplay.value
}

function onPriceKeydown(e: KeyboardEvent) {
  if ([8,9,27,37,38,39,40,46,35,36].includes(e.keyCode)) return
  if (e.ctrlKey || e.metaKey) return
  if (!/[0-9.]/.test(e.key)) e.preventDefault()
}

// ── Result ────────────────────────────────────────────────
interface DecisionResult {
  verdict: 'BUY' | 'SKIP'
  reasoning: string
  isAI: boolean
}
const result     = ref<DecisionResult | null>(null)
const isThinking = ref(false)

interface HistoryItem { item: string; price: string; verdict: 'BUY' | 'SKIP'; isAI: boolean }
const history = ref<HistoryItem[]>([])

const randomBuyMessages = [
  "The coin has spoken — treat yourself! Life's too short to always say no.",
  "The fates have aligned. Go get it before you talk yourself out of it.",
  "Random verdict: BUY. Congratulations, you're allowed to be happy.",
  "The dice gods are generous today. Add to cart.",
  "Pure chance says yes. Who are we to argue with the universe?",
]
const randomSkipMessages = [
  "The coin has spoken — put your wallet away. Future you says thanks.",
  "Random verdict: SKIP. Your bank account will thank you later.",
  "The fates decree: not today. Come back when the coin is kinder.",
  "Pure chance says no. A sign from the financial universe.",
  "The dice gods are saving you from yourself. Appreciate it.",
]

function getRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

async function decide() {
  if (!canDecide.value || isThinking.value) return
  isThinking.value = true
  result.value = null

  if (!form.useAI) {
    await new Promise(r => setTimeout(r, 800))
    const verdict = Math.random() > 0.5 ? 'BUY' : 'SKIP'
    result.value = {
      verdict,
      reasoning: verdict === 'BUY' ? getRandom(randomBuyMessages) : getRandom(randomSkipMessages),
      isAI: false,
    }
    pushHistory(verdict, false)
    isThinking.value = false
    return
  }

  const bal   = totalBalance.value
  const inc   = totalIncome.value
  const exp   = totalExpenses.value
  const top   = spendingByCategory.value.slice(0,3).map(c => c.category + ' (' + sym.value + c.total.toLocaleString() + ')').join(', ')
  const price = parseFloat(form.priceRaw) || 0
  const pctOfBalance = bal > 0 ? ((price / bal) * 100).toFixed(1) : 'N/A'

  const systemPrompt = `You are a concise personal finance advisor. Respond with EXACTLY this JSON (no other text):
{"verdict":"BUY","reasoning":"2-3 sentence explanation"}
or
{"verdict":"SKIP","reasoning":"2-3 sentence explanation"}`

  const userMsg = `User finances: Balance ${sym.value}${bal.toLocaleString()}, Income ${sym.value}${inc.toLocaleString()}/mo, Expenses ${sym.value}${exp.toLocaleString()}/mo, Top spending: ${top || 'none'}.
Purchase: ${form.item} — ${sym.value}${price.toLocaleString()} (${pctOfBalance}% of balance), Category: ${form.category}, Reason: ${form.reason || 'not specified'}.
Be warm but honest. Base verdict on financial health, price vs income/balance, and category (Want vs Need).`

  const parseReply = (text: string): { verdict: 'BUY'|'SKIP'; reasoning: string } => {
    const cleaned = text.replace(/\`\`\`json|\`\`\`/g, '').trim()
    // Try JSON first
    try { return JSON.parse(cleaned) } catch {}
    // Fallback: extract verdict from text
    const isBuy = /\bBUY\b/i.test(text)
    return {
      verdict: isBuy ? 'BUY' : 'SKIP',
      reasoning: text.replace(/\{.*?\}/s, '').trim().slice(0, 200) || (isBuy ? 'The finances support this purchase.' : 'Better to hold off for now.'),
    }
  }

  try {
    // ── Try native AI first ──────────────────────────────
    if (aiIsReady.value) {
      let reply = ''
      await nativeGenerate(systemPrompt, userMsg, [], (t: string) => { reply += t })
      const parsed = parseReply(reply)
      result.value = { verdict: parsed.verdict, reasoning: parsed.reasoning, isAI: true }
      pushHistory(parsed.verdict, true)
      return
    }

    // ── Fallback to Anthropic cloud API ─────────────────
    const fullPrompt = systemPrompt + '\n\n' + userMsg
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: fullPrompt }],
      }),
    })
    if (!response.ok) throw new Error('API error')
    const data = await response.json()
    const text = data.content?.find((b: any) => b.type === 'text')?.text ?? ''
    const parsed = parseReply(text)
    result.value = { verdict: parsed.verdict, reasoning: parsed.reasoning, isAI: true }
    pushHistory(parsed.verdict, true)

  } catch {
    const verdict = Math.random() > 0.5 ? 'BUY' : 'SKIP'
    result.value = {
      verdict,
      reasoning: verdict === 'BUY'
        ? "Couldn't reach AI, so the coin decided — and it says go for it! Double-check your budget first."
        : "Couldn't reach AI, so the coin decided — and it says wait. Probably wise to think it over anyway.",
      isAI: false,
    }
    pushHistory(verdict, false)
  } finally {
    isThinking.value = false
  }
}

function pushHistory(verdict: 'BUY' | 'SKIP', isAI: boolean) {
  history.value.unshift({ item: form.item, price: form.priceRaw, verdict, isAI })
  if (history.value.length > 20) history.value.length = 20
}

function dismissResult() {
  result.value = null
}

function reset() {
  form.item = ''
  form.priceRaw = ''
  form.reason = ''
  form.category = 'Want'
  result.value = null
}
</script>

<style scoped>
.result-overlay-enter-active { transition: opacity .3s ease; }
.result-overlay-leave-active { transition: opacity .28s ease; }
.result-overlay-enter-from,
.result-overlay-leave-to     { opacity: 0; }
.result-overlay-enter-active > div,
.result-overlay-leave-active > div { transition: transform .38s cubic-bezier(0.32, 1.1, 0.64, 1); }
.result-overlay-enter-from > div  { transform: translateY(100%); }
.result-overlay-leave-to > div    { transform: translateY(100%); }

@keyframes verdict-bounce { 0%,100%{transform:scale(1) rotate(-3deg)} 50%{transform:scale(1.15) rotate(3deg)} }
.verdict-bounce { animation: verdict-bounce 0.6s ease-in-out; }
</style>