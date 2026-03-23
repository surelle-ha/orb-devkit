/**
 * useSwipeDown.ts
 * Attach to any bottom sheet to enable swipe-down-to-close.
 * Usage: const { sheetStyle, onTouchStart, onTouchMove, onTouchEnd } = useSwipeDown(onClose)
 */
import { ref, computed } from 'vue'

export function useSwipeDown(onClose: () => void, threshold = 80) {
  const startY    = ref(0)
  const currentY  = ref(0)
  const dragging  = ref(false)

  const translateY = computed(() =>
    dragging.value ? Math.max(0, currentY.value - startY.value) : 0
  )

  const sheetStyle = computed(() => ({
    transform:  `translateY(${translateY.value}px)`,
    transition: dragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.32,1.1,0.64,1)',
    opacity:    dragging.value ? Math.max(0.4, 1 - translateY.value / 300) : 1,
  }))

  function onTouchStart(e: TouchEvent) {
    startY.value   = e.touches[0].clientY
    currentY.value = e.touches[0].clientY
    dragging.value = true
  }

  function onTouchMove(e: TouchEvent) {
    if (!dragging.value) return
    currentY.value = e.touches[0].clientY
  }

  function onTouchEnd() {
    dragging.value = false
    if (translateY.value >= threshold) {
      onClose()
    }
    startY.value   = 0
    currentY.value = 0
  }

  return { sheetStyle, onTouchStart, onTouchMove, onTouchEnd, translateY }
}