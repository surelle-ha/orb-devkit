<template>
  <div class="bg-slate-100 dark:bg-zinc-950 pb-28" style="touch-action:pan-y;">

    <!-- Header -->
    <div class="flex items-center justify-between px-5 pt-6 pb-3">
      <div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Bills & Dues</h2>
        <p v-if="overdueBillsCount > 0" class="text-[11px] font-bold text-rose-500 mt-0.5">
          {{ overdueBillsCount }} overdue
        </p>
      </div>
      <button @click="showAdd = true"
        class="flex items-center gap-1.5 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[13px] font-bold px-4 py-2.5 rounded-full active:scale-95 transition-transform shadow-sm">
        <Plus :size="14" :stroke-width="2.5" /> Add Bill
      </button>
    </div>

    <!-- Summary bar -->
    <div class="mx-4 mb-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm px-4 py-3 flex items-center justify-between">
      <div>
        <p class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Total Due</p>
        <p class="text-[22px] font-black text-slate-900 dark:text-zinc-50 tracking-tight mt-0.5">
          {{ sym }}{{ totalBillsDue.toLocaleString() }}
        </p>
      </div>
      <div class="flex gap-3 text-right">
        <div>
          <p class="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Pending</p>
          <p class="text-[16px] font-black text-amber-500">{{ pendingCount }}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Overdue</p>
          <p class="text-[16px] font-black text-rose-500">{{ overdueBillsCount }}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Paid</p>
          <p class="text-[16px] font-black text-emerald-500">{{ paidCount }}</p>
        </div>
      </div>
    </div>

    <!-- Filter chips -->
    <div class="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-3">
      <button v-for="f in filters" :key="f.val"
        @click="activeFilter = f.val"
        :class="['flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all',
          activeFilter === f.val
            ? 'bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-500/25'
            : 'bg-white/70 dark:bg-zinc-900/60 backdrop-blur border-slate-200/60 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400']">
        {{ f.label }}
      </button>
    </div>

    <!-- Bills list -->
    <div v-if="filteredBills.length === 0"
      class="mx-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 flex flex-col items-center gap-3 py-12">
      <div class="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
        <Receipt :size="22" class="text-violet-400" :stroke-width="1.5" />
      </div>
      <p class="text-[14px] font-bold text-slate-400 dark:text-zinc-600">No bills here</p>
    </div>

    <div v-else class="mx-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <div v-for="(bill, i) in filteredBills" :key="bill.id">
        <!-- Main bill row -->
        <div
          :class="['flex items-center gap-3 px-4 py-3.5 transition-colors',
            i < filteredBills.length - 1 || expandedBill === bill.id ? 'border-b border-slate-100 dark:border-zinc-800/60' : '']">

          <!-- Icon -->
          <div :class="['w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
            bill.status === 'overdue' ? 'bg-rose-50 dark:bg-rose-950/40' :
            bill.status === 'paid'    ? 'bg-emerald-50 dark:bg-emerald-950/40' :
                                        'bg-violet-50 dark:bg-violet-950/40']">
            <component :is="billIcon(bill.icon)" :size="19"
              :class="bill.status === 'overdue' ? 'text-rose-500' : bill.status === 'paid' ? 'text-emerald-500' : 'text-violet-500'"
              :stroke-width="1.8" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">{{ bill.name }}</p>
              <span v-if="bill.recurring"
                class="flex-shrink-0 text-[9px] font-black text-violet-500 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                ↻ monthly
              </span>
            </div>
            <p class="text-[11px] font-medium mt-0.5"
              :class="bill.status === 'overdue' ? 'text-rose-400' : 'text-slate-400 dark:text-zinc-500'">
              {{ bill.status === 'overdue' ? '⚠ Overdue' : bill.status === 'paid' ? '✓ Paid' : `Due ${dayLabel(bill.dueDay)}` }}
            </p>
          </div>

          <!-- Amount -->
          <p class="text-[15px] font-black text-slate-800 dark:text-zinc-100 flex-shrink-0">
            {{ sym }}{{ bill.amount.toLocaleString() }}
          </p>

          <!-- Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Payment history toggle — only if history exists -->
            <button v-if="billPaymentHistory(bill.id).length > 0"
              @click="expandedBill = expandedBill === bill.id ? null : bill.id"
              class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center active:scale-90 transition-transform"
              :title="expandedBill === bill.id ? 'Hide history' : 'Show payment history'">
              <ChevronDown :size="14"
                :class="['text-slate-400 dark:text-zinc-500 transition-transform', expandedBill === bill.id ? 'rotate-180' : '']"
                :stroke-width="2" />
            </button>
            <button v-if="bill.status !== 'paid'"
              @click="openPayOverlay(bill)"
              class="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center active:scale-90 transition-transform"
              title="Mark as paid">
              <Check :size="15" class="text-emerald-500" :stroke-width="2.5" />
            </button>
            <button @click="confirmDelete(bill)"
              class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center active:scale-90 transition-transform"
              title="Delete">
              <Trash2 :size="14" class="text-slate-400 dark:text-zinc-500" :stroke-width="2" />
            </button>
          </div>
        </div>

        <!-- Collapsible payment history -->
        <Transition name="expand">
          <div v-if="expandedBill === bill.id"
            class="border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50 dark:bg-zinc-900/40">
            <p class="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest px-4 pt-3 pb-1">
              Payment History
            </p>
            <div v-for="(pay, pi) in billPaymentHistory(bill.id)" :key="pay.id"
              :class="['flex items-center gap-3 px-4 py-2.5',
                pi < billPaymentHistory(bill.id).length - 1 ? 'border-b border-slate-100/60 dark:border-zinc-800/40' : 'pb-3']">
              <div class="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                <Check :size="12" class="text-emerald-500" :stroke-width="2.5" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[12px] font-semibold text-slate-700 dark:text-zinc-300">{{ pay.date }}</p>
                <p class="text-[10px] text-slate-400 dark:text-zinc-500">{{ pay.account }}</p>
              </div>
              <span class="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                −{{ sym }}{{ Math.abs(pay.amount).toLocaleString() }}
              </span>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <div class="h-4"></div>
  </div>

  <!-- ══════════════════════════════════════
       PAY BILL OVERLAY
  ══════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="payTarget"
        class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.55);backdrop-filter:blur(8px)"
        @click.self="payTarget = null">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))', ...paySheetStyle }"
          @touchstart="payOnTouchStart" @touchmove="payOnTouchMove" @touchend="payOnTouchEnd">
          <div class="flex flex-col gap-4 px-5 pt-4">

            <!-- Handle -->
            <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center cursor-grab"></div>

            <!-- Bill preview -->
            <div class="flex items-center gap-3 p-3.5 rounded-2xl"
              :style="{ background: accent + '10', border: '1px solid ' + accent + '30' }">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                :style="{ background: accent + '20' }">
                <component :is="billIcon(payTarget.icon)" :size="18" :style="{ color: accent }" :stroke-width="1.8" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-black text-slate-800 dark:text-zinc-100">{{ payTarget.name }}</p>
                <p class="text-[11px] font-semibold mt-0.5" :style="{ color: accent }">
                  {{ sym }}{{ payTarget.amount.toLocaleString() }}
                  <span v-if="payTarget.recurring" class="text-slate-400 dark:text-zinc-500"> · recurring monthly</span>
                </p>
              </div>
            </div>

            <h3 class="text-[17px] font-black text-slate-900 dark:text-zinc-50 -mt-1">
              Which account paid this?
            </h3>

            <!-- Account list -->
            <div v-if="savedAccounts.length === 0"
              class="flex flex-col items-center gap-2 py-6 text-center">
              <CreditCard :size="28" class="text-slate-300 dark:text-zinc-700" :stroke-width="1.5" />
              <p class="text-[13px] font-bold text-slate-400 dark:text-zinc-600">No accounts yet</p>
              <p class="text-[11px] text-slate-400 dark:text-zinc-600">Add an account in Accounts first</p>
            </div>

            <div v-else class="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-0.5" style="-webkit-overflow-scrolling:touch;">
              <button v-for="acc in savedAccounts" :key="acc.id"
                @click="payForm.accountId = acc.id"
                :class="['flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all active:scale-[0.98]',
                  payForm.accountId === acc.id
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
                    : 'border-transparent bg-slate-50 dark:bg-zinc-800']">
                <!-- Colored dot from gradient -->
                <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  :style="{ background: acc.gradient }">
                  <component :is="accountTypeIcon(acc.type)" :size="16" color="rgba(255,255,255,0.85)" :stroke-width="2" />
                </div>
                <div class="flex-1 text-left min-w-0">
                  <p :class="['text-[13px] font-bold truncate',
                    payForm.accountId === acc.id ? 'text-violet-600 dark:text-violet-300' : 'text-slate-700 dark:text-zinc-300']">
                    {{ acc.name }}
                  </p>
                  <p class="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                    {{ acc.institution }}
                    <span v-if="acc.lastFour" class="font-mono"> ···{{ acc.lastFour }}</span>
                  </p>
                </div>
                <div v-if="payForm.accountId === acc.id"
                  class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  :style="{ background: accent }">
                  <Check :size="11" color="white" :stroke-width="3" />
                </div>
              </button>
            </div>

            <!-- Override date section -->
            <div class="rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
              <!-- Toggle row -->
              <button @click="payForm.overrideDate = !payForm.overrideDate"
                class="w-full flex items-center gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-zinc-800 transition-colors">
                <!-- Custom checkbox -->
                <div :class="['w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                  payForm.overrideDate
                    ? 'border-violet-500 bg-violet-500'
                    : 'border-slate-300 dark:border-zinc-600 bg-transparent']">
                  <Check v-if="payForm.overrideDate" :size="11" color="white" :stroke-width="3" />
                </div>
                <div class="flex-1 text-left">
                  <p class="text-[13px] font-bold text-slate-700 dark:text-zinc-300">Override transaction date</p>
                  <p class="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Use if payment was made in the past</p>
                </div>
                <CalendarDays :size="16" class="text-slate-400 dark:text-zinc-600 flex-shrink-0" :stroke-width="1.8" />
              </button>

              <!-- Date input (shown when override checked) -->
              <Transition name="dropdown">
                <div v-if="payForm.overrideDate"
                  class="px-4 pb-3 border-t border-slate-100 dark:border-zinc-800">
                  <p class="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest pt-3 mb-2">Payment Date</p>
                  <input
                    v-model="payForm.dateValue"
                    type="date"
                    :max="todayISO"
                    class="w-full bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3 text-[14px] font-semibold text-slate-800 dark:text-zinc-100 border-2 border-transparent focus:border-violet-500 outline-none transition-colors"
                    style="-webkit-appearance:none;"
                  />
                  <p v-if="payForm.dateValue && payForm.dateValue > todayISO" class="text-[11px] font-bold text-rose-500 mt-1.5 px-1">
                    Date cannot be in the future
                  </p>
                </div>
              </Transition>
            </div>

            <!-- Confirm button -->
            <button @click="confirmPay"
              :disabled="!canConfirmPay"
              :class="['w-full py-4 rounded-2xl text-[16px] font-black transition-all active:scale-[0.98]',
                canConfirmPay
                  ? 'text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600']"
              :style="canConfirmPay ? { background: accent, boxShadow: '0 8px 24px ' + accent + '44' } : {}">
              Confirm Payment
            </button>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Add Bill Sheet ── -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showAdd"
        class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px)"
        @click.self="showAdd = false">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))', ...addSheetStyle }"
          @touchstart="addOnTouchStart" @touchmove="addOnTouchMove" @touchend="addOnTouchEnd">
          <div class="flex flex-col gap-3 px-5 pt-4">
            <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mb-1 cursor-grab"></div>
            <h3 class="text-[18px] font-black text-center text-slate-900 dark:text-zinc-50">Add Bill</h3>

            <!-- Name -->
            <input v-model="form.name" placeholder="Bill name (e.g. Netflix, Rent)"
              class="w-full bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 border-2 border-transparent focus:border-violet-500 outline-none transition-colors" />

            <!-- Amount -->
            <div class="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 border-2 border-transparent focus-within:border-violet-500 transition-colors">
              <span class="text-[20px] font-black text-violet-500">{{ sym }}</span>
              <input v-model="form.amount" type="number" inputmode="decimal" placeholder="0.00"
                class="flex-1 bg-transparent text-[20px] font-black text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-700 outline-none" />
            </div>

            <!-- Due day with validation -->
            <div>
              <div :class="['flex items-center gap-3 rounded-2xl px-4 py-3.5 border-2 transition-colors',
                dayError ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-400' : 'bg-slate-50 dark:bg-zinc-800 border-transparent focus-within:border-violet-500']">
                <Calendar :size="18" class="text-violet-500 flex-shrink-0" :stroke-width="2" />
                <input v-model="form.dueDay" type="number" inputmode="numeric"
                  placeholder="Due day of month (1–31)" min="1" max="31"
                  @input="validateDay"
                  class="flex-1 bg-transparent text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none" />
              </div>
              <p v-if="dayError" class="text-[11px] font-bold text-rose-500 mt-1 px-1">{{ dayError }}</p>
            </div>

            <!-- Recurring toggle -->
            <button @click="form.recurring = !form.recurring"
              :class="['flex items-center gap-3 p-4 rounded-2xl border-2 transition-all',
                form.recurring ? 'bg-violet-500/10 border-violet-500' : 'bg-slate-50 dark:bg-zinc-800 border-transparent']">
              <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                form.recurring ? 'bg-violet-500' : 'bg-slate-200 dark:bg-zinc-700']">
                <RefreshCw :size="18" :color="form.recurring ? 'white' : '#94a3b8'" :stroke-width="2" />
              </div>
              <div class="flex-1 text-left">
                <p :class="['text-[14px] font-bold', form.recurring ? 'text-violet-600 dark:text-violet-400' : 'text-slate-700 dark:text-zinc-300']">
                  Recurring Monthly
                </p>
                <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Resets to pending each month automatically</p>
              </div>
              <div :class="['w-12 h-6 rounded-full transition-all relative flex-shrink-0',
                form.recurring ? 'bg-violet-500' : 'bg-slate-200 dark:bg-zinc-700']">
                <div :class="['absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all',
                  form.recurring ? 'left-6' : 'left-0.5']"></div>
              </div>
            </button>

            <!-- Icon pick -->
            <div>
              <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-1">Category</p>
              <div class="grid grid-cols-4 gap-2">
                <button v-for="ic in iconOptions" :key="ic.key"
                  @click="form.icon = ic.key"
                  :class="['flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all',
                    form.icon === ic.key ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40' : 'border-transparent bg-slate-50 dark:bg-zinc-800']">
                  <component :is="ic.icon" :size="22"
                    :class="form.icon === ic.key ? 'text-violet-500' : 'text-slate-400 dark:text-zinc-600'"
                    :stroke-width="1.8" />
                  <span :class="['text-[10px] font-bold', form.icon === ic.key ? 'text-violet-500' : 'text-slate-400 dark:text-zinc-600']">{{ ic.label }}</span>
                </button>
              </div>
            </div>

            <button @click="submitAdd" :disabled="!canSubmit"
              :class="['w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] transition-all mb-2',
                canSubmit ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600']">
              Add Bill
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Delete Confirm ── -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="deleteTarget"
        class="fixed inset-0 z-[300] flex items-end justify-center"
        style="background:rgba(0,0,0,0.6);backdrop-filter:blur(12px)"
        @click.self="deleteTarget = null">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800 pb-10 px-5 pt-5">
          <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mx-auto mb-5"></div>
          <p class="text-[16px] font-black text-slate-900 dark:text-zinc-50 text-center mb-1">Delete "{{ deleteTarget?.name }}"?</p>
          <p class="text-[13px] text-slate-400 text-center mb-6">This bill will be permanently removed.</p>
          <button @click="doDelete" class="w-full py-4 rounded-2xl bg-rose-500 text-white text-[16px] font-black active:scale-[0.98] shadow-lg shadow-rose-500/30 mb-3">Delete</button>
          <button @click="deleteTarget = null" class="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[15px] font-bold active:scale-[0.98]">Cancel</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import {
  Plus, Check, Trash2, Calendar, CalendarDays, Receipt,
  Zap, Smartphone, Wifi, Building2, Tv2, CreditCard,
  MoreHorizontal, RefreshCw, PiggyBank, Landmark, Wallet,
  Banknote, TrendingUp, ChevronDown,
} from 'lucide-vue-next'
import {
  bills, billIcon, addBill, markBillPaid, deleteBill,
  refreshBillStatuses, totalBillsDue, overdueBillsCount,
  settings, addTx, cardsVersion, orbLog, transactions,
} from '../composables/useStore'
import { useSwipeDown } from '../composables/useSwipeDown'

