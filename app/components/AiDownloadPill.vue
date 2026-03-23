<template>
  <Transition name="pill">
    <div v-if="show"
      ref="pillEl"
      class="fixed z-[450] flex items-center gap-2.5 rounded-2xl px-3.5 py-3 select-none"
      :style="pillStyle"
      @pointerdown="onPointerDown"
      @click.capture="onClickCapture">

      <!-- Arc progress ring -->
      <div class="relative flex-shrink-0" style="width:36px;height:36px;">
        <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none"
            stroke="rgba(255,255,255,0.07)" stroke-width="2.5"/>
          <circle cx="18" cy="18" r="14" fill="none"
            :stroke="accent" stroke-width="2.5" stroke-linecap="round"
            :stroke-dasharray="`${progress * 0.879} 87.9`"
            style="transition:stroke-dasharray 0.7s ease;"/>
        </svg>
        <div class="absolute rounded-full"
          style="inset:7px;background:radial-gradient(circle at 38% 32%,#1a1a2e 0%,#000 100%);"
          :style="{ boxShadow:`0 0 8px 2px ${accent}55` }"></div>
        <!-- Load pulse ring -->
        <div v-if="progress >= 88"
          class="absolute inset-0 rounded-full pill-pulse-ring"
          :style="{ border:`1px solid ${accent}55` }"></div>
      </div>

      <!-- Text -->
      <div class="flex-1 min-w-0" style="cursor:default;">
        <p class="text-[12px] font-black text-white leading-none mb-0.5">Orb AI</p>
        <p class="text-[10px] font-semibold leading-none" :style="{ color: accent + 'CC' }">
          {{ progress < 88 ? `Downloading · ${progress}%` : 'Orb AI loading…' }}
        </p>
      </div>

      <!-- Vertical progress bar -->
      <div class="w-1.5 h-10 rounded-full flex-shrink-0 overflow-hidden"
        style="background:rgba(255,255,255,0.07);">
        <div class="w-full rounded-full transition-all duration-700"
          :style="{ height: progress + '%', background: accent, marginTop: (100 - progress) + '%' }">
        </div>
      </div>

      <!-- Dismiss -->
      <button class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style="background:rgba(255,255,255,0.08);"
        @pointerdown.stop
        @click.stop="dismissed = true">
        <X :size="9" class="text-zinc-400" :stroke-width="3" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import { useNativeLLM } from '../composables/useNativeLLM'
import { settings }     from '../composables/useStore'
import { useNav }       from '../composables/useNav'

const { isLoading, isReady, progress } = useNativeLLM()
const { navigate } = useNav()
const accent    = computed(() => settings.value.accentColor)
const dismissed = ref(false)
const pillEl    = ref<HTMLElement | null>(null)

const show = computed(() => isLoading.value && !isReady.value && !dismissed.value)

// ── Drag state ─────────────────────────────────────────────
// Default position: bottom-right, above tab bar
const DEFAULT_RIGHT  = 16
const DEFAULT_BOTTOM = 88 + 16   // above tab bar + gap
const pos = ref({ x: -1, y: -1 })   // -1 = use CSS default
const dragging = ref(false)

let startPx = 0, startPy = 0   // pointer start
let startEx = 0, startEy = 0   // element start (left/top)
let didDrag = false

const pillStyle = computed(() => {
  const base: Record<string, string> = {
    background: 'rgba(9,9,11,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: `1px solid ${accent.value}44`,
    cursor: dragging.value ? 'grabbing' : 'grab',
    transition: dragging.value ? 'none' : 'box-shadow 0.2s ease',
  }

  if (pos.value.x === -1) {
    // Default CSS position
    base.right  = DEFAULT_RIGHT + 'px'
    base.bottom = `calc(${DEFAULT_BOTTOM}px + env(safe-area-inset-bottom))`
  } else {
    // Dragged position (left/top based)
    base.left   = pos.value.x + 'px'
    base.top    = pos.value.y + 'px'
    base.right  = 'auto'
    base.bottom = 'auto'
  }

  if (dragging.value) {
    base.boxShadow = `0 12px 40px rgba(0,0,0,0.7), 0 0 0 2px ${accent.value}66`
  }

  return base
})

function onPointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('button')) return  // let dismiss button through
  e.preventDefault()
  didDrag = false
  dragging.value = true
  startPx = e.clientX
  startPy = e.clientY

  const el = pillEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  startEx = rect.left
  startEy = rect.top

  // Switch to absolute positioning immediately
  pos.value = { x: rect.left, y: rect.top }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup',   onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  const dx = e.clientX - startPx
  const dy = e.clientY - startPy
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true

  const el = pillEl.value
  if (!el) return
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w  = el.offsetWidth
  const h  = el.offsetHeight

  const newX = Math.max(8, Math.min(vw - w - 8, startEx + dx))
  const newY = Math.max(8, Math.min(vh - h - 8, startEy + dy))
  pos.value = { x: newX, y: newY }
}

function onPointerUp() {
  dragging.value = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup',   onPointerUp)
}

// Suppress click navigation if user just dragged
function onClickCapture(e: MouseEvent) {
  if (didDrag) {
    e.stopPropagation()
    e.preventDefault()
    didDrag = false
    return
  }
  navigate('orb')
}

// Reset position when pill hides so it comes back in default spot
import { watch } from 'vue'
watch(show, (v) => { if (!v) { pos.value = { x: -1, y: -1 }; dismissed.value = false } })

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup',   onPointerUp)
})
</script>

<style scoped>
@keyframes pill-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1);   }
  50%       { opacity: 0;   transform: scale(1.18); }
}
.pill-pulse-ring { animation: pill-pulse 1.4s ease-in-out infinite; }

.pill-enter-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.1,0.64,1); }
.pill-leave-active { transition: opacity 0.25s ease, transform 0.2s ease; }
.pill-enter-from   { opacity: 0; transform: translateY(12px) scale(0.9); }
.pill-leave-to     { opacity: 0; transform: translateY(6px)  scale(0.95); }
</style>