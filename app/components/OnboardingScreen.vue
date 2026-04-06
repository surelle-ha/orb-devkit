<template>
    <Transition name="onboard-out" @after-leave="$emit('done')">
        <div v-if="visible" class="onboard-root fixed inset-0 z-[9990] flex flex-col overflow-hidden"
            style="background:#060810;">

            <!-- Starfield canvas -->
            <canvas ref="starCanvas" class="absolute inset-0 pointer-events-none" style="opacity:0.45;"></canvas>

            <!-- Ambient radial glow -->
            <div class="absolute inset-0 pointer-events-none transition-all duration-1000"
                :style="{ background: `radial-gradient(ellipse 70% 50% at 50% ${glowY}, ${accent}28 0%, transparent 70%)` }">
            </div>

            <!-- Grid overlay -->
            <div class="absolute inset-0 pointer-events-none"
                :style="{ backgroundImage: `linear-gradient(${accent}07 1px, transparent 1px), linear-gradient(90deg, ${accent}07 1px, transparent 1px)`, backgroundSize: '40px 40px' }">
            </div>

            <!-- Progress bar -->
            <div class="absolute top-0 left-0 right-0 h-0.5 z-10" style="background:rgba(255,255,255,0.06);">
                <div class="h-full transition-all duration-700 ease-out"
                    :style="{ width: progressPct + '%', background: accent }"></div>
            </div>

            <!-- Step counter -->
            <div class="absolute top-5 right-5 z-10 flex items-center gap-2"
                style="padding-top:env(safe-area-inset-top)">
                <div class="flex gap-1.5">
                    <div v-for="i in totalSteps" :key="i" class="rounded-full transition-all duration-500" :style="{
                        width: step === i - 1 ? '20px' : '6px',
                        height: '6px',
                        background: step >= i - 1 ? accent : 'rgba(255,255,255,0.12)'
                    }"></div>
                </div>
            </div>

            <!-- Logo mark top-left -->
            <div class="absolute top-5 left-5 z-10 flex items-center gap-2"
                style="padding-top:env(safe-area-inset-top)">
                <div class="relative" style="width:28px;height:28px;">
                    <div class="absolute inset-0 rounded-full"
                        :style="{ border: `1px solid ${accent}55`, animation: 'ob-cw 8s linear infinite' }"></div>
                    <div class="absolute rounded-full"
                        :style="{ inset: '4px', background: 'radial-gradient(circle at 38% 32%,#1a1a2e,#000)', boxShadow: `0 0 8px 2px ${accent}44` }">
                    </div>
                </div>
                <span class="text-[10px] font-mono font-bold text-zinc-600 tracking-[0.25em] uppercase">orb
                    devkit</span>
            </div>

            <!-- Step content -->
            <div class="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-10"
                style="padding-top:calc(80px + env(safe-area-inset-top));">

                <!-- Step: WELCOME (0) -->
                <Transition :name="slideDir" mode="out-in">
                    <div v-if="step === 0" key="step0" class="w-full max-w-[380px] flex flex-col items-center gap-8">
                        <!-- Hero orb -->
                        <div class="relative flex items-center justify-center" style="width:140px;height:140px;">
                            <div v-for="ring in orbRings" :key="ring.id" class="absolute rounded-full" :style="{
                                width: ring.size + 'px', height: ring.size + 'px',
                                border: `${ring.thick}px solid ${accent}${ring.alpha}`,
                                animation: `${ring.dir === 'r' ? 'ob-ccw' : 'ob-cw'} ${ring.dur}s linear infinite`,
                                animationDelay: ring.delay + 's',
                                opacity: ring.opacity,
                            }"></div>
                            <!-- Lens glow -->
                            <div class="absolute rounded-full" style="width:90px;height:90px;"
                                :style="{ boxShadow: `0 0 40px 12px ${accent}44, 0 0 80px 24px ${accent}22` }"></div>
                            <!-- Core sphere -->
                            <div class="absolute rounded-full flex items-center justify-center"
                                style="width:70px;height:70px;background:radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 55%,#000 100%);"
                                :style="{ boxShadow: `inset 0 0 20px rgba(0,0,0,1), 0 0 0 1px ${accent}44` }">
                                <div class="absolute inset-0 rounded-full"
                                    :style="{ background: `radial-gradient(circle at 28% 26%, ${accent}28 0%, transparent 55%)` }">
                                </div>
                            </div>
                        </div>

                        <div class="text-center flex flex-col gap-3">
                            <p class="text-[10px] font-mono font-bold text-zinc-600 tracking-[0.35em] uppercase">welcome
                                to</p>
                            <h1 class="text-[36px] font-black font-mono text-zinc-50 tracking-tight leading-none">
                                Orb<span :style="{ color: accent }">.</span>
                            </h1>
                            <p class="text-[13px] font-mono text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
                                Developer toolkit for power users.<br>
                                Pocket ENV, vault, daemon bridge &amp; more.
                            </p>
                        </div>

                        <div class="flex flex-col gap-2 w-full">
                            <button @click="next" class="ob-btn-primary w-full"
                                :style="{ background: accent, boxShadow: `0 8px 32px ${accent}44` }">
                                <span>Get started</span>
                                <span class="text-[16px]">→</span>
                            </button>
                        </div>
                    </div>
                </Transition>

                <!-- Step: NAME (1) -->
                <Transition :name="slideDir" mode="out-in">
                    <div v-if="step === 1" key="step1" class="w-full max-w-[380px] flex flex-col gap-7">
                        <div class="flex flex-col gap-2">
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                                :style="{ background: accent + '18', border: `1px solid ${accent}33` }">
                                <span class="text-[22px]">👤</span>
                            </div>
                            <p class="text-[10px] font-mono font-bold text-zinc-600 tracking-[0.3em] uppercase">step 1
                                of 4</p>
                            <h2 class="text-[26px] font-black font-mono text-zinc-50 tracking-tight leading-tight">
                                What should<br>we call you?
                            </h2>
                            <p class="text-[12px] font-mono text-zinc-500 leading-relaxed">
                                Your name appears on the dashboard and in device listings.
                            </p>
                        </div>

                        <div class="flex flex-col gap-3">
                            <div
                                :class="['ob-input-wrap', nameError ? 'ob-input-error' : nameValue.trim() ? 'ob-input-success' : '']">
                                <span class="ob-input-icon font-mono text-zinc-600 text-[12px]">›_</span>
                                <input ref="nameInput" v-model="nameValue" type="text"
                                    placeholder="e.g. Alex, Riley, codegod…" autocomplete="given-name" maxlength="32"
                                    @input="nameError = ''" @keydown.enter="nextFromName" class="ob-input" />
                                <div v-if="nameValue.trim()" class="text-emerald-400 text-[12px]">✓</div>
                            </div>
                            <p v-if="nameError" class="text-[11px] font-mono text-rose-400 px-1">{{ nameError }}</p>
                        </div>

                        <div class="flex gap-2 mt-2">
                            <button @click="prev" class="ob-btn-ghost flex-shrink-0" style="width:48px;">←</button>
                            <button @click="nextFromName" class="ob-btn-primary flex-1"
                                :style="{ background: accent, boxShadow: `0 8px 32px ${accent}44` }">
                                Continue →
                            </button>
                        </div>
                    </div>
                </Transition>

                <!-- Step: DESIGNATION (2) -->
                <Transition :name="slideDir" mode="out-in">
                    <div v-if="step === 2" key="step2" class="w-full max-w-[380px] flex flex-col gap-7">
                        <div class="flex flex-col gap-2">
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                                :style="{ background: accent + '18', border: `1px solid ${accent}33` }">
                                <span class="text-[22px]">🎯</span>
                            </div>
                            <p class="text-[10px] font-mono font-bold text-zinc-600 tracking-[0.3em] uppercase">step 2
                                of 4</p>
                            <h2 class="text-[26px] font-black font-mono text-zinc-50 tracking-tight leading-tight">
                                What's your<br>role?
                            </h2>
                            <p class="text-[12px] font-mono text-zinc-500 leading-relaxed">
                                Optional — helps us personalize tips. You can skip this.
                            </p>
                        </div>

                        <!-- Preset pills -->
                        <div class="grid grid-cols-2 gap-2">
                            <button v-for="d in designations" :key="d.label" @click="selectDesignation(d.label)"
                                class="ob-designation-pill" :style="designationValue === d.label
                                    ? { background: accent + '18', border: `1.5px solid ${accent}55`, color: accent }
                                    : {}">
                                <span class="text-[16px]">{{ d.icon }}</span>
                                <span class="text-[12px] font-mono font-bold">{{ d.label }}</span>
                            </button>
                        </div>

                        <!-- Custom input -->
                        <div>
                            <p class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest mb-2 px-1">
                                Or type your own</p>
                            <div class="ob-input-wrap">
                                <span class="ob-input-icon font-mono text-zinc-600 text-[12px]">›_</span>
                                <input v-model="designationValue" type="text" placeholder="e.g. AI Engineer, Hacker…"
                                    maxlength="40" class="ob-input" />
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <button @click="prev" class="ob-btn-ghost flex-shrink-0" style="width:48px;">←</button>
                            <button @click="skipDesignation" class="ob-btn-ghost flex-1 text-[13px]">Skip</button>
                            <button @click="next" class="ob-btn-primary flex-1"
                                :style="{ background: accent, boxShadow: `0 8px 32px ${accent}44` }">
                                Continue →
                            </button>
                        </div>
                    </div>
                </Transition>

                <!-- Step: PIN (3) -->
                <Transition :name="slideDir" mode="out-in">
                    <div v-if="step === 3" key="step3" class="w-full max-w-[380px] flex flex-col gap-6">
                        <div class="flex flex-col gap-2">
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                                :style="{ background: accent + '18', border: `1px solid ${accent}33` }">
                                <span class="text-[22px]">🔐</span>
                            </div>
                            <p class="text-[10px] font-mono font-bold text-zinc-600 tracking-[0.3em] uppercase">step 3
                                of 4</p>
                            <h2 class="text-[26px] font-black font-mono text-zinc-50 tracking-tight leading-tight">
                                Set an App PIN
                            </h2>
                            <p class="text-[12px] font-mono text-zinc-500 leading-relaxed">
                                Locks the app on launch. Optional — you can add one later in Settings.
                            </p>
                        </div>

                        <!-- PIN dots -->
                        <div class="flex gap-5 justify-center py-2" :class="pinShaking ? 'ob-shake' : ''">
                            <div v-for="i in 6" :key="i"
                                class="w-5 h-5 rounded-full border-2 transition-all duration-200"
                                :class="i <= pinValue.length ? 'border-transparent scale-110' : 'border-zinc-700'"
                                :style="i <= pinValue.length ? { background: accent, boxShadow: `0 0 8px ${accent}88` } : {}">
                            </div>
                        </div>

                        <!-- PIN label -->
                        <div v-if="pinConfirmMode" class="text-center">
                            <p class="text-[12px] font-mono font-bold" :style="{ color: accent }">
                                ↺ &nbsp;Confirm your PIN
                            </p>
                        </div>

                        <!-- Keypad -->
                        <div class="grid grid-cols-3 gap-2.5">
                            <button v-for="k in pinKeypad" :key="k" @click="handlePinKey(k)"
                                :class="['ob-key', k === '' ? 'pointer-events-none opacity-0' : '']">
                                {{ k }}
                            </button>
                        </div>

                        <div class="flex gap-2 mt-1">
                            <button @click="prevFromPin" class="ob-btn-ghost flex-shrink-0"
                                style="width:48px;">←</button>
                            <button @click="skipPin" class="ob-btn-ghost flex-1 text-[13px]">Skip for now</button>
                        </div>
                    </div>
                </Transition>

                <!-- Step: UNIQUE KEY (4) -->
                <Transition :name="slideDir" mode="out-in">
                    <div v-if="step === 4" key="step4" class="w-full max-w-[380px] flex flex-col gap-6">
                        <div class="flex flex-col gap-2">
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                                :style="{ background: accent + '18', border: `1px solid ${accent}33` }">
                                <span class="text-[22px]">🔑</span>
                            </div>
                            <p class="text-[10px] font-mono font-bold text-zinc-600 tracking-[0.3em] uppercase">step 4
                                of 4</p>
                            <h2 class="text-[26px] font-black font-mono text-zinc-50 tracking-tight leading-tight">
                                Your unique<br>device key
                            </h2>
                            <p class="text-[12px] font-mono text-zinc-500 leading-relaxed">
                                Auto-generated. Used for local encryption and daemon device identity. Store this safely.
                            </p>
                        </div>

                        <!-- Key display -->
                        <div class="rounded-2xl overflow-hidden"
                            style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.08);">
                            <div class="flex items-center justify-between px-3 py-2 border-b border-white/5">
                                <div class="flex items-center gap-1.5">
                                    <div class="w-2 h-2 rounded-full bg-rose-500/70"></div>
                                    <div class="w-2 h-2 rounded-full bg-amber-400/70"></div>
                                    <div class="w-2 h-2 rounded-full bg-emerald-400/70"></div>
                                </div>
                                <span class="text-[9px] font-mono text-zinc-600 tracking-widest">ORB_DEVICE_KEY</span>
                                <button @click="copyKey"
                                    class="text-[9px] font-mono font-bold px-2 py-0.5 rounded transition-all active:scale-95"
                                    :style="keyCopied
                                        ? { background: 'rgba(52,211,153,0.15)', color: '#34d399' }
                                        : { background: accent + '15', color: accent }">
                                    {{ keyCopied ? '✓ copied' : 'copy' }}
                                </button>
                            </div>
                            <div class="px-4 py-4">
                                <p class="text-[11px] font-mono leading-relaxed break-all"
                                    :style="{ color: accent + 'CC' }">{{ deviceKey }}</p>
                            </div>
                        </div>

                        <!-- Regenerate -->
                        <button @click="regenerateKey"
                            class="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95"
                            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#52525b;">
                            ↻ &nbsp;Regenerate key
                        </button>

                        <div class="flex flex-col items-start gap-2 px-4 py-3 rounded-xl"
                            :style="{ background: accent + '08', border: `1px solid ${accent}18` }">
                            <div class="flex items-start gap-2">
                                <span class="text-[13px] flex-shrink-0 mt-px">⚠️</span>
                                <p class="text-[11px] font-mono leading-relaxed" :style="{ color: accent + 'AA' }">
                                    This key is generated once and stored locally. It cannot be recovered if you lose
                                    it.
                                    Screenshot or copy it before continuing.
                                </p>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <button @click="prev" class="ob-btn-ghost flex-shrink-0" style="width:48px;">←</button>
                            <button @click="finish" class="ob-btn-primary flex-1"
                                :style="{ background: accent, boxShadow: `0 8px 32px ${accent}44` }">
                                Launch Orb →
                            </button>
                        </div>
                    </div>
                </Transition>

            </div>

            <!-- Bottom hint -->
            <div class="flex-shrink-0 pb-8 text-center"
                style="padding-bottom:calc(32px + env(safe-area-inset-bottom));">
                <p class="text-[10px] font-mono text-zinc-700">
                    {{ bottomHints[Math.min(step, bottomHints.length - 1)] }}
                </p>
            </div>

        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { settings, saveSettings, orbLog } from '~/composables/useStore'
