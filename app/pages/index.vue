<template>
  <div class="devkit-root pb-28" style="touch-action:pan-y;">

    <!-- ── Topbar ── -->
    <div class="flex items-center justify-between px-5 pt-6 pb-3">
      <div>
        <p class="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase">orb devkit</p>
        <h1 class="text-[22px] font-black text-zinc-50 tracking-tight mt-0.5 font-mono">
          <span :style="{ color: accent }">›</span> dashboard
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          :style="{ background: tcpConnected ? '#10b98118' : '#ef444418', border: `1px solid ${tcpConnected ? '#10b98133' : '#ef444433'}` }">
          <div :class="['w-1.5 h-1.5 rounded-full', tcpConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500']">
          </div>
          <span class="text-[10px] font-mono font-bold" :style="{ color: tcpConnected ? '#34d399' : '#f87171' }">
            {{ tcpConnected ? 'TCP:' + tcpPort : 'OFFLINE' }}
          </span>
        </div>
        <button @click="navigate('settings')"
          class="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);">
          <Settings :size="16" class="text-zinc-400" :stroke-width="1.8" />
        </button>
      </div>
    </div>

    <!-- ── ORB CORE CARD ── -->

    <!-- supreme -->
    <div v-if="balanceStyle === 'supreme'" class="mx-4 mb-4 relative overflow-hidden rounded-3xl"
      :style="{ background: '#080b12', boxShadow: `0 0 0 1px ${accent}22, 0 12px 48px rgba(0,0,0,0.5)` }">
      <canvas ref="starsCanvas" class="absolute inset-0 pointer-events-none"
        style="width:100%;height:100%;opacity:0.6;"></canvas>
      <div class="absolute inset-0 pointer-events-none"
        :style="{ backgroundImage: `linear-gradient(${accent}08 1px, transparent 1px), linear-gradient(90deg, ${accent}08 1px, transparent 1px)`, backgroundSize: '32px 32px' }">
      </div>
      <div class="absolute inset-0 pointer-events-none"
        :style="{ background: `radial-gradient(ellipse at 50% 40%, ${accent}28 0%, transparent 65%)` }"></div>
      <div class="relative flex items-center justify-between px-5 pt-4 pb-0">
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 rounded-full bg-rose-500 opacity-70"></div>
          <div class="w-2 h-2 rounded-full bg-amber-400 opacity-70"></div>
          <div class="w-2 h-2 rounded-full bg-emerald-400 opacity-70"></div>
          <span class="text-[10px] font-mono text-zinc-700 ml-2 tracking-widest">core.runtime</span>
        </div>
        <button @click="confirmDevMode"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all active:scale-95" :style="devMode
            ? { background: `${accent}20`, border: `1px solid ${accent}44` }
            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }">
          <div class="w-1.5 h-1.5 rounded-full" :style="{ background: devMode ? accent : '#3f3f46' }"></div>
          <span class="text-[10px] font-mono font-bold" :style="{ color: devMode ? accent : '#52525b' }">
            {{ devMode ? 'dev:on' : 'dev:off' }}
          </span>
        </button>
      </div>

      <!-- Supreme orb area with twin TCP orb -->
      <button @click="confirmDevMode"
        class="relative w-full flex flex-col items-center pt-2 pb-3 active:scale-[0.97] transition-transform duration-200">
        <!-- Accretion rings -->
        <div class="absolute pointer-events-none"
          style="top:62px;left:50%;transform:translateX(-50%);width:1px;height:1px;">
          <svg class="absolute orb-h-ring-4"
            style="width:310px;height:68px;margin-left:-155px;margin-top:-34px;overflow:visible;">
            <path d="M 1,34 A 154,33 0 0,1 309,34" fill="none" :stroke="accent + '10'" stroke-width="1"
              style="filter:blur(1px);" />
          </svg>
          <svg class="absolute orb-h-ring-3"
            style="width:254px;height:52px;margin-left:-127px;margin-top:-26px;overflow:visible;">
            <path d="M 1,26 A 126,25 0 0,1 253,26" fill="none" :stroke="accent + '20'" stroke-width="1" />
          </svg>
          <svg class="absolute orb-h-ring-2"
            style="width:200px;height:36px;margin-left:-100px;margin-top:-18px;overflow:visible;">
            <path d="M 1,18 A 99,17 0 0,1 199,18" fill="none" :stroke="accent + '40'" stroke-width="1.5" />
          </svg>
          <svg class="absolute orb-h-ring-1"
            style="width:144px;height:24px;margin-left:-72px;margin-top:-12px;overflow:visible;">
            <path d="M 1,12 A 71,11 0 0,1 143,12" fill="none" :stroke="accent + '75'" stroke-width="2"
              :style="{ filter: `drop-shadow(0 0 4px ${accent}66)` }" />
          </svg>
        </div>

        <div class="relative mt-1" style="width:88px;height:88px;">
          <div class="absolute rounded-full" :style="orbOuterGlow"></div>
          <div class="absolute rounded-full" :style="orbLensRing"></div>
          <div class="absolute inset-0 rounded-full" :style="orbSphereShadow"></div>
          <div class="absolute inset-0 rounded-full"
            :style="{ background: `radial-gradient(circle at 28% 26%, ${accent}2E 0%, transparent 55%)` }"></div>
        </div>

        <div class="absolute pointer-events-none"
          style="top:62px;left:50%;transform:translateX(-50%);width:1px;height:1px;">
          <svg class="absolute orb-h-ring-4"
            style="width:310px;height:68px;margin-left:-155px;margin-top:-34px;overflow:visible;">
            <path d="M 1,34 A 154,33 0 0,0 309,34" fill="none" :stroke="accent + '10'" stroke-width="1"
              style="filter:blur(1px);" />
          </svg>
          <svg class="absolute orb-h-ring-3"
            style="width:254px;height:52px;margin-left:-127px;margin-top:-26px;overflow:visible;">
            <path d="M 1,26 A 126,25 0 0,0 253,26" fill="none" :stroke="accent + '20'" stroke-width="1" />
          </svg>
          <svg class="absolute orb-h-ring-2"
            style="width:200px;height:36px;margin-left:-100px;margin-top:-18px;overflow:visible;">
            <path d="M 1,18 A 99,17 0 0,0 199,18" fill="none" :stroke="accent + '55'" stroke-width="1.5" />
          </svg>
          <svg class="absolute orb-h-ring-1"
            style="width:144px;height:24px;margin-left:-72px;margin-top:-12px;overflow:visible;">
            <path d="M 1,12 A 71,11 0 0,0 143,12" fill="none" :stroke="accent + 'BB'" stroke-width="2.5"
              :style="{ filter: `drop-shadow(0 0 6px ${accent}99)` }" />
          </svg>
          <div class="absolute rounded-full orb-h-p1" style="width:3px;height:3px;top:0;left:0;"
            :style="{ background: accent, opacity: 0.9 }"></div>
          <div class="absolute rounded-full orb-h-p2" style="width:2px;height:2px;top:0;left:0;"
            :style="{ background: accent, opacity: 0.7 }"></div>
        </div>

        <!-- Twin TCP orb (appears 3s after TCP connects) -->
        <Transition name="twin-orb">
          <div v-if="showTwinOrb" class="absolute twin-orb-container cursor-pointer" style="top:10px;right:30px;"
            @click.stop="goToDevice">
            <!-- Connection line SVG -->
            <svg class="absolute" style="top:30px;right:44px;overflow:visible;pointer-events:none;" width="80"
              height="40">
              <path :d="`M 80,0 C 50,0 30,20 0,20`" fill="none" :stroke="accent" stroke-width="1" stroke-dasharray="4 3"
                style="opacity:0.5;animation:tcp-dash 1.2s linear infinite;" />
              <circle cx="80" cy="0" r="2" :fill="accent" opacity="0.8" />
            </svg>
            <!-- Twin orb body -->
            <div class="relative" style="width:40px;height:40px;">
              <!-- Outer ring -->
              <div class="absolute inset-0 rounded-full tcp-orb-ring" :style="{ border: `1px solid ${accent}66` }">
              </div>
              <!-- Inner ring -->
              <div class="absolute rounded-full tcp-orb-ring-inner"
                :style="{ inset: '4px', border: `0.5px solid ${accent}44` }"></div>
              <!-- Glow -->
              <div class="absolute rounded-full"
                :style="{ inset: '8px', boxShadow: `0 0 10px 3px ${accent}55`, borderRadius: '50%' }"></div>
              <!-- Core -->
              <div class="absolute rounded-full"
                style="inset:8px;background:radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 55%,#000 100%);"
                :style="{ boxShadow: `inset 0 0 8px rgba(0,0,0,1)` }"></div>
              <!-- Broken-lines data particles -->
              <div v-for="p in tcpParticles" :key="p.id" class="absolute rounded-full tcp-particle" :style="{
                width: p.size + 'px', height: p.size + 'px',
                background: accent, opacity: p.opacity,
                animationDuration: p.dur + 's',
                animationDelay: p.delay + 's',
                top: p.startY + 'px', left: p.startX + 'px',
              }"></div>
            </div>
            <p class="text-center mt-1.5 font-mono font-black text-[8px]" :style="{ color: accent + '88' }">desktop</p>
            <p class="text-center font-mono text-[7px]" style="color:rgba(255,255,255,0.2);">tap to open</p>
          </div>
        </Transition>

        <div class="relative mt-10 mx-5 px-3.5 py-1.5 rounded-xl text-center max-w-[280px]"
          style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
          <p class="text-[11px] font-mono leading-snug" style="color:rgba(255,255,255,0.4);">{{ orbStatusLine }}</p>
        </div>
      </button>

      <div class="relative grid grid-cols-3 gap-0 pb-4 px-5 mt-2">
        <div v-for="(m, i) in coreMetrics" :key="m.label"
          :class="['flex flex-col gap-0.5', i < 2 ? 'border-r border-white/5 pr-4' : 'pl-4']">
          <span class="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{{ m.label }}</span>
          <span class="text-[15px] font-black font-mono" :style="{ color: m.color }">{{ m.value }}</span>
          <span class="text-[9px] font-mono text-zinc-700">{{ m.sub }}</span>
        </div>
      </div>
    </div>

    <!-- neon -->
    <div v-else-if="balanceStyle === 'neon'" class="mx-4 mb-4 relative overflow-hidden rounded-3xl"
      :style="{ background: `linear-gradient(135deg, #0a0a1a 0%, #0f0f28 50%, ${accent}22 100%)`, boxShadow: `0 0 0 1px ${accent}55, 0 8px 40px ${accent}30` }">
      <div class="absolute inset-0 pointer-events-none opacity-10"
        :style="{ backgroundImage: `linear-gradient(${accent}40 1px, transparent 1px), linear-gradient(90deg, ${accent}40 1px, transparent 1px)`, backgroundSize: '40px 40px' }">
      </div>
      <div class="absolute top-0 left-0 right-0 h-px"
        :style="{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, boxShadow: `0 0 12px ${accent}` }">
      </div>
      <div class="absolute top-3 right-3 z-10">
        <button @click="confirmDevMode"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all active:scale-95"
          :style="devMode ? { background: `${accent}20`, border: `1px solid ${accent}44` } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }">
          <div class="w-1.5 h-1.5 rounded-full" :style="{ background: devMode ? accent : '#3f3f46' }"></div>
          <span class="text-[10px] font-mono font-bold" :style="{ color: devMode ? accent : '#52525b' }">
            {{ devMode ? 'dev:on' : 'dev:off' }}
          </span>
        </button>
      </div>
      <button @click="confirmDevMode"
        class="relative w-full flex flex-col items-center pt-5 pb-3 active:scale-[0.97] transition-transform">
        <div class="relative" style="width:80px;height:80px;">
          <div class="absolute rounded-full"
            :style="{ inset: '-16px', background: `radial-gradient(circle, ${accent}38 0%, transparent 70%)`, filter: 'blur(12px)' }">
          </div>
          <div class="absolute inset-0 rounded-full"
            :style="{ background: 'radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 45%,#000 100%)', boxShadow: `inset 0 0 22px rgba(0,0,0,1), 0 0 0 1px ${accent}55, 0 0 24px ${accent}66` }">
          </div>
          <div class="absolute inset-0 rounded-full"
            :style="{ background: `radial-gradient(circle at 28% 26%, ${accent}2E 0%, transparent 55%)` }"></div>
        </div>
        <p class="mt-4 text-[11px] font-mono text-center"
          :style="{ color: accent + '99', textShadow: `0 0 8px ${accent}` }">{{ orbStatusLine }}</p>
      </button>
      <div class="grid grid-cols-3 gap-0 pb-4 px-5">
        <div v-for="(m, i) in coreMetrics" :key="m.label"
          :class="['flex flex-col gap-0.5', i < 2 ? 'border-r pr-4' : 'pl-4']" :style="{ borderColor: accent + '20' }">
          <span class="text-[9px] font-mono uppercase tracking-widest" :style="{ color: accent + '55' }">{{ m.label
            }}</span>
          <span class="text-[15px] font-black font-mono"
            :style="{ color: m.color, textShadow: `0 0 8px ${m.color}88` }">{{ m.value }}</span>
          <span class="text-[9px] font-mono text-zinc-700">{{ m.sub }}</span>
        </div>
      </div>
      <div class="absolute bottom-0 left-0 right-0 h-px"
        :style="{ background: `linear-gradient(90deg, transparent, ${accent}88, transparent)` }"></div>
    </div>

    <!-- minimal -->
    <div v-else-if="balanceStyle === 'minimal'" class="mx-4 mb-4 rounded-2xl overflow-hidden relative"
      :style="{ background: 'rgba(15,15,20,0.85)', border: `1px solid ${accent}22`, backdropFilter: 'blur(24px)' }">
      <div class="absolute top-0 right-0 w-40 h-40 pointer-events-none rounded-full"
        :style="{ background: `radial-gradient(circle at 80% 0%, ${accent}20 0%, transparent 65%)`, filter: 'blur(18px)' }">
      </div>
      <div class="flex items-center gap-4 px-5 py-4">
        <button @click="confirmDevMode" class="flex-shrink-0 active:scale-90 transition-transform">
          <div class="relative" style="width:48px;height:48px;">
            <div class="absolute inset-0 rounded-full"
              :style="{ background: `radial-gradient(circle, ${accent}44 0%, transparent 70%)`, filter: 'blur(6px)' }">
            </div>
            <div class="absolute rounded-full"
              style="inset:4px;background:radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 60%,#000 100%);"
              :style="{ boxShadow: `0 0 10px 2px ${accent}55, inset 0 0 8px rgba(0,0,0,0.9)` }"></div>
          </div>
        </button>
        <div class="flex-1 min-w-0">
          <p class="text-[11px] font-mono font-bold uppercase tracking-widest" :style="{ color: accent + 'AA' }">orb
            devkit core</p>
          <p class="text-[13px] font-mono text-zinc-400 mt-0.5 truncate">{{ orbStatusLine }}</p>
        </div>
        <button @click="confirmDevMode"
          class="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold active:scale-95 transition-transform flex items-center gap-1.5"
          :style="devMode
            ? { background: accent + '18', border: `1px solid ${accent}33`, color: accent }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }">
          <div class="w-1.5 h-1.5 rounded-full" :style="{ background: devMode ? accent : '#3f3f46' }"></div>
          {{ devMode ? 'dev:on' : 'dev:off' }}
        </button>
      </div>
      <div class="border-t px-5 py-3 grid grid-cols-3 gap-0" :style="{ borderColor: accent + '15' }">
        <div v-for="(m, i) in coreMetrics" :key="m.label"
          :class="['flex flex-col gap-0.5', i < 2 ? 'border-r pr-4' : 'pl-4']" :style="{ borderColor: accent + '15' }">
          <span class="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">{{ m.label }}</span>
          <span class="text-[13px] font-black font-mono" :style="{ color: m.color }">{{ m.value }}</span>
        </div>
      </div>
    </div>

    <!-- glass -->
    <div v-else-if="balanceStyle === 'glass'" class="mx-4 mb-4 rounded-3xl overflow-hidden relative"
      style="background:rgba(255,255,255,0.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.1);box-shadow:0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08);">
      <div class="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
        :style="{ background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)`, filter: 'blur(20px)' }"></div>
      <div class="absolute top-3 right-3 z-10">
        <button @click="confirmDevMode"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all active:scale-95"
          :style="devMode ? { background: `${accent}20`, border: `1px solid ${accent}44` } : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }">
          <div class="w-1.5 h-1.5 rounded-full" :style="{ background: devMode ? accent : 'rgba(255,255,255,0.2)' }">
          </div>
          <span class="text-[10px] font-mono font-bold" :style="{ color: devMode ? accent : 'rgba(255,255,255,0.25)' }">
            {{ devMode ? 'dev:on' : 'dev:off' }}
          </span>
        </button>
      </div>
      <button @click="confirmDevMode"
        class="relative w-full flex flex-col items-center pt-5 pb-3 active:scale-[0.97] transition-transform">
        <div class="relative" style="width:80px;height:80px;">
          <div class="absolute rounded-full"
            :style="{ inset: '-12px', background: `radial-gradient(circle, ${accent}25 0%, transparent 65%)`, filter: 'blur(10px)' }">
          </div>
          <div class="absolute inset-0 rounded-full"
            style="background:radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 45%,#000 100%);"
            :style="{ boxShadow: `inset 0 0 22px rgba(0,0,0,1), 0 0 0 1px rgba(255,255,255,0.15)` }"></div>
          <div class="absolute inset-0 rounded-full"
            :style="{ background: `radial-gradient(circle at 28% 26%, ${accent}2E 0%, transparent 55%)` }"></div>
        </div>
        <p class="mt-4 text-[11px] font-mono text-white/40 text-center">{{ orbStatusLine }}</p>
      </button>
      <div class="grid grid-cols-3 gap-0 pb-4 px-5 border-t border-white/5 pt-3">
        <div v-for="(m, i) in coreMetrics" :key="m.label"
          :class="['flex flex-col gap-0.5', i < 2 ? 'border-r border-white/8 pr-4' : 'pl-4']">
          <span class="text-[9px] font-mono text-white/25 uppercase tracking-widest">{{ m.label }}</span>
          <span class="text-[15px] font-black font-mono" :style="{ color: m.color }">{{ m.value }}</span>
          <span class="text-[9px] font-mono text-white/20">{{ m.sub }}</span>
        </div>
      </div>
    </div>

    <!-- ── Dev Mode Status Card ── -->
    <Transition name="slide-down">
      <div v-if="devMode" class="mx-4 mb-4 rounded-2xl overflow-hidden"
        :style="{ background: accent + '08', border: `1px solid ${accent}22` }">
        <div class="flex items-center gap-3 px-4 py-3">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            :style="{ background: accent + '18', border: `1px solid ${accent}33` }">
            <Code2 :size="15" :style="{ color: accent }" :stroke-width="2" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-mono font-bold" :style="{ color: accent }">dev_mode active</p>
            <p class="text-[10px] font-mono text-zinc-600 mt-0.5">Hot reload · extended logs · debug overlays</p>
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <div class="w-1.5 h-1.5 rounded-full animate-pulse" :style="{ background: accent }"></div>
            <span class="text-[10px] font-mono font-bold" :style="{ color: accent }">{{ devSessionTime }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Dev Tools ── -->
    <div class="flex items-center justify-between px-5 pb-2">
      <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">dev_tools</p>
    </div>
    <div class="flex flex-col gap-2.5 px-4 mb-4">

      <!-- Pocket ENV -->
      <button @click="navigate('env')"
        class="devtool-card flex items-center gap-4 px-4 py-4 rounded-2xl active:scale-[0.98] transition-all"
        style="background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.18);">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.25);">
          <KeyRound :size="22" style="color:#34d399" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0 text-left">
          <div class="flex items-center gap-2 mb-0.5">
            <p class="text-[15px] font-black text-zinc-100 font-mono">Pocket ENV</p>
            <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
              style="background:rgba(16,185,129,0.15);color:#34d399;">NEW</span>
          </div>
          <p class="text-[11px] font-mono text-zinc-500 leading-snug">Store &amp; sync .env variables to VSCode via TCP
          </p>
        </div>
        <div class="flex-shrink-0 flex flex-col items-end gap-1">
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            :style="{ background: tcpConnected ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.08)', border: `1px solid ${tcpConnected ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.15)'}` }">
            <div class="w-1.5 h-1.5 rounded-full" :class="tcpConnected ? 'bg-emerald-400' : 'bg-rose-500'"></div>
            <span class="text-[9px] font-mono font-bold" :class="tcpConnected ? 'text-emerald-400' : 'text-rose-400'">
              {{ tcpConnected ? 'synced' : 'offline' }}
            </span>
          </div>
          <span class="text-[10px] font-mono text-zinc-700">{{ envVarCount }} vars</span>
        </div>
      </button>

      <!-- Password Manager -->
      <button @click="navigate('passwords')"
        class="devtool-card flex items-center gap-4 px-4 py-4 rounded-2xl active:scale-[0.98] transition-all"
        :style="{ background: `rgba(${accentRgb},0.06)`, border: `1px solid rgba(${accentRgb},0.15)` }">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          :style="{ background: `rgba(${accentRgb},0.12)`, border: `1px solid rgba(${accentRgb},0.25)` }">
          <ShieldCheck :size="22" :style="{ color: accent }" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0 text-left">
          <p class="text-[15px] font-black text-zinc-100 font-mono mb-0.5">Password Manager</p>
          <p class="text-[11px] font-mono text-zinc-500 leading-snug">Self-hosted account &amp; credential vault</p>
        </div>
        <div class="flex-shrink-0 flex flex-col items-end gap-1">
          <span class="text-[14px] font-black font-mono" :style="{ color: accent }">{{ vaultCount }}</span>
          <span class="text-[9px] font-mono text-zinc-700">entries</span>
        </div>
      </button>

      <!-- Vibecode Therapy -->
      <button @click="navigate('vibecode')"
        class="devtool-card flex items-center gap-4 px-4 py-4 rounded-2xl active:scale-[0.98] transition-all"
        style="background:rgba(168,85,247,0.07);border:1px solid rgba(168,85,247,0.18);">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.25);">
          <Brain :size="22" style="color:#c084fc" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0 text-left">
          <div class="flex items-center gap-2 mb-0.5">
            <p class="text-[15px] font-black text-zinc-100 font-mono">Vibecode Therapy</p>
          </div>
          <p class="text-[11px] font-mono text-zinc-500 leading-snug">Block all AI platforms · focus sessions</p>
        </div>
        <div class="flex-shrink-0 flex flex-col items-end gap-1">
          <span class="text-[14px] font-black font-mono" style="color:#c084fc">{{ focusStreak }}🔥</span>
          <span class="text-[9px] font-mono text-zinc-700">streak</span>
        </div>
      </button>

      <!-- AI Prompt Manager -->
      <button @click="navigate('prompts')"
        class="devtool-card flex items-center gap-4 px-4 py-4 rounded-2xl active:scale-[0.98] transition-all"
        style="background:rgba(139,92,246,0.07);border:1px solid rgba(139,92,246,0.18);">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);">
          <BrainCircuit :size="22" style="color:#a78bfa" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0 text-left">
          <p class="text-[15px] font-black text-zinc-100 font-mono mb-0.5">AI Prompt Manager</p>
          <p class="text-[11px] font-mono text-zinc-500 leading-snug">Save, organize &amp; run reusable prompts</p>
        </div>
        <div class="flex-shrink-0 flex flex-col items-end gap-1">
          <span class="text-[14px] font-black font-mono" style="color:#a78bfa">{{ promptCount }}</span>
          <span class="text-[9px] font-mono text-zinc-700">prompts</span>
        </div>
      </button>

      <!-- Wifi Speedtest -->
      <button @click="navigate('more')"
        class="devtool-card flex items-center gap-4 px-4 py-4 rounded-2xl active:scale-[0.98] transition-all"
        style="background:rgba(96,165,250,0.07);border:1px solid rgba(96,165,250,0.15);">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style="background:rgba(96,165,250,0.12);border:1px solid rgba(96,165,250,0.25);">
          <Wifi :size="22" style="color:#60a5fa" :stroke-width="1.8" />
        </div>
        <div class="flex-1 min-w-0 text-left">
          <p class="text-[15px] font-black text-zinc-100 font-mono mb-0.5">Wifi Speedtest</p>
          <p class="text-[11px] font-mono text-zinc-500 leading-snug">Measure download, upload &amp; ping latency</p>
        </div>
        <div class="flex-shrink-0 flex flex-col items-end gap-1">
          <span class="text-[14px] font-black font-mono text-blue-400">{{ lastSpeed }}</span>
          <span class="text-[9px] font-mono text-zinc-700">Mbps</span>
        </div>
      </button>
    </div>

    <!-- ── TCP Connection ── -->
    <div class="px-5 pb-2">
      <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">tcp_connection</p>
    </div>
    <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
      style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
      <div class="px-4 py-4 flex items-center gap-4">
        <div class="relative w-12 h-12 flex-shrink-0">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center"
            :style="{ background: tcpConnected ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.08)', border: `1px solid ${tcpConnected ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.15)'}` }">
            <Network :size="22" :style="{ color: tcpConnected ? '#34d399' : '#f87171' }" :stroke-width="1.8" />
          </div>
          <div v-if="tcpConnected"
            class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-emerald-400 animate-pulse"
            style="border-color:#060810;"></div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-black font-mono text-zinc-200">VSCode Extension</p>
          <p class="text-[11px] font-mono mt-0.5" :class="tcpConnected ? 'text-emerald-400' : 'text-zinc-600'">
            {{ tcpConnected ? `Connected · 127.0.0.1:${tcpPort}` : 'Not connected · install extension first' }}
          </p>
        </div>
        <button @click="toggleTcp"
          class="flex-shrink-0 px-4 py-2 rounded-xl text-[12px] font-mono font-bold active:scale-95 transition-all"
          :style="tcpConnected
            ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }
            : { background: `rgba(${accentRgb},0.12)`, border: `1px solid rgba(${accentRgb},0.25)`, color: accent }">
          {{ tcpConnected ? 'disconnect' : 'connect' }}
        </button>
      </div>
      <div class="border-t border-white/5 px-4 py-3 flex items-center gap-3">
        <span class="text-[10px] font-mono text-zinc-600">port</span>
        <div class="flex gap-1.5">
          <button v-for="p in [3131, 4242, 5050]" :key="p" @click="tcpPort = p"
            class="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all" :style="tcpPort === p
              ? { background: accent + '18', border: `1px solid ${accent}33`, color: accent }
              : { border: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }">
            {{ p }}
          </button>
        </div>
        <span class="ml-auto text-[10px] font-mono text-zinc-700">orb-devkit-sync</span>
      </div>
    </div>

    <div class="h-4"></div>
  </div>

  <!-- ── Dev Mode Confirm Overlay ── -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showDevConfirm" class="fixed inset-0 z-[400] flex items-end justify-center"
        style="background:rgba(0,0,0,0.7);backdrop-filter:blur(14px)" @click.self="showDevConfirm = false">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t pb-10 px-5 pt-5"
          :style="{ background: '#0e0b1e', borderColor: accent + '33' }">
          <div class="w-10 h-1 rounded-full mx-auto mb-5" :style="{ background: accent + '44' }"></div>
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center"
              :style="{ background: accent + '18', border: `1px solid ${accent}33` }">
              <Code2 :size="26" :style="{ color: accent }" :stroke-width="1.8" />
            </div>
          </div>
          <p class="text-[18px] font-black text-center mb-2 text-zinc-100">
            {{ devMode ? 'Disable Dev Mode?' : 'Enable Dev Mode?' }}
          </p>
          <p class="text-[13px] text-center leading-relaxed mb-6 text-zinc-500">
            {{ devMode
              ? 'This will disable extended logging, debug overlays, and disconnect TCP.'
              : 'This enables hot reload, extended logs, debug overlays, and auto-starts TCP connection.' }}
          </p>
          <button @click="executeDevToggle"
            class="w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] mb-3 transition-all"
            :style="{ background: accent, color: 'white', boxShadow: `0 8px 32px ${accent}44` }">
            {{ devMode ? 'Yes, disable' : 'Yes, enable dev mode' }}
          </button>
          <button @click="showDevConfirm = false"
            class="w-full py-3.5 rounded-2xl text-[15px] font-bold active:scale-[0.98] text-zinc-400"
            :style="{ background: accent + '12' }">
            Cancel
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Orb expand overlay -->
  <Teleport to="body">
    <Transition name="orb-expand">
      <div v-if="orbExpanding" class="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-none"
        :style="{ background: `radial-gradient(circle at 50% 50%, ${accent}FF 0%, ${accent}CC 15%, ${accent}88 35%, #060810 75%)` }">
        <div class="w-32 h-32 rounded-full"
          :style="{ background: `radial-gradient(circle at 38% 32%, #1a1a2e 0%, #000 100%)`, boxShadow: `0 0 80px 30px ${accent}88` }">
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Settings, Wifi, Network, KeyRound, BrainCircuit, Code2, Brain, ShieldCheck } from 'lucide-vue-next'
import { useNav } from '../composables/useNav'
import { settings, orbLog } from '../composables/useStore'
import { tcpConnected, tcpPort, toggleTcp } from '../composables/useTcp'
import { devices as connectedDevices } from '../composables/useDevices'
// ── Use the shared devMode composable so it stays in sync with the layout ──
import { devMode, devSessionTime, toggleDevMode } from '../composables/useDevMode'

