# CLAUDE.md — Orb Finance: AI Agent Technical Guide

> This file is consumed by Claude and other AI coding assistants to understand the architecture, conventions, and constraints of **Orb Finance** before making any changes. Read this in full before editing any file.

---

## 1. Project Overview

**Orb Finance** is a mobile-first personal finance app built with:
- **Nuxt 4** (Vue 3, Composition API, `<script setup lang="ts">`)
- **Tailwind CSS v3** with `darkMode: 'class'`
- **Capacitor 8** for iOS/Android native wrapping
- **@nuxtjs/ionic** for Ionic integration
- **lucide-vue-next** for all icons
- **localStorage** as the primary data store (no backend)
- **@capacitor-community/sqlite** for optional native SQLite (gracefully degrades to localStorage on web)

The app runs as a **SPA** (`ssr: false` in nuxt.config.ts). All pages are rendered client-side.

---

## 2. Directory Structure

```
app/
├── app.vue                    # Root: splash → onboarding → app phases + accent injection
├── layouts/
│   └── default.vue            # Tab bar nav, page routing, AddTransactionSheet, shake handler
├── pages/
│   ├── index.vue              # Home: balance card with animated Orb, heatmap, spending chart
│   ├── cards.vue              # Accounts: add/view/delete bank accounts and cards
│   ├── bills.vue              # Bills & dues tracker
│   ├── grocery.vue            # Grocery lists with budgeting
│   ├── transaction.vue        # Transaction history with search/filter
│   ├── more.vue               # Hub: navigation to tools, settings, developer
│   ├── settings.vue           # Settings: appearance, currency, security (PIN + idle), danger zone
│   ├── profile.vue            # User profile, edit onboarding answers
│   ├── developer.vue          # Dev tools: storage inspector, logs, reset
│   ├── about.vue              # About page with animated orb hero
│   └── randomizer.vue         # Buy-or-Not-to-Buy decision tool with AI
├── components/
│   ├── SplashScreen.vue       # Animated orb splash, morphs toward home on exit
│   ├── OnboardingScreen.vue   # Multi-step onboarding wizard
│   ├── AddTransactionSheet.vue # Bottom sheet for adding transactions
│   ├── IdleLockScreen.vue     # Blur lock after inactivity
│   ├── PinLockScreen.vue      # 4-6 digit PIN lock with security question reset
│   ├── OrbChat.vue            # AI chat powered by Claude API
│   └── OrbitRecap.vue         # Annual financial review overlay
└── composables/
    ├── useStore.ts             # All reactive state + localStorage persistence
    ├── useNav.ts               # Page routing (activePage ref, navigate fn)
    ├── useDark.ts              # Theme: light/dark/system/adaptive
    ├── useIdleLock.ts          # Idle screen lock logic
    ├── usePin.ts               # PIN security with SHA-256 hashing
    ├── useShake.ts             # DeviceMotion shake-to-add detection
    └── useDatabase.ts          # Capacitor SQLite wrapper (graceful fallback)
```

---

## 3. Navigation System

**CRITICAL**: Navigation is fully custom — **do NOT use `<NuxtLink>` or `useRouter()`**.

```typescript
// composables/useNav.ts
type PageId = 'home' | 'cards' | 'grocery' | 'bills' | 'more' | 
              'settings' | 'developer' | 'orb' | 'transactions' |
              'profile' | 'randomizer' | 'about'

// Usage in any component:
const { navigate } = useNav()
navigate('settings')
```

Pages are mapped in `layouts/default.vue` `PAGE_MAP`. **When adding a new page:**
1. Add it to `PageId` in `composables/useNav.ts`
2. Import the component in `layouts/default.vue`
3. Add it to `PAGE_MAP` in `layouts/default.vue`
4. If it has a back button, use `navigate('more')` or the appropriate parent

---

## 4. State Management (useStore.ts)

All app state lives in `composables/useStore.ts` as **module-level Vue refs** (singletons shared across all imports).

### Key Storage Keys
```
orb_transactions_v1    → Tx[]
orb_cards_v1           → Account[]
orb_settings_v1        → Settings
orb_bills_v1           → Bill[]
orb_grocery_lists_v1   → GroceryList[]
orb_onboarding_done    → 'true'
orb_pin_hash_v1        → SHA-256 hash string
orb_pin_meta_v1        → PinMeta JSON
orb_dev_logs_v1        → LogEntry[] (developer page persistent logs)
orb_dark_mode          → DarkMode string
```

