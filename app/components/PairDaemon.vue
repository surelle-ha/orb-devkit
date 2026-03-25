<template>
  <div class="devkit-root pb-28" style="touch-action:pan-y;min-height:100dvh;">

    <!-- Header -->
    <div class="flex items-center gap-3 px-5 pt-6 pb-4">
      <button @click="handleBack"
        class="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
        style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
        <ChevronLeft :size="18" class="text-zinc-300" :stroke-width="2.5" />
      </button>
      <div class="flex-1">
        <p class="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase">orb devkit / daemon</p>
        <h1 class="text-[22px] font-black text-zinc-50 tracking-tight mt-0.5 font-mono">
          <span :style="{ color: accent }">›</span>
          {{ stepTitle }}
        </h1>
      </div>
      <!-- Step indicator -->
      <div class="flex items-center gap-1.5">
        <div v-for="i in 3" :key="i"
          class="rounded-full transition-all duration-300"
          :style="{
            width: currentStepIndex === i - 1 ? '20px' : '6px',
            height: '6px',
            background: currentStepIndex >= i - 1 ? accent : 'rgba(255,255,255,0.1)'
          }">
        </div>
      </div>
    </div>

    <!-- ══ STEP: IDLE (Instructions) ══ -->
    <template v-if="step === 'idle'">
      <!-- Hero card -->
      <div class="mx-4 mb-5 rounded-3xl overflow-hidden relative"
        :style="{ background: `linear-gradient(135deg, #0a0a14, ${accent}18)`, border: `1px solid ${accent}30` }">
        <div class="absolute inset-0 pointer-events-none"
          :style="{ background: `radial-gradient(ellipse at 80% 20%, ${accent}20 0%, transparent 60%)` }"></div>
        
        <!-- Animated orb -->
        <div class="flex flex-col items-center pt-8 pb-6 relative">
          <div class="relative" style="width:90px;height:90px;">
            <div class="absolute inset-0 rounded-full pair-ring-1" :style="{ border: `1px solid ${accent}44` }"></div>
            <div class="absolute rounded-full pair-ring-2" :style="{ inset:'8px', border: `0.5px solid ${accent}30` }"></div>
            <div class="absolute rounded-full"
              :style="{ inset:'16px', boxShadow: `0 0 20px 6px ${accent}55`, borderRadius:'50%' }"></div>
            <div class="absolute rounded-full"
              style="inset:16px;background:radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 55%,#000 100%);"
              :style="{ boxShadow: `inset 0 0 16px rgba(0,0,0,1), 0 0 0 1px ${accent}33` }"></div>
            <div class="absolute rounded-full"
              style="inset:16px;"
              :style="{ background: `radial-gradient(circle at 28% 26%, ${accent}30 0%, transparent 55%)` }"></div>
          </div>
          <p class="mt-4 text-[18px] font-black text-zinc-100">Connect your desktop</p>
          <p class="mt-1 text-[12px] font-mono text-zinc-500 text-center px-6 leading-relaxed">
            Pair the Orb daemon to sync ENV vars,<br>vault entries &amp; AI platform blocklists
          </p>
        </div>
      </div>

      <!-- Steps -->
      <div class="px-5 pb-2">
        <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">setup_steps</p>
      </div>
      <div class="flex flex-col gap-2 mx-4 mb-5">
        <div v-for="(s, i) in setupSteps" :key="i"
          class="flex items-start gap-4 px-4 py-3.5 rounded-2xl"
          style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
          <div class="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            :style="{ background: accent + '18', border: `1px solid ${accent}30` }">
            <span class="text-[11px] font-black font-mono" :style="{ color: accent }">{{ i + 1 }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-bold font-mono text-zinc-200">{{ s.label }}</p>
            <p class="text-[11px] font-mono text-zinc-600 mt-0.5 leading-relaxed">{{ s.sub }}</p>
            <div v-if="s.code" class="mt-2 px-3 py-1.5 rounded-lg inline-block"
              style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
              <code class="text-[11px] font-mono" :style="{ color: accent }">{{ s.code }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-col gap-2.5 px-4">
        <button @click="startScan"
          class="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[15px] font-black font-mono active:scale-[0.98] transition-all"
          :style="{ background: accent, color: '#fff', boxShadow: `0 8px 24px ${accent}44` }">
          <QrCode :size="19" :stroke-width="2.2" />
          Scan QR Code
        </button>

        <button @click="step = 'manual'"
          class="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-[14px] font-bold font-mono active:scale-[0.98] transition-all"
          style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#71717a;">
          <Keyboard :size="17" :stroke-width="1.8" />
          Enter manually
        </button>
      </div>

      <!-- Error display -->
      <Transition name="err-slide">
        <div v-if="pairError" class="mx-4 mt-4 rounded-2xl overflow-hidden"
          style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);">
          <!-- Error header -->
          <div class="flex items-center gap-2.5 px-4 py-3 border-b border-rose-900/30">
            <AlertCircle :size="15" class="text-rose-400 flex-shrink-0" :stroke-width="2" />
            <p class="text-[12px] font-black font-mono text-rose-300 flex-1">connection_failed</p>
            <button @click="pairError = null" class="text-rose-700 active:text-rose-400 flex-shrink-0">
              <X :size="14" :stroke-width="2.5" />
            </button>
          </div>
          <!-- Error body — show each line of the message -->
          <div class="px-4 py-3 space-y-1">
            <p v-for="(line, i) in pairErrorLines" :key="i"
              class="text-[11px] font-mono leading-relaxed"
              :class="i === 0 ? 'text-rose-300' : 'text-rose-500/70'">
              {{ line }}
            </p>
          </div>
          <!-- Checklist hint -->
          <div class="px-4 pb-3 flex flex-col gap-1.5">
            <p class="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1">check_these</p>
            <div v-for="hint in connectionHints" :key="hint"
              class="flex items-center gap-2">
              <div class="w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0"></div>
              <p class="text-[10px] font-mono text-zinc-600">{{ hint }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </template>

    <!-- ══ STEP: SCANNING ══ -->
    <template v-else-if="step === 'scanning'">
      <div class="mx-4 mb-4">
        <!-- Camera viewfinder -->
        <div class="relative rounded-3xl overflow-hidden bg-zinc-950"
          style="aspect-ratio:1;">
          
          <video
            ref="videoRef"
            class="w-full h-full object-cover"
            autoplay
            playsinline
            muted>
          </video>

          <!-- Dimming overlay with cutout illusion using box-shadow -->
          <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div class="relative" style="width:200px;height:200px;">
              <!-- Corners -->
              <div class="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] rounded-tl-2xl"
                :style="{ borderColor: accent }"></div>
              <div class="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] rounded-tr-2xl"
                :style="{ borderColor: accent }"></div>
              <div class="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] rounded-bl-2xl"
                :style="{ borderColor: accent }"></div>
              <div class="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] rounded-br-2xl"
                :style="{ borderColor: accent }"></div>
              <!-- Scan line -->
              <div class="absolute left-3 right-3 h-0.5 rounded-full scan-line"
                :style="{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }"></div>
            </div>
          </div>

          <!-- Dark overlay outside viewfinder -->
          <div class="absolute inset-0 pointer-events-none"
            style="background:linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55));
                   -webkit-mask:
                     linear-gradient(#fff,#fff) top/100% calc(50% - 100px),
                     linear-gradient(#fff,#fff) left/calc(50% - 100px) 200px,
                     linear-gradient(#fff,#fff) right/calc(50% - 100px) 200px,
                     linear-gradient(#fff,#fff) bottom/100% calc(50% - 100px);
                   -webkit-mask-repeat:no-repeat;
                   mask:
                     linear-gradient(#fff,#fff) top/100% calc(50% - 100px),
                     linear-gradient(#fff,#fff) left/calc(50% - 100px) 200px,
                     linear-gradient(#fff,#fff) right/calc(50% - 100px) 200px,
                     linear-gradient(#fff,#fff) bottom/100% calc(50% - 100px);
                   mask-repeat:no-repeat;">
          </div>

          <!-- Status badge -->
          <div class="absolute top-4 left-0 right-0 flex justify-center">
            <div class="flex items-center gap-2 px-3.5 py-2 rounded-xl"
              style="background:rgba(6,8,16,0.85);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.1);">
              <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span class="text-[12px] font-mono font-bold text-zinc-200">{{ scanStatus }}</span>
            </div>
          </div>

          <!-- Loading state if camera not ready -->
          <div v-if="cameraLoading" class="absolute inset-0 flex flex-col items-center justify-center"
            style="background:rgba(6,8,16,0.9);">
            <div class="w-10 h-10 rounded-full border-2 border-transparent pair-spin-fast mb-4"
              :style="{ borderTopColor: accent }"></div>
            <p class="text-[12px] font-mono text-zinc-400">Starting camera…</p>
          </div>
        </div>

        <p class="text-center text-[11px] font-mono text-zinc-600 mt-3 leading-relaxed">
          Point at the QR code shown in your terminal<br>after running <span :style="{ color: accent }" class="font-bold">orb-daemon pair</span>
        </p>
      </div>

      <button @click="cancelScan"
        class="mx-4 w-[calc(100%-32px)] py-3.5 rounded-2xl text-[14px] font-bold font-mono active:scale-[0.98] transition-all"
        style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#52525b;">
        Cancel
      </button>
    </template>

    <!-- ══ STEP: MANUAL ══ -->
    <template v-else-if="step === 'manual'">
      <div class="flex flex-col gap-3 px-4 mb-4">

        <div class="rounded-2xl px-4 py-3 flex items-start gap-3"
          :style="{ background: accent + '08', border: `1px solid ${accent}20` }">
          <Info :size="14" :style="{ color: accent + 'CC' }" :stroke-width="2" class="flex-shrink-0 mt-0.5" />
          <p class="text-[11px] font-mono leading-relaxed" :style="{ color: accent + 'AA' }">
            Run <b>orb-daemon pair</b> in your terminal. Copy the host, token and fingerprint shown there.
          </p>
        </div>

        <div>
          <label class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1 block">HOST / IP</label>
          <input v-model="manualForm.host" placeholder="192.168.1.100"
            class="w-full rounded-xl px-4 py-3 text-[14px] font-mono font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1 block">PORT</label>
            <input v-model.number="manualForm.port" type="number" placeholder="3132"
              class="w-full rounded-xl px-4 py-3 text-[14px] font-mono font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
              style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);" />
          </div>
          <div>
            <label class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1 block">PROTOCOL VER</label>
            <input v-model.number="manualForm.v" type="number" placeholder="1"
              class="w-full rounded-xl px-4 py-3 text-[14px] font-mono font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
              style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);" />
          </div>
        </div>

        <div>
          <label class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1 block">PAIRING TOKEN</label>
          <input v-model="manualForm.token" placeholder="32-char token from terminal output" autocomplete="off"
            class="w-full rounded-xl px-4 py-3 text-[12px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none"
            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);" />
        </div>

        <div>
          <label class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1 block">CERT FINGERPRINT <span class="text-zinc-700 normal-case">(optional)</span></label>
          <input v-model="manualForm.fingerprint" placeholder="Leave blank to skip cert pinning"
            class="w-full rounded-xl px-4 py-3 text-[11px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none"
            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);" />
        </div>

        <!-- Validation hint -->
        <div v-if="!manualFormValid && (manualForm.host || manualForm.token)"
          class="flex items-center gap-2 px-3 py-2 rounded-xl"
          style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);">
          <AlertCircle :size="12" class="text-rose-500 flex-shrink-0" :stroke-width="2" />
          <p class="text-[11px] font-mono text-rose-400">Host and token are required</p>
        </div>

        <div class="flex gap-2 mt-1">
          <button @click="step = 'idle'"
            class="flex-1 py-3.5 rounded-xl text-[13px] font-bold font-mono active:scale-[0.98]"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);color:#52525b;">
            ← Back
          </button>
          <button @click="connectManual"
            :disabled="!manualFormValid"
            class="flex-1 py-3.5 rounded-xl text-[14px] font-black font-mono active:scale-[0.98] transition-all disabled:opacity-40"
            :style="{ background: accent, color: '#fff', boxShadow: manualFormValid ? `0 6px 20px ${accent}44` : 'none' }">
            Connect →
          </button>
        </div>
      </div>

      <Transition name="err-slide">
        <div v-if="pairError" class="mx-4 mb-4 rounded-2xl overflow-hidden"
          style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);">
          <div class="flex items-center gap-2.5 px-4 py-3 border-b border-rose-900/30">
            <AlertCircle :size="15" class="text-rose-400 flex-shrink-0" :stroke-width="2" />
            <p class="text-[12px] font-black font-mono text-rose-300 flex-1">connection_failed</p>
            <button @click="pairError = null" class="text-rose-700"><X :size="13" :stroke-width="2.5" /></button>
          </div>
          <div class="px-4 py-3 space-y-1">
            <p v-for="(line, i) in pairErrorLines" :key="i"
              class="text-[11px] font-mono leading-relaxed"
              :class="i === 0 ? 'text-rose-300' : 'text-rose-500/70'">
              {{ line }}
            </p>
          </div>
        </div>
      </Transition>
    </template>

    <!-- ══ STEP: CONNECTING ══ -->
    <template v-else-if="step === 'connecting'">
      <div class="mx-4 mb-4 rounded-3xl overflow-hidden relative py-14 flex flex-col items-center gap-6"
        :style="{ background: accent + '08', border: `1px solid ${accent}22` }">
        
        <!-- Animated connecting ring -->
        <div class="relative" style="width:80px;height:80px;">
          <div class="absolute inset-0 rounded-full pair-spin-fast"
            :style="{ border: `2px solid transparent`, borderTopColor: accent, borderRightColor: accent + '44' }"></div>
          <div class="absolute inset-0 rounded-full pair-spin-slow"
            :style="{ border: `1px solid ${accent}22` }"></div>
          <div class="absolute rounded-full"
            style="inset:10px;background:radial-gradient(circle at 38% 32%,#1a1a2e 0%,#000 100%);"
            :style="{ boxShadow: `0 0 12px 3px ${accent}44` }"></div>
        </div>

        <div class="text-center px-8">
          <p class="text-[17px] font-black text-zinc-100">{{ connectingLabel }}</p>
          <p class="text-[12px] font-mono mt-2 leading-relaxed" :style="{ color: accent + '88' }">{{ connectingHost }}</p>
          <div class="flex items-center justify-center gap-1.5 mt-3">
            <div v-for="i in 3" :key="i"
              class="w-1.5 h-1.5 rounded-full dot-bounce"
              :style="{ background: accent, animationDelay: `${(i-1) * 0.2}s` }"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- ══ STEP: PAIRED ══ -->
    <template v-else-if="step === 'paired'">
      <div class="mx-4 mb-5 rounded-3xl overflow-hidden relative py-10 flex flex-col items-center gap-5"
        style="background:linear-gradient(135deg, rgba(16,185,129,0.06), rgba(52,211,153,0.03));border:1px solid rgba(52,211,153,0.22);">
        <div class="absolute inset-0 pointer-events-none"
          style="background:radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.08) 0%, transparent 60%)"></div>

        <!-- Success checkmark orb -->
        <div class="relative" style="width:80px;height:80px;">
          <div class="absolute inset-0 rounded-full success-ring-1" style="border:1px solid rgba(52,211,153,0.4)"></div>
          <div class="absolute rounded-full success-ring-2" style="inset:8px;border:0.5px solid rgba(52,211,153,0.25)"></div>
          <div class="absolute rounded-full flex items-center justify-center"
            style="inset:16px;background:radial-gradient(circle at 40% 35%,#0d2418 0%,#062010 60%,#000 100%);box-shadow:0 0 16px 4px rgba(52,211,153,0.4),inset 0 0 10px rgba(0,0,0,0.8);">
            <Check :size="20" class="text-emerald-400" :stroke-width="3" />
          </div>
        </div>

        <div class="text-center px-6">
          <p class="text-[22px] font-black text-emerald-300">Daemon paired!</p>
          <p class="text-[13px] font-mono text-emerald-600 mt-1">{{ pairedDaemonName }}</p>
          <p class="text-[11px] font-mono text-zinc-700 mt-0.5">{{ pairedHost }}</p>
        </div>

        <!-- What's synced -->
        <div class="w-full px-6 flex flex-col gap-2">
          <div v-for="f in pairedFeatures" :key="f"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style="background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.12);">
            <Check :size="12" class="text-emerald-400 flex-shrink-0" :stroke-width="2.5" />
            <span class="text-[12px] font-mono text-emerald-400/80">{{ f }}</span>
          </div>
        </div>
      </div>

      <button @click="emit('close')"
        class="mx-4 w-[calc(100%-32px)] flex items-center justify-center gap-2.5 py-4 rounded-2xl text-[15px] font-black font-mono active:scale-[0.98] transition-all"
        style="background:#10b981;color:white;box-shadow:0 8px 28px rgba(16,185,129,0.35);">
        <Check :size="17" :stroke-width="2.5" />
        Done
      </button>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, nextTick, onBeforeUnmount } from 'vue'
import {
  ChevronLeft, QrCode, Keyboard, Check,
  AlertCircle, X, Info,
} from 'lucide-vue-next'
import { settings, orbLog } from '../composables/useStore'
import { useDaemon, parsePairingQR, type PairingPayload } from '../composables/useDaemon'

// ── FIX: proper emit declaration — this is what $emit('close') needs ──
const emit = defineEmits<{ close: [] }>()

const accent = computed(() => settings.value.accentColor)
const { completePairing } = useDaemon()

// ── State ─────────────────────────────────────────────────
type Step = 'idle' | 'scanning' | 'manual' | 'connecting' | 'paired'
const step            = ref<Step>('idle')
const pairError       = ref<string | null>(null)
const cameraLoading   = ref(false)
const videoRef        = ref<HTMLVideoElement | null>(null)
const connectingLabel = ref('Connecting…')
const connectingHost  = ref('')
const pairedDaemonName = ref('')
const pairedHost      = ref('')

const scanStatus = ref('Starting camera…')

let mediaStream:  MediaStream | null = null
let scanInterval: ReturnType<typeof setTimeout> | null = null
let rafId:        number | null = null
let zxingReader:  any = null

// ── Error helpers ──────────────────────────────────────────
// Split multi-line error into array for display
const pairErrorLines = computed(() =>
  (pairError.value ?? '').split('\n').filter(l => l.trim())
)

const connectionHints = [
  'orb-daemon is running on your PC',
  'Your phone & PC are on the same WiFi',
  `Port 3132 is not blocked by a firewall`,
  'Token has not expired (5 min limit)',
]

// ── Step meta ─────────────────────────────────────────────
const stepTitle = computed(() => {
  const map: Record<Step, string> = {
    idle:       'pair_desktop',
    scanning:   'scan_qr',
    manual:     'manual_entry',
    connecting: 'connecting…',
    paired:     'paired_✓',
  }
  return map[step.value]
})

const currentStepIndex = computed(() => {
  const map: Record<Step, number> = { idle: 0, scanning: 0, manual: 1, connecting: 1, paired: 2 }
  return map[step.value]
})

// ── Setup steps ────────────────────────────────────────────
const setupSteps = [
  {
    label: 'Install the daemon binary',
    sub: 'Download from GitHub releases or build from source.',
    code: 'cargo install orb-daemon',
  },
  {
    label: 'Generate a pairing QR code',
    sub: 'Run this in your terminal to show the QR code.',
    code: 'orb-daemon pair',
  },
  {
    label: 'Scan from this screen',
    sub: 'Use the button below to open your camera and scan.',
    code: null,
  },
]

// ── Paired features ────────────────────────────────────────
const pairedFeatures = [
  'ENV vars sync to .env files automatically',
  'AI platform blocklist written to hosts file',
  'Vault entries encrypted & backed up',
]

// ── Manual form ────────────────────────────────────────────
const manualForm = reactive({
  host: '',
  port: 3132,
  token: '',
  fingerprint: '',
  v: 1,
})

const manualFormValid = computed(() =>
  !!manualForm.host.trim() && !!manualForm.token.trim()
)

// ── Navigation ─────────────────────────────────────────────
// FIX: use the emit declared above — no more getCurrentInstance() hack
function handleBack() {
  if (step.value === 'scanning') { cancelScan(); return }
  if (step.value === 'manual')   { step.value = 'idle'; return }
  if (step.value === 'paired')   { emit('close'); return }
  // idle → close the whole panel
  emit('close')
}

// ── Camera / QR scanning ───────────────────────────────────
async function startScan() {
  pairError.value     = null
  step.value          = 'scanning'
  cameraLoading.value = true

  await nextTick()

  try {
    // Request camera permission on Android (if Capacitor available)
    try {
      const cap = (window as any).Capacitor
      if (cap && cap.isNativePlatform?.()) {
        const camera = cap.Plugins?.Camera
        if (camera?.checkPermissions) {
          const status = await camera.checkPermissions()
          if (status.camera !== 'granted') {
            await camera.requestPermissions()
          }
        }
      }
    } catch {
      // Silently continue - browser will show native permission dialog
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    })

    if (!videoRef.value) throw new Error('Video element not ready')

    videoRef.value.srcObject = mediaStream

    await new Promise<void>((resolve, reject) => {
      const v = videoRef.value!
      v.onloadedmetadata = () => {
        v.play().then(resolve).catch(reject)
      }
      v.onerror = reject
    })

    cameraLoading.value = false
    scanStatus.value = 'Camera ready — point at QR code'

    if ('BarcodeDetector' in window) {
      startNativeDetector()
    } else {
      startZxingScanner()
    }

  } catch (err: any) {
    cameraLoading.value = false
    stopCamera()
    pairError.value =
      err?.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access in your browser settings and try again.' :
      err?.name === 'NotFoundError'   ? 'No camera found on this device.' :
      err?.name === 'NotReadableError'? 'Camera is in use by another app. Close it and try again.' :
      `Camera error: ${err?.message || 'unknown error'}`
    step.value = 'idle'
  }
}

// Strategy 1: Native BarcodeDetector API (best performance, Android Chrome)
function startNativeDetector() {
  scanStatus.value = 'Scanning (native)…'
  const BarcodeDetectorClass = (window as any).BarcodeDetector
  const detector = new BarcodeDetectorClass({ formats: ['qr_code'] })

  const tick = async () => {
    if (step.value !== 'scanning' || !videoRef.value) return
    const video = videoRef.value
    if (video.readyState < 2) { rafId = requestAnimationFrame(tick); return }

    try {
      const barcodes = await detector.detect(video)
      if (barcodes.length > 0 && barcodes[0].rawValue) {
        stopCamera()
        processQrData(barcodes[0].rawValue)
        return
      }
    } catch { /* no QR in frame */ }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
}

// Strategy 2: @zxing/library with canvas polling
function startZxingScanner() {
  scanStatus.value = 'Scanning (zxing)…'
  import('@zxing/library').then(({ BrowserMultiFormatReader }) => {
    if (step.value !== 'scanning') return

    zxingReader = new BrowserMultiFormatReader()

    const videoEl = videoRef.value
    if (!videoEl) return

    const canvas = document.createElement('canvas')
    const ctx    = canvas.getContext('2d', { willReadFrequently: true })!

    const poll = async () => {
      if (step.value !== 'scanning' || !videoEl) return

      if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
        canvas.width  = videoEl.videoWidth
        canvas.height = videoEl.videoHeight
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)

        try {
          const result = zxingReader!.decodeFromCanvas(canvas)
          if (result?.getText()) {
            stopCamera()
            processQrData(result.getText())
            return
          }
        } catch {
          // NotFoundException thrown when no QR visible — normal
        }
      }

      scanInterval = setTimeout(poll, 250) as unknown as ReturnType<typeof setInterval>
    }

    poll()
  }).catch(() => {
    startCanvasPolling()
  })
}