import { setPin } from '~/composables/usePin'

// ─── Constants ────────────────────────────────────────────
const ONBOARDING_KEY = 'orb_onboarding_v1'
const DEVICE_KEY_KEY = 'orb_device_key_v1'

const emit = defineEmits(['done'])

// ─── State ────────────────────────────────────────────────
const visible = ref(true)
const step = ref(0)
const slideDir = ref('slide-left')
const totalSteps = 5

const nameValue = ref('')
const nameError = ref('')
const designationValue = ref('Developer')
const pinValue = ref('')
const pinConfirmMode = ref(false)
const pinFirst = ref('')
const pinShaking = ref(false)
const keyCopied = ref(false)
const deviceKey = ref('')

const nameInput = ref<HTMLInputElement | null>(null)
const starCanvas = ref<HTMLCanvasElement | null>(null)

let starAnimFrame = 0

// ─── Computed ─────────────────────────────────────────────
const accent = computed(() => settings.value.accentColor)
const glowY = computed(() => step.value === 0 ? '35%' : '45%')

const progressPct = computed(() => {
    const map = [0, 25, 50, 75, 100]
    return map[Math.min(step.value, map.length - 1)]
})

// ─── Orb rings config ─────────────────────────────────────
const orbRings = [
    { id: 1, size: 100, thick: 1, alpha: '55', opacity: 0.9, dur: 9, dir: 'n', delay: 0 },
    { id: 2, size: 120, thick: 0.5, alpha: '33', opacity: 0.7, dur: 14, dir: 'r', delay: -3 },
    { id: 3, size: 140, thick: 1, alpha: '22', opacity: 0.5, dur: 20, dir: 'n', delay: -7 },
]