const { sheetStyle: paySheetStyle, onTouchStart: payOnTouchStart, onTouchMove: payOnTouchMove, onTouchEnd: payOnTouchEnd } =
  useSwipeDown(() => { payTarget.value = null })
const { sheetStyle: addSheetStyle, onTouchStart: addOnTouchStart, onTouchMove: addOnTouchMove, onTouchEnd: addOnTouchEnd } =
  useSwipeDown(() => { showAdd.value = false })

const CARDS_KEY = 'orb_cards_v1'
const sym    = computed(() => settings.value.currencySymbol)
const accent = computed(() => settings.value.accentColor)

onMounted(() => refreshBillStatuses())

const pendingCount = computed(() => bills.value.filter(b => b.status === 'pending').length)
const paidCount    = computed(() => bills.value.filter(b => b.status === 'paid').length)

// ── Collapsible history ────────────────────────────────────
const expandedBill = ref<number | null>(null)

interface PayRecord { id: number; date: string; amount: number; account: string }
function billPaymentHistory(billId: number): PayRecord[] {
  const bill = bills.value.find(b => b.id === billId)
  if (!bill) return []
  // Match transactions that look like payments for this bill
  return transactions.value
    .filter(t => t.amount < 0 && t.name.toLowerCase().includes(bill.name.toLowerCase()) && t.name.toLowerCase().includes('bill'))
    .slice(0, 6)
    .map(t => ({
      id:      t.id,
      date:    t.date,
      amount:  t.amount,
      account: t.accountId != null
        ? (savedAccounts.value.find(a => a.id === t.accountId)?.name ?? 'Account')
        : 'Cash',
    }))
}