// Strategy 3: Pure canvas polling with jsqr
function startCanvasPolling() {
  scanStatus.value = 'Scanning (canvas)…'
  const canvas = document.createElement('canvas')
  const ctx    = canvas.getContext('2d', { willReadFrequently: true })!

  const tryDecode = async (imageData: ImageData): Promise<string | null> => {
    try {
      const { default: jsQR } = await import('jsqr' as any)
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' })
      return code?.data ?? null
    } catch {
      return null
    }
  }

  const poll = async () => {
    if (step.value !== 'scanning') return
    const video = videoRef.value
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      scanInterval = setTimeout(poll, 300) as unknown as ReturnType<typeof setInterval>
      return
    }

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const result = await tryDecode(imageData)

    if (result) {
      stopCamera()
      processQrData(result)
    } else {
      scanInterval = setTimeout(poll, 300) as unknown as ReturnType<typeof setInterval>
    }
  }

  poll()
}

function stopCamera() {
  if (rafId !== null)    { cancelAnimationFrame(rafId); rafId = null }
  if (scanInterval)      { clearTimeout(scanInterval);  scanInterval = null }
  if (zxingReader)       { try { zxingReader.reset() } catch {} zxingReader = null }

  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop())
    mediaStream = null
  }
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.srcObject = null
  }
}