### Key Exports
```typescript
// Reactive state
transactions    // ref<Tx[]>
bills           // ref<Bill[]>
groceryLists    // ref<GroceryList[]>
settings        // ref<Settings>
quickAddOpen    // ref<boolean> — opens AddTransactionSheet
cardsVersion    // ref<number> — increment to trigger card reload
appLogs         // ref<LogEntry[]>

// Actions
addTx(tx)                    // Adds transaction, updates card balance
updateCardDisplayBalance()   // Updates stored card balance
saveSettings(patch)          // Merges and persists settings
addBill(bill)
markBillPaid(id)
deleteBill(id)
addGroceryList(name, budget)
addGroceryItem(listId, item)
orbLog(msg, level)           // Logs to appLogs + console

// Computed
totalBalance     // computed — sum of all tx amounts
totalIncome      // computed — sum of positive tx
totalExpenses    // computed — sum of absolute negative tx
recentTx         // computed — sorted with icon attached
spendingByCategory  // computed — [{category, total}]
totalBillsDue    // computed
overdueBillsCount // computed
```

### Adding a New Transaction
```typescript
// Always use addTx — never push to transactions.value directly
import { addTx } from '../composables/useStore'

addTx({
  name: 'Salary',
  amount: 5000,        // positive = income, negative = expense
  category: 'Income',
  accountId: 123,      // null for cash
})
```

---

## 5. Accent Color System

The accent color is **dynamically injected** via a `<style id="orb-accent">` tag in `app.vue`.

**Rules:**
- Never hardcode `#8b5cf6` (violet) anywhere — always use `accent` computed
- Always derive accent: `const accent = computed(() => settings.value.accentColor)`
- Use Tailwind `violet-*` classes — they are overridden by the injected CSS
- For inline styles use the accent ref: `:style="{ color: accent, background: accent + '18' }"`
- The `18` hex suffix = 9% opacity (useful for icon backgrounds)

```vue
<!-- Correct pattern for accent-colored elements -->
<div :style="{ background: accent + '18' }">
  <component :is="SomeIcon" :style="{ color: accent }" />
</div>
```

---

## 6. Cards / Accounts System

Cards are stored in `orb_cards_v1` as a JSON array. They are **separate from transactions** — the `cards.vue` page manages them independently.

### Account Types
```
credit    → has limit, outstanding (liability)
debit     → has balance, spent
savings   → has balance
investment → has balance
cash      → has balance
prepaid   → has balance
atm       → has balance
loan      → has principal, remaining (liability)
```

### CRITICAL: Initial Balance = Transaction
When adding an account with an initial balance, **you MUST call `addTx()`** for asset accounts (non-credit, non-loan):

```typescript
// In cards.vue submitAdd():
if (isAsset && amount > 0) {
  addTx({
    name: `Initial balance — ${acc.name}`,
    amount: amount,
    category: 'Income',
    accountId: acc.id,
  })
}
```

This ensures `totalBalance` (computed from transactions) includes the account balance.

### Reactivity Pattern for Cards
```typescript
// Load fresh from localStorage on version change
const accounts = ref<Account[]>([])
onMounted(() => { accounts.value = loadAccounts() })
watch(cardsVersion, () => { accounts.value = loadAccounts() })

// When saving: always loadAccounts() → push → saveAccounts() → cardsVersion.value++
// NEVER push to accounts.value then also call cardsVersion++ (race condition)
function submitAdd() {
  const list = loadAccounts()
  list.push(acc)
  saveAccounts(list)
  cardsVersion.value++  // triggers watch, reloads
}
```

---

## 7. PIN Security System

### composables/usePin.ts
- PIN stored as **SHA-256 hash** in `orb_pin_hash_v1` — never plaintext
- Security question answer also hashed in `orb_pin_meta_v1`
- `crypto.subtle.digest` used for hashing (Web Crypto API)

### Key API
```typescript
import { setPin, verifyPin, verifyAnswer, removePin, lockWithPin, unlockPin, isPinLocked, pinEnabled } from '../composables/usePin'

await setPin(pinString, hintQuestion, answerString)
const ok = await verifyPin(attempt)
const ok = await verifyAnswer(answer)
removePin()
lockWithPin()   // sets isPinLocked = true
unlockPin()     // sets isPinLocked = false
```

### Integration Points
- `app.vue`: calls `lockWithPin()` on app open if `pinEnabled`
- `PinLockScreen.vue`: renders on top of everything when `isPinLocked === true`
- `settings.vue`: allows setting/changing/removing PIN with security question

---

## 8. Component Conventions

### Bottom Sheets
```vue
<Teleport to="body">
  <Transition name="sheet">
    <div v-if="showSheet"
      class="fixed inset-0 z-[200] flex items-end justify-center"
      style="background:rgba(0,0,0,0.5);backdrop-filter:blur(8px)"
      @click.self="showSheet = false">
      <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px]"
        :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
        <!-- content -->
      </div>
    </div>
  </Transition>
</Teleport>
```

### Z-Index Ladder
```
9999 — SplashScreen, PIN lock
9998 — PIN lock screen
9997 — Idle lock screen  
500  — OrbitRecap overlay
400  — Remove PIN confirm
300  — Danger zone modal, PIN setup sheets
200  — Bottom sheets (AddTransaction, etc.)
999  — Toast notifications
50   — Tab bar nav
```

