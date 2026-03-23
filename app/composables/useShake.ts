// composables/useShake.ts
import { onMounted, onUnmounted } from 'vue'

interface ShakeOptions {
  threshold?:    number
  hitsRequired?: number
  hitWindowMs?:  number
  cooldownMs?:   number
}

export function useShake(callback: () => void, options: ShakeOptions = {}) {
  const {
    threshold    = 35,
    hitsRequired = 3,
    hitWindowMs  = 600,
    cooldownMs   = 2000,
  } = options

  let lastX: number | null = null
  let lastY: number | null = null
  let lastZ: number | null = null
  let hitCount   = 0
  let firstHitAt = 0
  let lastFiredAt = 0

  function handleMotion(e: DeviceMotionEvent) {
    const acc = e.accelerationIncludingGravity
    if (!acc) return
    const { x, y, z } = acc
    if (x === null || y === null || z === null) return
    if (lastX === null) { lastX = x ?? 0; lastY = y ?? 0; lastZ = z ?? 0; return }
    const deltaX = Math.abs((x ?? 0) - lastX)
    const deltaY = Math.abs((y ?? 0) - lastY)
    const deltaZ = Math.abs((z ?? 0) - lastZ)
    const total  = deltaX + deltaY + deltaZ
    lastX = x ?? 0; lastY = y ?? 0; lastZ = z ?? 0
    const now = Date.now()
    if (total > threshold) {
      if (hitCount === 0) {
        firstHitAt = now; hitCount = 1
      } else if (now - firstHitAt <= hitWindowMs) {
        hitCount++
        if (hitCount >= hitsRequired) {
          if (now - lastFiredAt >= cooldownMs) { lastFiredAt = now; callback() }
          hitCount = 0
        }
      } else {
        firstHitAt = now; hitCount = 1
      }
    }
  }

  onMounted(() => {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window)
      window.addEventListener('devicemotion', handleMotion)
  })
  onUnmounted(() => {
    if (typeof window !== 'undefined')
      window.removeEventListener('devicemotion', handleMotion)
  })
}