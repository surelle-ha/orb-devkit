<template>
  <div class="bg-slate-100 dark:bg-zinc-950 pb-28" style="touch-action:pan-y;">

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMsg"
        class="fixed left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl"
        :style="{ top:'calc(16px + env(safe-area-inset-top))', background: toastType==='success'?`linear-gradient(135deg,${accent}cc,${accent}ee)`:'#dc2626', maxWidth:'360px', width:'calc(100vw - 32px)' }"
      >
        <div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Check v-if="toastType==='success'" :size="13" color="white" :stroke-width="3" />
          <X     v-else                       :size="13" color="white" :stroke-width="3" />
        </div>
        <p class="text-white text-[13px] font-bold flex-1">{{ toastMsg }}</p>
      </div>
    </Transition>

    <!-- Header -->
    <div class="flex items-center justify-between px-5 pt-6 pb-4">
      <h2 class="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Accounts</h2>
      <button @click="showAddSheet = true"
        class="flex items-center gap-1.5 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[13px] font-bold px-4 py-2.5 rounded-full active:scale-95 transition-transform shadow-sm">
        <Plus :size="14" :stroke-width="2.5" /> Add Account
      </button>
    </div>

    <!-- Account type filter chips -->
    <div class="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-3">
      <button v-for="f in typeFilters" :key="f.val"
        @click="activeFilter = f.val"
        :class="['flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all',
          activeFilter === f.val
            ? 'bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-500/25'
            : 'bg-white/70 dark:bg-zinc-900/60 backdrop-blur border-slate-200/60 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400']">
        <component :is="f.icon" :size="11" :stroke-width="2.5" />
        {{ f.label }}
      </button>
    </div>

    <!-- Net worth summary bar -->
    <div v-if="accounts.length > 0"
      class="mx-4 mb-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm px-4 py-3 flex items-center justify-between">
      <div>
        <p class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Net Worth</p>
        <p :class="['text-[22px] font-black tracking-tight mt-0.5', netWorth >= 0 ? 'text-slate-900 dark:text-zinc-50' : 'text-rose-500']">
          {{ sym }}{{ formatAmount(Math.abs(netWorth)) }}
        </p>
      </div>
      <div class="text-right">
        <p class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{{ filteredAccounts.length }} accounts</p>
        <div class="flex gap-2 mt-1 justify-end">
          <span class="text-[11px] font-bold text-emerald-500">↑ {{ sym }}{{ formatAmount(totalAssets) }} in</span>
          <span class="text-[11px] font-bold text-rose-400">↓ {{ sym }}{{ formatAmount(totalLiabilities) }} out</span>
        </div>
      </div>
    </div>

    <!-- Account list -->
    <div v-if="filteredAccounts.length === 0"
      class="mx-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 flex flex-col items-center justify-center gap-3 py-12">
      <div class="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
        <Wallet :size="22" class="text-violet-400" :stroke-width="1.5" />
      </div>
      <div class="text-center">
        <p class="text-[14px] font-bold text-slate-500 dark:text-zinc-500">No accounts yet</p>
        <p class="text-[12px] text-slate-400 dark:text-zinc-600 mt-0.5">Tap Add Account to get started</p>
      </div>
    </div>

    <!-- Grouped by category -->
    <div v-for="group in groupedAccounts" :key="group.type" class="mb-2">
      <div class="flex items-center gap-2 px-5 pb-2">
        <component :is="accountTypeMeta(group.type).icon" :size="13" class="text-violet-500" :stroke-width="2.5" />
        <h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{{ accountTypeMeta(group.type).label }}</h3>
      </div>
      <div class="mx-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
        <div v-for="(acc, i) in group.items" :key="acc.id"
          @click="selectAccount(acc)"
          :class="['flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-slate-50 dark:active:bg-zinc-800/80 transition-colors',
            i < group.items.length - 1 ? 'border-b border-slate-100 dark:border-zinc-800/60' : '']">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            :style="{ background: acc.gradient }">
            <component :is="accountTypeMeta(acc.type).icon" :size="18" color="rgba(255,255,255,0.85)" :stroke-width="2" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100 truncate">{{ acc.name }}</p>
            <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
              {{ acc.institution }}
              <span v-if="acc.lastFour" class="font-mono"> ···{{ acc.lastFour }}</span>
            </p>
          </div>
          <div class="text-right flex-shrink-0">
            <p :class="['text-[15px] font-black', balanceColor(acc)]">
              {{ sym }}{{ formatAmount(displayBalance(acc)) }}
            </p>
            <p v-if="acc.type === 'credit'" class="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
              {{ sym }}{{ formatAmount((acc.limit ?? 0) - (acc.outstanding ?? 0)) }} avail
            </p>
            <p v-else class="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 capitalize">{{ acc.type }}</p>
          </div>
          <ChevronRight :size="15" class="text-slate-300 dark:text-zinc-700 flex-shrink-0 ml-1" :stroke-width="2" />
        </div>
      </div>
    </div>

    <div class="h-4"></div>
  </div>

  <!-- ── Add Account Sheet ── -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showAddSheet"
        class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px)"
        @click.self="showAddSheet = false">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-3 px-5 pt-4 max-h-[90vh] overflow-y-auto pb-2">

            <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mb-1"></div>
            <h3 class="text-[18px] font-black text-center text-slate-900 dark:text-zinc-50">Add Account</h3>

            <!-- Account type selector -->
            <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-1">Account Type</p>
            <div class="grid grid-cols-2 gap-2">
              <button v-for="t in accountTypes" :key="t.val"
                @click="newAcc.type = t.val"
                :class="['flex items-center gap-3 p-3 rounded-2xl border-2 transition-all active:scale-[0.98]',
                  newAcc.type === t.val
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
                    : 'border-transparent bg-slate-50 dark:bg-zinc-800']">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  :style="{ background: t.gradient }">
                  <component :is="t.icon" :size="16" color="white" :stroke-width="2" />
                </div>
                <div class="text-left">
                  <p :class="['text-[12px] font-black', newAcc.type===t.val?'text-violet-600 dark:text-violet-300':'text-slate-700 dark:text-zinc-300']">{{ t.label }}</p>
                  <p class="text-[9px] text-slate-400 dark:text-zinc-500">{{ t.sub }}</p>
                </div>
              </button>
            </div>

            <!-- Name -->
            <input v-model="newAcc.name" placeholder="Account name (e.g. BDO Savings)"
              class="w-full bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 border-2 border-transparent focus:border-violet-500 outline-none transition-colors" />

            <!-- Institution -->
            <input v-model="newAcc.institution" placeholder="Bank / Broker / Institution"
              class="w-full bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 border-2 border-transparent focus:border-violet-500 outline-none transition-colors" />

            <!-- Last 4 + network (cards only) -->
            <div v-if="['credit','debit','prepaid','atm'].includes(newAcc.type)" class="flex gap-2">
              <input v-model="newAcc.lastFour" placeholder="Last 4" maxlength="4" inputmode="numeric"
                class="w-24 bg-slate-50 dark:bg-zinc-800 rounded-2xl px-3 py-3.5 text-[14px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 border-2 border-transparent focus:border-violet-500 outline-none transition-colors text-center" />
              <div class="flex flex-1 bg-slate-100 dark:bg-zinc-800 rounded-2xl p-1 gap-0.5">
                <button v-for="n in ['VISA','MC','JCB','Amex']" :key="n"
                  @click="newAcc.network = n"
                  :class="['flex-1 py-2 rounded-xl text-[11px] font-bold transition-all',
                    newAcc.network===n?'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-50 shadow-sm':'text-slate-400 dark:text-zinc-600']">
                  {{ n }}
                </button>
              </div>
            </div>

            <!-- Balance / limit field -->
            <div class="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 border-2 border-transparent focus-within:border-violet-500 transition-colors">
              <span class="text-[20px] font-black text-violet-500">{{ sym }}</span>
              <input v-model="newAcc.initialBalance" type="number"
                :placeholder="newAcc.type === 'credit' ? 'Credit limit' : 'Current balance'"
                class="flex-1 bg-transparent text-[20px] font-black text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-700 outline-none" />
            </div>

            <!-- Note about balance adding to total -->
            <p v-if="!['credit','loan'].includes(newAcc.type) && parseFloat(newAcc.initialBalance) > 0"
              class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-3 py-2 border border-emerald-200 dark:border-emerald-800/40">
              ✓ {{ sym }}{{ parseFloat(newAcc.initialBalance).toLocaleString() }} will be added to your total balance as an income transaction
            </p>

            <!-- Due date (credit only) -->
            <input v-if="newAcc.type === 'credit'" v-model="newAcc.due" placeholder="Due date (e.g. 5th of month)"
              class="w-full bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 text-[14px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 border-2 border-transparent focus:border-violet-500 outline-none transition-colors" />

            <!-- Color picker -->
            <div>
              <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-1">Color</p>
              <div class="flex gap-2 flex-wrap">
                <button v-for="(g, idx) in gradients" :key="idx"
                  @click="newAcc.gradientIdx = idx"
                  :class="['w-9 h-9 rounded-xl transition-all active:scale-95', newAcc.gradientIdx===idx?'ring-2 ring-offset-2 ring-violet-500 scale-110':'']"
                  :style="{ background: g }" />
              </div>
            </div>

            <!-- NFC toggle (card types) -->
            <button v-if="['credit','debit','prepaid','atm'].includes(newAcc.type)"
              @click="newAcc.nfcEnabled = !newAcc.nfcEnabled"
              :class="['flex items-center gap-3 p-4 rounded-2xl border-2 transition-all',
                newAcc.nfcEnabled?'bg-violet-500/10 border-violet-500':'bg-slate-50 dark:bg-zinc-800 border-transparent']">
              <div :class="['w-9 h-9 rounded-xl flex items-center justify-center',
                newAcc.nfcEnabled?'bg-violet-500':'bg-slate-200 dark:bg-zinc-700']">
                <Wifi :size="16" :color="newAcc.nfcEnabled?'white':'#94a3b8'" :stroke-width="2" style="transform:rotate(90deg)" />
              </div>
              <div class="flex-1 text-left">
                <p :class="['text-[13px] font-bold', newAcc.nfcEnabled?'text-violet-600 dark:text-violet-400':'text-slate-700 dark:text-zinc-300']">Enable NFC / Tap to Pay</p>
              </div>
              <div :class="['w-11 h-6 rounded-full transition-all relative', newAcc.nfcEnabled?'bg-violet-500':'bg-slate-200 dark:bg-zinc-700']">
                <div :class="['absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all', newAcc.nfcEnabled?'left-5':'left-0.5']"></div>
              </div>
            </button>

            <button @click="submitAdd" :disabled="!canSubmit"
              :class="['w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] transition-all mb-2',
                canSubmit?'bg-violet-500 text-white shadow-lg shadow-violet-500/30':'bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600']">
              Add Account
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Account Detail Overlay ── -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="selectedAcc"
        class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.5);backdrop-filter:blur(10px)"
        @click.self="selectedAcc = null">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[32px] border-t border-slate-200/60 dark:border-zinc-800 overflow-hidden"
          :style="{ paddingBottom:'calc(28px + env(safe-area-inset-bottom))' }">

          <!-- Gradient header -->
          <div class="px-5 pt-5 pb-4 flex items-center gap-4" :style="{ background: selectedAcc.gradient }">
            <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <component :is="accountTypeMeta(selectedAcc.type).icon" :size="22" color="white" :stroke-width="2" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-bold text-white/50 uppercase tracking-widest">{{ accountTypeMeta(selectedAcc.type).label }}</p>
              <p class="text-[20px] font-black text-white leading-tight truncate">{{ selectedAcc.name }}</p>
              <p class="text-[12px] text-white/60 mt-0.5">{{ selectedAcc.institution }}<span v-if="selectedAcc.lastFour" class="font-mono"> ···{{ selectedAcc.lastFour }}</span></p>
            </div>
            <button @click="selectedAcc = null"
              class="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0">
              <X :size="15" color="white" :stroke-width="2.5" />
            </button>
          </div>

          <div class="px-5 pt-4 flex flex-col gap-4 max-h-[65vh] overflow-y-auto" style="-webkit-overflow-scrolling:touch;">

            <!-- Balance / limit row -->
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-slate-50 dark:bg-zinc-800 px-4 py-3.5">
                <p class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                  {{ selectedAcc.type === 'credit' ? 'Outstanding' : selectedAcc.type === 'loan' ? 'Remaining' : 'Balance' }}
                </p>
                <p :class="['text-[20px] font-black leading-none', displayBalance(selectedAcc) < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-zinc-50']">
                  {{ sym }}{{ formatAmount(Math.abs(displayBalance(selectedAcc))) }}
                </p>
              </div>
              <div v-if="selectedAcc.type === 'credit'" class="rounded-2xl bg-slate-50 dark:bg-zinc-800 px-4 py-3.5">
                <p class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Available</p>
                <p class="text-[20px] font-black leading-none text-emerald-500">
                  {{ sym }}{{ formatAmount((selectedAcc.limit ?? 0) - (selectedAcc.outstanding ?? 0)) }}
                </p>
              </div>
              <div v-else-if="selectedAcc.type === 'loan'" class="rounded-2xl bg-slate-50 dark:bg-zinc-800 px-4 py-3.5">
                <p class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Original</p>
                <p class="text-[20px] font-black leading-none text-slate-900 dark:text-zinc-50">
                  {{ sym }}{{ formatAmount(selectedAcc.principal ?? 0) }}
                </p>
              </div>
            </div>

            <!-- Credit utilization bar -->
            <div v-if="selectedAcc.type === 'credit'" class="rounded-2xl bg-slate-50 dark:bg-zinc-800 px-4 py-3.5">
              <div class="flex justify-between items-center mb-2">
                <p class="text-[12px] font-bold text-slate-500 dark:text-zinc-400">Credit Utilization</p>
                <p class="text-[15px] font-black"
                  :class="utilizationPct > 70 ? 'text-rose-500' : utilizationPct > 40 ? 'text-amber-500' : 'text-violet-500'">
                  {{ utilizationPct }}%
                </p>
              </div>
              <div class="h-2 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-2">
                <div :class="['h-full rounded-full transition-all duration-700',
                  utilizationPct > 70 ? 'bg-rose-500' : utilizationPct > 40 ? 'bg-amber-500' : 'bg-violet-500']"
                  :style="{ width: Math.min(100, utilizationPct) + '%' }"></div>
              </div>
              <p class="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">Due {{ selectedAcc.due ?? '—' }}</p>
            </div>

            <!-- Recent transactions -->
            <div>
              <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Recent Transactions</p>
              <div class="rounded-2xl overflow-hidden bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/60">
                <div v-if="accountTxns.length === 0" class="py-8 text-center">
                  <p class="text-[13px] font-bold text-slate-400 dark:text-zinc-600">No transactions yet</p>
                </div>
                <div v-for="(tx, i) in accountTxns.slice(0, 6)" :key="tx.id"
                  :class="['flex items-center gap-3 px-4 py-3',
                    i < Math.min(5, accountTxns.length - 1) ? 'border-b border-slate-100 dark:border-zinc-700/60' : '']">
                  <div class="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center flex-shrink-0">
                    <component :is="tx.icon" :size="16" class="text-violet-500" :stroke-width="1.8" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-bold text-slate-800 dark:text-zinc-100 truncate">{{ tx.name }}</p>
                    <p class="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{{ tx.category }} · {{ tx.date }}</p>
                  </div>
                  <span :class="['text-[13px] font-bold flex-shrink-0', tx.amount > 0 ? 'text-emerald-500' : 'text-slate-700 dark:text-zinc-300']">
                    {{ tx.amount > 0 ? '+' : '−' }}{{ sym }}{{ formatAmount(Math.abs(tx.amount)) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Remove account -->
            <button @click="selectedAcc = null; showDeleteConfirm = true"
              class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-[13px] font-bold active:scale-[0.98] transition-all border border-rose-100 dark:border-rose-900/40">
              <Trash2 :size="14" :stroke-width="2" /> Remove Account
            </button>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Delete Confirmation ── -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showDeleteConfirm"
        class="fixed inset-0 z-[300] flex items-end justify-center"
        style="background:rgba(0,0,0,0.6);backdrop-filter:blur(12px)"
        @click.self="showDeleteConfirm = false">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800 pb-10 px-5 pt-5">
          <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mx-auto mb-5"></div>
          <div v-if="selectedAcc" class="rounded-2xl p-4 mb-5 flex items-center gap-3" :style="{ background: selectedAcc.gradient }">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <component :is="accountTypeMeta(selectedAcc.type).icon" :size="18" color="white" :stroke-width="2" />
            </div>
            <div>
              <p class="text-[11px] font-semibold text-white/50 uppercase">{{ accountTypeMeta(selectedAcc.type).label }}</p>
              <p class="text-[17px] font-black text-white mt-0.5">{{ selectedAcc.name }}</p>
              <p class="text-[12px] text-white/60">{{ selectedAcc.institution }}</p>
            </div>
          </div>
          <p class="text-[16px] font-black text-slate-900 dark:text-zinc-50 text-center mb-1">Remove this account?</p>
          <p class="text-[13px] text-slate-400 dark:text-zinc-500 text-center mb-6 leading-snug">This only removes it from Orb. Your actual account is unaffected.</p>
          <button @click="confirmDelete" class="w-full py-4 rounded-2xl bg-rose-500 text-white text-[16px] font-black active:scale-[0.98] shadow-lg shadow-rose-500/30 mb-3">Yes, Remove</button>
          <button @click="showDeleteConfirm = false" class="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[15px] font-bold active:scale-[0.98]">Cancel</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import {
  Plus, Wifi, ChevronRight, Check, X, Trash2,
  CreditCard, Landmark, Wallet, PiggyBank,
  TrendingUp, Building2, Coins, Banknote,
} from 'lucide-vue-next'
import { recentTx, cardsVersion, settings, orbLog, addTx, totalBalance, totalIncome, totalExpenses } from '../composables/useStore'

const CARDS_KEY = 'orb_cards_v1'
const sym = computed(() => settings.value.currencySymbol)
const accent = computed(() => settings.value.accentColor)

interface Account {
  id:           number
  type:         'credit' | 'debit' | 'savings' | 'investment' | 'cash' | 'prepaid' | 'atm' | 'loan'
  name:         string
  institution:  string
  lastFour?:    string
  network?:     string
  gradient:     string
  nfcEnabled:   boolean
  limit?:       number
  outstanding?: number
  due?:         string
  balance?:     number
  spent?:       number
  principal?:   number
  remaining?:   number
}

const ACCOUNT_META: Record<string, { label: string; icon: any; gradient: string; sub: string }> = {
  credit:     { label:'Credit Card',   icon:CreditCard, gradient:'linear-gradient(135deg,#1e1b4b,#3730a3)', sub:'Revolving credit line'  },
  debit:      { label:'Debit Card',    icon:CreditCard, gradient:'linear-gradient(135deg,#0f2027,#203a43)', sub:'Linked to bank account' },
  savings:    { label:'Savings',       icon:PiggyBank,  gradient:'linear-gradient(135deg,#065f46,#059669)', sub:'High-yield or regular'   },
  investment: { label:'Investment',    icon:TrendingUp, gradient:'linear-gradient(135deg,#1c1917,#7c2d12)', sub:'Stocks, funds, crypto'  },
  cash:       { label:'Cash',          icon:Banknote,   gradient:'linear-gradient(135deg,#14532d,#16a34a)', sub:'Physical cash on hand'  },
  prepaid:    { label:'Prepaid',       icon:Wallet,     gradient:'linear-gradient(135deg,#4a044e,#86198f)', sub:'Loaded prepaid card'    },
  atm:        { label:'ATM / Passbook',icon:Landmark,   gradient:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', sub:'Traditional bank book'  },
  loan:       { label:'Loan / Debt',   icon:Building2,  gradient:'linear-gradient(135deg,#7f1d1d,#dc2626)', sub:'Track what you owe'     },
}

function accountTypeMeta(type: string) {
  return ACCOUNT_META[type] ?? ACCOUNT_META.debit
}

const accountTypes = Object.entries(ACCOUNT_META).map(([val, m]) => ({ val, ...m }))

const gradients = [
  'linear-gradient(135deg,#1e1b4b,#3730a3)', 'linear-gradient(135deg,#1a1a2e,#16213e)',
  'linear-gradient(135deg,#0f2027,#203a43)', 'linear-gradient(135deg,#065f46,#059669)',
  'linear-gradient(135deg,#7c2d12,#c2410c)', 'linear-gradient(135deg,#4a044e,#86198f)',
  'linear-gradient(135deg,#0c4a6e,#0284c7)', 'linear-gradient(135deg,#1c1917,#44403c)',
  'linear-gradient(135deg,#134e4a,#0891b2)', 'linear-gradient(135deg,#14532d,#16a34a)',
  'linear-gradient(135deg,#1e3a5f,#1d4ed8)', 'linear-gradient(135deg,#7f1d1d,#dc2626)',
]

function loadAccounts(): Account[] {
  try { const r = localStorage.getItem(CARDS_KEY); if (r) return JSON.parse(r) } catch {}
  return []
}
function saveAccounts(list: Account[]) {
  try { localStorage.setItem(CARDS_KEY, JSON.stringify(list)) } catch {}
}

const accounts = ref<Account[]>([])
onMounted(() => { accounts.value = loadAccounts() })
watch(cardsVersion, () => { accounts.value = loadAccounts() })

const typeFilters = [
  { val:'all',        label:'All',         icon:Wallet      },
  { val:'credit',     label:'Credit',      icon:CreditCard  },
  { val:'debit',      label:'Debit',       icon:Landmark    },
  { val:'savings',    label:'Savings',     icon:PiggyBank   },
  { val:'investment', label:'Investment',  icon:TrendingUp  },
  { val:'loan',       label:'Loans',       icon:Building2   },
]
const activeFilter = ref('all')

const filteredAccounts = computed(() =>
  activeFilter.value === 'all' ? accounts.value : accounts.value.filter(a => a.type === activeFilter.value)
)

const groupedAccounts = computed(() => {
  const map = new Map<string, Account[]>()
  for (const acc of filteredAccounts.value) {
    if (!map.has(acc.type)) map.set(acc.type, [])
    map.get(acc.type)!.push(acc)
  }
  return Array.from(map.entries()).map(([type, items]) => ({ type, items }))
})

// Compute per-account balance from the transaction store — not from the
// stored acc.balance field, which gets double-counted because the initial
// balance was recorded as a transaction AND written to acc.balance.
function accountBalance(accId: number): number {
  return recentTx.value
    .filter(t => t.accountId === accId)
    .reduce((s, t) => s + t.amount, 0)
}

function displayBalance(acc: Account): number {
  if (acc.type === 'credit') return -(acc.outstanding ?? 0)
  if (acc.type === 'loan')   return -(acc.remaining ?? acc.principal ?? 0)
  return accountBalance(acc.id)
}

function balanceColor(acc: Account): string {
  const b = displayBalance(acc)
  if (b < 0) return 'text-rose-500'
  if (acc.type === 'investment') return 'text-amber-500'
  return 'text-slate-800 dark:text-zinc-100'
}

// Net worth = transaction-based balance (same source as home page)
// Using totalBalance from store prevents double-counting since initial
// balances are already recorded as income transactions via addTx().
const netWorth      = computed(() => totalBalance.value)
const totalAssets   = computed(() => totalIncome.value)
const totalLiabilities = computed(() => totalExpenses.value)

const selectedAcc = ref<Account | null>(null)

function selectAccount(acc: Account) {
  selectedAcc.value = acc
}

const accountTxns = computed(() =>
  selectedAcc.value
    ? recentTx.value.filter(t => t.accountId === selectedAcc.value!.id)
    : []
)

const utilizationPct = computed(() => {
  if (!selectedAcc.value || selectedAcc.value.type !== 'credit') return 0
  const limit = selectedAcc.value.limit ?? 1
  return Math.round(((selectedAcc.value.outstanding ?? 0) / limit) * 100)
})

// ── Toast ──────────────────────────────────────────────────
const toastMsg  = ref('')
const toastType = ref<'success'|'error'>('success')
let   toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string, type: 'success'|'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toastMsg.value = msg; toastType.value = type
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 3000)
}

// ── Add account ────────────────────────────────────────────
const showAddSheet = ref(false)
const newAcc = reactive({
  type: 'debit' as Account['type'],
  name: '', institution: '', lastFour: '', network: 'VISA',
  initialBalance: '', due: '', nfcEnabled: false, gradientIdx: 0,
})

const canSubmit = computed(() => newAcc.name.trim().length > 0 && newAcc.institution.trim().length > 0)

function submitAdd() {
  if (!canSubmit.value) return

  const amount = parseFloat(newAcc.initialBalance) || 0
  const isAsset = !['credit', 'loan'].includes(newAcc.type)

  const acc: Account = {
    id:          Date.now(),
    type:        newAcc.type,
    name:        newAcc.name.trim(),
    institution: newAcc.institution.trim(),
    lastFour:    newAcc.lastFour || undefined,
    network:     newAcc.network || undefined,
    gradient:    gradients[newAcc.gradientIdx] ?? accountTypeMeta(newAcc.type).gradient,
    nfcEnabled:  newAcc.nfcEnabled,
    ...(newAcc.type === 'credit'
      ? { limit: amount, outstanding: 0, due: newAcc.due || '—' }
      : newAcc.type === 'loan'
      ? { principal: amount, remaining: amount }
      : { balance: amount, spent: 0 }),
  }

  // Save account
  const list = loadAccounts()
  list.push(acc)
  saveAccounts(list)

  // ── KEY FIX: Create income transaction for asset accounts with initial balance ──
  if (isAsset && amount > 0) {
    addTx({
      name:      `Initial balance — ${acc.name}`,
      amount:    amount,
      category:  'Income',
      accountId: acc.id,
    })
  }

  // Trigger reactivity reload
  cardsVersion.value++

  showAddSheet.value = false
  showToast(`${acc.name} added!`)
  orbLog(`Account added: ${acc.name} (${acc.type})${isAsset && amount > 0 ? ` +${sym.value}${amount.toLocaleString()} balance` : ''}`)

  // Reset form
  Object.assign(newAcc, {
    type:'debit', name:'', institution:'', lastFour:'', network:'VISA',
    initialBalance:'', due:'', nfcEnabled:false, gradientIdx:0,
  })
}

// ── Delete ─────────────────────────────────────────────────
const showDeleteConfirm = ref(false)

function confirmDelete() {
  if (!selectedAcc.value) return
  const name = selectedAcc.value.name
  const list = loadAccounts().filter(a => a.id !== selectedAcc.value!.id)
  saveAccounts(list)
  cardsVersion.value++
  selectedAcc.value = null
  showDeleteConfirm.value = false
  showToast(`${name} removed`, 'error')
  orbLog(`Account deleted: ${name}`)
}

function formatAmount(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (abs/1_000_000).toFixed(2).replace(/\.?0+$/,'') + 'M'
  return abs.toLocaleString('en-US', { minimumFractionDigits:0, maximumFractionDigits:2 })
}
</script>

<style scoped>
.sheet-enter-active,.sheet-leave-active{transition:opacity .28s ease;}
.sheet-enter-active>div,.sheet-leave-active>div{transition:transform .32s cubic-bezier(.32,1.1,.64,1);}
.sheet-enter-from,.sheet-leave-to{opacity:0;}
.sheet-enter-from>div,.sheet-leave-to>div{transform:translateY(100%);}
.fade-enter-active,.fade-leave-active{transition:opacity .25s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
.toast-enter-active{transition:all .35s cubic-bezier(0.34,1.1,0.64,1);}
.toast-leave-active{transition:all .25s ease;}
.toast-enter-from{opacity:0;transform:translate(-50%,-20px) scale(0.92);}
.toast-leave-to{opacity:0;transform:translate(-50%,-8px) scale(0.96);}
</style>