function cancelScan() {
  stopCamera()
  step.value = 'idle'
}

// ── QR data processing ─────────────────────────────────────
async function processQrData(raw: string) {
  const payload = parsePairingQR(raw.trim())
  if (!payload) {
    pairError.value = 'Invalid QR code — this is not an Orb pairing code.'
    step.value = 'idle'
    return
  }
  await doPairing(payload)
}

async function connectManual() {
  if (!manualFormValid.value) return
  const payload: PairingPayload = {
    host:        manualForm.host.trim(),
    port:        manualForm.port || 3132,
    token:       manualForm.token.trim(),
    fingerprint: manualForm.fingerprint.trim(),
    v:           manualForm.v || 1,
  }
  await doPairing(payload)
}

// ── Pairing logic ──────────────────────────────────────────
async function doPairing(payload: PairingPayload) {
  pairError.value        = null
  step.value             = 'connecting'
  connectingLabel.value  = 'Establishing connection…'
  connectingHost.value   = `ws://${payload.host}:${payload.port}`

  orbLog(`[Pairing] Connecting to ${payload.host}:${payload.port}`)

  const deviceName = await getDeviceName()
  const deviceOs   = await getDeviceOs()

  // Update label midway
  setTimeout(() => {
    if (step.value === 'connecting') connectingLabel.value = 'Verifying token…'
  }, 1200)

  try {
    const ok = await completePairing(payload, deviceName, deviceOs)

    if (ok) {
      orbLog(`[Pairing] ✓ Success: paired to ${payload.host}:${payload.port}`, 'info')
      pairedDaemonName.value = `orb-daemon @ ${payload.host}`
      pairedHost.value       = `${payload.host}:${payload.port}`
      step.value             = 'paired'
    } else {
      const errMsg = 'Pairing rejected by daemon.\nCheck that your token is valid (expires in 5 min) and the daemon is running.'
      orbLog(`[Pairing] ✗ Failed`, 'error')
      pairError.value = errMsg
      step.value      = 'idle'
    }
  } catch (error: any) {
    // Pass the full error message through — useDaemon now provides detailed close code reasons
    const errMsg = error?.message || 'Unknown connection error'
    orbLog(`[Pairing] ✗ Error: ${errMsg}`, 'error')
    pairError.value = errMsg
    step.value      = 'idle'
  }
}

