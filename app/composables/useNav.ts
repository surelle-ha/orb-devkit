// composables/useNav.ts
import { ref, readonly } from 'vue'

export type PageId =
  | 'home' | 'env' | 'more'
  | 'settings' | 'developer' | 'orb'
  | 'profile' | 'about'
  | 'passwords' | 'devices'
  | 'faq'

const TAB_ORDER: PageId[] = ['home', 'env', 'more', 'devices']

const activePage     = ref<PageId>('home')
const transitionName = ref<'slide-left' | 'slide-right'>('slide-left')

// Expose a way for pages to pass params (e.g. which device to highlight)
const navParams = ref<Record<string, any>>({})

export function useNav() {
  function navigate(to: PageId, params?: Record<string, any>) {
    const from = TAB_ORDER.indexOf(activePage.value)
    const dest = TAB_ORDER.indexOf(to)
    transitionName.value = dest >= from || dest === -1 ? 'slide-left' : 'slide-right'
    activePage.value = to
    navParams.value  = params ?? {}
  }
  return {
    activePage:     readonly(activePage),
    transitionName: readonly(transitionName),
    navParams:      readonly(navParams),
    navigate,
    TAB_ORDER,
  }
}