// ─── Designations ─────────────────────────────────────────
const designations = [
    { label: 'Developer', icon: '💻' },
    { label: 'DevOps', icon: '⚙️' },
    { label: 'Security', icon: '🛡️' },
    { label: 'AI Engineer', icon: '🤖' },
    { label: 'Data Engineer', icon: '📊' },
    { label: 'Full-Stack', icon: '🔄' },
]

// ─── PIN keypad ────────────────────────────────────────────
const pinKeypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

// ─── Bottom hints ─────────────────────────────────────────
const bottomHints = [
    'All data is stored locally on your device.',
    'Your name is only used locally — never uploaded.',
    'Designation is optional and only displayed to you.',
    'Your PIN is hashed with SHA-256. It never leaves your device.',
    'Keep your device key somewhere safe.',
]

// ─── Navigation ────────────────────────────────────────────
function next() {
    slideDir.value = 'slide-left'
    step.value = Math.min(step.value + 1, totalSteps - 1)
}
function prev() {
    slideDir.value = 'slide-right'
    step.value = Math.max(step.value - 1, 0)
}

function nextFromName() {
    if (!nameValue.value.trim()) {
        nameError.value = 'Please enter your name to continue.'
        return
    }
    next()
}

function selectDesignation(label: string) {
    designationValue.value = label
}
function skipDesignation() {
    designationValue.value = 'Developer'
    next()
}

