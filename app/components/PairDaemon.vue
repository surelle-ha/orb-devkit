<template>
  <div class="devkit-root pb-28" style="touch-action:pan-y;">

    <!-- Header -->
    <div class="flex items-center gap-3 px-5 pt-6 pb-4">
      <button @click="$emit('close')"
        class="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
        style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
        <ChevronLeft :size="18" class="text-zinc-300" :stroke-width="2.5" />
      </button>
      <div class="flex-1">
        <p class="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase">orb devkit / daemon</p>
        <h1 class="text-[22px] font-black text-zinc-50 tracking-tight mt-0.5 font-mono">
          <span :style="{ color: accent }">›</span> pair_desktop
        </h1>
      </div>
    </div>

    <!-- STEP 1: Not paired — show instructions + scan button -->
    <template v-if="step === 'idle'">
      <div class="mx-4 mb-4 rounded-3xl overflow-hidden relative py-8 flex flex-col items-center gap-5"
        :style="{ background: accent + '08', border: `1px solid ${accent}22` }">
        <div class="relative" style="width:80px;height:80px;">
          <div class="absolute inset-0 rounded-full" :style="{ border: `1px solid ${accent}55`, animation:'pair-spin 10s linear infinite' }"></div>
          <div class="absolute rounded-full" :style="{ inset:'4px', background:'radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 55%,#000 100%)', boxShadow:`0 0 20px 4px ${accent}44` }"></div>
        </div>
        <div class="text-center px-6">
          <p class="text-[18px] font-black text-zinc-100">Connect your desktop</p>
          <p class="text-[12px] font-mono text-zinc-500 mt-2 leading-relaxed">
            Run <span :style="{ color: accent }" class="font-bold">orb-daemon pair</span> in your terminal,<br>
            then scan the QR code with the button below.
          </p>
        </div>

        <!-- Steps -->
        <div class="w-full px-6 flex flex-col gap-2">
          <div v-for="(s, i) in setupSteps" :key="i"
            class="flex items-start gap-3 px-4 py-3 rounded-xl"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
            <span class="text-[12px] font-mono font-black flex-shrink-0 mt-0.5" :style="{ color: accent }">{{ i + 1 }}</span>
            <div>
              <p class="text-[12px] font-mono font-bold text-zinc-300">{{ s.label }}</p>
              <p class="text-[11px] font-mono text-zinc-600 mt-0.5">{{ s.sub }}</p>
            </div>
          </div>
        </div>

        <button @click="startScan"
          class="flex items-center gap-2.5 px-6 py-4 rounded-2xl text-[15px] font-black font-mono active:scale-95 transition-all"
          :style="{ background: accent, color: '#fff', boxShadow: `0 8px 24px ${accent}44` }">
          <QrCode :size="18" :stroke-width="2" />
          Scan QR Code
        </button>
      </div>

      <!-- Manual entry fallback -->
      <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
        style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
        <button @click="step = 'manual'"
          class="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition-colors">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
            <Keyboard :size="17" class="text-zinc-500" :stroke-width="1.8" />
          </div>
          <div class="flex-1 text-left">
            <p class="text-[13px] font-bold font-mono text-zinc-300">Enter manually</p>
            <p class="text-[11px] font-mono text-zinc-600 mt-0.5">Type host, port & token</p>
          </div>
          <ChevronRight :size="15" class="text-zinc-700" :stroke-width="2" />
        </button>
      </div>
    </template>

    <!-- STEP 2: Camera / QR scanner -->
    <template v-else-if="step === 'scanning'">
      <div class="mx-4 mb-4 rounded-3xl overflow-hidden relative"
        style="background:#000;aspect-ratio:1;">
        <!-- Camera video preview -->
        <video
          ref="videoRef"
          class="w-full h-full object-cover"
          style="display: block;">
        </video>
        
        <!-- Scanning overlay frame -->
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div class="relative w-48 h-48">
            <!-- Scanning frame corners -->
            <div class="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg" :style="{ borderColor: accent }"></div>
            <div class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-lg" :style="{ borderColor: accent }"></div>
            <div class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-lg" :style="{ borderColor: accent }"></div>
            <div class="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-lg" :style="{ borderColor: accent }"></div>
            <!-- Scan line -->
            <div class="absolute left-2 right-2 h-0.5 scan-line" :style="{ background: accent + '88' }"></div>
          </div>
          <p class="text-[12px] font-mono text-zinc-100 drop-shadow-lg" style="text-shadow: 0 0 10px rgba(0,0,0,0.8);">Point camera at QR code</p>
        </div>
      </div>
      <div class="mx-4">
        <button @click="() => { stopScan(); step = 'idle' }"
          class="w-full py-3 rounded-2xl text-[13px] font-mono font-bold text-zinc-500 active:text-zinc-300">
          Cancel
        </button>
      </div>
    </template>

    <!-- STEP 3: Manual entry -->
    <template v-else-if="step === 'manual'">
      <div class="flex flex-col gap-3 px-4 mb-4">
        <div>
          <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">HOST</p>
          <input v-model="manualForm.host" placeholder="192.168.1.100"
            class="w-full rounded-xl px-4 py-3 text-[14px] font-mono font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">PORT</p>
            <input v-model="manualForm.port" type="number" placeholder="3131"
              class="w-full rounded-xl px-4 py-3 text-[14px] font-mono font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
              style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
          </div>
          <div>
            <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">VERSION</p>
            <input v-model="manualForm.v" type="number" placeholder="1"
              class="w-full rounded-xl px-4 py-3 text-[14px] font-mono font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
              style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
          </div>
        </div>
        <div>
          <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">PAIRING TOKEN</p>
          <input v-model="manualForm.token" placeholder="From orb-daemon pair output"
            class="w-full rounded-xl px-4 py-3 text-[13px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none"
            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
        </div>
        <div>
          <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">CERT FINGERPRINT (optional)</p>
          <input v-model="manualForm.fingerprint" placeholder="Leave empty to skip pinning"
            class="w-full rounded-xl px-4 py-3 text-[11px] font-mono text-zinc-100 placeholder:text-zinc-700 outline-none"
            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);" />
        </div>
        <div class="flex gap-2 mt-1">
          <button @click="step = 'idle'"
            class="flex-1 py-3.5 rounded-xl text-[13px] font-bold font-mono text-zinc-500 active:text-zinc-300"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
            Cancel
          </button>
          <button @click="connectManual"
            :disabled="!manualForm.host || !manualForm.token"
            class="flex-1 py-3.5 rounded-xl text-[14px] font-black font-mono active:scale-[0.98] transition-all"
            :style="manualForm.host && manualForm.token
              ? { background: accent, color: '#fff', boxShadow: `0 6px 20px ${accent}44` }
              : { background: 'rgba(255,255,255,0.05)', color: '#3f3f46' }">
            Connect
          </button>
        </div>
      </div>
    </template>

    <!-- STEP 4: Connecting / pairing in progress -->
    <template v-else-if="step === 'connecting'">
      <div class="mx-4 mb-4 rounded-3xl overflow-hidden relative py-12 flex flex-col items-center gap-5"
        :style="{ background: accent + '08', border: `1px solid ${accent}22` }">
        <div class="relative" style="width:60px;height:60px;">
          <div class="absolute inset-0 rounded-full pair-spin-fast" :style="{ border: `2px solid ${accent}` }"></div>
          <div class="absolute rounded-full" style="inset:6px;background:radial-gradient(circle at 38% 32%,#1a1a2e,#000);"></div>
        </div>
        <div class="text-center">
          <p class="text-[16px] font-black text-zinc-100">{{ connectingLabel }}</p>
          <p class="text-[11px] font-mono text-zinc-500 mt-1">{{ connectingHost }}</p>
        </div>
      </div>
    </template>

    <!-- STEP 5: Paired! -->
    <template v-else-if="step === 'paired'">
      <div class="mx-4 mb-4 rounded-3xl overflow-hidden relative py-10 flex flex-col items-center gap-5"
        style="background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.2);">
        <div class="w-20 h-20 rounded-3xl flex items-center justify-center"
          style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.25);">
          <ShieldCheck :size="36" class="text-emerald-400" :stroke-width="1.5" />
        </div>
        <div class="text-center px-6">
          <p class="text-[20px] font-black text-emerald-300">Paired!</p>
          <p class="text-[12px] font-mono text-emerald-600 mt-2">{{ pairedDaemonName }}</p>
          <p class="text-[10px] font-mono text-zinc-600 mt-1">{{ pairedHost }}</p>
        </div>
        <button @click="$emit('close')"
          class="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[14px] font-black font-mono active:scale-95 transition-all text-white"
          style="background:#10b981;box-shadow:0 8px 24px rgba(16,185,129,0.3);">
          <Check :size="16" :stroke-width="2.5" />
          Done
        </button>
      </div>
    </template>

    <!-- Error state -->
    <div v-if="pairError" class="mx-4 mb-4 rounded-2xl px-4 py-4 flex items-center gap-3"
      style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);">
      <AlertCircle :size="18" class="text-rose-400 flex-shrink-0" :stroke-width="2" />
      <p class="text-[12px] font-mono text-rose-300">{{ pairError }}</p>
      <button @click="pairError = null" class="ml-auto text-rose-600 active:text-rose-400">
        <X :size="14" :stroke-width="2.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import {
  ChevronLeft, ChevronRight, QrCode, Keyboard, ShieldCheck, Check,
  AlertCircle, X,
} from 'lucide-vue-next'
import { settings } from '../composables/useStore'
import { useDaemon, parsePairingQR, type PairingPayload } from '../composables/useDaemon'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