// ── Filters ────────────────────────────────────────────────
const filters = [
  { val:'all',     label:'All'     },
  { val:'pending', label:'Pending' },
  { val:'overdue', label:'Overdue' },
  { val:'paid',    label:'Paid'    },
]
const activeFilter = ref('all')
const filteredBills = computed(() =>
  activeFilter.value === 'all' ? bills.value : bills.value.filter(b => b.status === activeFilter.value)
)

function dayLabel(day: number): string {
  const now = new Date()
  const due = new Date(now.getFullYear(), now.getMonth(), day)
  const todayMs = new Date().setHours(0,0,0,0)
  const diff = Math.ceil((due.getTime() - todayMs) / 86400000)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff < 0)  return `${Math.abs(diff)}d ago`
  return `in ${diff}d (${day}${daySuffix(day)})`
}
function daySuffix(d: number) {
  if (d >= 11 && d <= 13) return 'th'
  return ['st','nd','rd'][((d % 10) - 1)] ?? 'th'
}

// ── Today's ISO date (for max on date input) ────────────────
const todayISO = computed(() => new Date().toISOString().slice(0, 10))

// ── Accounts ───────────────────────────────────────────────
interface SavedAccount {
  id:          number
  type:        string
  name:        string
  institution: string
  lastFour?:   string
  gradient:    string
}
const savedAccounts = ref<SavedAccount[]>([])

