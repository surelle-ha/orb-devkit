// composables/useStore.ts

import { ref, computed, watch } from 'vue'
import {
  ShoppingBag, Car, Banknote, Utensils, Zap,
  Smartphone, Gamepad2, Wifi, Building2, Tv2,
  Plane, Shield, Laptop, BarChart2, MoreHorizontal, ShoppingCart,
} from 'lucide-vue-next'

// ── Keys ──────────────────────────────────────────────────
export const TXNS_KEY     = 'orb_transactions_v1'
export const CARDS_KEY    = 'orb_cards_v1'
export const SETTINGS_KEY = 'orb_settings_v1'
export const BILLS_KEY    = 'orb_bills_v1'

// ── App-wide logger ────────────────────────────────────────
export interface LogEntry { ts: string; level: 'info'|'warn'|'error'; msg: string }
const MAX_LOGS = 200
export const appLogs = ref<LogEntry[]>([])

export function orbLog(msg: string, level: 'info'|'warn'|'error' = 'info') {
  const ts = new Date().toISOString().slice(11, 23)
  appLogs.value.unshift({ ts, level, msg })
  if (appLogs.value.length > MAX_LOGS) appLogs.value.length = MAX_LOGS
  if (level === 'error') console.error(`[Orb] ${msg}`)
  else if (level === 'warn') console.warn(`[Orb] ${msg}`)
  else console.log(`[Orb] ${msg}`)
}

// ── Settings ───────────────────────────────────────────────
export interface Settings {
  currency:         string
  currencySymbol:   string
  shakeToAdd:       boolean
  idleLockEnabled:  boolean
  idleLockMinutes:  number
  accentColor:      string
  userName:         string
  balanceStyle:     'supreme' | 'minimal' | 'neon' | 'glass'
  customCategories: string[]
}

const DEFAULT_SETTINGS: Settings = {
  currency: 'USD', currencySymbol: '$', shakeToAdd: true,
  idleLockEnabled: false, idleLockMinutes: 5,
  accentColor: '#ef4444', // ← RED default
  userName: '',
  balanceStyle: 'supreme',
  customCategories: [],
}

function loadSettings(): Settings {
  try {
    const r = localStorage.getItem(SETTINGS_KEY)
    if (r) return { ...DEFAULT_SETTINGS, ...JSON.parse(r) }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}
export const settings = ref<Settings>(loadSettings())

watch(settings, v => {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(v)) } catch {}
}, { deep: true })

export function saveSettings(patch: Partial<Settings>) {
  settings.value = { ...settings.value, ...patch }
  orbLog(`Settings updated: ${JSON.stringify(patch)}`)
}

export const ACCENT_COLORS = [
  { label: 'Red',     hex: '#ef4444' },
  { label: 'Rose',    hex: '#f43f5e' },
  { label: 'Orange',  hex: '#f97316' },
  { label: 'Amber',   hex: '#f59e0b' },
  { label: 'Emerald', hex: '#10b981' },
  { label: 'Teal',    hex: '#14b8a6' },
  { label: 'Cyan',    hex: '#06b6d4' },
  { label: 'Blue',    hex: '#3b82f6' },
  { label: 'Indigo',  hex: '#6366f1' },
  { label: 'Violet',  hex: '#8b5cf6' },
  { label: 'Purple',  hex: '#a855f7' },
  { label: 'Pink',    hex: '#ec4899' },
]

export const CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'US Dollar'        },
  { code: 'PHP', symbol: '₱',  label: 'Philippine Peso'  },
  { code: 'EUR', symbol: '€',  label: 'Euro'             },
  { code: 'GBP', symbol: '£',  label: 'British Pound'    },
  { code: 'JPY', symbol: '¥',  label: 'Japanese Yen'     },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar'},
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar'  },
  { code: 'KRW', symbol: '₩',  label: 'Korean Won'       },
  { code: 'CNY', symbol: '¥',  label: 'Chinese Yuan'     },
]

