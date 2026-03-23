<template>
  <div class="bg-slate-100 dark:bg-zinc-950 pb-28" style="touch-action:pan-y;">
    <div class="flex items-center gap-3 px-5 pt-6 pb-4">
      <button @click="navigate('more')" class="w-9 h-9 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-center active:scale-90 transition-transform">
        <ChevronLeft :size="18" class="text-slate-600 dark:text-zinc-300" :stroke-width="2.5" />
      </button>
      <h2 class="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Settings</h2>
    </div>

    <!-- APPEARANCE -->
    <div class="px-5 pb-2"><h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Appearance</h3></div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <div class="border-b border-slate-100 dark:border-zinc-800/60">
        <button @click="accentOpen = !accentOpen" class="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 dark:active:bg-zinc-800 transition-colors">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" :style="{ background: `${accent}18` }">
            <div class="grid grid-cols-2 gap-1 p-1.5">
              <div v-for="col in ACCENT_COLORS.slice(0,4)" :key="col.hex" class="w-2.5 h-2.5 rounded-full" :style="{ background: col.hex, opacity: col.hex === accent ? 1 : 0.4 }"></div>
            </div>
          </div>
          <div class="flex-1 text-left">
            <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">Accent Color</p>
            <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1.5">
              <span class="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ background: accent }"></span>
              {{ currentAccentLabel }} · {{ accent }}
            </p>
          </div>
          <ChevronDown :size="17" :class="['text-slate-400 dark:text-zinc-500 transition-transform duration-200 flex-shrink-0', accentOpen ? 'rotate-180' : '']" :stroke-width="2" />
        </button>
        <Transition name="dropdown">
          <div v-if="accentOpen" class="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-zinc-800/60">
            <div class="grid grid-cols-6 gap-3 mb-3">
              <button v-for="col in ACCENT_COLORS" :key="col.hex" @click="setAccent(col.hex)" class="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                <div class="w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center"
                  :style="{ background: col.hex, boxShadow: accent === col.hex ? `0 0 0 2.5px white, 0 0 0 4.5px ${col.hex}` : 'none', transform: accent === col.hex ? 'scale(1.18)' : 'scale(1)' }">
                  <svg v-if="accent === col.hex" viewBox="0 0 12 12" width="13" height="13"><polyline points="2,6 5,9 10,3" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <span :class="['text-[9px] font-bold truncate w-full text-center leading-none', accent === col.hex ? 'text-slate-700 dark:text-zinc-200' : 'text-slate-400 dark:text-zinc-600']">{{ col.label }}</span>
              </button>
            </div>
            <div class="flex items-center gap-2.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800">
              <span class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 flex-shrink-0">Custom</span>
              <div class="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 cursor-pointer shadow-sm" :style="{ background: customHex }">
                <input type="color" v-model="customHex" @input="onCustomInput" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
              </div>
              <input v-model="customHex" placeholder="#8b5cf6" maxlength="7" @input="onCustomInput" class="flex-1 bg-slate-50 dark:bg-zinc-800 rounded-xl px-3 py-2 text-[12px] font-mono text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 outline-none transition-colors placeholder:text-slate-300 dark:placeholder:text-zinc-600" />
              <button @click="applyCustom" class="text-[12px] font-bold px-3 py-2 rounded-xl transition-colors flex-shrink-0" :style="{ background: `${accent}20`, color: accent }">Apply</button>
            </div>
          </div>
        </Transition>
      </div>
      <div class="flex items-center gap-3 px-4 py-3.5">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" :style="{ background: `${accent}18` }">
          <component :is="darkModeIcon" :size="19" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">Theme</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{{ darkModeLabel }}</p>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-1.5 px-4 pb-3.5">
        <button v-for="opt in darkModeOptions" :key="opt.value" @click="setMode(opt.value)"
          class="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[11px] font-bold transition-all active:scale-95"
          :style="mode === opt.value ? { background: `${accent}18`, borderColor: accent, color: accent } : {}"
          :class="mode !== opt.value ? 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400' : ''">
          <component :is="opt.icon" :size="14" :stroke-width="2" />{{ opt.label }}
        </button>
      </div>

      <!-- Balance Card Style -->
      <div class="border-t border-slate-100 dark:border-zinc-800/60 px-4 py-3.5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :style="{ background: `${accent}18` }">
            <LayoutTemplate :size="17" :style="{ color: accent }" :stroke-width="1.8" />
          </div>
          <div>
            <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">Balance Card Style</p>
            <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Choose your home screen balance look</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          <!-- Supreme Orb preview -->
          <button @click="saveSettings({ balanceStyle: 'supreme' })"
            :class="['relative overflow-hidden rounded-2xl border-2 transition-all active:scale-[0.97] p-3',
              settings.balanceStyle === 'supreme' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800']">
            <div class="w-full rounded-xl overflow-hidden mb-2"
              style="background:#09090b;height:56px;position:relative;">
              <div class="absolute inset-0" :style="{ background: `radial-gradient(ellipse at 50% 30%, ${accent}30 0%, transparent 70%)` }"></div>
              <div class="absolute" style="top:50%;left:50%;transform:translate(-50%,-50%);width:28px;height:28px;">
                <div class="absolute inset-0 rounded-full"
                  :style="{ background: `radial-gradient(circle at 38% 32%,#1a1a2e 0%,#000 100%)`, boxShadow: `0 0 8px 2px ${accent}44, 0 0 0 1px ${accent}55` }"></div>
              </div>
            </div>
            <p :class="['text-[12px] font-black text-center', settings.balanceStyle === 'supreme' ? 'text-violet-600 dark:text-violet-300' : 'text-slate-500 dark:text-zinc-400']">Supreme Orb</p>
            <p class="text-[9px] text-slate-400 dark:text-zinc-600 text-center mt-0.5">Orb with starfield</p>
            <div v-if="settings.balanceStyle === 'supreme'" class="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" :style="{ background: accent }">
              <Check :size="9" color="white" :stroke-width="3" />
            </div>
          </button>

          <!-- Minimal Orb preview -->
          <button @click="saveSettings({ balanceStyle: 'minimal' })"
            :class="['relative overflow-hidden rounded-2xl border-2 transition-all active:scale-[0.97] p-3',
              settings.balanceStyle === 'minimal' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800']">
            <div class="w-full rounded-xl overflow-hidden mb-2 bg-white dark:bg-zinc-900"
              style="height:56px;position:relative;border:1px solid rgba(0,0,0,0.06);">
              <div class="absolute inset-0 flex items-center px-3 gap-2">
                <div class="w-5 h-5 rounded-full flex-shrink-0"
                  :style="{ background: `radial-gradient(circle at 38% 32%,#1a1a2e 0%,#000 100%)`, boxShadow: `0 0 6px 1px ${accent}66` }"></div>
                <div class="flex flex-col gap-0.5">
                  <div class="h-1.5 rounded-full w-16" :style="{ background: accent + '44' }"></div>
                  <div class="h-1 rounded-full w-10" :style="{ background: accent + '22' }"></div>
                </div>
              </div>
            </div>
            <p :class="['text-[12px] font-black text-center', settings.balanceStyle === 'minimal' ? 'text-violet-600 dark:text-violet-300' : 'text-slate-500 dark:text-zinc-400']">Minimal Orb</p>
            <p class="text-[9px] text-slate-400 dark:text-zinc-600 text-center mt-0.5">Clean &amp; compact</p>
            <div v-if="settings.balanceStyle === 'minimal'" class="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" :style="{ background: accent }">
              <Check :size="9" color="white" :stroke-width="3" />
            </div>
          </button>

          <!-- Neon Card style -->
          <button @click="saveSettings({ balanceStyle: 'neon' })"
            :class="['relative overflow-hidden rounded-2xl border-2 transition-all active:scale-[0.97] p-3',
              settings.balanceStyle === 'neon' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800']">
            <!-- Preview: gradient card with glowing numbers -->
            <div class="w-full rounded-xl overflow-hidden mb-2"
              style="height:56px;position:relative;"
              :style="{ background: `linear-gradient(135deg, #0f0f23, ${accent}55)` }">
              <div class="absolute inset-0 flex flex-col justify-center px-3">
                <div class="h-2 rounded w-10 mb-1" :style="{ background: accent + 'AA' }"></div>
                <div class="h-3 rounded w-20 font-black" :style="{ background: accent }"></div>
                <div class="flex gap-1 mt-1">
                  <div class="h-1 rounded w-7" :style="{ background: accent + '55' }"></div>
                  <div class="h-1 rounded w-7" :style="{ background: accent + '33' }"></div>
                </div>
              </div>
              <!-- Neon glow -->
              <div class="absolute bottom-0 left-0 right-0 h-px" :style="{ background: accent + 'CC', boxShadow: `0 0 8px ${accent}` }"></div>
            </div>
            <p :class="['text-[12px] font-black text-center', settings.balanceStyle === 'neon' ? 'text-violet-600 dark:text-violet-300' : 'text-slate-500 dark:text-zinc-400']">Neon Card</p>
            <p class="text-[9px] text-slate-400 dark:text-zinc-600 text-center mt-0.5">Dark gradient glow</p>
            <div v-if="settings.balanceStyle === 'neon'" class="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" :style="{ background: accent }">
              <Check :size="9" color="white" :stroke-width="3" />
            </div>
          </button>

          <!-- Glass style -->
          <button @click="saveSettings({ balanceStyle: 'glass' })"
            :class="['relative overflow-hidden rounded-2xl border-2 transition-all active:scale-[0.97] p-3',
              settings.balanceStyle === 'glass' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800']">
            <!-- Preview: frosted glass card -->
            <div class="w-full rounded-xl overflow-hidden mb-2"
              style="height:56px;position:relative;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);backdrop-filter:blur(8px);">
              <div class="absolute inset-0" :style="{ background: `radial-gradient(ellipse at 30% 50%, ${accent}20 0%, transparent 60%)` }"></div>
              <div class="absolute inset-0 flex flex-col justify-center px-3 gap-1">
                <div class="h-1.5 rounded-full w-14 bg-white/20"></div>
                <div class="h-2.5 rounded-full w-20" :style="{ background: 'rgba(255,255,255,0.35)' }"></div>
                <div class="flex gap-2">
                  <div class="h-1 rounded-full w-8 bg-white/15"></div>
                  <div class="h-1 rounded-full w-6 bg-white/10"></div>
                </div>
              </div>
            </div>
            <p :class="['text-[12px] font-black text-center', settings.balanceStyle === 'glass' ? 'text-violet-600 dark:text-violet-300' : 'text-slate-500 dark:text-zinc-400']">Glass Card</p>
            <p class="text-[9px] text-slate-400 dark:text-zinc-600 text-center mt-0.5">Frosted blur effect</p>
            <div v-if="settings.balanceStyle === 'glass'" class="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" :style="{ background: accent }">
              <Check :size="9" color="white" :stroke-width="3" />
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- CURRENCY -->
    <div class="px-5 pb-2"><h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Currency</h3></div>
    <div class="mx-4 mb-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <button @click="currencyOpen = !currencyOpen" class="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 dark:active:bg-zinc-800 transition-colors rounded-2xl">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" :style="{ background: `${accent}18` }">
          <span class="text-[18px] font-black" :style="{ color: accent }">{{ selectedCurrency.symbol }}</span>
        </div>
        <div class="flex-1 text-left">
          <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">{{ selectedCurrency.label }}</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{{ selectedCurrency.code }}</p>
        </div>
        <ChevronDown :size="17" :class="['text-slate-400 dark:text-zinc-500 transition-transform flex-shrink-0', currencyOpen ? 'rotate-180' : '']" :stroke-width="2" />
      </button>
      <Transition name="dropdown">
        <div v-if="currencyOpen" class="border-t border-slate-100 dark:border-zinc-800/60">
          <button v-for="(cur, i) in CURRENCIES" :key="cur.code" @click="setCurrency(cur)"
            :class="['w-full flex items-center gap-3 px-4 py-3 transition-colors active:bg-slate-50 dark:active:bg-zinc-800', i < CURRENCIES.length - 1 ? 'border-b border-slate-50 dark:border-zinc-800/40' : '']">
            <span class="w-8 text-center text-[16px] font-black text-slate-500 dark:text-zinc-400 flex-shrink-0">{{ cur.symbol }}</span>
            <div class="flex-1 text-left">
              <p class="text-[13px] font-bold" :style="{ color: settings.currency === cur.code ? accent : '' }" :class="settings.currency !== cur.code ? 'text-slate-700 dark:text-zinc-200' : ''">{{ cur.label }}</p>
              <p class="text-[10px] text-slate-400 dark:text-zinc-500">{{ cur.code }}</p>
            </div>
            <div v-if="settings.currency === cur.code" class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" :style="{ background: accent }">
              <Check :size="11" color="white" :stroke-width="3" />
            </div>
          </button>
        </div>
      </Transition>
    </div>

    <!-- SECURITY -->
    <div class="px-5 pb-2"><h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Security</h3></div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">

      <!-- Idle Screen Lock -->
      <div class="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800/60">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" :style="{ background: `${accent}18` }">
          <Lock :size="19" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">Idle Screen Lock</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Blur & lock after inactivity</p>
        </div>
        <button @click="toggleIdleLock" class="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
          :style="{ background: settings.idleLockEnabled ? accent : '' }" :class="!settings.idleLockEnabled ? 'bg-slate-200 dark:bg-zinc-700' : ''">
          <div :class="['absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all', settings.idleLockEnabled ? 'left-6' : 'left-0.5']"></div>
        </button>
      </div>
      <Transition name="dropdown">
        <div v-if="settings.idleLockEnabled" class="px-4 py-4 border-b border-slate-100 dark:border-zinc-800/60">
          <p class="text-[12px] font-bold text-slate-500 dark:text-zinc-400 mb-3">Lock after <span :style="{ color: accent }">{{ settings.idleLockMinutes }} min{{ settings.idleLockMinutes > 1 ? 's' : '' }}</span> of inactivity</p>
          <div class="grid grid-cols-4 gap-2">
            <button v-for="m in [1, 2, 5, 10, 15, 20, 30, 60]" :key="m" @click="setIdleMinutes(m)"
              class="py-2 rounded-xl text-[12px] font-bold border transition-all"
              :style="settings.idleLockMinutes === m ? { background: `${accent}18`, borderColor: accent, color: accent } : {}"
              :class="settings.idleLockMinutes !== m ? 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400' : ''">
              {{ m }}m
            </button>
          </div>
        </div>
      </Transition>

      <!-- App PIN -->
      <div class="flex items-center gap-3 px-4 py-3.5" :class="pinEnabled ? 'border-b border-slate-100 dark:border-zinc-800/60' : ''">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" :style="{ background: `${accent}18` }">
          <KeyRound :size="19" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">App PIN</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{{ pinEnabled ? 'PIN active — tap to change or remove' : 'Require PIN to open the app' }}</p>
        </div>
        <button v-if="!pinEnabled" @click="openPinSetup"
          class="flex-shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all active:scale-95"
          :style="{ background: `${accent}18`, color: accent }">Set PIN</button>
        <button v-else @click="showPinManage = true"
          class="flex-shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-all active:scale-95">Manage</button>
      </div>
      <Transition name="dropdown">
        <div v-if="pinEnabled" class="px-4 py-3 flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
          <p class="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">PIN protection active</p>
          <div class="flex gap-1 ml-auto">
            <div v-for="i in 4" :key="i" class="w-2.5 h-2.5 rounded-full" :style="{ background: accent }"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-zinc-700"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-zinc-700"></div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ORB AI -->
    <div class="px-5 pb-2"><h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Orb AI</h3></div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">

      <!-- Status row -->
      <div class="flex items-center gap-3 px-4 py-3.5" :class="orbAiEnabled ? 'border-b border-slate-100 dark:border-zinc-800/60' : ''">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
          :style="{ background: `${accent}18` }">
          <Sparkles :size="19" :style="{ color: accent }" :stroke-width="1.8" />
          <!-- Live status dot -->
          <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900"
            :class="orbAiReady ? 'bg-emerald-400' : orbAiDownloading ? 'bg-amber-400 animate-pulse' : 'bg-zinc-400'">
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">Orb AI</p>
          <p class="text-[11px] mt-0.5"
            :class="orbAiReady ? 'text-emerald-500' : orbAiDownloading ? 'text-amber-500' : 'text-slate-400 dark:text-zinc-500'">
            {{ orbAiStatus }}
          </p>
        </div>
        <!-- Toggle -->
        <button @click="toggleOrbAI" :disabled="orbAiDownloading"
          class="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
          :style="{ background: orbAiEnabled ? accent : '' }"
          :class="!orbAiEnabled ? 'bg-slate-200 dark:bg-zinc-700' : ''">
          <div :class="['absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all',
            orbAiEnabled ? 'left-6' : 'left-0.5']"></div>
        </button>
      </div>

      <!-- Downloading progress bar -->
      <div v-if="orbAiDownloading" class="px-4 pt-3 pb-1">
        <div class="flex justify-between items-center mb-1.5">
          <p class="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
            {{ orbAiProgress < 88 ? 'Downloading model…' : 'Loading into memory…' }}
          </p>
          <p class="text-[11px] font-bold" :style="{ color: accent }">{{ orbAiProgress }}%</p>
        </div>
        <div class="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-1">
          <div class="h-full rounded-full transition-all duration-500"
            :style="{ width: orbAiProgress + '%', background: accent }"></div>
        </div>
        <p class="text-[10px] text-slate-400 dark:text-zinc-600 font-mono truncate">{{ orbAiProgressMsg }}</p>
      </div>

      <!-- Enabled but not downloaded yet -->
      <div v-else-if="orbAiEnabled && !orbAiReady" class="px-4 py-3">
        <button @click="startAiDownload"
          class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold active:scale-[0.98] transition-all"
          :style="{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }">
          <Download :size="15" :stroke-width="2.5" />
          Download Orb AI (~800 MB)
        </button>
      </div>

      <!-- Ready — show re-download option -->
      <div v-else-if="orbAiReady" class="px-4 py-3 flex items-center justify-between">
        <p class="text-[11px] text-emerald-500 font-semibold">✓ Orb AI ready · Private mode</p>
        <button @click="redownloadAI"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex-shrink-0 ml-3"
          :style="{ background: `${accent}12`, color: accent }">
          <Download :size="11" :stroke-width="2.5" /> Re-download
        </button>
      </div>

      <!-- Backend selector -->
      <div v-if="!orbAiDownloading && orbAiEnabled" class="px-4 py-3 border-t border-slate-100 dark:border-zinc-800/60">
        <p class="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-2.5">Processing Engine</p>
        <div class="grid grid-cols-2 gap-2">
          <button @click="applyAiBackend('CPU')"
            :class="['flex flex-col items-start gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-[0.97]',
              aiBackend === 'CPU'
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                : 'border-transparent bg-slate-50 dark:bg-zinc-800']">
            <div class="flex items-center gap-2">
              <div :class="['w-2 h-2 rounded-full', aiBackend === 'CPU' ? 'bg-violet-500' : 'bg-slate-300 dark:bg-zinc-600']"></div>
              <span :class="['text-[13px] font-black', aiBackend === 'CPU' ? 'text-violet-600 dark:text-violet-300' : 'text-slate-700 dark:text-zinc-200']">CPU</span>
            </div>
            <p class="text-[10px] leading-snug" :class="aiBackend === 'CPU' ? 'text-violet-500/70' : 'text-slate-400 dark:text-zinc-600'">Stable on all devices. Slower responses (~10–20s).</p>
          </button>
          <button @click="applyAiBackend('GPU')"
            :class="['flex flex-col items-start gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-[0.97]',
              aiBackend === 'GPU'
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                : 'border-transparent bg-slate-50 dark:bg-zinc-800']">
            <div class="flex items-center gap-2">
              <div :class="['w-2 h-2 rounded-full', aiBackend === 'GPU' ? 'bg-violet-500' : 'bg-slate-300 dark:bg-zinc-600']"></div>
              <span :class="['text-[13px] font-black', aiBackend === 'GPU' ? 'text-violet-600 dark:text-violet-300' : 'text-slate-700 dark:text-zinc-200']">GPU</span>
            </div>
            <p class="text-[10px] leading-snug" :class="aiBackend === 'GPU' ? 'text-violet-500/70' : 'text-slate-400 dark:text-zinc-600'">Faster responses. May not work on all devices.</p>
          </button>
        </div>
        <p v-if="aiBackend === 'GPU'" class="text-[10px] text-amber-500 mt-2 leading-relaxed">
          ⚠ If Orb AI crashes or gives errors, switch back to CPU.
        </p>
        <p v-if="(orbAiReady || orbAiDownloaded)" class="text-[10px] text-slate-400 dark:text-zinc-600 mt-1.5 leading-relaxed">
          Reload the model after switching engines.
          <button @click="redownloadAI" class="underline ml-1" :style="{ color: accent }">Reload now</button>
        </p>
      </div>

      <!-- Info footer -->
      <div v-if="!orbAiDownloading" class="px-4 pb-3 pt-2 flex items-start gap-2.5 border-t border-slate-100 dark:border-zinc-800/60">
        <p class="text-[10px] text-slate-400 dark:text-zinc-600 leading-relaxed">
          Runs fully offline on your device. No data is sent to any server.
        </p>
      </div>
    </div>

    <!-- PREFERENCES -->
    <div class="px-5 pb-2"><h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Preferences</h3></div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <div class="flex items-center gap-3 px-4 py-3.5">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" :style="{ background: `${accent}18` }">
          <Smartphone :size="19" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">Shake to Add</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Shake phone to open transaction sheet</p>
        </div>
        <button @click="toggleShake" class="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
          :style="{ background: settings.shakeToAdd ? accent : '' }" :class="!settings.shakeToAdd ? 'bg-slate-200 dark:bg-zinc-700' : ''">
          <div :class="['absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all', settings.shakeToAdd ? 'left-6' : 'left-0.5']"></div>
        </button>
      </div>
    </div>

    <!-- DATA -->
    <div class="px-5 pb-2"><h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Data</h3></div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">
      <!-- Export -->
      <button @click="openExport"
        class="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800/60 active:bg-slate-50 dark:active:bg-zinc-800 transition-colors">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" :style="{ background: `${accent}18` }">
          <Upload :size="19" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">Export Data</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Download encrypted backup of all data</p>
        </div>
        <ChevronRight :size="17" class="text-slate-300 dark:text-zinc-700 flex-shrink-0" :stroke-width="2" />
      </button>
      <!-- Import -->
      <button @click="openImport"
        class="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 dark:active:bg-zinc-800 transition-colors">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" :style="{ background: `${accent}18` }">
          <Download :size="19" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">Import Data</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Restore from an Orb backup file</p>
        </div>
        <ChevronRight :size="17" class="text-slate-300 dark:text-zinc-700 flex-shrink-0" :stroke-width="2" />
      </button>
    </div>

    <!-- CATEGORIES -->
    <div class="px-5 pb-2"><h3 class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Expense Categories</h3></div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm">

      <!-- Built-in chips (read-only) -->
      <div class="px-4 pt-3.5 pb-2">
        <p class="text-[11px] font-semibold text-slate-400 dark:text-zinc-600 mb-2">Built-in</p>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="cat in builtInCategories" :key="cat"
            class="px-3 py-1 rounded-full text-[12px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
            {{ cat }}
          </span>
        </div>
      </div>

      <div class="mx-4 h-px bg-slate-100 dark:bg-zinc-800"></div>

      <!-- Custom categories list -->
      <div class="px-4 pt-3 pb-2">
        <p class="text-[11px] font-semibold text-slate-400 dark:text-zinc-600 mb-2">Custom</p>
        <div v-if="(settings.customCategories ?? []).length === 0"
          class="text-[12px] font-semibold text-slate-300 dark:text-zinc-700 py-1">
          None added yet.
        </div>
        <div v-else class="flex flex-wrap gap-1.5">
          <button v-for="cat in settings.customCategories" :key="cat"
            @click="removeCategory(cat)"
            class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold transition-all active:scale-95"
            :style="{ background: accent + '18', color: accent }">
            {{ cat }}
            <X :size="10" :stroke-width="2.5" />
          </button>
        </div>
      </div>

      <!-- Add new category row -->
      <div class="px-4 pt-1 pb-3.5 border-t border-slate-100 dark:border-zinc-800/60 mt-1">
        <div class="flex items-center gap-2 mt-2">
          <div class="flex-1 flex items-center bg-slate-50 dark:bg-zinc-800 rounded-2xl px-3 py-2.5 border-2 border-transparent focus-within:border-violet-500 transition-colors gap-2">
            <Tag :size="14" class="text-slate-400 dark:text-zinc-600 flex-shrink-0" :stroke-width="2" />
            <input
              v-model="newCategory"
              placeholder="New category name…"
              maxlength="24"
              @keydown.enter="addCategory"
              class="flex-1 bg-transparent text-[14px] font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-300 dark:placeholder:text-zinc-600 outline-none"
            />
          </div>
          <button @click="addCategory"
            :disabled="!newCategory.trim()"
            class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            :style="newCategory.trim() ? { background: accent, boxShadow: `0 4px 12px ${accent}44` } : {}"
            :class="!newCategory.trim() ? 'bg-slate-100 dark:bg-zinc-800' : ''">
            <Plus :size="17"
              :style="newCategory.trim() ? { color: 'white' } : {}"
              :class="!newCategory.trim() ? 'text-slate-300 dark:text-zinc-600' : ''"
              :stroke-width="2.5" />
          </button>
        </div>
        <p v-if="catError" class="text-[11px] font-bold text-rose-500 mt-1.5 px-1">{{ catError }}</p>
      </div>
    </div>

    <!-- DANGER ZONE -->
    <div class="px-5 pb-2"><h3 class="text-[11px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest">Danger Zone</h3></div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-rose-200/60 dark:border-rose-900/40 shadow-sm">
      <button @click="confirmAction('all')" class="w-full flex items-center gap-3 px-4 py-3.5 border-b border-rose-100 dark:border-rose-900/30 active:bg-rose-50 dark:active:bg-rose-950/20 transition-colors">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style="background:linear-gradient(135deg,rgba(109,40,217,0.2),rgba(139,92,246,0.12));border:1px solid rgba(139,92,246,0.3)">
          <Trash2 :size="19" style="color:#8b5cf6" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold" style="color:#8b5cf6">Clear All Data</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Reset everything to zero — irreversible</p>
        </div>
        <ChevronRight :size="17" class="text-slate-300 dark:text-zinc-700 flex-shrink-0" :stroke-width="2" />
      </button>
      <button @click="confirmAction('bills')" class="w-full flex items-center gap-3 px-4 py-3.5 border-b border-rose-100 dark:border-rose-900/30 active:bg-rose-50 dark:active:bg-rose-950/20 transition-colors">
        <div class="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0">
          <Zap :size="19" class="text-rose-500" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-rose-500">Clear Bills Data</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Remove all bills and dues</p>
        </div>
        <ChevronRight :size="17" class="text-slate-300 dark:text-zinc-700 flex-shrink-0" :stroke-width="2" />
      </button>
      <button @click="confirmAction('grocery')" class="w-full flex items-center gap-3 px-4 py-3.5 active:bg-rose-50 dark:active:bg-rose-950/20 transition-colors">
        <div class="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center flex-shrink-0">
          <ShoppingCart :size="19" class="text-rose-500" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-bold text-rose-500">Clear Grocery Data</p>
          <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Remove all grocery lists and items</p>
        </div>
        <ChevronRight :size="17" class="text-slate-300 dark:text-zinc-700 flex-shrink-0" :stroke-width="2" />
      </button>
    </div>

    <div class="mx-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur border border-slate-200/60 dark:border-zinc-800/60 shadow-sm px-4 py-4 flex items-center gap-3">
      <div class="relative flex-shrink-0" style="width:40px;height:40px;">
        <div class="absolute inset-0 rounded-full" style="animation:settings-cw 8s linear infinite;" :style="{ border: `1px solid ${accent}80` }"></div>
        <div class="absolute rounded-full" style="inset:7px;background:radial-gradient(circle at 40% 35%,#18181b 0%,#09090b 60%,#000 100%);" :style="{ boxShadow: `0 0 10px 2px ${accent}66` }"></div>
      </div>
      <div>
        <p class="text-[14px] font-black text-slate-800 dark:text-zinc-100">Orb Finance</p>
        <p class="text-[11px] text-slate-400 dark:text-zinc-500">Your Financial Universe · v1.0</p>
      </div>
    </div>
    <div class="h-4"></div>
  </div>

  <!-- Danger Zone Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="dangerTarget" class="fixed inset-0 z-[300] flex items-end justify-center" style="background:rgba(0,0,0,0.65);backdrop-filter:blur(14px)" @click.self="dangerTarget = null">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t pb-10 px-5 pt-5"
          :class="dangerTarget === 'all' ? 'bg-[#0e0b1e] border-purple-900/50' : 'bg-white dark:bg-zinc-900 border-rose-200/60 dark:border-rose-900/40'">
          <div class="w-10 h-1 rounded-full self-center mx-auto mb-5" :class="dangerTarget === 'all' ? 'bg-purple-800' : 'bg-slate-200 dark:bg-zinc-700'"></div>
          <div class="flex justify-center mb-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
              :style="dangerTarget === 'all' ? 'background:linear-gradient(135deg,rgba(109,40,217,0.3),rgba(139,92,246,0.15));border:1px solid rgba(139,92,246,0.4)' : 'background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2)'">
              <component :is="dangerIcon" :size="24" :style="{ color: dangerTarget === 'all' ? '#a78bfa' : '#ef4444' }" :stroke-width="1.8" />
            </div>
          </div>
          <p class="text-[18px] font-black text-center mb-2" :class="dangerTarget === 'all' ? 'text-purple-200' : 'text-slate-900 dark:text-zinc-50'">{{ dangerTitle }}</p>
          <p class="text-[13px] text-center leading-relaxed mb-6" :class="dangerTarget === 'all' ? 'text-purple-400/70' : 'text-slate-500 dark:text-zinc-400'">{{ dangerDesc }}</p>
          <button @click="executeDanger" class="w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] mb-3"
            :style="dangerTarget === 'all' ? 'background:linear-gradient(135deg,#4c1d95,#7c3aed);color:white;box-shadow:0 8px 32px rgba(109,40,217,0.4)' : 'background:#ef4444;color:white;box-shadow:0 8px 32px rgba(239,68,68,0.35)'">
            {{ dangerConfirmLabel }}
          </button>
          <button @click="dangerTarget = null" class="w-full py-3.5 rounded-2xl text-[15px] font-bold active:scale-[0.98]"
            :class="dangerTarget === 'all' ? 'bg-purple-900/30 text-purple-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'">Cancel</button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- PIN Setup Sheet -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showPinSetup" class="fixed inset-0 z-[300] flex items-end justify-center" style="background:rgba(0,0,0,0.6);backdrop-filter:blur(12px)" @click.self="closePinSetup">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800" :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-4 px-5 pt-4">
            <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mb-1"></div>
            <h3 class="text-[18px] font-black text-center text-slate-900 dark:text-zinc-50">Set App PIN</h3>
            <p class="text-[13px] text-slate-400 dark:text-zinc-500 text-center -mt-2">Choose a 6-digit PIN</p>
            <div class="flex gap-4 justify-center py-2">
              <div v-for="i in 6" :key="i" class="w-4 h-4 rounded-full border-2 transition-all duration-200"
                :class="i <= setupPin.length ? 'border-transparent scale-110' : 'border-slate-300 dark:border-zinc-600'"
                :style="i <= setupPin.length ? { background: accent } : {}"></div>
            </div>
            <div class="grid grid-cols-3 gap-2.5">
              <button v-for="k in ['1','2','3','4','5','6','7','8','9','','0','⌫']" :key="k+'-s'" @click="handleSetupKey(k)"
                :class="['h-[62px] rounded-2xl text-[22px] font-black transition-all active:scale-90', k==='' ? 'pointer-events-none' : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 active:bg-slate-200 dark:active:bg-zinc-700']">
                {{ k }}
              </button>
            </div>
            <button @click="proceedToQuestion" :disabled="setupPin.length < 6"
              class="w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] transition-all disabled:opacity-40"
              :style="setupPin.length >= 6 ? { background: accent, color: 'white', boxShadow: `0 8px 24px ${accent}44` } : { background: '#e2e8f0', color: '#94a3b8' }">
              Continue
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Security Question Sheet -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showQuestionSetup" class="fixed inset-0 z-[300] flex items-end justify-center" style="background:rgba(0,0,0,0.6);backdrop-filter:blur(12px)" @click.self="showQuestionSetup = false">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800" :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-4 px-5 pt-4 max-h-[88vh] overflow-y-auto pb-2">
            <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mb-1"></div>
            <h3 class="text-[18px] font-black text-center text-slate-900 dark:text-zinc-50">Security Question</h3>
            <p class="text-[13px] text-slate-400 dark:text-zinc-500 text-center -mt-2">Used to reset your PIN if forgotten</p>
            <div>
              <p class="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-1">Choose a question</p>
              <div class="flex flex-col gap-1.5">
                <button v-for="q in securityQuestions" :key="q" @click="selectedQuestion = q"
                  :class="['text-left px-4 py-3 rounded-xl text-[13px] font-semibold border-2 transition-all active:scale-[0.98]',
                    selectedQuestion === q ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300' : 'border-transparent bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400']">
                  {{ q }}
                </button>
              </div>
            </div>
            <Transition name="dropdown">
              <input v-if="selectedQuestion" v-model="securityAnswer" type="text" autocomplete="off"
                placeholder="Your answer (case-insensitive)"
                class="w-full bg-slate-50 dark:bg-zinc-800 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 border-2 border-transparent focus:border-violet-500 outline-none transition-colors" />
            </Transition>
            <button @click="savePinSetup" :disabled="!selectedQuestion || !securityAnswer.trim()"
              class="w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] transition-all disabled:opacity-40"
              :style="selectedQuestion && securityAnswer.trim() ? { background: accent, color: 'white', boxShadow: `0 8px 24px ${accent}44` } : { background: '#e2e8f0', color: '#94a3b8' }">
              Save PIN
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- PIN Manage Sheet -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showPinManage" class="fixed inset-0 z-[300] flex items-end justify-center" style="background:rgba(0,0,0,0.6);backdrop-filter:blur(12px)" @click.self="showPinManage = false">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800" :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-3 px-5 pt-4 pb-2">
            <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mb-1"></div>
            <h3 class="text-[18px] font-black text-center text-slate-900 dark:text-zinc-50">Manage PIN</h3>
            <button @click="startChangePIN" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800 active:scale-[0.98] transition-all">
              <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" :style="{ background: `${accent}18` }">
                <KeyRound :size="19" :style="{ color: accent }" :stroke-width="1.8" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-[14px] font-bold text-slate-800 dark:text-zinc-100">Change PIN</p>
                <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Set a new PIN code</p>
              </div>
              <ChevronRight :size="17" class="text-slate-300 dark:text-zinc-700" :stroke-width="2" />
            </button>
            <button @click="showRemovePinConfirm = true; showPinManage = false" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 active:scale-[0.98] transition-all">
              <div class="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
                <Trash2 :size="19" class="text-rose-500" :stroke-width="1.8" />
              </div>
              <div class="flex-1 text-left">
                <p class="text-[14px] font-bold text-rose-500">Remove PIN</p>
                <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Disable PIN protection</p>
              </div>
              <ChevronRight :size="17" class="text-rose-300 dark:text-rose-700" :stroke-width="2" />
            </button>
            <button @click="showPinManage = false" class="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[15px] font-bold active:scale-[0.98]">Cancel</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Remove PIN Confirm -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showRemovePinConfirm" class="fixed inset-0 z-[400] flex items-end justify-center" style="background:rgba(0,0,0,0.6);backdrop-filter:blur(12px)" @click.self="showRemovePinConfirm = false">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-rose-200/60 dark:border-rose-900/40 pb-10 px-5 pt-5">
          <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mx-auto mb-5"></div>
          <p class="text-[18px] font-black text-slate-900 dark:text-zinc-50 text-center mb-2">Remove PIN?</p>
          <p class="text-[13px] text-slate-400 text-center mb-6">Your app will no longer be protected by a PIN.</p>
          <button @click="doRemovePin" class="w-full py-4 rounded-2xl bg-rose-500 text-white text-[16px] font-black active:scale-[0.98] shadow-lg shadow-rose-500/30 mb-3">Yes, Remove PIN</button>
          <button @click="showRemovePinConfirm = false" class="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[15px] font-bold active:scale-[0.98]">Cancel</button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ EXPORT SHEET ══ -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showExport"
        class="fixed inset-0 z-[300] flex items-end justify-center"
        style="background:rgba(0,0,0,0.6);backdrop-filter:blur(12px)"
        @click.self="closeExport">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-4 px-5 pt-4">
            <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mb-1"></div>
            <h3 class="text-[18px] font-black text-center text-slate-900 dark:text-zinc-50">Export Data</h3>
            <p class="text-[13px] text-slate-400 dark:text-zinc-500 text-center -mt-2 leading-relaxed">
              Your data will be encrypted with a password. You'll need this password to import it on another device.
            </p>

            <div v-if="exportStep === 'password'" class="flex flex-col gap-3">
              <div :class="['flex items-center gap-3 rounded-2xl px-4 py-3.5 border-2 transition-colors',
                exportError ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20' : 'bg-slate-50 dark:bg-zinc-800 border-transparent focus-within:border-violet-500']">
                <Lock :size="17" :class="exportError ? 'text-rose-400' : 'text-slate-400 dark:text-zinc-500'" :stroke-width="2" class="flex-shrink-0" />
                <input v-model="exportPassword" type="password" placeholder="Set a backup password"
                  autocomplete="new-password"
                  class="flex-1 bg-transparent text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 outline-none" />
              </div>
              <div :class="['flex items-center gap-3 rounded-2xl px-4 py-3.5 border-2 transition-colors',
                exportError ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20' : 'bg-slate-50 dark:bg-zinc-800 border-transparent focus-within:border-violet-500']">
                <Lock :size="17" :class="exportError ? 'text-rose-400' : 'text-slate-400 dark:text-zinc-500'" :stroke-width="2" class="flex-shrink-0" />
                <input v-model="exportPasswordConfirm" type="password" placeholder="Confirm password"
                  autocomplete="new-password"
                  class="flex-1 bg-transparent text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 outline-none" />
              </div>
              <p v-if="exportError" class="text-[12px] font-bold text-rose-500 px-1">{{ exportError }}</p>
              <button @click="doExport"
                :disabled="!exportPassword || !exportPasswordConfirm"
                :class="['w-full py-4 rounded-2xl text-[16px] font-black transition-all active:scale-[0.98]',
                  exportPassword && exportPasswordConfirm ? 'text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600']"
                :style="exportPassword && exportPasswordConfirm ? { background: accent, boxShadow: `0 8px 24px ${accent}44` } : {}">
                Export &amp; Download
              </button>
            </div>

            <div v-else class="flex flex-col items-center gap-4 py-4">
              <div class="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <CheckCircle :size="32" class="text-emerald-500" :stroke-width="1.5" />
              </div>
              <p class="text-[16px] font-black text-slate-900 dark:text-zinc-50">Export complete!</p>
              <p class="text-[13px] text-slate-400 dark:text-zinc-500 text-center">Your encrypted backup file has been downloaded. Keep it and your password safe.</p>
              <button @click="closeExport" class="w-full py-4 rounded-2xl text-white text-[16px] font-black active:scale-[0.98]"
                :style="{ background: accent }">Done</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ IMPORT SHEET ══ -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showImport"
        class="fixed inset-0 z-[300] flex items-end justify-center"
        style="background:rgba(0,0,0,0.6);backdrop-filter:blur(12px)"
        @click.self="closeImport">
        <div class="w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-[28px] border-t border-slate-200/60 dark:border-zinc-800"
          :style="{ paddingBottom:'calc(32px + env(safe-area-inset-bottom))' }">
          <div class="flex flex-col gap-4 px-5 pt-4">
            <div class="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full self-center mb-1"></div>
            <h3 class="text-[18px] font-black text-center text-slate-900 dark:text-zinc-50">Import Data</h3>
            <p class="text-[13px] text-slate-400 dark:text-zinc-500 text-center -mt-2 leading-relaxed">
              Select your <span class="font-bold text-slate-600 dark:text-zinc-300">.orbbackup</span> file and enter the password used when exporting.
            </p>

            <div v-if="importStep === 'file'" class="flex flex-col gap-3">
              <!-- File picker -->
              <div :class="['flex items-center gap-3 rounded-2xl px-4 py-3.5 border-2 transition-all cursor-pointer',
                importFile ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' : 'border-dashed border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-800']"
                @click="triggerFilePicker">
                <FileArchive :size="18" :class="importFile ? 'text-violet-500' : 'text-slate-400 dark:text-zinc-600'" :stroke-width="1.8" class="flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-semibold truncate"
                    :class="importFile ? 'text-violet-700 dark:text-violet-300' : 'text-slate-400 dark:text-zinc-600'">
                    {{ importFile ? importFile.name : 'Tap to choose .orbbackup file' }}
                  </p>
                  <p v-if="importFile" class="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{{ formatFileSize(importFile.size) }}</p>
                </div>
              </div>
              <input ref="fileInputRef" type="file" accept=".orbbackup,.json" class="hidden" @change="onFileSelected" />

              <!-- Password -->
              <div :class="['flex items-center gap-3 rounded-2xl px-4 py-3.5 border-2 transition-colors',
                importError ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20' : 'bg-slate-50 dark:bg-zinc-800 border-transparent focus-within:border-violet-500']">
                <Lock :size="17" :class="importError ? 'text-rose-400' : 'text-slate-400 dark:text-zinc-500'" :stroke-width="2" class="flex-shrink-0" />
                <input v-model="importPassword" type="password" placeholder="Backup password"
                  autocomplete="current-password"
                  class="flex-1 bg-transparent text-[15px] font-semibold text-slate-900 dark:text-zinc-50 placeholder:text-slate-300 dark:placeholder:text-zinc-600 outline-none" />
              </div>
              <p v-if="importError" class="text-[12px] font-bold text-rose-500 px-1">{{ importError }}</p>

              <!-- Warning -->
              <div class="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                <AlertTriangle :size="16" class="text-amber-500 flex-shrink-0 mt-0.5" :stroke-width="2" />
                <p class="text-[12px] font-semibold text-amber-700 dark:text-amber-400 leading-relaxed">
                  Importing will <span class="font-black">replace</span> all current data. This cannot be undone.
                </p>
              </div>

              <button @click="doImport"
                :disabled="!importFile || !importPassword || importLoading"
                :class="['w-full py-4 rounded-2xl text-[16px] font-black transition-all active:scale-[0.98]',
                  importFile && importPassword ? 'text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600']"
                :style="importFile && importPassword ? { background: accent, boxShadow: `0 8px 24px ${accent}44` } : {}">
                {{ importLoading ? 'Restoring…' : 'Restore Data' }}
              </button>
            </div>

            <div v-else class="flex flex-col items-center gap-4 py-4">
              <div class="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <CheckCircle :size="32" class="text-emerald-500" :stroke-width="1.5" />
              </div>
              <p class="text-[16px] font-black text-slate-900 dark:text-zinc-50">Restore complete!</p>
              <p class="text-[13px] text-slate-400 dark:text-zinc-500 text-center">All your data has been restored. The app will reload now.</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import {
  ChevronLeft, ChevronDown, ChevronRight, Check, Smartphone,
  Moon, Sun, Monitor, Clock, Lock, Trash2, Zap, ShoppingCart,
  KeyRound, LayoutTemplate, Upload, Download, FileArchive,
  AlertTriangle, CheckCircle, X, Plus, Tag, Sparkles,
} from 'lucide-vue-next'
import {
  settings, saveSettings, CURRENCIES, ACCENT_COLORS, orbLog,
  bills, groceryLists, activeListId,
  TXNS_KEY, CARDS_KEY, SETTINGS_KEY, BILLS_KEY,
  transactions, GROCERY_KEY,
} from '../composables/useStore'
import { setPin, removePin, pinEnabled } from '../composables/usePin'
import { useNav }  from '../composables/useNav'
import { useDark, type DarkMode } from '../composables/useDark'
import { AI_ENABLED_KEY } from '../composables/useOrbAI'
import { useNativeLLM, initNativeModel, deleteNativeModel } from '../composables/useNativeLLM'