function loadAccounts() {
  try {
    const raw = localStorage.getItem(CARDS_KEY)
    if (raw) savedAccounts.value = JSON.parse(raw)
  } catch {}
}

onMounted(loadAccounts)
watch(cardsVersion, loadAccounts)

function accountTypeIcon(type: string) {
  const MAP: Record<string, any> = {
    credit:     CreditCard,
    debit:      CreditCard,
    savings:    PiggyBank,
    investment: TrendingUp,
    cash:       Banknote,
    prepaid:    Wallet,
    atm:        Landmark,
    loan:       Building2,
  }
  return MAP[type] ?? CreditCard
}

// ── Pay overlay ────────────────────────────────────────────
type BillItem = typeof bills.value[0]
const payTarget = ref<BillItem | null>(null)

const payForm = reactive({
  accountId:    null as number | null,
  overrideDate: false,
  dateValue:    '',
})

function openPayOverlay(bill: BillItem) {
  payTarget.value = bill
  payForm.accountId = savedAccounts.value[0]?.id ?? null
  payForm.overrideDate = false
  payForm.dateValue = todayISO.value
}

const canConfirmPay = computed(() => {
  if (!payTarget.value) return false
  if (savedAccounts.value.length > 0 && payForm.accountId === null) return false
  if (payForm.overrideDate) {
    if (!payForm.dateValue) return false
    if (payForm.dateValue > todayISO.value) return false
  }
  return true
})