function prevFromPin() {
    pinValue.value = ''
    pinFirst.value = ''
    pinConfirmMode.value = false
    prev()
}

function skipPin() {
    pinValue.value = ''
    pinFirst.value = ''
    pinConfirmMode.value = false
    slideDir.value = 'slide-left'
    step.value = 4
}

// ─── PIN logic ─────────────────────────────────────────────
function handlePinKey(k: string) {
    if (!k) return
    if (k === '⌫') {
        pinValue.value = pinValue.value.slice(0, -1)
        return
    }
    if (pinValue.value.length >= 6) return
    pinValue.value += k
    if (pinValue.value.length === 6) handlePinComplete()
}

async function handlePinComplete() {
    if (!pinConfirmMode.value) {
        // First entry — store and ask to confirm
        pinFirst.value = pinValue.value
        pinValue.value = ''
        pinConfirmMode.value = true
    } else {
        // Confirm mode
        if (pinValue.value === pinFirst.value) {
            // Save PIN (reuse setPin from usePin.ts)
            await setPin(pinValue.value, 'What was the name of your first pet?', 'unknown')
            orbLog('Onboarding: PIN set')
            pinValue.value = ''
            pinFirst.value = ''
            pinConfirmMode.value = false
            slideDir.value = 'slide-left'
            step.value = 4
        } else {
            // Mismatch — shake and reset confirm
            pinShaking.value = true
            setTimeout(() => {
                pinShaking.value = false
                pinValue.value = ''
                pinConfirmMode.value = false
                pinFirst.value = ''
            }, 650)
        }
    }
}

