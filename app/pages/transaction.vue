<template>
  <div class="bg-slate-100 dark:bg-zinc-950 pb-28" style="touch-action:pan-y;">

    <!-- Header with back button -->
    <div class="flex items-center gap-3 px-5 pt-6 pb-4">
      <button @click="navigate('more')"
        class="w-9 h-9 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0">
        <ChevronLeft :size="18" class="text-slate-600 dark:text-zinc-300" :stroke-width="2.5" />
      </button>
      <h2 class="flex-1 text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">History</h2>
      <button @click="quickAddOpen = true"
        class="flex items-center gap-1.5 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[13px] font-bold px-4 py-2.5 rounded-full active:scale-95 transition-transform shadow-sm flex-shrink-0">
        <Plus :size="14" :stroke-width="2.5" /> Add
      </button>
    </div>

    <!-- Summary chips -->
    <div class="flex gap-3 px-4 mb-3">
      <div class="flex-1 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm px-4 py-3">
        <p class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Income</p>
        <p class="text-[16px] font-black text-emerald-500 mt-0.5">+{{ sym }}{{ fmt(totalIncome) }}</p>
      </div>
      <div class="flex-1 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm px-4 py-3">
        <p class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wide">Expenses</p>
        <p class="text-[16px] font-black text-rose-500 mt-0.5">−{{ sym }}{{ fmt(totalExpenses) }}</p>
      </div>
    </div>

    <!-- Search -->
    <div class="mx-4 mb-3 flex items-center gap-2.5 bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl px-4 py-3 shadow-sm">
      <Search :size="16" class="text-slate-400 dark:text-zinc-600 flex-shrink-0" :stroke-width="2" />
      <input v-model="search" placeholder="Search transactions…"
        class="flex-1 bg-transparent text-[14px] font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none" />
      <button v-if="search" @click="search = ''" class="text-slate-400 dark:text-zinc-600 active:opacity-60">
        <X :size="15" :stroke-width="2.5" />
      </button>
    </div>

    <!-- Filter chips -->
    <div class="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-3">
      <button v-for="f in filters" :key="f.val" @click="filter = f.val"
        :class="['flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-all',
          filter === f.val
            ? 'bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-500/25'
            : 'bg-white/70 dark:bg-zinc-900/60 backdrop-blur border-slate-200/60 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400']">
        {{ f.label }}
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="grouped.length === 0" class="flex flex-col items-center gap-3 pt-16 px-8 text-center">
      <div class="w-14 h-14 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-center">
        <Search :size="22" class="text-slate-300 dark:text-zinc-700" :stroke-width="1.5" />
      </div>
      <p class="text-[14px] font-bold text-slate-400 dark:text-zinc-600">
        {{ recentTx.length === 0 ? 'No transactions yet' : 'No results found' }}
      </p>
      <p v-if="recentTx.length === 0" class="text-[12px] text-slate-400 dark:text-zinc-600">Tap Add to log one</p>
    </div>

    <!-- Grouped list -->
    <div v-for="grp in grouped" :key="grp.date" class="mb-3">
      <div class="flex items-center justify-between px-5 pb-2 pt-1">
        <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">{{ grp.date }}</p>
        <p :class="['text-[11px] font-bold', grp.dayNet >= 0 ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-600']">
          {{ grp.dayNet >= 0 ? '+' : '−' }}{{ sym }}{{ fmt(Math.abs(grp.dayNet)) }}
        </p>
      </div>
      <div class="mx-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
        <div v-for="(tx, i) in grp.items" :key="tx.id"
          :class="['flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-slate-50 dark:active:bg-zinc-800',
            i < grp.items.length - 1 ? 'border-b border-slate-100 dark:border-zinc-800/60' : '']">
          <div class="w-11 h-11 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center flex-shrink-0">
            <component :is="tx.icon" :size="19" class="text-violet-500" :stroke-width="1.8" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100 truncate">{{ tx.name }}</p>
            <p class="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">{{ tx.category }}</p>
          </div>
          <span :class="['text-[14px] font-bold flex-shrink-0 mr-1', tx.amount > 0 ? 'text-emerald-500' : 'text-slate-700 dark:text-zinc-300']">
            {{ tx.amount > 0 ? '+' : '−' }}{{ sym }}{{ fmt(Math.abs(tx.amount)) }}
          </span>
          <button @click.stop="confirmDelete(tx)"
            class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 active:bg-rose-50 dark:active:bg-rose-950/40 active:scale-90 transition-all">
            <Trash2 :size="14" class="text-slate-400 dark:text-zinc-500" :stroke-width="2" />
          </button>
        </div>
      </div>
    </div>

    <div class="h-4"></div>
  </div>

  <!-- Delete Confirmation -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="deleteTarget"
        class="fixed inset-0 z-[300] flex items-end justify-center"
        style="background:rgba(0,0,0,0.55);backdrop-filter:blur(12px)"
        @click.self="deleteTarget = null">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800 pb-10 px-5 pt-5">
          <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mx-auto mb-5"></div>
          <div class="flex items-center gap-3 mb-5 px-1">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0">
              <Trash2 :size="20" class="text-rose-500" :stroke-width="1.8" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[15px] font-black text-slate-900 dark:text-zinc-50 truncate">{{ deleteTarget?.name }}</p>
              <p :class="['text-[13px] font-bold', (deleteTarget?.amount ?? 0) > 0 ? 'text-emerald-500' : 'text-rose-500']">
                {{ (deleteTarget?.amount ?? 0) > 0 ? '+' : '−' }}{{ sym }}{{ fmt(Math.abs(deleteTarget?.amount ?? 0)) }}
                <span class="text-slate-400 dark:text-zinc-500 font-medium"> · {{ deleteTarget?.category }}</span>
              </p>
            </div>
          </div>
          <p class="text-[13px] text-slate-500 dark:text-zinc-400 text-center mb-6 leading-relaxed">
            This transaction will be permanently deleted and your balance will be updated.
          </p>
          <button @click="doDelete"
            class="w-full py-4 rounded-2xl bg-rose-500 text-white text-[16px] font-black active:scale-[0.98] shadow-lg shadow-rose-500/30 mb-3">
            Delete Transaction
          </button>
          <button @click="deleteTarget = null"
            class="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[15px] font-bold active:scale-[0.98]">
            Cancel
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Search, X, ChevronLeft, Trash2 } from 'lucide-vue-next'
import { recentTx, transactions, quickAddOpen, totalIncome, totalExpenses, settings, TXNS_KEY, orbLog } from '../composables/useStore'
import { useNav } from '../composables/useNav'

