<template>
  <Transition name="splash-out" @after-leave="$emit('done')">
    <div v-if="visible"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950 overflow-hidden">

      <!-- Ambient background glow -->
      <div class="absolute inset-0">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full transition-opacity duration-[1200ms]"
          :class="glowActive ? 'opacity-30' : 'opacity-0'"
          :style="{ background: `radial-gradient(circle, ${accent} 0%, ${accentDark} 40%, transparent 70%)` }"></div>
      </div>

      <!-- Orb wrapper — morphs to home position during leave -->
      <div class="orb-wrapper" :class="[logoScale, morphing ? 'orb-morphing' : '']">

        <!-- Accretion disc rings -->
        <div v-for="ring in rings" :key="ring.id"
          class="absolute rounded-full ring-el"
          :style="{
            width:  ring.size + 'px',
            height: ring.size + 'px',
            opacity: morphing ? ring.opacity * 0.4 : ring.opacity,
            borderWidth:  ring.thick + 'px',
            borderStyle:  'solid',
            borderColor:  accentWithAlpha(ring.alpha),
            animationName: ring.dir === 'reverse' ? 'orb-spin-r' : 'orb-spin',
            animationDuration: ring.dur + 's',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDelay: ring.delay + 's',
            transition: 'opacity 0.4s ease',
          }"
        ></div>

        <!-- Lensing glow -->
        <div class="absolute rounded-full lens-glow" style="width:88px;height:88px;"
          :style="{ boxShadow: `0 0 40px 12px ${accentWithAlpha(0.5)}, 0 0 80px 24px ${accentWithAlpha(0.25)}` }"></div>

        <!-- Event horizon (the core orb sphere) -->
        <div class="relative w-20 h-20 rounded-full flex items-center justify-center horizon">
          <div class="absolute inset-0 rounded-full shimmer"
            :style="{ background: `radial-gradient(circle at 30% 30%, ${accentWithAlpha(0.15)} 0%, transparent 60%)` }"></div>
          <span class="relative z-10 orb-wordmark" :class="morphing ? 'opacity-0' : 'opacity-100'"
            style="transition:opacity 0.3s ease;">ORB</span>
        </div>

        <!-- Orbiting particles -->
        <div v-for="p in particles" :key="'p' + p.id"
          class="absolute rounded-full particle"
          :style="{
            width:   p.size + 'px',
            height:  p.size + 'px',
            opacity: morphing ? 0 : p.alpha,
            background: accent,
            animationName: 'orb-orbit-' + p.id,
            animationDuration: p.dur + 's',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            transition: 'opacity 0.3s ease',
          }"
        ></div>
      </div>

      <!-- Tagline -->
      <div class="absolute bottom-20 flex flex-col items-center gap-1 tagline-wrap"
        :class="[textVisible && !morphing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3']">
        <p class="text-[11px] font-bold text-zinc-600 tracking-[0.3em] uppercase">Orb DevKit</p>
        <p class="text-[10px] text-zinc-500">Developer Environment</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits(['done'])

const visible     = ref(true)
const glowActive  = ref(false)
const textVisible = ref(false)
const logoScale   = ref('scale-75 opacity-0')
const morphing    = ref(false)

// ── Read accent from localStorage ──────────────────────────
const SETTINGS_KEY = 'orb_settings_v1'
function readAccent(): string {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.accentColor) return parsed.accentColor
    }
  } catch {}
  return '#8b5cf6'
}

const accentHex = ref(readAccent())
const accent    = computed(() => accentHex.value)

const accentDark = computed(() => {
  const hex = accentHex.value.replace('#', '')
  const r = Math.round(parseInt(hex.slice(0,2),16) * 0.6)
  const g = Math.round(parseInt(hex.slice(2,4),16) * 0.6)
  const b = Math.round(parseInt(hex.slice(4,6),16) * 0.6)
  return `rgb(${r},${g},${b})`
})

function accentWithAlpha(a: number): string {
  const hex = accentHex.value.replace('#','')
  const r = parseInt(hex.slice(0,2),16)
  const g = parseInt(hex.slice(2,4),16)
  const b = parseInt(hex.slice(4,6),16)
  return `rgba(${r},${g},${b},${a})`
}

