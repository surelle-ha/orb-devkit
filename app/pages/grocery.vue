<template>
  <div class="bg-slate-100 dark:bg-zinc-950 pb-28" style="touch-action:pan-y;">

    <!-- Header -->
    <div class="flex items-center justify-between px-5 pt-6 pb-4">
      <h2 class="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Grocery</h2>
      <button @click="showNewList = true"
        class="flex items-center gap-1.5 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[13px] font-bold px-4 py-2.5 rounded-full active:scale-95 transition-transform shadow-sm">
        <Plus :size="14" :stroke-width="2.5" /> New List
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="groceryLists.length === 0"
      class="mx-4 rounded-3xl border-2 border-dashed border-slate-300 dark:border-zinc-700 flex flex-col items-center gap-4 py-16 px-8 text-center">
      <div class="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
        <ShoppingCart :size="28" class="text-violet-400" :stroke-width="1.5" />
      </div>
      <div>
        <p class="text-[16px] font-black text-slate-800 dark:text-zinc-100">No grocery lists yet</p>
        <p class="text-[12px] text-slate-400 dark:text-zinc-500 mt-1">Create a list to start planning your shopping</p>
      </div>
      <button @click="showNewList = true"
        class="flex items-center gap-2 bg-violet-500 text-white text-[14px] font-bold px-6 py-3 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-violet-500/30">
        <Plus :size="16" :stroke-width="2.5" /> Create First List
      </button>
    </div>

    <template v-else>
      <!-- List tabs -->
      <div class="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-3">
        <button v-for="list in groceryLists" :key="list.id"
          @click="activeListId = list.id"
          :class="['flex items-center gap-2 flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-all',
            activeListId === list.id
              ? 'bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-500/25'
              : 'bg-white/70 dark:bg-zinc-900/60 backdrop-blur border-slate-200/60 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400']">
          {{ list.name }}
          <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded-full',
            activeListId === list.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500']">
            {{ list.items.length }}
          </span>
        </button>
      </div>

      <!-- Budget card -->
      <div v-if="activeGroceryList" class="mx-4 mb-3 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm p-4">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{{ activeGroceryList.name }}</p>
              <button @click="showListMenu = !showListMenu" class="active:scale-90 transition-transform">
                <MoreHorizontal :size="14" class="text-slate-400 dark:text-zinc-600" :stroke-width="2" />
              </button>
            </div>
            <p class="text-[26px] font-black text-slate-900 dark:text-zinc-50 tracking-tight">
              {{ sym }}{{ groceryTotal.toLocaleString() }}
            </p>
            <template v-if="activeGroceryList.budget > 0">
              <div class="w-44 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2 mb-1.5">
                <div class="h-full rounded-full transition-all duration-500"
                  :class="budgetPct >= 100 ? 'bg-rose-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-violet-500'"
                  :style="{ width: Math.min(100, budgetPct) + '%' }"></div>
              </div>
              <p class="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                {{ sym }}{{ groceryCheckedTotal.toLocaleString() }} in cart
                · <span :class="budgetLeft >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                  {{ budgetLeft >= 0 ? sym + budgetLeft.toLocaleString() + ' left' : sym + Math.abs(budgetLeft).toLocaleString() + ' over' }}
                </span>
              </p>
            </template>
            <p v-else class="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mt-1">
              {{ sym }}{{ groceryCheckedTotal.toLocaleString() }} in cart · <button @click="showBudget = true" class="text-violet-500 underline-offset-2">Set budget</button>
            </p>
          </div>
          <div v-if="activeGroceryList.budget > 0" class="relative w-[64px] h-[64px] flex-shrink-0">
            <svg viewBox="0 0 64 64" class="w-full h-full -rotate-90">
              <circle cx="32" cy="32" r="24" fill="none" class="stroke-slate-100 dark:stroke-zinc-800" stroke-width="5"/>
              <circle cx="32" cy="32" r="24" fill="none" stroke-width="5" stroke-linecap="round"
                :stroke="budgetPct >= 100 ? '#ef4444' : budgetPct >= 80 ? '#f59e0b' : '#8b5cf6'"
                :stroke-dasharray="`${Math.min(100, budgetPct) * 1.508} 150.8`"/>
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-[12px] font-black text-violet-500">
              {{ Math.min(999, Math.round(budgetPct)) }}%
            </span>
          </div>
        </div>
        <div v-if="showListMenu" class="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap gap-2">
          <button @click="openRename" class="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
            <Pencil :size="12" :stroke-width="2.5" /> Rename
          </button>
          <button @click="showBudget = true; showListMenu = false"
            class="flex items-center gap-1.5 text-[12px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-950/40 px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
            <DollarSign :size="12" :stroke-width="2.5" /> Budget
          </button>
          <button v-if="checkedCount > 0" @click="clearChecked"
            class="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
            <CheckSquare :size="12" :stroke-width="2.5" /> Clear checked ({{ checkedCount }})
          </button>
          <button @click="confirmDeleteList"
            class="flex items-center gap-1.5 text-[12px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
            <Trash2 :size="12" :stroke-width="2.5" /> Delete list
          </button>
        </div>
      </div>

      <!-- Add item bar -->
      <div class="mx-4 mb-3 flex items-center gap-2">
        <div class="flex-1 flex items-center gap-2 bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl px-4 py-3 shadow-sm">
          <input v-model="quickItem" @keydown.enter="quickAdd"
            placeholder="Add item…"
            class="flex-1 bg-transparent text-[14px] font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none" />
        </div>
        <button @click="showAddItem = true"
          class="w-11 h-11 rounded-2xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30 active:scale-90 transition-transform flex-shrink-0">
          <SlidersHorizontal :size="17" color="white" :stroke-width="2" />
        </button>
      </div>

      <!-- Items list -->
      <div v-if="currentGroceryItems.length === 0"
        class="mx-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm flex flex-col items-center gap-2 py-10">
        <ShoppingCart :size="28" class="text-slate-300 dark:text-zinc-700" :stroke-width="1.5" />
        <p class="text-[13px] font-bold text-slate-400 dark:text-zinc-600">List is empty</p>
      </div>

      <div v-for="(group, cat) in groupedItems" :key="cat" class="mb-3">
        <p v-if="Object.keys(groupedItems).length > 1"
          class="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest px-5 pb-1.5">
          {{ cat }}
        </p>
        <div class="mx-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
          <div v-for="(item, i) in group" :key="item.id"
            :class="['flex items-center gap-3.5 px-4 py-3.5 transition-all',
              item.checked ? 'opacity-50' : '',
              i < group.length - 1 ? 'border-b border-slate-100 dark:border-zinc-800/60' : '']">
            <button @click="toggleItem(item.id)"
              :class="['w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90',
                item.checked ? 'bg-violet-500 border-violet-500' : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800']">
              <Check v-if="item.checked" :size="13" color="white" :stroke-width="3" />
            </button>
            <div class="flex-1 min-w-0">
              <p :class="['text-[14px] font-bold text-slate-800 dark:text-zinc-100', item.checked ? 'line-through' : '']">{{ item.name }}</p>
              <p v-if="item.qty" class="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">{{ item.qty }}</p>
            </div>
            <span v-if="item.price > 0" class="text-[14px] font-bold text-violet-500 flex-shrink-0 mr-1">
              {{ sym }}{{ item.price.toLocaleString() }}
            </span>
            <button @click="removeItem(item.id)"
              class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 active:bg-rose-50 dark:active:bg-rose-950/40 active:scale-90 transition-all">
              <Trash2 :size="13" class="text-slate-400 dark:text-zinc-500" :stroke-width="2" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="currentGroceryItems.length > 0"
        class="mx-4 rounded-2xl overflow-hidden relative"
        style="background:linear-gradient(135deg,#4c1d95,#5b21b6);box-shadow:0 8px 24px rgba(109,40,217,0.3)">
        <div class="relative flex justify-between items-center px-5 py-4">
          <div>
            <p class="text-[11px] font-semibold text-white/50">Estimated Total</p>
            <p class="text-[11px] font-semibold text-white/40 mt-0.5">{{ uncheckedCount }} remaining · {{ checkedCount }} in cart</p>
          </div>
          <span class="text-[22px] font-black text-violet-200 tracking-tight">{{ sym }}{{ groceryTotal.toLocaleString() }}</span>
        </div>
      </div>
    </template>
    <div class="h-4"></div>
  </div>

  <!-- New List sheet -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showNewList" class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px)" @click.self="showNewList = false">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-3 px-5 pt-4">
            <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mb-1"></div>
            <h3 class="text-[18px] font-black text-center text-slate-900 dark:text-zinc-50">New Grocery List</h3>
            <input v-model="newListName" placeholder="List name…" @keydown.enter="createList"
              class="w-full bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 border-2 border-transparent focus:border-violet-500 outline-none transition-colors" />
            <div class="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 border-2 border-transparent focus-within:border-violet-500 transition-colors">
              <span class="text-[16px] font-black text-violet-500">{{ sym }}</span>
              <input v-model="newListBudget" type="number" inputmode="decimal" placeholder="Budget (optional)"
                class="flex-1 bg-transparent text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-700 outline-none" />
            </div>
            <button @click="createList" :disabled="!newListName.trim()"
              :class="['w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] transition-all mb-2',
                newListName.trim() ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600']">
              Create List
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Add item sheet -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showAddItem" class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px)" @click.self="showAddItem = false">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-3 px-5 pt-4 max-h-[88vh] overflow-y-auto pb-2">
            <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mb-1"></div>
            <h3 class="text-[18px] font-black text-center text-slate-900 dark:text-zinc-50">Add Item</h3>
            <input v-model="itemForm.name" placeholder="Item name"
              class="w-full bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 border-2 border-transparent focus:border-violet-500 outline-none transition-colors" />
            <div class="flex gap-2">
              <input v-model="itemForm.qty" placeholder="Qty (e.g. 2 pcs)"
                class="flex-1 bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 border-2 border-transparent focus:border-violet-500 outline-none transition-colors" />
              <div class="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 rounded-2xl px-3 py-3.5 border-2 border-transparent focus-within:border-violet-500 transition-colors w-32">
                <span class="text-[15px] font-black text-violet-500">{{ sym }}</span>
                <input v-model="itemForm.price" type="number" inputmode="decimal" placeholder="0"
                  class="flex-1 bg-transparent text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-400 outline-none w-0" />
              </div>
            </div>
            <div>
              <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-1">Category</p>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="cat in GROCERY_CATEGORIES" :key="cat"
                  @click="itemForm.category = cat"
                  :class="['px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all',
                    itemForm.category === cat ? 'bg-violet-500 border-violet-500 text-white' : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400']">
                  {{ cat }}
                </button>
              </div>
            </div>
            <button @click="addItem" :disabled="!itemForm.name.trim()"
              :class="['w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] transition-all mb-2',
                itemForm.name.trim() ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600']">
              Add to List
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Budget, Rename, Delete sheets omitted for brevity - same as source -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showBudget" class="fixed inset-0 z-[200] flex items-end justify-center"
        style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px)" @click.self="showBudget = false">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-3 px-5 pt-4">
            <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mb-1"></div>
            <h3 class="text-[18px] font-black text-center text-slate-900 dark:text-zinc-50">Set Budget</h3>
            <p class="text-[13px] text-slate-400 text-center">For "{{ activeGroceryList?.name }}"</p>
            <div class="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-4 border-2 border-transparent focus-within:border-violet-500 transition-colors">
              <span class="text-[26px] font-black text-violet-500">{{ sym }}</span>
              <input v-model="budgetInput" type="number" inputmode="decimal" placeholder="0"
                class="flex-1 bg-transparent text-[28px] font-black text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-700 outline-none tracking-tight" />
            </div>
            <button @click="saveBudget" class="w-full py-4 rounded-2xl bg-violet-500 text-white text-[16px] font-black active:scale-[0.98] shadow-lg shadow-violet-500/30 mb-2">Save Budget</button>
            <button v-if="activeGroceryList?.budget" @click="clearBudget" class="w-full py-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[14px] font-bold active:scale-[0.98] mb-1">Remove Budget</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Plus, Check, ShoppingCart, MoreHorizontal, Trash2, Pencil, DollarSign, CheckSquare, SlidersHorizontal } from 'lucide-vue-next'