// ── Icon map ───────────────────────────────────────────────
export const CATEGORY_ICONS: Record<string, any> = {
  Food: Utensils, Groceries: ShoppingBag, Transport: Car,
  Utilities: Zap, Shopping: ShoppingCart, Leisure: Gamepad2,
  Income: Banknote, Other: MoreHorizontal,
}
function iconForCategory(cat: string, amount: number) {
  if (amount > 0) return Banknote
  return CATEGORY_ICONS[cat] ?? MoreHorizontal
}

// ── Transaction ────────────────────────────────────────────
export interface Tx {
  id:        number
  name:      string
  amount:    number
  category:  string
  accountId: number | null
  date:      string
  isoDate:   string
  creditTx?: boolean
}

function formatDate(iso: string): string {
  const d = new Date(iso), now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function loadTxns(): Tx[] {
  try { const r = localStorage.getItem(TXNS_KEY); if (r) return JSON.parse(r) } catch {}
  return []
}
function saveTxns(list: Tx[]) {
  try { localStorage.setItem(TXNS_KEY, JSON.stringify(list)) } catch {}
}

function getAccountType(accountId: number | null): string | null {
  if (accountId == null) return null
  try {
    const raw = localStorage.getItem(CARDS_KEY)
    if (!raw) return null
    const cards = JSON.parse(raw) as any[]
    return cards.find((c: any) => c.id === accountId)?.type ?? null
  } catch { return null }
}

export const transactions = ref<Tx[]>(loadTxns())

export const recentTx = computed(() =>
  [...transactions.value]
    .sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime())
    .map(t => ({ ...t, icon: iconForCategory(t.category, t.amount) }))
)

export function addTx(tx: {
  name:      string
  amount:    number
  category:  string
  accountId?: number | null
  isoDate?:  string
}) {
  const iso = tx.isoDate ?? new Date().toISOString()
  const accType = getAccountType(tx.accountId ?? null)
  const isCreditTx = accType === 'credit'

  const entry: Tx = {
    id: Date.now(), name: tx.name, amount: tx.amount,
    category: tx.category, accountId: tx.accountId ?? null,
    date: formatDate(iso), isoDate: iso,
    ...(isCreditTx ? { creditTx: true } : {}),
  }
  transactions.value.unshift(entry)
  saveTxns(transactions.value)
  orbLog(`TX added: ${tx.name} ${tx.amount > 0 ? '+' : ''}${tx.amount}${isCreditTx ? ' (credit)' : ''}`)
  if (tx.accountId != null) updateCardDisplayBalance(tx.accountId, tx.amount)
}

export const cardsVersion = ref(0)

export function updateCardDisplayBalance(cardId: number, amount: number) {
  try {
    const raw = localStorage.getItem(CARDS_KEY)
    if (!raw) return
    const cards = JSON.parse(raw) as any[]
    const card = cards.find((c: any) => c.id === cardId)
    if (!card) return
    if (card.type === 'credit') {
      card.outstanding = Math.max(0, (card.outstanding ?? 0) - amount)
    } else {
      card.balance = Math.max(0, (card.balance ?? 0) + amount)
      if (amount < 0) card.spent = (card.spent ?? 0) + Math.abs(amount)
    }
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards))
    cardsVersion.value++
  } catch (e: any) { orbLog(`Card update failed: ${e?.message}`, 'error') }
}

// ── Totals ─────────────────────────────────────────────────
export const totalIncome = computed(() =>
  transactions.value
    .filter(t => t.amount > 0 && !t.creditTx)
    .reduce((s, t) => s + t.amount, 0)
)
export const totalExpenses = computed(() =>
  transactions.value
    .filter(t => t.amount < 0 && !t.creditTx)
    .reduce((s, t) => s + Math.abs(t.amount), 0)
)
export const totalBalance = computed(() =>
  transactions.value
    .filter(t => !t.creditTx)
    .reduce((s, t) => s + t.amount, 0)
)

// ── Spending by category ───────────────────────────────────
export interface SpendCat { category: string; total: number }

