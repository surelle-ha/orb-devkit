<template>
  <div class="fixed inset-0 z-[9996] bg-zinc-950 flex flex-col items-center justify-center overflow-hidden"
    :style="{ paddingTop:'env(safe-area-inset-top)', paddingBottom:'env(safe-area-inset-bottom)' }">

    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute rounded-full" :style="nebula1"></div>
      <div class="absolute rounded-full" :style="nebula2"></div>
    </div>

    <Transition name="ai-fade" mode="out-in">
      <div v-if="phase === 'choice'" key="choice"
        class="flex flex-col items-center px-8 z-10 w-full max-w-[380px]">

        <div class="relative mb-8" style="width:96px;height:96px;">
          <div class="absolute inset-0 rounded-full orb-ring-a" :style="{ border:`1px solid ${accent}55` }"></div>
          <div class="absolute rounded-full orb-ring-b" :style="{ inset:'-10px', border:`0.5px solid ${accent}28` }"></div>
          <div class="absolute rounded-full" :style="orbCore"></div>
          <div class="absolute rounded-full" :style="orbShine"></div>
        </div>

        <p class="text-[11px] font-bold text-violet-400 uppercase tracking-[0.3em] mb-3">AI Assistant</p>
        <h1 class="text-[28px] font-black text-white leading-tight tracking-tight mb-3 text-center">Meet Orb AI</h1>
        <p class="text-[13px] text-zinc-400 leading-relaxed text-center mb-8 max-w-[300px]">
          A private, Orb AI that understands your finances. Runs fully offline after a one-time download.
        </p>

        <div class="flex flex-col gap-2.5 w-full mb-8">
          <div v-for="f in features" :key="f.label"
            class="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
            <span class="text-[18px]">{{ f.emoji }}</span>
            <div>
              <p class="text-[13px] font-bold text-zinc-200">{{ f.label }}</p>
              <p class="text-[11px] text-zinc-500">{{ f.sub }}</p>
            </div>
          </div>
        </div>

        <button @click="startDownload"
          class="w-full py-4 rounded-2xl text-[16px] font-black text-white active:scale-[0.97] transition-all mb-3"
          :style="{ background:`linear-gradient(135deg,#6d28d9,#8b5cf6)`, boxShadow:`0 8px 24px ${accent}44` }">
          ✦ Enable Orb AI <span class="text-[12px] font-semibold opacity-60 ml-1">~800 MB</span>
        </button>
        <button @click="skip"
          class="w-full py-3 rounded-2xl text-[14px] font-semibold text-zinc-600 active:opacity-60">
          Skip for now
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AI_ENABLED_KEY, AI_SETUP_KEY } from '../composables/useOrbAI'
import { initNativeModel } from '../composables/useNativeLLM'
import { settings } from '../composables/useStore'

const emit = defineEmits<{ done: [] }>()

const accent = computed(() => settings.value.accentColor)
const phase  = ref<'choice'>('choice')

const nebula1 = computed(() => ({
  width:'400px', height:'400px', top:'-80px', left:'-100px',
  background:`radial-gradient(circle,${accent.value}1A 0%,transparent 65%)`,
  filter:'blur(40px)',
}))
const nebula2 = computed(() => ({
  width:'300px', height:'300px', bottom:'-60px', right:'-80px',
  background:`radial-gradient(circle,${accent.value}12 0%,transparent 60%)`,
  filter:'blur(50px)',
}))
const orbCore = computed(() => ({
  borderRadius:'50%',
  background:'radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 55%,#000 100%)',
  boxShadow:`inset 0 0 24px rgba(0,0,0,1),0 0 0 1px ${accent.value}44,0 0 24px 6px ${accent.value}22`,
}))
const orbShine = computed(() => ({
  borderRadius:'50%',
  background:`radial-gradient(circle at 28% 26%,${accent.value}22 0%,transparent 55%)`,
}))

const features = [
  { emoji:'🔒', label:'Fully private',    sub:'Nothing leaves your phone'         },
  { emoji:'✈️', label:'Works offline',    sub:'No internet needed after setup'    },
  { emoji:'💸', label:'Free forever',     sub:'No API costs, no subscriptions'    },
  { emoji:'🤖', label:'Orb AI',       sub:'Private · Offline · ~800 MB'          },
]

function startDownload() {
  // Save prefs immediately
  try { localStorage.setItem(AI_ENABLED_KEY, 'true') } catch {}
  try { localStorage.setItem(AI_SETUP_KEY,   'true') } catch {}

  // Fire and forget — download runs in background
  // llmReady event auto-activates OrbChat when done
  initNativeModel().catch((e: any) => {
    console.warn('[Orb] AI download failed:', e?.message)
  })

  // Let user into the app right away
  emit('done')
}

function skip() {
  try { localStorage.setItem(AI_ENABLED_KEY, 'false') } catch {}
  try { localStorage.setItem(AI_SETUP_KEY,   'true')  } catch {}
  emit('done')
}
</script>

<style scoped>
@keyframes orb-ring-spin-a { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes orb-ring-spin-b { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
.orb-ring-a { animation: orb-ring-spin-a 12s linear infinite; }
.orb-ring-b { animation: orb-ring-spin-b 20s linear infinite; }
.ai-fade-enter-active { transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.1,0.64,1); }
.ai-fade-leave-active { transition: opacity 0.25s ease; }
.ai-fade-enter-from   { opacity: 0; transform: translateY(16px); }
.ai-fade-leave-to     { opacity: 0; }
</style>