import {
  groceryLists, activeListId, activeGroceryList,
  currentGroceryItems, groceryTotal, groceryCheckedTotal,
  addGroceryList, deleteGroceryList, renameGroceryList, setListBudget,
  addGroceryItem, toggleGroceryItem, deleteGroceryItem, clearCheckedItems,
  GROCERY_CATEGORIES, settings,
} from '../composables/useStore'

const sym = computed(() => settings.value.currencySymbol)

const checkedCount   = computed(() => currentGroceryItems.value.filter(i => i.checked).length)
const uncheckedCount = computed(() => currentGroceryItems.value.filter(i => !i.checked).length)
const budgetPct      = computed(() => {
  const b = activeGroceryList.value?.budget ?? 0
  if (!b) return 0
  return (groceryTotal.value / b) * 100
})
const budgetLeft = computed(() => (activeGroceryList.value?.budget ?? 0) - groceryTotal.value)

const groupedItems = computed(() => {
  const items = currentGroceryItems.value
  const groups: Record<string, typeof items> = {}
  for (const item of items.filter(i => !i.checked)) {
    const cat = item.category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  }
  const checked = items.filter(i => i.checked)
  if (checked.length) groups['✓ Checked'] = checked
  return groups
})

const quickItem = ref('')
function quickAdd() {
  const name = quickItem.value.trim()
  if (!name || !activeListId.value) return
  addGroceryItem(activeListId.value, { name, qty: '', price: 0, category: 'Other' })
  quickItem.value = ''
}