export const spendingByCategory = computed((): SpendCat[] => {
  const map = new Map<string, number>()
  transactions.value
    .filter(t => t.amount < 0 && !t.creditTx)
    .forEach(t => {
      const prev = map.get(t.category) ?? 0
      map.set(t.category, prev + Math.abs(t.amount))
    })
  return Array.from(map.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
})

// ── Spending by account ────────────────────────────────────
export interface SpendAcct { accountId: number | null; name: string; total: number }

export const spendingByAccount = computed((): SpendAcct[] => {
  const map = new Map<number | null, number>()
  transactions.value
    .filter(t => t.amount < 0 && !t.creditTx)
    .forEach(t => {
      const prev = map.get(t.accountId) ?? 0
      map.set(t.accountId, prev + Math.abs(t.amount))
    })
  let cards: any[] = []
  try { const r = localStorage.getItem(CARDS_KEY); if (r) cards = JSON.parse(r) } catch {}
  return Array.from(map.entries())
    .map(([accountId, total]) => {
      const card = cards.find((c: any) => c.id === accountId)
      const name = card ? (card.name || card.bank || 'Account') : 'Cash / Unlinked'
      return { accountId, name, total }
    })
    .sort((a, b) => b.total - a.total)
})

// ── Bills ──────────────────────────────────────────────────
export interface Bill {
  id:        number
  name:      string
  amount:    number
  dueDay:    number
  status:    'pending' | 'paid' | 'overdue'
  icon:      string
  recurring: boolean
}

const ICON_KEY_MAP: Record<string, any> = {
  zap: Zap, smartphone: Smartphone, wifi: Wifi,
  building2: Building2, tv2: Tv2, creditcard: MoreHorizontal, other: MoreHorizontal,
}
export function billIcon(key: string) { return ICON_KEY_MAP[key] ?? MoreHorizontal }

function dueDateStatus(dueDay: number): 'pending' | 'overdue' {
  return new Date().getDate() > dueDay ? 'overdue' : 'pending'
}

function loadBills(): Bill[] {
  try { const r = localStorage.getItem(BILLS_KEY); if (r) return JSON.parse(r) } catch {}
  return []
}
function saveBillsRaw(list: Bill[]) {
  try { localStorage.setItem(BILLS_KEY, JSON.stringify(list)) } catch {}
}

export const bills = ref<Bill[]>(loadBills())

export function saveBills() {
  saveBillsRaw(bills.value)
  orbLog(`Bills saved (${bills.value.length} items)`)
}

export function addBill(bill: Omit<Bill, 'id' | 'status'>): void {
  bills.value.push({ ...bill, id: Date.now(), status: dueDateStatus(bill.dueDay) })
  saveBills()
  orbLog(`Bill added: ${bill.name}`)
}

export function markBillPaid(id: number): void {
  const b = bills.value.find(b => b.id === id)
  if (!b) return
  b.status = 'paid'
  saveBills()
  orbLog(`Bill paid: ${b.name}`)
}

export function deleteBill(id: number): void {
  const b = bills.value.find(b => b.id === id)
  bills.value = bills.value.filter(b => b.id !== id)
  saveBills()
  orbLog(`Bill deleted: ${b?.name}`)
}

export function refreshBillStatuses(): void {
  const today = new Date().getDate()
  bills.value.forEach(b => {
    if (b.status !== 'paid') b.status = today > b.dueDay ? 'overdue' : 'pending'
  })
  saveBills()
}

export const totalBillsDue = computed(() =>
  bills.value.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amount, 0)
)
export const overdueBillsCount = computed(() =>
  bills.value.filter(b => b.status === 'overdue').length
)

// ── Goals ──────────────────────────────────────────────────
export const goals = ref([
  { icon: Plane,     label: 'Japan',     pct: 68, saved: 34000, target: 50000  },
  { icon: Shield,    label: 'Emergency', pct: 45, saved: 45000, target: 100000 },
  { icon: Laptop,    label: 'Laptop',    pct: 82, saved: 41000, target: 50000  },
  { icon: BarChart2, label: 'Invest',    pct: 30, saved: 15000, target: 50000  },
])

// ── Grocery ────────────────────────────────────────────────
export const GROCERY_KEY        = 'orb_grocery_lists_v1'
export const GROCERY_BUDGET_KEY = 'orb_grocery_budget_v1'