function confirmPay() {
  if (!payTarget.value || !canConfirmPay.value) return
  const bill = payTarget.value

  // Build ISO timestamp for the transaction
  let txIso: string
  if (payForm.overrideDate && payForm.dateValue) {
    // Use the override date at noon local time so it sorts cleanly
    txIso = new Date(payForm.dateValue + 'T12:00:00').toISOString()
  } else {
    txIso = new Date().toISOString()
  }

  // Record as an expense transaction
  addTx({
    name:      `${bill.name} — bill payment`,
    amount:    -bill.amount,
    category:  'Utilities',
    accountId: payForm.accountId,
    isoDate:   txIso,
  })

  markBillPaid(bill.id)
  orbLog(`Bill paid: ${bill.name} via account ${payForm.accountId ?? 'cash'}`)
  payTarget.value = null
}

// ── Delete ─────────────────────────────────────────────────
const deleteTarget = ref<BillItem | null>(null)
function confirmDelete(bill: BillItem) { deleteTarget.value = bill }
function doDelete() {
  if (deleteTarget.value) deleteBill(deleteTarget.value.id)
  deleteTarget.value = null
}

// ── Add bill form ──────────────────────────────────────────
const showAdd  = ref(false)
const dayError = ref('')
const form = reactive({ name:'', amount:'', dueDay:'', icon:'other', recurring:false })

