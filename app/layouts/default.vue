<template>
  <div
    class="flex flex-col w-full max-w-[430px] mx-auto bg-slate-100 dark:bg-zinc-950 transition-colors duration-300"
    style="height:100dvh;overflow:hidden;padding-top:env(safe-area-inset-top);"
  >
    <div class="relative flex-1" style="overflow:hidden;min-height:0;">
      <Transition :name="transitionName">
        <div :key="activePage" class="page-wrap">
          <component :is="currentPage" />
        </div>
      </Transition>
    </div>

    <!-- Only show tab bar on main tab pages -->
    <nav v-if="isTabPage"
      class="flex-shrink-0 flex items-center bg-white/80 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-slate-200/60 dark:border-zinc-800/60 z-50"
      style="padding-bottom:calc(8px + env(safe-area-inset-bottom));"
    >
      <button v-for="tab in leftTabs" :key="tab.id"
        class="flex-1 flex flex-col items-center gap-1 pt-2 pb-1 active:scale-90 transition-transform"
        @click="navigate(tab.id)">
        <div :class="['w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200',
          activePage === tab.id ? 'bg-violet-500 shadow-lg shadow-violet-500/30' : '']">
          <component :is="tab.icon" :size="20"
            :color="activePage === tab.id ? 'white' : isDark ? '#52525b' : '#94a3b8'"
            :stroke-width="activePage === tab.id ? 2.2 : 1.8" />
        </div>
        <span :class="['text-[10px] font-bold', activePage === tab.id ? 'text-violet-500' : 'text-slate-400 dark:text-zinc-600']">{{ tab.label }}</span>
      </button>

      <div class="flex-1 flex flex-col items-center pt-1 pb-1">
        <button @click="quickAddOpen = true"
          class="relative -mt-6 w-14 h-14 rounded-full bg-violet-500 flex items-center justify-center shadow-xl shadow-violet-500/40 active:scale-90 transition-all duration-200 border-4 border-white dark:border-zinc-950">
          <Plus :size="26" color="white" :stroke-width="2.5" />
        </button>
        <span class="text-[10px] font-bold text-slate-400 dark:text-zinc-600 mt-1">Add</span>
      </div>

      <button v-for="tab in rightTabs" :key="tab.id"
        class="flex-1 flex flex-col items-center gap-1 pt-2 pb-1 active:scale-90 transition-transform"
        @click="navigate(tab.id)">
        <div :class="['relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200',
          activePage === tab.id ? 'bg-violet-500 shadow-lg shadow-violet-500/30' : '']">
          <component :is="tab.icon" :size="20"
            :color="activePage === tab.id ? 'white' : isDark ? '#52525b' : '#94a3b8'"
            :stroke-width="activePage === tab.id ? 2.2 : 1.8" />
          <!-- Overdue badge on Bills tab -->
          <div v-if="tab.id === 'bills' && overdueBillsCount > 0 && activePage !== 'bills'"
            class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
            <span class="text-[9px] font-black text-white">{{ overdueBillsCount }}</span>
          </div>
        </div>
        <span :class="['text-[10px] font-bold', activePage === tab.id ? 'text-violet-500' : 'text-slate-400 dark:text-zinc-600']">{{ tab.label }}</span>
      </button>
    </nav>
  </div>

  <Teleport to="body">
    <AddTransactionSheet />
    <AiDownloadPill />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Home, CreditCard, Zap, MoreHorizontal, Plus } from 'lucide-vue-next'
import { useNav }       from '../composables/useNav'
import { useDark }      from '../composables/useDark'
import { quickAddOpen, settings, orbLog, overdueBillsCount } from '../composables/useStore'
import { useShake }     from '../composables/useShake'
import AddTransactionSheet from '../components/AddTransactionSheet.vue'
import AiDownloadPill      from '../components/AiDownloadPill.vue'
import Index        from '../pages/index.vue'
import Cards        from '../pages/cards.vue'
import Grocery      from '../pages/grocery.vue'
import Bills        from '../pages/bills.vue'
import More         from '../pages/more.vue'
import Settings     from '../pages/settings.vue'
import Developer    from '../pages/developer.vue'
import Transactions from '../pages/transaction.vue'
import OrbChat      from '../components/OrbChat.vue'
import Profile      from '../pages/profile.vue'
import Randomizer   from '../pages/randomizer.vue'
import BuyOrNot     from '../pages/randomizer.vue'
import About        from '../pages/about.vue'

const { activePage, transitionName, navigate, TAB_ORDER } = useNav()
const { isDark } = useDark()

const TAB_PAGES = new Set(['home','cards','grocery','bills','more'])
const isTabPage = computed(() => TAB_PAGES.has(activePage.value))

const PAGE_MAP: Record<string,any> = {
  home: Index, cards: Cards, grocery: Grocery,
  bills: Bills, more: More,
  settings: Settings, developer: Developer,
  transactions: Transactions, orb: OrbChat,
  profile: Profile, randomizer: Randomizer,
  buyornot: BuyOrNot, about: About,
}
const currentPage = computed(() => PAGE_MAP[activePage.value])

const leftTabs  = [{ id:'home', icon:Home, label:'Home' }, { id:'cards', icon:CreditCard, label:'Accounts' }]
const rightTabs = [{ id:'bills', icon:Zap, label:'Bills' }, { id:'more', icon:MoreHorizontal, label:'More' }]

function handlePop() {
  const idx = TAB_ORDER.indexOf(activePage.value)
  if (idx > 0) navigate(TAB_ORDER[idx - 1])
  else if (!TAB_PAGES.has(activePage.value)) navigate('more')
  history.pushState({ page: activePage.value }, '')
}
onMounted(() => { history.pushState({ page: activePage.value }, ''); window.addEventListener('popstate', handlePop) })
onUnmounted(() => window.removeEventListener('popstate', handlePop))

useShake(() => {
  if (settings.value.shakeToAdd && !quickAddOpen.value) {
    quickAddOpen.value = true
    orbLog('Shake triggered add-transaction')
  }
}, { threshold: 35, hitsRequired: 3 })
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
.font-nunito { font-family:'Nunito',sans-serif; }
* { -webkit-user-select:none!important; user-select:none!important; -webkit-touch-callout:none!important; }
input, textarea { -webkit-user-select:text!important; user-select:text!important; }
.scrollbar-hide::-webkit-scrollbar { display:none; }
.scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }

.page-wrap {
  position:absolute; top:0; left:0; right:0; bottom:0;
  overflow-y:scroll; overflow-x:hidden;
  -webkit-overflow-scrolling:touch;
  touch-action:pan-y;
  overscroll-behavior-y:contain;
}
.page-wrap::-webkit-scrollbar { display:none; }

.slide-left-enter-active, .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active {
  transition: transform .32s cubic-bezier(.35,0,.15,1), opacity .32s cubic-bezier(.35,0,.15,1);
}
.slide-left-enter-from  { transform:translateX(100%);  opacity:0; }
.slide-left-leave-to    { transform:translateX(-25%);  opacity:0; }
.slide-right-enter-from { transform:translateX(-100%); opacity:0; }
.slide-right-leave-to   { transform:translateX(25%);   opacity:0; }
</style>