export interface GroceryItem {
  id:       number
  name:     string
  qty:      string
  price:    number
  checked:  boolean
  category: string
}

export interface GroceryList {
  id:        number
  name:      string
  budget:    number
  items:     GroceryItem[]
  createdAt: string
}

function loadGroceryLists(): GroceryList[] {
  try { const r = localStorage.getItem(GROCERY_KEY); if (r) return JSON.parse(r) } catch {}
  return []
}
function saveGroceryListsRaw(lists: GroceryList[]) {
  try { localStorage.setItem(GROCERY_KEY, JSON.stringify(lists)) } catch {}
}

export const groceryLists  = ref<GroceryList[]>(loadGroceryLists())
export const activeListId  = ref<number | null>(groceryLists.value[0]?.id ?? null)

export const activeGroceryList = computed(() =>
  groceryLists.value.find(l => l.id === activeListId.value) ?? null
)
export const currentGroceryItems = computed(() =>
  activeGroceryList.value?.items ?? []
)
export const groceryTotal = computed(() =>
  currentGroceryItems.value.reduce((s, i) => s + i.price, 0)
)
export const groceryCheckedTotal = computed(() =>
  currentGroceryItems.value.filter(i => i.checked).reduce((s, i) => s + i.price, 0)
)

function saveGroceryLists() { saveGroceryListsRaw(groceryLists.value) }

export function addGroceryList(name: string, budget = 0): GroceryList {
  const list: GroceryList = {
    id: Date.now(), name: name.trim(), budget,
    items: [], createdAt: new Date().toISOString(),
  }
  groceryLists.value.push(list)
  saveGroceryLists()
  activeListId.value = list.id
  orbLog(`Grocery list created: ${name}`)
  return list
}

export function deleteGroceryList(id: number) {
  const name = groceryLists.value.find(l => l.id === id)?.name
  groceryLists.value = groceryLists.value.filter(l => l.id !== id)
  if (activeListId.value === id) activeListId.value = groceryLists.value[0]?.id ?? null
  saveGroceryLists()
  orbLog(`Grocery list deleted: ${name}`)
}

export function renameGroceryList(id: number, name: string) {
  const list = groceryLists.value.find(l => l.id === id)
  if (!list) return
  list.name = name.trim()
  saveGroceryLists()
}

export function setListBudget(id: number, budget: number) {
  const list = groceryLists.value.find(l => l.id === id)
  if (!list) return
  list.budget = budget
  saveGroceryLists()
  orbLog(`Grocery budget set: ${budget} for ${list.name}`)
}

export function addGroceryItem(listId: number, item: Omit<GroceryItem, 'id' | 'checked'>) {
  const list = groceryLists.value.find(l => l.id === listId)
  if (!list) return
  list.items.push({ ...item, id: Date.now(), checked: false })
  saveGroceryLists()
  orbLog(`Grocery item added: ${item.name}`)
}

export function toggleGroceryItem(listId: number, itemId: number) {
  const list = groceryLists.value.find(l => l.id === listId)
  if (!list) return
  const item = list.items.find(i => i.id === itemId)
  if (!item) return
  item.checked = !item.checked
  saveGroceryLists()
}

export function deleteGroceryItem(listId: number, itemId: number) {
  const list = groceryLists.value.find(l => l.id === listId)
  if (!list) return
  list.items = list.items.filter(i => i.id !== itemId)
  saveGroceryLists()
  orbLog('Grocery item deleted')
}

export function clearCheckedItems(listId: number) {
  const list = groceryLists.value.find(l => l.id === listId)
  if (!list) return
  const removed = list.items.filter(i => i.checked).length
  list.items = list.items.filter(i => !i.checked)
  saveGroceryLists()
  orbLog(`Cleared ${removed} checked items from ${list.name}`)
}

export const GROCERY_CATEGORIES = [
  'Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery',
  'Pantry', 'Frozen', 'Beverages', 'Snacks',
  'Household', 'Personal Care', 'Other',
]

// ── Quick Add Sheet ────────────────────────────────────────
export const quickAddOpen = ref(false)

orbLog('Store initialised')