### Toast Pattern
```typescript
const toastMsg  = ref('')
const toastType = ref<'success'|'error'>('success')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string, type: 'success'|'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toastMsg.value = msg; toastType.value = type
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 3000)
}
```

Template:
```vue
<Transition name="toast">
  <div v-if="toastMsg" class="fixed left-1/2 -translate-x-1/2 z-[999]"
    :style="{ top:'calc(16px + env(safe-area-inset-top))' }">
    {{ toastMsg }}
  </div>
</Transition>
```

---

## 9. Dark Mode

```typescript
// useDark.ts — 4 modes
type DarkMode = 'light' | 'dark' | 'system' | 'adaptive'
// adaptive = dark 8pm–6am, light 6am–8pm
// Applied via: document.documentElement.classList.toggle('dark', isDark)
```

Always use Tailwind dark variants: `dark:bg-zinc-900`, `dark:text-zinc-50`, etc.

---

## 10. AddTransactionSheet

The sheet is triggered via `quickAddOpen` ref:
```typescript
import { quickAddOpen } from '../composables/useStore'
quickAddOpen.value = true
```

It's rendered via `<Teleport to="body">` in `layouts/default.vue`. The component itself is at `components/AddTransactionSheet.vue`.

**Common bug**: If the sheet doesn't appear, check that `AddTransactionSheet` is imported in `layouts/default.vue`. The `quickAddOpen` ref is module-level — all imports share the same instance.

---

## 11. Orb Chat (AI)

`OrbChat.vue` calls the Anthropic Claude API directly from the browser:

```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: conversationHistory,
  }),
})
```

The system prompt includes live financial data (balance, expenses, categories).

---

## 12. Formatting Conventions

### Currency / Numbers
```typescript
// Always use settings.value.currencySymbol — never hardcode $
const sym = computed(() => settings.value.currencySymbol)

// Format large numbers
function formatAmount(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (abs/1_000_000).toFixed(2).replace(/\.?0+$/,'') + 'M'
  return abs.toLocaleString('en-US', { minimumFractionDigits:0, maximumFractionDigits:2 })
}
```

### Numeric Inputs with Comma Formatting
```typescript
// For price/amount inputs — use amountDisplay + amountRaw pattern
const form = reactive({ amountDisplay: '', amountRaw: '' })

function onAmountInput(e: Event) {
  const el = e.target as HTMLInputElement
  let cleaned = el.value.replace(/[^0-9.]/g, '')
  // strip extra dots...
  form.amountRaw = cleaned
  form.amountDisplay = formatDisplay(cleaned)  // adds commas
  el.value = form.amountDisplay
}
```

---

## 13. Safe Area / Mobile Layout

Always use safe area insets for bottom sheets and fixed elements:
```css
padding-bottom: calc(32px + env(safe-area-inset-bottom));
padding-top: env(safe-area-inset-top);
```

The main layout has `height:100dvh` and `overflow:hidden`. Pages scroll inside `.page-wrap` which has `overflow-y:scroll`.

---

## 14. Known Constraints

1. **No Vue Router** — custom nav only via `useNav.ts`
2. **No Pinia** — all state in `useStore.ts` module-level refs
3. **No SSR** — `ssr: false` in nuxt.config.ts
4. **No async setup** — all async ops in `onMounted` or event handlers
5. **Tailwind v3** — no v4 syntax; dark mode via class strategy
6. **No form tags** — use `@click` on buttons, not HTML form submit
7. **Cards reload pattern** — increment `cardsVersion` to trigger reload, don't mutate array then reload
8. **localStorage only** — SQLite is optional/additive, never required for web functionality

---

## 15. Common Patterns

### Adding a New Settings Option
1. Add field to `Settings` interface in `useStore.ts`
2. Add default to `DEFAULT_SETTINGS`
3. Add UI row in `settings.vue`
4. Call `saveSettings({ newField: value })`

### Adding a New Page
1. Create `app/pages/newpage.vue`
2. Add to `PageId` in `useNav.ts`
3. Import in `layouts/default.vue`
4. Add to `PAGE_MAP` in `layouts/default.vue`
5. Add navigation entry (button in More page or elsewhere)

### Adding a New Bill Icon
1. Add to `ICON_KEY_MAP` in `useStore.ts`
2. Add to `iconOptions` array in `bills.vue`

---

## 16. File Output Convention

When outputting files for this project, always place them in:
- Components: `app/components/ComponentName.vue`
- Pages: `app/pages/pagename.vue`
- Composables: `app/composables/useSomething.ts`
- Layouts: `app/layouts/default.vue`

The `app/` prefix is the Nuxt `srcDir`.
