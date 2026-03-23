<template>
  <Transition name="sheet">
    <div
      v-if="quickAddOpen"
      class="fixed inset-0 z-[200] flex items-end justify-center"
      style="background:rgba(0,0,0,0.45);backdrop-filter:blur(8px)"
      @click.self="quickAddOpen = false"
    >
      <div
        class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800"
        :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))', ...sheetStyle }"
        @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd"
      >
        <div class="flex flex-col gap-4 px-5 pt-4">

          <!-- Handle -->
          <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mb-1 cursor-grab active:cursor-grabbing"></div>
          <h3 class="text-[18px] font-black text-center text-slate-900 dark:text-zinc-50">Add Transaction</h3>

          <!-- No accounts — prompt user -->
          <div v-if="savedCards.length === 0"
            class="flex flex-col items-center gap-3 py-6 px-2 text-center">
            <div class="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
              <CreditCard :size="24" class="text-violet-400" :stroke-width="1.5" />
            </div>
            <div>
              <p class="text-[15px] font-black text-slate-800 dark:text-zinc-100">No accounts yet</p>
              <p class="text-[12px] text-slate-400 dark:text-zinc-500 mt-1 leading-relaxed">
                Add an account first — go to <strong>More → Accounts</strong> to create one.
              </p>
            </div>
            <button @click="quickAddOpen = false; navigate('cards')"
              class="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-[13px] font-bold active:scale-95 transition-transform"
              :style="{ background: accent }">
              <Plus :size="14" :stroke-width="2.5" /> Add Account
            </button>
          </div>

          <template v-else>

            <!-- Expense / Income toggle -->
            <div class="flex bg-slate-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1">
              <button
                v-for="t in typeOptions" :key="t.val"
                @click="form.type = t.val"
                :class="['flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold transition-all',
                  form.type === t.val
                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-50 shadow-sm'
                    : 'text-slate-400 dark:text-zinc-600']"
              >
                <component :is="t.icon" :size="16" :stroke-width="2" />
                {{ t.label }}
              </button>
            </div>

            <!-- Amount -->
            <div class="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 border-2 border-transparent focus-within:border-violet-500 transition-colors">
              <span class="text-[26px] font-black" :style="{ color: accent }">{{ sym }}</span>
              <input
                :value="form.amountDisplay"
                @input="onAmountInput"
                @keydown="onAmountKeydown"
                inputmode="decimal"
                placeholder="0.00"
                class="flex-1 bg-transparent text-[32px] font-black text-slate-900 dark:text-zinc-50 placeholder:text-slate-200 dark:placeholder:text-zinc-700 outline-none tracking-tight"
              />
            </div>

            <!-- Description -->
            <input
              v-model="form.desc"
              placeholder="Description…"
              class="w-full bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 border-2 border-transparent focus:border-violet-500 outline-none transition-colors"
            />

            <!-- Account selector -->
            <div>
              <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-1">Account</p>
              <div class="relative">
                <!-- Selected / trigger -->
                <button @click="acctOpen = !acctOpen"
                  class="w-full flex items-center gap-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3 border-2 border-transparent transition-colors"
                  :style="acctOpen ? { borderColor: accent } : {}">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    :style="{ background: accent + '18' }">
                    <component :is="cardIcon(selectedCard?.type ?? '')" :size="16" :style="{ color: accent }" :stroke-width="2" />
                  </div>
                  <div class="flex-1 text-left min-w-0">
                    <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100 truncate">
                      {{ selectedCard?.name ?? 'Select account' }}
                    </p>
                  </div>
                  <!-- Balance of selected account -->
                  <span v-if="selectedCard" class="text-[13px] font-bold flex-shrink-0 mr-1"
                    :class="cardDisplayBalance(selectedCard) >= 0 ? 'text-emerald-500' : 'text-rose-400'">
                    {{ sym }}{{ Math.abs(cardDisplayBalance(selectedCard)).toLocaleString() }}
                  </span>
                  <ChevronDown :size="16"
                    :class="['text-slate-400 dark:text-zinc-500 transition-transform', acctOpen ? 'rotate-180' : '']"
                    :stroke-width="2" />
                </button>

                <!-- Dropdown panel -->
                <Transition name="dropdown">
                  <div v-if="acctOpen"
                    class="absolute left-0 right-0 top-full mt-1 z-[300] rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 shadow-xl">
                    <button
                      v-for="(card, i) in savedCards" :key="card.id"
                      @click="form.accountId = card.id; acctOpen = false"
                      :class="['w-full flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-slate-50 dark:active:bg-zinc-700',
                        i < savedCards.length - 1 ? 'border-b border-slate-100 dark:border-zinc-700/50' : '']"
                    >
                      <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        :style="{ background: form.accountId === card.id ? accent + '18' : '' }"
                        :class="form.accountId !== card.id ? 'bg-slate-100 dark:bg-zinc-700' : ''">
                        <component :is="cardIcon(card.type)" :size="15"
                          :style="form.accountId === card.id ? { color: accent } : {}"
                          :class="form.accountId !== card.id ? 'text-slate-400 dark:text-zinc-500' : ''"
                          :stroke-width="2" />
                      </div>
                      <span class="flex-1 text-left text-[14px] font-bold text-slate-800 dark:text-zinc-100 truncate">
                        {{ card.name }}
                      </span>
                      <!-- Balance beside account name -->
                      <span class="text-[12px] font-bold flex-shrink-0 mr-1"
                        :class="cardDisplayBalance(card) >= 0 ? 'text-emerald-500' : 'text-rose-400'">
                        {{ sym }}{{ Math.abs(cardDisplayBalance(card)).toLocaleString() }}
                      </span>
                      <div v-if="form.accountId === card.id"
                        class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        :style="{ background: accent }">
                        <Check :size="11" color="white" :stroke-width="3" />
                      </div>
                    </button>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- Category (only for expense) -->
            <div v-if="form.type === 'expense'">
              <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-1">Category</p>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="cat in allCategories" :key="cat.label"
                  @click="form.category = cat.label"
                  :class="['flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all',
                    form.category === cat.label
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
                      : 'border-transparent bg-slate-50 dark:bg-zinc-800']"
                >
                  <component :is="cat.icon" :size="22"
                    :class="form.category === cat.label ? 'text-violet-500' : 'text-slate-400 dark:text-zinc-600'"
                    :stroke-width="1.8" />
                  <span :class="['text-[10px] font-bold truncate w-full text-center',
                    form.category === cat.label ? 'text-violet-500' : 'text-slate-400 dark:text-zinc-600']">
                    {{ cat.label }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button
              @click="submit"
              :disabled="!canSubmit"
              :class="['w-full py-4 rounded-2xl text-[16px] font-black transition-all',
                canSubmit
                  ? 'text-white active:scale-[0.98] shadow-lg'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600']"
              :style="canSubmit ? { background: accent, boxShadow: '0 8px 24px ' + accent + '44' } : {}"
            >
              Add Transaction
            </button>

          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref, watch } from 'vue'