defineEmits(['close'])

const accent = computed(() => settings.value.accentColor)
const { completePairing } = useDaemon()

type Step = 'idle' | 'scanning' | 'manual' | 'connecting' | 'paired'
const step = ref<Step>('idle')
const pairError = ref<string | null>(null)
const manualQr = ref('')
const qrInput = ref<HTMLInputElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const connectingLabel = ref('Connecting...')
const connectingHost = ref('')
const pairedDaemonName = ref('')
const pairedHost = ref('')

let codeReader: BrowserMultiFormatReader | null = null
let scanningInterval: ReturnType<typeof setInterval> | null = null

const manualForm = reactive({
  host: '',
  port: 3131,
  token: '',
  fingerprint: '',
  v: 1,
})

const setupSteps = [
  {
    label: 'Install orb-daemon',
    sub: 'cargo install orb-daemon  (or download binary)',
  },
  {
    label: 'Run pair command',
    sub: 'orb-daemon pair  — shows QR in terminal',
  },
  {
    label: 'Scan from this screen',
    sub: 'Tap "Scan QR Code" and point at your terminal',
  },
]

function startScan() {
  step.value = 'scanning'
  nextTick(async () => {
    try {
      if (!videoRef.value) return
      
      codeReader = new BrowserMultiFormatReader()
      const videoInputDevices = await codeReader.listVideoInputDevices()
      
      if (videoInputDevices.length === 0) {
        pairError.value = 'No camera found'
        step.value = 'idle'
        return
      }
      
      // Use back camera (last in list) on mobile
      const selectedDevice = videoInputDevices[videoInputDevices.length - 1]
      
      const controls = await codeReader.decodeFromVideoElement(
        videoRef.value,
        selectedDevice.deviceId,
        (result) => {
          if (result?.getText()) {
            const qrData = result.getText()
            stopScan()
            processQrData(qrData)
          }
        }
      )
    } catch (err: any) {
      pairError.value = err.message || 'Camera permission denied'
      step.value = 'idle'
    }
  })
}