const { navigate } = useNav()
const accent = computed(() => settings.value.accentColor)
const balanceStyle = computed(() => settings.value.balanceStyle ?? 'supreme')

const accentRgb = computed(() => {
  const h = accent.value.replace('#', '')
  return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`
})

// ── Dev Mode confirm — delegates to shared composable ──────
const showDevConfirm = ref(false)

function goToDevice() {
  const first = connectedDevices.value.find(d => d.online)
  if (first) {
    navigate('devices', { deviceId: first.id })
  } else {
    navigate('devices')
  }
}

function confirmDevMode() {
  showDevConfirm.value = true
}

function executeDevToggle() {
  showDevConfirm.value = false
  // toggleDevMode() handles TCP, timer, and persistence — same as layout button
  toggleDevMode()
}

// ── Twin TCP orb (supreme only) ────────────────────────────
const showTwinOrb = ref(false)
let twinOrbTimer: ReturnType<typeof setTimeout> | null = null

watch(tcpConnected, (connected) => {
  if (twinOrbTimer) clearTimeout(twinOrbTimer)
  if (connected && balanceStyle.value === 'supreme') {
    twinOrbTimer = setTimeout(() => { showTwinOrb.value = true }, 3000)
  } else {
    showTwinOrb.value = false
  }
}, { immediate: true })

const tcpParticles = [
  { id: 1, size: 2, opacity: 0.8, dur: 1.8, delay: 0, startX: 15, startY: 15 },
  { id: 2, size: 1.5, opacity: 0.6, dur: 2.2, delay: 0.4, startX: 20, startY: 20 },
  { id: 3, size: 2, opacity: 0.7, dur: 1.5, delay: 0.8, startX: 10, startY: 25 },
]

// ── Counts from localStorage ───────────────────────────────
const vaultCount = computed(() => {
  try {
    const r = localStorage.getItem('orb_vault_entries_v1')
    return r ? JSON.parse(r).length : 0
  } catch { return 0 }
})

const promptCount = computed(() => {
  try {
    const r = localStorage.getItem('orb_prompts_v1')
    return r ? JSON.parse(r).length : 7
  } catch { return 7 }
})

const focusStreak = computed(() => {
  try {
    const r = localStorage.getItem('orb_vibecode_history_v1')
    if (!r) return 0
    const history = JSON.parse(r) as Array<{ completedAt: string }>
    const days = new Set(history.map(s => new Date(s.completedAt).toDateString()))
    let count = 0
    const d = new Date()
    while (days.has(d.toDateString())) { count++; d.setDate(d.getDate() - 1) }
    return count
  } catch { return 0 }
})

// ── ENV var count — reads actual projects from localStorage ─
const envVarCount = computed(() => {
  try {
    const r = localStorage.getItem('orb_env_projects_v2')
    if (!r) return 0
    const projects = JSON.parse(r) as Array<{ instances: Array<{ vars: unknown[] }> }>
    return projects.reduce((total, proj) =>
      total + proj.instances.reduce((sum, inst) => sum + inst.vars.length, 0), 0)
  } catch { return 0 }
})

// ── Orb data ──────────────────────────────────────────────
const lastSpeed = ref('—')
const orbExpanding = ref(false)

// ── Orb styles ─────────────────────────────────────────────
const orbOuterGlow = computed(() => ({ inset: '-20px', background: `radial-gradient(circle, ${accent.value}38 0%, transparent 70%)`, filter: 'blur(14px)' }))
const orbLensRing = computed(() => ({ inset: '-8px', border: `1px solid ${accent.value}4D`, boxShadow: `0 0 20px 6px ${accent.value}29` }))
const orbSphereShadow = computed(() => ({ background: 'radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 45%,#000 100%)', boxShadow: `inset 0 0 22px rgba(0,0,0,1), 0 0 0 1px ${accent.value}59` }))

const orbStatusLine = computed(() => {
  if (devMode.value) return `dev_mode · active · ${devSessionTime.value}`
  return tcpConnected.value ? `tcp_live · 127.0.0.1:${tcpPort.value}` : 'tap to start dev_mode'
})

const coreMetrics = computed(() => [
  {
    label: 'tcp_status',
    value: tcpConnected.value ? 'LIVE' : 'DOWN',
    sub: tcpConnected.value ? `port ${tcpPort.value}` : 'not linked',
    color: tcpConnected.value ? '#34d399' : '#ef4444',
  },
  {
    label: 'device_conn',
    value: tcpConnected.value ? '1' : '0',
    sub: tcpConnected.value ? 'desktop linked' : 'no device',
    color: tcpConnected.value ? accent.value : '#3f3f46',
  },
  {
    label: 'dev_mode',
    value: devMode.value ? 'ON' : 'OFF',
    sub: devMode.value ? devSessionTime.value : 'tap orb',
    color: devMode.value ? accent.value : '#3f3f46',
  },
])

// ── Starfield ─────────────────────────────────────────────
const starsCanvas = ref<HTMLCanvasElement | null>(null)
let animFrame = 0
interface Star { x: number; y: number; r: number; a: number; da: number; dx: number; dy: number }

function initStarfield(canvas: HTMLCanvasElement) {
  if (animFrame) cancelAnimationFrame(animFrame)
  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth || 340
  const H = canvas.clientHeight || 200
  canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr)
  const stars: Star[] = Array.from({ length: 55 }, () => ({
    x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.0 + 0.2, a: Math.random(),
    da: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
    dx: (Math.random() - 0.5) * 0.05, dy: (Math.random() - 0.5) * 0.05,
  }))
  function draw() {
    ctx.clearRect(0, 0, W, H)
    for (const s of stars) {
      s.a += s.da; if (s.a > 1 || s.a < 0) s.da *= -1
      s.x = (s.x + s.dx + W) % W; s.y = (s.y + s.dy + H) % H
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(150,180,255,${Math.max(0, Math.min(1, s.a))})`; ctx.fill()
    }
    animFrame = requestAnimationFrame(draw)
  }
  draw()
}