async function getDeviceName(): Promise<string> {
  try {
    const { Device } = await import('@capacitor/device')
    const info = await Device.getInfo()
    return info.name || 'Orb Mobile'
  } catch { return 'Orb Mobile' }
}

async function getDeviceOs(): Promise<string> {
  try {
    const { Device } = await import('@capacitor/device')
    const info = await Device.getInfo()
    return `${info.operatingSystem} ${info.osVersion}`
  } catch { return navigator.platform || 'Unknown' }
}

// ── Cleanup ────────────────────────────────────────────────
onBeforeUnmount(() => {
  stopCamera()
})
</script>

<style scoped>
.devkit-root { background: #060810; }

/* Orb rings */
@keyframes pair-spin-cw  { from { transform: rotate(0deg)   } to { transform: rotate(360deg)  } }
@keyframes pair-spin-ccw { from { transform: rotate(360deg) } to { transform: rotate(0deg)    } }
@keyframes pair-spin-fast-kf { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

.pair-ring-1 { animation: pair-spin-cw 10s linear infinite; }
.pair-ring-2 { animation: pair-spin-ccw 16s linear infinite; }
.pair-spin-fast { animation: pair-spin-fast-kf 1.2s linear infinite; }
.pair-spin-slow { animation: pair-spin-cw 4s linear infinite; }

/* Success rings */
@keyframes success-expand { 0%,100% { opacity:.6; transform:scale(1); } 50% { opacity:.2; transform:scale(1.1); } }
.success-ring-1 { animation: success-expand 2.5s ease-in-out infinite; }
.success-ring-2 { animation: success-expand 2.5s ease-in-out infinite; animation-delay: -1.25s; }

/* Scan line */
@keyframes scan-bounce { 0%,100% { top: 12px; } 50% { top: calc(100% - 14px); } }
.scan-line {
  position: absolute;
  left: 12px; right: 12px;
  height: 2px;
  animation: scan-bounce 2.2s ease-in-out infinite;
}

/* Dot bounce loading */
@keyframes dot-bounce { 0%,100% { transform: translateY(0); opacity:.6; } 50% { transform: translateY(-5px); opacity:1; } }
.dot-bounce { animation: dot-bounce 1s ease-in-out infinite; }

/* Error slide */
.err-slide-enter-active { transition: all 0.3s cubic-bezier(0.34,1.1,0.64,1); }
.err-slide-leave-active { transition: all 0.2s ease; }
.err-slide-enter-from   { opacity: 0; transform: translateY(-8px) scale(0.97); }
.err-slide-leave-to     { opacity: 0; transform: translateY(-4px) scale(0.98); }
</style>