const { navigate }      = useNav()
const { mode, setMode } = useDark()
const accent = computed(() => settings.value.accentColor)

const darkModeOptions: Array<{ value: DarkMode; label: string; icon: any }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'adaptive', label: 'Adaptive', icon: Clock },
]
const darkModeIcon = computed(() => darkModeOptions.find(o => o.value === mode.value)?.icon ?? Moon)
const darkModeLabel = computed(() => {
  if (mode.value === 'light') return 'Always light'
  if (mode.value === 'dark') return 'Always dark'
  if (mode.value === 'system') return 'Follows device setting'
  return 'Light 6am–8pm · Dark 8pm–6am'
})

const accentOpen = ref(false)
const customHex  = ref(settings.value.accentColor)
const currentAccentLabel = computed(() => ACCENT_COLORS.find(c => c.hex === settings.value.accentColor)?.label ?? 'Custom')
function setAccent(hex: string) { customHex.value = hex; saveSettings({ accentColor: hex }) }
function onCustomInput() { if (/^#[0-9a-fA-F]{6}$/.test(customHex.value)) saveSettings({ accentColor: customHex.value }) }
function applyCustom() { if (/^#[0-9a-fA-F]{6}$/.test(customHex.value)) { saveSettings({ accentColor: customHex.value }); orbLog(`Custom accent: ${customHex.value}`) } }

const currencyOpen = ref(false)
const selectedCurrency = computed(() => CURRENCIES.find(c => c.code === settings.value.currency) ?? CURRENCIES[0])
function setCurrency(cur: typeof CURRENCIES[0]) { saveSettings({ currency: cur.code, currencySymbol: cur.symbol }); currencyOpen.value = false }

function toggleIdleLock() { saveSettings({ idleLockEnabled: !settings.value.idleLockEnabled }) }
function setIdleMinutes(m: number) { saveSettings({ idleLockMinutes: m }) }
function toggleShake() { saveSettings({ shakeToAdd: !settings.value.shakeToAdd }) }

// ── Orb AI ─────────────────────────────────────────────────
const {
  isReady:      orbAiReady,
  isLoading:    orbAiDownloading,
  progress:     orbAiProgress,
  progressMsg:  orbAiProgressMsg,
  isDownloaded: orbAiDownloaded,
} = useNativeLLM()

const orbAiEnabled = ref(
  (() => { try { return localStorage.getItem(AI_ENABLED_KEY) === 'true' } catch { return false } })()
)

// ── AI Backend selection (CPU / GPU) ───────────────────────
const aiBackend = ref<'CPU'|'GPU'>(
  (() => { try { return (localStorage.getItem(AI_BACKEND_KEY) as 'CPU'|'GPU') || 'CPU' } catch { return 'CPU' } })()
)

async function applyAiBackend(b: 'CPU'|'GPU') {
  aiBackend.value = b
  try { localStorage.setItem(AI_BACKEND_KEY, b) } catch {}
  await setAiBackend(b).catch(() => {})
  orbLog('Orb AI backend set to ' + b)
}

const orbAiStatus = computed(() => {
  if (orbAiDownloading.value) return `Downloading… ${orbAiProgress.value}%`
  if (orbAiReady.value)       return 'Active · Private mode'
  if (orbAiDownloaded.value)  return 'Downloaded · Will load on next chat'
  if (orbAiEnabled.value)     return 'Enabled · Model not yet downloaded'
  return 'Disabled'
})

function toggleOrbAI() {
  const next = !orbAiEnabled.value
  orbAiEnabled.value = next
  try { localStorage.setItem(AI_ENABLED_KEY, next ? 'true' : 'false') } catch {}
  try { localStorage.setItem('orb_ai_setup_done_v1', 'true') } catch {}
  orbLog('Orb AI ' + (next ? 'enabled' : 'disabled'))
}

function startAiDownload() {
  if (orbAiDownloading.value) return
  initNativeModel().catch(() => {})
}

function redownloadAI() {
  deleteNativeModel().then(() => initNativeModel()).catch(() => {})
}
const builtInCategories = ['Food', 'Groceries', 'Transport', 'Utilities', 'Shopping', 'Leisure', 'Other']
const newCategory = ref('')
const catError    = ref('')

function addCategory() {
  const name = newCategory.value.trim()
  if (!name) return
  if (name.length > 24) { catError.value = 'Max 24 characters.'; return }
  const all = [...builtInCategories, ...(settings.value.customCategories ?? [])]
  if (all.some(c => c.toLowerCase() === name.toLowerCase())) {
    catError.value = 'Category already exists.'
    return
  }
  catError.value = ''
  saveSettings({ customCategories: [...(settings.value.customCategories ?? []), name] })
  orbLog(`Category added: ${name}`)
  newCategory.value = ''
}

function removeCategory(name: string) {
  saveSettings({ customCategories: (settings.value.customCategories ?? []).filter(c => c !== name) })
  orbLog(`Category removed: ${name}`)
}
const showPinSetup      = ref(false)
const showQuestionSetup = ref(false)
const showPinManage     = ref(false)
const showRemovePinConfirm = ref(false)
const setupPin          = ref('')
const selectedQuestion  = ref('')
const securityAnswer    = ref('')

const securityQuestions = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your elementary school?",
  "What was the make of your first car?",
]

function openPinSetup() { setupPin.value = ''; showPinSetup.value = true }
function closePinSetup() { showPinSetup.value = false; setupPin.value = '' }
function handleSetupKey(k: string) {
  if (!k) return
  if (k === '⌫') { setupPin.value = setupPin.value.slice(0, -1); return }
  if (setupPin.value.length >= 6) return
  setupPin.value += k
}
function proceedToQuestion() {
  if (setupPin.value.length < 6) return
  showPinSetup.value = false
  selectedQuestion.value = ''
  securityAnswer.value = ''
  nextTick(() => { showQuestionSetup.value = true })
}
async function savePinSetup() {
  if (!selectedQuestion.value || !securityAnswer.value.trim()) return
  await setPin(setupPin.value, selectedQuestion.value, securityAnswer.value)
  setupPin.value = ''; selectedQuestion.value = ''; securityAnswer.value = ''
  showQuestionSetup.value = false
  orbLog('PIN security enabled')
}
function startChangePIN() { showPinManage.value = false; setupPin.value = ''; nextTick(() => { showPinSetup.value = true }) }
function doRemovePin() { removePin(); showRemovePinConfirm.value = false; orbLog('PIN removed') }

// ── Danger Zone ────────────────────────────────────────────
type DangerTarget = 'all' | 'bills' | 'grocery' | null
const dangerTarget = ref<DangerTarget>(null)
const dangerIcon = computed(() => dangerTarget.value === 'all' ? Trash2 : dangerTarget.value === 'bills' ? Zap : ShoppingCart)
const dangerTitle = computed(() => dangerTarget.value === 'all' ? 'Clear All Data?' : dangerTarget.value === 'bills' ? 'Clear Bills Data?' : 'Clear Grocery Data?')
const dangerDesc = computed(() => dangerTarget.value === 'all' ? 'This will permanently erase all data. Cannot be undone.' : dangerTarget.value === 'bills' ? 'All bills will be permanently removed.' : 'All grocery lists will be permanently removed.')
const dangerConfirmLabel = computed(() => dangerTarget.value === 'all' ? '⚠ Yes, Erase Everything' : dangerTarget.value === 'bills' ? 'Delete All Bills' : 'Delete All Grocery Data')
function confirmAction(t: DangerTarget) { dangerTarget.value = t }
function executeDanger() {
  if (dangerTarget.value === 'all') { Object.keys(localStorage).forEach(k => localStorage.removeItem(k)); orbLog('Danger: all data cleared'); dangerTarget.value = null; setTimeout(() => window.location.reload(), 500) }
  else if (dangerTarget.value === 'bills') { try { localStorage.removeItem(BILLS_KEY) } catch {}; bills.value = []; orbLog('Bills cleared'); dangerTarget.value = null }
  else if (dangerTarget.value === 'grocery') { try { localStorage.removeItem(GROCERY_KEY) } catch {}; groceryLists.value = []; activeListId.value = null; orbLog('Grocery cleared'); dangerTarget.value = null }
}

// ── Export / Import ────────────────────────────────────────
// Simple encryption: AES-GCM via Web Crypto

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations:100_000, hash:'SHA-256' },
    keyMaterial,
    { name:'AES-GCM', length:256 },
    false,
    ['encrypt','decrypt']
  )
}