onMounted(() => {
  orbLog('DevKit dashboard loaded')
  nextTick(() => { requestAnimationFrame(() => { const c = starsCanvas.value; if (c && c.clientWidth > 0) initStarfield(c) }) })
})
onUnmounted(() => { cancelAnimationFrame(animFrame); if (twinOrbTimer) clearTimeout(twinOrbTimer) })
</script>

<style scoped>
.devkit-root {
  background: #060810;
  min-height: 100%;
}

.devtool-card {
  position: relative;
  overflow: hidden;
}

.devtool-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 60%);
  pointer-events: none;
}

@keyframes orb-h-spin-cw {
  from { transform: rotate(0deg) }
  to { transform: rotate(360deg) }
}

@keyframes orb-h-spin-ccw {
  from { transform: rotate(0deg) }
  to { transform: rotate(-360deg) }
}

@keyframes orb-h-orbit-1 {
  0%   { transform: rotate(0deg)   translate(72px, 0) rotate(0deg);    opacity: .95 }
  25%  { transform: rotate(90deg)  translate(72px, 0) rotate(-90deg);  opacity: .3  }
  50%  { transform: rotate(180deg) translate(72px, 0) rotate(-180deg); opacity: .2  }
  75%  { transform: rotate(270deg) translate(72px, 0) rotate(-270deg); opacity: .3  }
  100% { transform: rotate(360deg) translate(72px, 0) rotate(-360deg); opacity: .95 }
}