function stopScan() {
  if (codeReader) {
    codeReader.reset()
    codeReader = null
  }
  if (videoRef.value?.srcObject) {
    const tracks = (videoRef.value.srcObject as MediaStream).getTracks()
    tracks.forEach(track => track.stop())
  }
}

async function processQrData(raw: string) {
  if (!raw.trim()) return
  const payload = parsePairingQR(raw.trim())
  if (!payload) {
    pairError.value = 'Invalid QR code — not an Orb pairing code'
    step.value = 'idle'
    return
  }
  await doPairing(payload)
}

async function connectManual() {
  const payload: PairingPayload = {
    host: manualForm.host,
    port: manualForm.port || 3131,
    token: manualForm.token,
    fingerprint: manualForm.fingerprint,
    v: manualForm.v || 1,
  }
  await doPairing(payload)
}

async function doPairing(payload: PairingPayload) {
  pairError.value = null
  step.value = 'connecting'
  connectingLabel.value = 'Pairing...'
  connectingHost.value = `${payload.host}:${payload.port}`

  const deviceName = (await getDeviceName()) || 'Orb Mobile'
  const deviceOs = (await getDeviceOs()) || 'iOS/Android'

  const ok = await completePairing(payload, deviceName, deviceOs)

  if (ok) {
    pairedDaemonName.value = `${payload.host}:${payload.port}`
    pairedHost.value = `${payload.host}:${payload.port}`
    step.value = 'paired'
  } else {
    pairError.value = 'Pairing failed. Check token validity and try again.'
    step.value = 'idle'
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

// Cleanup camera when component unmounts or step changes
onBeforeUnmount(() => {
  stopScan()
})
</script>

<style scoped>
.devkit-root { background: #060810; min-height: 100%; }

@keyframes pair-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes pair-spin-fast { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes scan-bounce { 0%, 100% { top: 8px; } 50% { top: calc(100% - 12px); } }

.pair-spin-fast { animation: pair-spin-fast 1.5s linear infinite; }

.scan-line {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 2px;
  animation: scan-bounce 2s ease-in-out infinite;
}
</style>