function toggleItem(itemId: number) {
  if (!activeListId.value) return
  toggleGroceryItem(activeListId.value, itemId)
}
function removeItem(itemId: number) {
  if (!activeListId.value) return
  deleteGroceryItem(activeListId.value, itemId)
}
function clearChecked() {
  if (!activeListId.value) return
  clearCheckedItems(activeListId.value)
  showListMenu.value = false
}

const showListMenu   = ref(false)
const showNewList    = ref(false)
const showAddItem    = ref(false)
const showBudget     = ref(false)
const showRename     = ref(false)
const showDeleteList = ref(false)

const newListName   = ref('')
const newListBudget = ref('')
function createList() {
  if (!newListName.value.trim()) return
  addGroceryList(newListName.value, parseFloat(newListBudget.value) || 0)
  newListName.value = ''; newListBudget.value = ''; showNewList.value = false
}

const itemForm = reactive({ name: '', qty: '', price: '', category: 'Other' })
function addItem() {
  if (!itemForm.name.trim() || !activeListId.value) return
  addGroceryItem(activeListId.value, { name: itemForm.name.trim(), qty: itemForm.qty.trim(), price: parseFloat(itemForm.price) || 0, category: itemForm.category })
  Object.assign(itemForm, { name: '', qty: '', price: '', category: 'Other' })
  showAddItem.value = false
}