@keyframes orb-h-orbit-2 {
  0%   { transform: rotate(180deg) translate(90px, 0) rotate(-180deg); opacity: .7  }
  50%  { transform: rotate(360deg) translate(90px, 0) rotate(-360deg); opacity: .7  }
  75%  { transform: rotate(450deg) translate(90px, 0) rotate(-450deg); opacity: .25 }
  100% { transform: rotate(540deg) translate(90px, 0) rotate(-540deg); opacity: .7  }
}

.orb-h-ring-1 { animation: orb-h-spin-cw  14s linear infinite; transform-origin: 72px  12px }
.orb-h-ring-2 { animation: orb-h-spin-ccw 22s linear infinite; transform-origin: 100px 18px }
.orb-h-ring-3 { animation: orb-h-spin-cw  35s linear infinite; transform-origin: 127px 26px }
.orb-h-ring-4 { animation: orb-h-spin-ccw 50s linear infinite; transform-origin: 155px 34px }
.orb-h-p1 { animation: orb-h-orbit-1 4s linear infinite }
.orb-h-p2 { animation: orb-h-orbit-2 7s linear infinite }

/* Twin TCP orb */
.twin-orb-container { position: absolute; }

@keyframes tcp-orb-cw  { from { transform: rotate(0deg)   } to { transform: rotate(360deg)  } }
@keyframes tcp-orb-ccw { from { transform: rotate(360deg) } to { transform: rotate(0deg)    } }