function validateDay() {
  const n = parseInt(form.dueDay)
  if (!form.dueDay) { dayError.value = ''; return }
  if (isNaN(n) || n < 1 || n > 31) {
    dayError.value = 'Day must be between 1 and 31'
  } else {
    dayError.value = ''
  }
}

const canSubmit = computed(() =>
  form.name.trim().length > 0 &&
  !!form.amount && parseFloat(form.amount) > 0 &&
  !!form.dueDay && !dayError.value &&
  parseInt(form.dueDay) >= 1 && parseInt(form.dueDay) <= 31
)

const iconOptions = [
  { key:'zap',        icon:Zap,           label:'Electric'  },
  { key:'smartphone', icon:Smartphone,    label:'Mobile'    },
  { key:'wifi',       icon:Wifi,          label:'Internet'  },
  { key:'building2',  icon:Building2,     label:'Rent'      },
  { key:'tv2',        icon:Tv2,           label:'Streaming' },
  { key:'creditcard', icon:CreditCard,    label:'Card'      },
  { key:'other',      icon:MoreHorizontal,label:'Other'     },
]

function submitAdd() {
  validateDay()
  if (!canSubmit.value) return
  addBill({
    name:      form.name.trim(),
    amount:    parseFloat(form.amount),
    dueDay:    parseInt(form.dueDay),
    icon:      form.icon,
    recurring: form.recurring,
  })
  Object.assign(form, { name:'', amount:'', dueDay:'', icon:'other', recurring:false })
  dayError.value = ''
  showAdd.value = false
}
</script>

<style scoped>
.sheet-enter-active,.sheet-leave-active{transition:opacity .28s ease;}
.sheet-enter-active>div,.sheet-leave-active>div{transition:transform .32s cubic-bezier(.32,1.1,.64,1);}
.sheet-enter-from,.sheet-leave-to{opacity:0;}
.sheet-enter-from>div,.sheet-leave-to>div{transform:translateY(100%);}
.fade-enter-active,.fade-leave-active{transition:opacity .25s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;}
.dropdown-enter-active,.dropdown-leave-active{transition:all .22s ease;overflow:hidden;}
.dropdown-enter-from,.dropdown-leave-to{opacity:0;max-height:0;}
.dropdown-enter-to,.dropdown-leave-from{opacity:1;max-height:200px;}
/* collapsible payment history */
.expand-enter-active,.expand-leave-active{transition:all .28s ease;overflow:hidden;}
.expand-enter-from,.expand-leave-to{opacity:0;max-height:0;}
.expand-enter-to,.expand-leave-from{opacity:1;max-height:400px;}
</style>