const budgetInput = ref('')
function saveBudget() {
  if (!activeListId.value) return
  setListBudget(activeListId.value, parseFloat(budgetInput.value) || 0)
  showBudget.value = false; showListMenu.value = false
}
function clearBudget() {
  if (!activeListId.value) return
  setListBudget(activeListId.value, 0)
  showBudget.value = false; showListMenu.value = false
}

const renameValue = ref('')
function openRename() {
  renameValue.value = activeGroceryList.value?.name ?? ''
  showRename.value = true; showListMenu.value = false
}
function doRename() {
  if (!renameValue.value.trim() || !activeListId.value) return
  renameGroceryList(activeListId.value, renameValue.value)
  showRename.value = false
}

function confirmDeleteList() { showDeleteList.value = true; showListMenu.value = false }
function doDeleteList() {
  if (!activeListId.value) return
  deleteGroceryList(activeListId.value)
  showDeleteList.value = false
}
</script>

<style scoped>
.sheet-enter-active,.sheet-leave-active{transition:opacity .28s ease;}
.sheet-enter-active>div,.sheet-leave-active>div{transition:transform .32s cubic-bezier(.32,1.1,.64,1);}
.sheet-enter-from,.sheet-leave-to{opacity:0;}
.sheet-enter-from>div,.sheet-leave-to>div{transform:translateY(100%);}
</style>