async function encryptData(data: string, password: string): Promise<Uint8Array> {
  const enc   = new TextEncoder()
  const salt  = crypto.getRandomValues(new Uint8Array(16))
  const iv    = crypto.getRandomValues(new Uint8Array(12))
  const key   = await deriveKey(password, salt)
  const ciphertext = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode(data))
  const out = new Uint8Array(16 + 12 + ciphertext.byteLength)
  out.set(salt, 0); out.set(iv, 16); out.set(new Uint8Array(ciphertext), 28)
  return out
}

async function decryptData(buf: Uint8Array, password: string): Promise<string> {
  const salt       = buf.slice(0, 16)
  const iv         = buf.slice(16, 28)
  const ciphertext = buf.slice(28)
  const key        = await deriveKey(password, salt)
  const plain      = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plain)
}

// Export
const showExport          = ref(false)
const exportStep          = ref<'password'|'done'>('password')
const exportPassword      = ref('')
const exportPasswordConfirm = ref('')
const exportError         = ref('')

function openExport() { showExport.value = true; exportStep.value = 'password'; exportPassword.value = ''; exportPasswordConfirm.value = ''; exportError.value = '' }
function closeExport() { showExport.value = false }

async function doExport() {
  exportError.value = ''
  if (exportPassword.value.length < 6) { exportError.value = 'Password must be at least 6 characters'; return }
  if (exportPassword.value !== exportPasswordConfirm.value) { exportError.value = 'Passwords do not match'; return }

  const payload: Record<string, string | null> = {}
  const keys = [TXNS_KEY, CARDS_KEY, SETTINGS_KEY, BILLS_KEY, GROCERY_KEY, 'orb_onboarding_done', 'orb_dark_mode']
  keys.forEach(k => { try { payload[k] = localStorage.getItem(k) } catch {} })

  try {
    const json     = JSON.stringify({ version: 1, createdAt: new Date().toISOString(), data: payload })
    const enc      = await encryptData(json, exportPassword.value)
    const fileName = `orb-backup-${new Date().toISOString().slice(0,10)}.orbbackup`
    const blob     = new Blob([enc], { type: 'application/octet-stream' })
    const file     = new File([blob], fileName, { type: 'application/octet-stream' })

    // ── Mobile: Web Share API (Android/iOS share sheet → saves to Downloads)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Orb Backup' })
    } else {
      // ── Web fallback: anchor download
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href    = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    exportStep.value = 'done'
    orbLog('Data exported successfully')
  } catch (e: any) {
    // User cancelled share sheet is not a real error
    if (e?.name === 'AbortError') { exportStep.value = 'done'; return }
    exportError.value = 'Export failed: ' + (e?.message ?? 'unknown error')
  }
}