const rings = [
  { id:1, size:130, thick:1,   alpha:0.6,  opacity:0.8,  dur:8,  dir:'normal',  delay:0    },
  { id:2, size:160, thick:0.5, alpha:0.35, opacity:0.6,  dur:12, dir:'reverse', delay:-3   },
  { id:3, size:195, thick:1,   alpha:0.2,  opacity:0.5,  dur:18, dir:'normal',  delay:-6   },
  { id:4, size:230, thick:0.5, alpha:0.12, opacity:0.35, dur:25, dir:'reverse', delay:-10  },
  { id:5, size:270, thick:0.5, alpha:0.07, opacity:0.25, dur:35, dir:'normal',  delay:-15  },
]

const particles = [
  { id:1, size:2.5, alpha:0.9, dur:4  },
  { id:2, size:1.5, alpha:0.7, dur:6  },
  { id:3, size:2,   alpha:0.5, dur:9  },
  { id:4, size:1,   alpha:0.6, dur:13 },
  { id:5, size:1.5, alpha:0.4, dur:7  },
]

onMounted(async () => {
  accentHex.value = readAccent()

  await delay(120)
  glowActive.value = true
  logoScale.value  = 'scale-100 opacity-100'

  await delay(600)
  textVisible.value = true

  await delay(1400)

  // Begin morph: scale down and fade particles/rings — orb shrinks toward where it'll live
  morphing.value = true

  await delay(500)

  // Now fade out the whole splash
  visible.value = false
  // 'done' is emitted after the leave transition via @after-leave
})

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@900&display=swap');

@keyframes orb-spin   { from{transform:rotate(0deg)}   to{transform:rotate(360deg)}  }
@keyframes orb-spin-r { from{transform:rotate(360deg)} to{transform:rotate(0deg)}    }

@keyframes orb-orbit-1 {
  0%   { transform:rotate(0deg)   translateX(54px)  rotate(0deg);    }
  100% { transform:rotate(360deg) translateX(54px)  rotate(-360deg); }
}
@keyframes orb-orbit-2 {
  0%   { transform:rotate(120deg) translateX(70px)  rotate(-120deg); }
  100% { transform:rotate(480deg) translateX(70px)  rotate(-480deg); }
}
@keyframes orb-orbit-3 {
  0%   { transform:rotate(240deg) translateX(90px)  rotate(-240deg); }
  100% { transform:rotate(600deg) translateX(90px)  rotate(-600deg); }
}
@keyframes orb-orbit-4 {
  0%   { transform:rotate(60deg)  translateX(110px) rotate(-60deg);  }
  100% { transform:rotate(420deg) translateX(110px) rotate(-420deg); }
}
@keyframes orb-orbit-5 {
  0%   { transform:rotate(180deg) translateX(130px) rotate(-180deg); }
  100% { transform:rotate(540deg) translateX(130px) rotate(-540deg); }
}

/* Orb wrapper — centers in screen normally */
.orb-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 300px;
  height: 300px;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease;
}

/* When morphing: shrink and move toward where home orb lives */
/* Home orb is approximately at: center-x, ~35% from top of screen */
.orb-morphing {
  transform: scale(0.3) translateY(-140px) !important;
}

.logo-wrap {
  transition: transform 1.2s cubic-bezier(0.34,1.1,0.64,1), opacity 1.2s ease;
}

/* scale-75/100 classes applied via :class */
.scale-75  { transform: scale(0.75); }
.scale-100 { transform: scale(1); }
.opacity-0 { opacity: 0; }
.opacity-100 { opacity: 1; }

/* orb-wrapper inherits both logo and scale transitions */
.scale-75.opacity-0 { transform: scale(0.75); opacity: 0; }
.scale-100.opacity-100 { transform: scale(1); opacity: 1; }

.horizon {
  background: radial-gradient(circle at 40% 35%, #18181b 0%, #09090b 60%, #000 100%);
  box-shadow: inset 0 0 20px rgba(0,0,0,0.9);
}

.orb-wordmark {
  font-family: 'Nunito', sans-serif;
  font-weight: 900;
  font-size: 15px;
  color: rgba(255,255,255,0.9);
  letter-spacing: 0.25em;
}

.tagline-wrap {
  transition: opacity 0.8s cubic-bezier(0.34,1.1,0.64,1), transform 0.8s cubic-bezier(0.34,1.1,0.64,1);
}

/* Splash leave: the whole overlay fades + scales up slightly */
.splash-out-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.splash-out-leave-to {
  opacity: 0;
  transform: scale(1.04);
}
</style>