@keyframes tcp-particle-move {
  0%   { transform: translateX(0) translateY(0);       opacity: 0.8; }
  50%  { transform: translateX(-30px) translateY(-20px); opacity: 0.3; }
  100% { transform: translateX(-60px) translateY(-10px); opacity: 0;   }
}

@keyframes tcp-dash { to { stroke-dashoffset: -14; } }

.tcp-orb-ring       { animation: tcp-orb-cw  6s linear infinite; }
.tcp-orb-ring-inner { animation: tcp-orb-ccw 9s linear infinite; }
.tcp-particle       { animation: tcp-particle-move linear infinite; position: absolute; }

.twin-orb-enter-active { transition: all 0.6s cubic-bezier(0.34, 1.1, 0.64, 1); }
.twin-orb-leave-active { transition: all 0.3s ease; }
.twin-orb-enter-from   { opacity: 0; transform: scale(0.3) translateY(20px); }
.twin-orb-leave-to     { opacity: 0; transform: scale(0.3); }

.fade-enter-active, .fade-leave-active { transition: opacity .25s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

.orb-expand-enter-active { animation: orb-burst .65s cubic-bezier(.22, 1, .36, 1) forwards }
.orb-expand-leave-active { transition: opacity .2s ease }
.orb-expand-leave-to     { opacity: 0 }

@keyframes orb-burst {
  0%   { transform: scale(.05); opacity: .8 }
  60%  { transform: scale(1.4); opacity: 1  }
  100% { transform: scale(3);   opacity: 1  }
}

.slide-down-enter-active, .slide-down-leave-active { transition: all .28s ease; overflow: hidden; }
.slide-down-enter-from, .slide-down-leave-to       { max-height: 0; opacity: 0; }
.slide-down-enter-to, .slide-down-leave-from       { max-height: 120px; opacity: 1; }
</style>