import {
  ArrowDownCircle, ArrowUpCircle,
  Utensils, ShoppingBag, Car, Zap, ShoppingCart,
  Gamepad2, MoreHorizontal, Banknote, CreditCard,
  PiggyBank, Landmark, TrendingUp, Check, ChevronDown,
  Plus, Tag,
} from 'lucide-vue-next'
import { quickAddOpen, addTx, cardsVersion, settings } from '../composables/useStore'
import { useNav }       from '../composables/useNav'
import { useSwipeDown } from '../composables/useSwipeDown'

const { navigate } = useNav()
const { sheetStyle, onTouchStart, onTouchMove, onTouchEnd } = useSwipeDown(() => { quickAddOpen.value = false })

const CARDS_KEY = 'orb_cards_v1'
const sym    = computed(() => settings.value.currencySymbol)
const accent = computed(() => settings.value.accentColor)

interface SavedCard {
  id:           number
  name:         string
  type:         string
  balance?:     number
  outstanding?: number
  remaining?:   number
  principal?:   number
}
const savedCards = ref<SavedCard[]>([])
const acctOpen   = ref(false)

function loadCards() {
  try {
    const raw = localStorage.getItem(CARDS_KEY)
    if (raw) {
      savedCards.value = JSON.parse(raw).map((c: any) => ({
        id:           c.id,
        name:         c.name || c.bank || 'Account',
        type:         c.type,
        balance:      c.balance,
        outstanding:  c.outstanding,
        remaining:    c.remaining,
        principal:    c.principal,
      }))
    } else {
      savedCards.value = []
    }
  } catch { savedCards.value = [] }
}

