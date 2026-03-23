# AGENT.md — Orb Finance: Quick Reference for AI Agents

> Companion to CLAUDE.md. Read CLAUDE.md for deep context. This file is a fast lookup.

---

## Stack at a Glance

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4, Vue 3, Composition API |
| Styling | Tailwind CSS v3 (class dark mode) |
| Native | Capacitor 8 (iOS/Android) |
| Icons | lucide-vue-next |
| State | Module-level Vue refs (no Pinia) |
| Storage | localStorage (primary), SQLite (optional) |
| Routing | Custom `useNav.ts` — NO Vue Router |
| API | Anthropic Claude (in OrbChat.vue) |

---

## Before You Edit Any File

1. **Read CLAUDE.md** — especially sections relevant to the file you're changing
2. **Never use `<NuxtLink>` or `useRouter()`** — use `navigate(pageId)` from `useNav`
3. **Never hardcode colors** — use `accent = computed(() => settings.value.accentColor)`
4. **Never hardcode `$`** — use `sym = computed(() => settings.value.currencySymbol)`
5. **Always Teleport bottom sheets** to `body` with `z-[200]` minimum

---

## PageId Type (must stay in sync with PAGE_MAP)

```typescript
type PageId = 'home' | 'cards' | 'grocery' | 'bills' | 'more' | 
              'settings' | 'developer' | 'orb' | 'transactions' |
              'profile' | 'randomizer' | 'about'
```

Adding a page = update `useNav.ts` + `layouts/default.vue` PAGE_MAP + import.

---

## Critical Files Map

| Task | File(s) |
|------|---------|
| Add transaction | `addTx()` in `useStore.ts` |
| Add account | `cards.vue` → `submitAdd()` |
| Open add sheet | `quickAddOpen.value = true` (from useStore) |
| Navigate | `navigate(pageId)` from `useNav` |
| Change settings | `saveSettings(patch)` from useStore |
| Log something | `orbLog(msg, level?)` from useStore |
| Lock screen | `isLocked` from useIdleLock; `isPinLocked` from usePin |
| Theme | `useDark.ts` |
| Accent injection | `app.vue` buildAccentCSS() |

---

## useStore.ts Key Exports Cheatsheet

```typescript
// State
transactions, bills, groceryLists, settings, quickAddOpen, cardsVersion, appLogs

// Computed
totalBalance, totalIncome, totalExpenses, recentTx
spendingByCategory, totalBillsDue, overdueBillsCount

// Actions  
addTx({name, amount, category, accountId?})
saveSettings({...partial Settings})
addBill(bill), markBillPaid(id), deleteBill(id)
addGroceryList(name, budget?), addGroceryItem(listId, item)
orbLog(msg, 'info'|'warn'|'error')

// Constants
TXNS_KEY, CARDS_KEY, SETTINGS_KEY, BILLS_KEY
CURRENCIES, ACCENT_COLORS, CATEGORY_ICONS, GROCERY_CATEGORIES
```

---

## Z-Index Reference

```
9999  SplashScreen
9998  PinLockScreen  
9997  IdleLockScreen
500   OrbitRecap
400+  Critical modals (remove PIN confirm)
300   PIN setup sheets, danger zone modal
200   Standard bottom sheets
999   Toast notifications (fixed top)
50    Tab bar nav
10    Page content
```

---

## Settings Interface

```typescript
interface Settings {
  currency:        string   // 'USD', 'PHP', etc.
  currencySymbol:  string   // '$', '₱', etc.
  shakeToAdd:      boolean
  idleLockEnabled: boolean
  idleLockMinutes: number   // 1-60
  accentColor:     string   // CSS hex e.g. '#8b5cf6'
  userName:        string
}
```

---

## PIN Security (usePin.ts)

```typescript
// SHA-256 hashed, never stored in plaintext
setPin(pin, hintQuestion, answer)  // async
verifyPin(attempt)                  // async → boolean
verifyAnswer(answer)                // async → boolean  
removePin()
lockWithPin()                       // sets isPinLocked = true
unlockPin()                         // sets isPinLocked = false

// Reactive
isPinLocked   // ref<boolean>
pinEnabled    // computed<boolean>
pinMeta       // readonly ref<PinMeta|null>
```

---

## Account Types & Balance Logic

```
ASSETS (balance tracked in tx):  debit, savings, investment, cash, prepaid, atm
LIABILITIES (not in tx total):   credit, loan

Initial balance on asset account → MUST call addTx() to affect totalBalance
Credit card limit → NOT a transaction (stored in acc.limit only)
```

---

## Dark Mode Classes

Always pair light/dark:
```
bg-white / dark:bg-zinc-900
bg-slate-100 / dark:bg-zinc-950  
bg-slate-50 / dark:bg-zinc-800
text-slate-900 / dark:text-zinc-50
text-slate-500 / dark:text-zinc-400
border-slate-200 / dark:border-zinc-800
```

---

## Transition Names Available

```
sheet           — slides up from bottom (for bottom sheets)
fade            — simple opacity
app-fade        — app entrance with scale
splash-out      — splash exit
toast           — toast enter/leave
lock-fade       — idle lock
pin-fade        — PIN screen
dropdown        — accordion expand/collapse
recap-slide     — OrbitRecap full-screen
```

---

## Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `$router.push('/settings')` | `navigate('settings')` |
| `'#8b5cf6'` hardcoded | `settings.value.accentColor` |
| `'$'` hardcoded | `settings.value.currencySymbol` |
| `accounts.value.push(x); cardsVersion.value++` | `const l = loadAccounts(); l.push(x); saveAccounts(l); cardsVersion.value++` |
| `import { addTx } from '~/composables/useStore'` in a `.vue` file (with `~/`) | Use relative path `'../composables/useStore'` in pages/components |
| `<form @submit.prevent="fn">` | `<button @click="fn">` (no form tags) |
| `v-if` on root `<div>` of a page | Wrap content, leave root div unconditional |

---

## Capacitor Notes

- `@capacitor/splash-screen` — hidden programmatically in `app.vue` `onMounted`
- `@capacitor/haptics` — can be imported in any component for tactile feedback
- SQLite is in `useDatabase.ts` — all ops wrapped in try/catch for web fallback
- `env(safe-area-inset-*)` — always use for fixed/absolute positioned elements

---

## When Things Don't Work

1. **Sheet not showing** → Check it's imported in `layouts/default.vue` and Teleported to body
2. **Balance not updating** → Check `addTx()` was called (not just account saved)  
3. **Accent not applying** → Check `injectAccent()` called in `app.vue` and classes use `violet-*`
4. **Page not navigating** → Check PageId added to `useNav.ts` and `PAGE_MAP` in layout
5. **Dark mode not working** → Check `dark:` classes present on all elements
6. **Cards not reloading** → Check `cardsVersion.value++` called after `saveAccounts()`