// ─── Key generation ────────────────────────────────────────
function generateDeviceKey(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

function regenerateKey() {
    deviceKey.value = generateDeviceKey()
    localStorage.setItem(DEVICE_KEY_KEY, deviceKey.value)
    keyCopied.value = false
}

function copyKey() {
    navigator.clipboard?.writeText(deviceKey.value).then(() => {
        keyCopied.value = true
        setTimeout(() => { keyCopied.value = false }, 2500)
    })
}

// ─── Finish ────────────────────────────────────────────────
async function finish() {
    // Save name and designation to settings
    saveSettings({
        userName: nameValue.value.trim(),
    })

    // Save designation separately (not in settings type, store as misc)
    try { localStorage.setItem('orb_designation_v1', designationValue.value) } catch { }

    // Mark onboarding complete
    localStorage.setItem(ONBOARDING_KEY, 'done')

    orbLog(`Onboarding complete: ${nameValue.value.trim()} · ${designationValue.value}`)

    // Transition out
    visible.value = false
}

// ─── Starfield ─────────────────────────────────────────────
interface Star { x: number; y: number; r: number; a: number; da: number; dx: number; dy: number }

function initStars(canvas: HTMLCanvasElement) {
    if (starAnimFrame) cancelAnimationFrame(starAnimFrame)
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth || 360
    const H = canvas.clientHeight || 800
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr)
    const stars: Star[] = Array.from({ length: 80 }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.1 + 0.2,
        a: Math.random(), da: (Math.random() * 0.004 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
        dx: (Math.random() - 0.5) * 0.04, dy: (Math.random() - 0.5) * 0.04,
    }))
    function draw() {
        ctx.clearRect(0, 0, W, H)
        for (const s of stars) {
            s.a += s.da; if (s.a > 1 || s.a < 0) s.da *= -1
            s.x = (s.x + s.dx + W) % W; s.y = (s.y + s.dy + H) % H
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(160,190,255,${Math.max(0, Math.min(1, s.a))})`
            ctx.fill()
        }
        starAnimFrame = requestAnimationFrame(draw)
    }
    draw()
}

// ─── Focus management ──────────────────────────────────────
watch(step, async (s) => {
    await nextTick()
    if (s === 1) nameInput.value?.focus()
})

// ─── Init ─────────────────────────────────────────────────
onMounted(async () => {
    // Check if already onboarded
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (done === 'done') { visible.value = false; emit('done'); return }

    // Init device key
    const stored = localStorage.getItem(DEVICE_KEY_KEY)
    deviceKey.value = stored ?? generateDeviceKey()
    if (!stored) localStorage.setItem(DEVICE_KEY_KEY, deviceKey.value)

    // Starfield
    await nextTick()
    if (starCanvas.value && starCanvas.value.clientWidth > 0) {
        initStars(starCanvas.value)
    }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800;900&display=swap');

* {
    font-family: 'JetBrains Mono', monospace;
}

.onboard-root {
    font-family: 'JetBrains Mono', monospace;
}

/* Orb animations */
@keyframes ob-cw {
    from {
        transform: rotate(0deg)
    }

    to {
        transform: rotate(360deg)
    }
}

@keyframes ob-ccw {
    from {
        transform: rotate(360deg)
    }

    to {
        transform: rotate(0deg)
    }
}

/* Primary button */
.ob-btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 24px;
    border-radius: 16px;
    font-size: 15px;
    font-weight: 900;
    color: white;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
}

.ob-btn-primary:active {
    transform: scale(0.97);
}

/* Ghost button */
.ob-btn-ghost {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px 20px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 700;
    color: #52525b;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.2s ease;
    cursor: pointer;
}

.ob-btn-ghost:active {
    transform: scale(0.97);
    color: #a1a1aa;
}

/* Input */
.ob-input-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1.5px solid rgba(255, 255, 255, 0.08);
    transition: border-color 0.2s ease, background 0.2s ease;
}

.ob-input-wrap:focus-within {
    background: rgba(255, 255, 255, 0.06);
    border-color: v-bind('accent + "66"');
}

.ob-input-error {
    border-color: rgba(239, 68, 68, 0.5) !important;
    background: rgba(239, 68, 68, 0.05) !important;
}

.ob-input-success {
    border-color: rgba(52, 211, 153, 0.35) !important;
}

.ob-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 14px;
    font-weight: 700;
    color: #e4e4e7;
    font-family: 'JetBrains Mono', monospace;
}

.ob-input::placeholder {
    color: #3f3f46;
    font-weight: 400;
}

/* Designation pill */
.ob-designation-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1.5px solid rgba(255, 255, 255, 0.07);
    color: #71717a;
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
    transition: all 0.2s ease;
}

.ob-designation-pill:active {
    transform: scale(0.97);
}

/* PIN key */
.ob-key {
    height: 68px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 22px;
    font-weight: 900;
    color: #e4e4e7;
    font-family: 'JetBrains Mono', monospace;
    transition: all 0.15s ease;
    cursor: pointer;
}

.ob-key:active {
    transform: scale(0.90);
    background: rgba(255, 255, 255, 0.1);
}

/* Page transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
    transition: all 0.3s cubic-bezier(0.35, 0, 0.15, 1);
}

.slide-left-enter-from {
    transform: translateX(60px);
    opacity: 0;
}

.slide-left-leave-to {
    transform: translateX(-40px);
    opacity: 0;
}

.slide-right-enter-from {
    transform: translateX(-60px);
    opacity: 0;
}

.slide-right-leave-to {
    transform: translateX(40px);
    opacity: 0;
}

/* Onboarding exit */
.onboard-out-leave-active {
    transition: opacity 0.45s ease, transform 0.45s ease;
}

.onboard-out-leave-to {
    opacity: 0;
    transform: scale(1.03);
}

/* PIN shake */
@keyframes ob-shake {

    0%,
    100% {
        transform: translateX(0);
    }

    20% {
        transform: translateX(-10px);
    }

    40% {
        transform: translateX(10px);
    }

    60% {
        transform: translateX(-7px);
    }

    80% {
        transform: translateX(7px);
    }
}

.ob-shake {
    animation: ob-shake 0.55s ease;
}
</style>