function cardDisplayBalance(card: SavedCard): number {
  if (card.type === 'credit')  return -(card.outstanding ?? 0)
  if (card.type === 'loan')    return -(card.remaining ?? card.principal ?? 0)
  return card.balance ?? 0
}

function cardIcon(type: string) {
  if (type === 'savings')    return PiggyBank
  if (type === 'investment') return TrendingUp
  if (type === 'atm')        return Landmark
  if (type === 'cash')       return Banknote
  return CreditCard
}

onMounted(loadCards)
watch(cardsVersion, loadCards)
watch(quickAddOpen, v => {
  if (v) {
    loadCards()
    acctOpen.value = false
    if (savedCards.value.length > 0 && form.accountId === null)
      form.accountId = savedCards.value[0].id
  }
})

const selectedCard = computed(() =>
  savedCards.value.find(c => c.id === form.accountId) ?? null
)

const typeOptions = [
  { val: 'expense', icon: ArrowDownCircle, label: 'Expense' },
  { val: 'income',  icon: ArrowUpCircle,   label: 'Income'  },
]

const BASE_CATEGORIES = [
  { icon: Utensils,       label: 'Food'      },
  { icon: ShoppingBag,    label: 'Groceries' },
  { icon: Car,            label: 'Transport' },
  { icon: Zap,            label: 'Utilities' },
  { icon: ShoppingCart,   label: 'Shopping'  },
  { icon: Gamepad2,       label: 'Leisure'   },
  { icon: MoreHorizontal, label: 'Other'     },
]

const allCategories = computed(() => {
  const custom = (settings.value.customCategories ?? []).map((label: string) => ({ icon: Tag, label }))
  return [...BASE_CATEGORIES, ...custom]
})

const form = reactive({
  type:          'expense',
  desc:          '',
  amountDisplay: '',
  amountRaw:     '',
  category:      'Food',
  accountId:     null as number | null,
})

function formatDisplay(raw: string): string {
  if (!raw) return ''
  const parts = raw.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

function onAmountInput(e: Event) {
  const el = e.target as HTMLInputElement
  let cleaned = el.value.replace(/[^0-9.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1)
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  if (cleaned.indexOf('.') !== -1 && cleaned.length - cleaned.indexOf('.') > 3)
    cleaned = cleaned.slice(0, cleaned.indexOf('.') + 3)
  form.amountRaw     = cleaned
  form.amountDisplay = formatDisplay(cleaned)
  el.value = form.amountDisplay
}

function onAmountKeydown(e: KeyboardEvent) {
  if ([8,9,27,37,38,39,40,46,35,36].includes(e.keyCode)) return
  if (e.ctrlKey || e.metaKey) return
  if (!/[0-9.]/.test(e.key)) e.preventDefault()
}

const canSubmit = computed(() =>
  form.desc.trim().length > 0 && form.amountRaw && parseFloat(form.amountRaw) > 0
)

function submit() {
  if (!canSubmit.value) return
  const amt = parseFloat(form.amountRaw)
  addTx({
    name:      form.desc.trim(),
    amount:    form.type === 'income' ? amt : -amt,
    category:  form.type === 'income' ? 'Income' : form.category,
    accountId: form.accountId,
  })
  Object.assign(form, { type:'expense', desc:'', amountDisplay:'', amountRaw:'', category:'Food', accountId: savedCards.value[0]?.id ?? null })
  quickAddOpen.value = false
}
</script>

<style>
.sheet-enter-active, .sheet-leave-active { transition: opacity .28s ease; }
.sheet-enter-active > div, .sheet-leave-active > div { transition: transform .32s cubic-bezier(.32,1.1,.64,1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from > div, .sheet-leave-to > div { transform: translateY(100%); }

.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s ease; overflow: hidden; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; max-height: 0; }
.dropdown-enter-to, .dropdown-leave-from { opacity: 1; max-height: 400px; }
</style>