const { navigate } = useNav()
const sym = computed(() => settings.value.currencySymbol)

function fmt(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (abs / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  return abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const search = ref('')
const filter = ref('all')
const filters = [
  { val:'all',     label:'All'     },
  { val:'income',  label:'Income'  },
  { val:'expense', label:'Expense' },
]

const filtered = computed(() =>
  recentTx.value.filter(t => {
    if (filter.value === 'income'  && t.amount <= 0) return false
    if (filter.value === 'expense' && t.amount >= 0) return false
    if (search.value && !t.name.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  })
)

const grouped = computed(() => {
  const map: Record<string, typeof recentTx.value> = {}
  filtered.value.forEach(t => {
    if (!map[t.date]) map[t.date] = []
    map[t.date].push(t)
  })
  return Object.entries(map).map(([date, items]) => ({
    date, items,
    dayNet: items.reduce((s, t) => s + t.amount, 0),
  }))
})

type TxItem = typeof recentTx.value[0]
const deleteTarget = ref<TxItem | null>(null)

function confirmDelete(tx: TxItem) { deleteTarget.value = tx }

function doDelete() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  transactions.value = transactions.value.filter(t => t.id !== id)
  try { localStorage.setItem(TXNS_KEY, JSON.stringify(transactions.value)) } catch {}
  orbLog(`TX deleted: ${deleteTarget.value.name}`)
  deleteTarget.value = null
}
</script>

<style scoped>
.fade-enter-active,.fade-leave-active{transition:opacity .25s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
</style>