// Import
const showImport      = ref(false)
const importStep      = ref<'file'|'done'>('file')
const importFile      = ref<File | null>(null)
const importPassword  = ref('')
const importError     = ref('')
const importLoading   = ref(false)
const fileInputRef    = ref<HTMLInputElement | null>(null)

function openImport() { showImport.value = true; importStep.value = 'file'; importFile.value = null; importPassword.value = ''; importError.value = '' }
function closeImport() { showImport.value = false }
function triggerFilePicker() { fileInputRef.value?.click() }
function onFileSelected(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null
  importFile.value = f
  importError.value = ''
}
function formatFileSize(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b/1024).toFixed(1)} KB`
  return `${(b/1024/1024).toFixed(1)} MB`
}

async function doImport() {
  if (!importFile.value || !importPassword.value) return
  importLoading.value = true; importError.value = ''
  try {
    const buf  = new Uint8Array(await importFile.value.arrayBuffer())
    const json = await decryptData(buf, importPassword.value)
    const parsed = JSON.parse(json)
    if (!parsed?.data || typeof parsed.data !== 'object') throw new Error('Invalid backup file')

    // Restore all keys
    Object.entries(parsed.data as Record<string, string | null>).forEach(([k, v]) => {
      if (v == null) { try { localStorage.removeItem(k) } catch {} }
      else { try { localStorage.setItem(k, v) } catch {} }
    })

    importStep.value = 'done'
    orbLog('Data imported successfully')
    setTimeout(() => window.location.reload(), 1800)
  } catch (e: any) {
    importError.value = 'Wrong password or corrupted file'
  } finally {
    importLoading.value = false
  }
}
</script>

<style scoped>
@keyframes settings-cw { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.22s ease; overflow: hidden; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; max-height: 0; }
.dropdown-enter-to, .dropdown-leave-from { opacity: 1; max-height: 700px; }
.fade-enter-active,.fade-leave-active { transition:opacity .25s ease; }
.fade-enter-from,.fade-leave-to { opacity:0; }
.sheet-enter-active,.sheet-leave-active{transition:opacity .28s ease;}
.sheet-enter-active>div,.sheet-leave-active>div{transition:transform .32s cubic-bezier(.32,1.1,.64,1);}
.sheet-enter-from,.sheet-leave-to{opacity:0;}
.sheet-enter-from>div,.sheet-leave-to>div{transform:translateY(100%);}
</style>