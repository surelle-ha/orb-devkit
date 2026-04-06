<template>
  <Transition name="pin-fade">
    <div v-if="isPinLocked"
      class="fixed inset-0 z-[9998] flex flex-col items-center justify-between bg-slate-100 dark:bg-zinc-950 overflow-hidden"
      :style="{ paddingTop:'env(safe-area-inset-top)', paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">

      <!-- Ambient glow -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          :style="{ background: `radial-gradient(circle, ${accent}22 0%, transparent 65%)` }"></div>
      </div>

      <!-- Forgot PIN overlay -->
      <Teleport to="body">
        <Transition name="pin-fade">
          <div v-if="showForgot"
            class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-100 dark:bg-zinc-950 px-8"
            :style="{ paddingTop:'env(safe-area-inset-top)' }">

            <div class="w-full max-w-[380px] flex flex-col items-center gap-6">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center"
                :style="{ background: accent + '20', border: `1px solid ${accent}44` }">
                <HelpCircle :size="28" :style="{ color: accent }" :stroke-width="1.8" />
              </div>

              <div class="text-center">
                <h2 class="text-[22px] font-black text-slate-900 dark:text-white">Forgot your PIN?</h2>
                <p class="text-[13px] text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">Answer your security question to reset it.</p>
              </div>

              <div class="w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800">
                <p class="text-[11px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-2">Security Question</p>
                <p class="text-[15px] font-bold text-slate-800 dark:text-zinc-200">{{ pinMeta?.hint || 'No question set' }}</p>
              </div>

              <div class="w-full">
                <input
                  v-model="answerInput"
                  type="text"
                  placeholder="Your answer…"
                  autocomplete="off"
                  @keydown.enter="checkAnswer"
                  class="w-full bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 focus:border-violet-500 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none transition-colors"
                />
                <p v-if="answerError" class="text-[12px] font-bold text-rose-400 mt-2 text-center">{{ answerError }}</p>
              </div>

              <button @click="checkAnswer"
                class="w-full py-4 rounded-2xl text-[16px] font-black text-white active:scale-[0.98] transition-all"
                :style="{ background: accent, boxShadow: `0 8px 24px ${accent}44` }">
                Verify Answer
              </button>

              <button @click="showForgot = false; answerInput = ''; answerError = ''"
                class="text-[13px] font-semibold text-slate-500 dark:text-zinc-600 active:text-slate-400 dark:active:text-zinc-400">
                Back to PIN
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Reset PIN overlay (after correct answer) -->
      <Teleport to="body">
        <Transition name="pin-fade">
          <div v-if="showResetPin"
            class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-100 dark:bg-zinc-950 px-8"
            :style="{ paddingTop:'env(safe-area-inset-top)' }">
            <div class="w-full max-w-[380px] flex flex-col items-center gap-6">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center"
                :style="{ background: accent + '20', border: `1px solid ${accent}44` }">
                <KeyRound :size="28" :style="{ color: accent }" :stroke-width="1.8" />
              </div>
              <div class="text-center">
                <h2 class="text-[22px] font-black text-slate-900 dark:text-white">Set New PIN</h2>
                <p class="text-[13px] text-slate-500 dark:text-zinc-400 mt-1">Choose a new 6-digit PIN</p>
              </div>
              <!-- New PIN dots -->
              <div class="flex gap-4 justify-center">
                <div v-for="i in 6" :key="i"
                  class="w-4 h-4 rounded-full border-2 transition-all duration-200"
                  :class="i <= resetInput.length
                    ? 'border-transparent'
                    : 'border-slate-300 dark:border-zinc-700'"
                  :style="i <= resetInput.length ? { background: accent } : {}">
                </div>
              </div>
              <!-- keypad for reset -->
              <div class="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                <button v-for="k in ['1','2','3','4','5','6','7','8','9','','0','⌫']" :key="k"
                  @click="handleResetKey(k)"
                  :class="['h-16 rounded-2xl text-[22px] font-black transition-all active:scale-90',
                    k === '' ? 'pointer-events-none' : 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700 active:bg-slate-100 dark:active:bg-zinc-700']">
                  {{ k }}
                </button>
              </div>
              <button @click="confirmResetPin" :disabled="resetInput.length < 6"
                class="w-full py-4 rounded-2xl text-[16px] font-black text-white active:scale-[0.98] transition-all disabled:opacity-40"
                :style="{ background: accent }">
                Set PIN
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ── Main PIN Entry ── -->
      <div class="flex-1 flex flex-col items-center justify-center gap-8 w-full px-8">

        <!-- Mini orb -->
        <div class="relative" style="width:56px;height:56px;">
          <div class="absolute inset-0 rounded-full" :style="{ border: `1px solid ${accent}55`, animation:'pin-spin 10s linear infinite' }"></div>
          <div class="absolute rounded-full" :style="{ inset:'6px', background:'radial-gradient(circle at 38% 32%,#18181b 0%,#09090b 55%,#000 100%)', boxShadow:`0 0 16px 4px ${accent}44` }"></div>
        </div>

        <div class="text-center">
          <p class="text-[13px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-[0.2em]">Enter your PIN</p>
        </div>

        <!-- PIN dots -->
        <div class="flex gap-5 justify-center" :class="shaking ? 'pin-shake' : ''">
          <div v-for="i in 6" :key="i"
            class="w-4 h-4 rounded-full border-2 transition-all duration-200"
            :class="[
              i <= enteredPin.length
                ? 'border-transparent scale-110'
                : 'border-slate-300 dark:border-zinc-700 scale-100',
              wrongAttempt && i <= enteredPin.length ? 'border-rose-500' : ''
            ]"
            :style="i <= enteredPin.length && !wrongAttempt ? { background: accent } :
                    wrongAttempt && i <= enteredPin.length ? { background: '#ef4444' } : {}">
          </div>
        </div>

        <p v-if="errorMsg" class="text-[13px] font-bold text-rose-400 -mt-4">{{ errorMsg }}</p>
      </div>

      <!-- Keypad -->
      <div class="flex flex-col gap-3 w-full px-8 max-w-[380px] mx-auto">
        <div class="grid grid-cols-3 gap-3">
          <button v-for="key in keypad" :key="key"
            @click="handleKey(key)"
            :class="['h-[72px] rounded-2xl text-[24px] font-black transition-all active:scale-90',
              key === '⌫' ? 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 active:bg-slate-100 dark:active:bg-zinc-800' :
              key === '' ? 'pointer-events-none' : 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-800 active:bg-slate-100 dark:active:bg-zinc-800']">
            {{ key }}
          </button>
        </div>

        <!-- Forgot PIN -->
        <button @click="showForgot = true" class="text-center text-[13px] font-semibold text-slate-500 dark:text-zinc-600 active:text-slate-400 dark:active:text-zinc-400 py-2">
          Forgot PIN?
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { HelpCircle, KeyRound } from 'lucide-vue-next'
import { isPinLocked, unlockPin, verifyPin, verifyAnswer, setPin, pinMeta } from '../composables/usePin'
import { settings } from '../composables/useStore'

