// composables/useNav.ts
import { ref, readonly } from 'vue'

export type PageId =
  | 'home' | 'env' | 'grocery' | 'bills' | 'more'
  | 'settings' | 'developer' | 'orb' | 'transactions'
  | 'profile' | 'randomizer' | 'about'
  | 'prompts' | 'passwords' | 'vibecode'

const TAB_ORDER: PageId[] = ['home', 'env', 'grocery', 'bills', 'more']

const activePage     = ref<PageId>('home')
const transitionName = ref<'slide-left' | 'slide-right'>('slide-left')

export function useNav() {
  function navigate(to: PageId) {
    const from = TAB_ORDER.indexOf(activePage.value)
    const dest = TAB_ORDER.indexOf(to)
    transitionName.value = dest >= from || dest === -1 ? 'slide-left' : 'slide-right'
    activePage.value = to
  }
  return { activePage: readonly(activePage), transitionName: readonly(transitionName), navigate, TAB_ORDER }
}