const accent = computed(() => settings.value.accentColor)

const keypad = ['1','2','3','4','5','6','7','8','9','','0','⌫']

const enteredPin  = ref('')
const errorMsg    = ref('')
const wrongAttempt = ref(false)
const shaking     = ref(false)
const showForgot  = ref(false)
const answerInput = ref('')
const answerError = ref('')
const showResetPin = ref(false)
const resetInput  = ref('')

function handleKey(k: string) {
  if (!k || k === '') return
  if (k === '⌫') {
    enteredPin.value = enteredPin.value.slice(0, -1)
    errorMsg.value = ''
    wrongAttempt.value = false
    return
  }
  if (enteredPin.value.length >= 6) return
  enteredPin.value += k
  if (enteredPin.value.length === 6) {
    checkPin()
  }
}

async function checkPin() {
  const ok = await verifyPin(enteredPin.value)
  if (ok) {
    unlockPin()
    enteredPin.value = ''
    errorMsg.value = ''
  } else {
    wrongAttempt.value = true
    shaking.value = true
    errorMsg.value = 'Incorrect PIN — try again'
    setTimeout(() => { shaking.value = false }, 600)
    setTimeout(() => {
      enteredPin.value = ''
      wrongAttempt.value = false
      errorMsg.value = ''
    }, 700)
  }
}

async function checkAnswer() {
  if (!answerInput.value.trim()) return
  const ok = await verifyAnswer(answerInput.value)
  if (ok) {
    answerError.value = ''
    showForgot.value = false
    showResetPin.value = true
  } else {
    answerError.value = 'Incorrect answer — try again'
  }
}

function handleResetKey(k: string) {
  if (!k || k === '') return
  if (k === '⌫') { resetInput.value = resetInput.value.slice(0, -1); return }
  if (resetInput.value.length >= 6) return
  resetInput.value += k
}

async function confirmResetPin() {
  if (resetInput.value.length < 6) return
  const meta = pinMeta.value
  if (meta) {
    await setPin(resetInput.value, meta.hint, answerInput.value)
  }
  showResetPin.value = false
  resetInput.value = ''
  answerInput.value = ''
  unlockPin()
}
</script>

<style scoped>
.pin-fade-enter-active { transition: opacity 0.35s ease; }
.pin-fade-leave-active { transition: opacity 0.3s ease; }
.pin-fade-enter-from, .pin-fade-leave-to { opacity: 0; }

@keyframes pin-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes pin-shake {
  0%,100% { transform:translateX(0); }
  20%     { transform:translateX(-10px); }
  40%     { transform:translateX(10px); }
  60%     { transform:translateX(-8px); }
  80%     { transform:translateX(8px); }
}
.pin-shake { animation: pin-shake 0.55s ease; }

</style>
