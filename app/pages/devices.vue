<template>
  <div class="devkit-root pb-28" style="touch-action:pan-y;">

    <!-- ══ HEADER ══ -->
    <div class="flex items-center justify-between px-5 pt-6 pb-3">
      <div>
        <p class="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase">orb devkit / devices</p>
        <h1 class="text-[22px] font-black text-zinc-50 tracking-tight mt-0.5 font-mono">
          <span :style="{ color: accent }">›</span>
          <span v-if="!viewingDevice"> devices</span>
          <span v-else> {{ viewingDevice.name }}</span>
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <div v-if="viewingDevice" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full" :style="viewingDevice.online
          ? { background: '#10b98118', border: '1px solid #10b98133' }
          : { background: '#ef444418', border: '1px solid #ef444433' }">
          <div
            :class="['w-1.5 h-1.5 rounded-full', viewingDevice.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500']">
          </div>
          <span class="text-[10px] font-mono font-bold"
            :style="{ color: viewingDevice.online ? '#34d399' : '#f87171' }">
            {{ viewingDevice.online ? 'LIVE' : 'OFFLINE' }}
          </span>
        </div>
        <button v-if="viewingDevice" @click="showDeviceActions = true"
          class="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.18);">
          <MoreVertical :size="16" class="text-rose-400" :stroke-width="2" />
        </button>
        <button v-if="viewingDevice" @click="viewingDeviceId = null"
          class="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
          <ChevronLeft :size="17" class="text-zinc-400" :stroke-width="2.5" />
        </button>
      </div>
    </div>

    <!-- ══ DEVICE LIST VIEW ══ -->
    <template v-if="!viewingDevice">

      <div v-if="!devMode" class="mx-4 mb-4 rounded-3xl overflow-hidden relative py-10 flex flex-col items-center gap-5"
        style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
        <div class="absolute inset-0 pointer-events-none"
          style="background:radial-gradient(ellipse at 50% 80%, rgba(239,68,68,0.05) 0%, transparent 70%)"></div>
        <div class="relative">
          <div class="w-20 h-20 rounded-3xl flex items-center justify-center"
            style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.18);">
            <MonitorOff :size="34" class="text-rose-500/50" :stroke-width="1.5" />
          </div>
          <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style="background:#1a0505;border:2px solid rgba(239,68,68,0.35);">
            <Zap :size="11" class="text-rose-400" :stroke-width="2.5" />
          </div>
        </div>
        <div class="text-center px-8">
          <p class="text-[17px] font-black text-zinc-200">Dev mode is off</p>
          <p class="text-[12px] font-mono text-zinc-600 mt-2 leading-relaxed">
            Enable dev mode to allow daemon connections<br>and device monitoring.
          </p>
        </div>
        <button @click="toggleDevMode"
          class="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[14px] font-black font-mono active:scale-95 transition-all"
          :style="{ background: accent, color: '#fff', boxShadow: `0 8px 24px ${accent}44` }">
          <Zap :size="16" :stroke-width="2.5" />
          enable_dev_mode
        </button>
      </div>

      <div v-else-if="!devices.length"
        class="mx-4 mb-4 rounded-3xl overflow-hidden relative py-10 flex flex-col items-center gap-5"
        style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);">
        <div class="absolute inset-0 pointer-events-none"
          :style="{ background: `radial-gradient(ellipse at 50% 80%, ${accent}08 0%, transparent 70%)` }"></div>
        <div class="relative">
          <div class="w-20 h-20 rounded-3xl flex items-center justify-center"
            :style="{ background: accent + '10', border: `1px solid ${accent}22` }">
            <Monitor :size="34" :style="{ color: accent + '66' }" :stroke-width="1.5" />
          </div>
          <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500/90 flex items-center justify-center"
            style="border:2px solid #060810;">
            <span class="text-[10px]">⏳</span>
          </div>
        </div>
        <div class="text-center px-8">
          <p class="text-[17px] font-black text-zinc-200">Waiting for devices…</p>
          <p class="text-[12px] font-mono text-zinc-600 mt-2 leading-relaxed">
            Install the Orb daemon on your desktop<br>and run <span :style="{ color: accent }"
              class="font-bold">orb-daemon pair</span>
          </p>
        </div>
        <button @click.stop="showPairing = true"
          class="flex items-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-black font-mono active:scale-95 transition-all"
          :style="{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }">
          <QrCode :size="16" :stroke-width="2" />
          pair_desktop
        </button>
      </div>

      <template v-if="devices.length">
        <div v-if="onlineDevices.length" class="px-5 pb-2">
          <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">online</p>
        </div>
        <div class="flex flex-col gap-2.5 px-4 mb-3">
          <button v-for="device in onlineDevices" :key="device.id" @click="selectAndView(device.id)"
            class="rounded-2xl overflow-hidden active:scale-[0.99] transition-all text-left"
            :style="{ background: accent + '06', border: `1px solid ${accent}22` }">
            <div class="flex items-center gap-3 px-4 py-4">
              <div class="relative flex-shrink-0" style="width:48px;height:48px;">
                <div class="absolute inset-0 rounded-full"
                  :style="{ border: `1px solid ${accent}55`, animation: 'dev-spin-cw 8s linear infinite' }"></div>
                <div class="absolute rounded-full"
                  :style="{ inset: '4px', background: 'radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 60%,#000 100%)', boxShadow: `0 0 14px 3px ${accent}44, inset 0 0 12px rgba(0,0,0,0.9)` }">
                </div>
                <div class="absolute rounded-full"
                  :style="{ inset: '4px', background: `radial-gradient(circle at 28% 26%, ${accent}28 0%, transparent 55%)` }">
                </div>
                <div class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 animate-pulse"
                  style="border-color:#060810;"></div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[15px] font-black font-mono" :style="{ color: accent }">{{ device.name }}</p>
                <p class="text-[11px] font-mono text-zinc-500 mt-0.5">{{ device.os }} · {{ device.cpu }}</p>
                <p class="text-[10px] font-mono text-zinc-700 mt-0.5">{{ device.ip }}:{{ device.port }}</p>
              </div>
              <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span class="text-[9px] font-mono font-bold px-2 py-1 rounded"
                  style="background:rgba(52,211,153,0.12);color:#34d399;border:1px solid rgba(52,211,153,0.25);">
                  LIVE
                </span>
                <span class="text-[10px] font-mono text-zinc-600">{{ device.ramGb }}GB RAM · {{ device.cores }}c</span>
              </div>
            </div>
          </button>
        </div>

        <div v-if="offlineDevices.length" class="px-5 pb-2">
          <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">previously seen</p>
        </div>
        <div class="flex flex-col gap-2.5 px-4">
          <div v-for="device in offlineDevices" :key="device.id" class="rounded-2xl overflow-hidden"
            style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
            <div class="flex items-center gap-3 px-4 py-3.5">
              <div class="relative flex-shrink-0" style="width:40px;height:40px;">
                <div class="absolute inset-0 rounded-full" style="border:1px solid rgba(255,255,255,0.08);"></div>
                <div class="absolute rounded-full"
                  style="inset:4px;background:radial-gradient(circle at 38% 32%,#18181b 0%,#09090b 60%,#000 100%);">
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-black font-mono text-zinc-500">{{ device.name }}</p>
                <p class="text-[11px] font-mono text-zinc-700 mt-0.5">Last seen {{ formatLastSeen(device.lastSeen) }}
                </p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="text-[9px] font-mono font-bold px-2 py-1 rounded"
                  style="background:rgba(239,68,68,0.08);color:#f87171;border:1px solid rgba(239,68,68,0.15);">
                  OFFLINE
                </span>
                <button @click.stop="removeDevice(device.id)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                  style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12);">
                  <Trash2 :size="12" class="text-rose-600" :stroke-width="2" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mx-4 mt-3">
          <button @click="showPairing = true"
            class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold font-mono active:scale-95 transition-all"
            :style="{ background: accent + '10', border: `1px solid ${accent}22`, color: accent }">
            <QrCode :size="15" :stroke-width="2" />
            pair another device
          </button>
        </div>
      </template>

      <div class="px-5 pb-2 mt-4">
        <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">available_metrics</p>
      </div>
      <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
        style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
        <div v-for="(feat, i) in features" :key="feat.label"
          :class="['flex items-center gap-3 px-4 py-3', i < features.length - 1 ? 'border-b border-white/5' : '']">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            :style="{ background: feat.color + '12', border: `1px solid ${feat.color}20` }">
            <component :is="feat.icon" :size="14" :style="{ color: feat.color }" :stroke-width="1.8" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-bold font-mono text-zinc-400">{{ feat.label }}</p>
            <p class="text-[10px] font-mono text-zinc-700 mt-0.5">{{ feat.sub }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- ══ DEVICE MONITOR VIEW ══ -->
    <template v-else>
      <Transition name="slide-down">
        <div v-if="!viewingDevice.online" class="mx-4 mb-4 rounded-2xl overflow-hidden"
          style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);">
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="w-8 h-8 rounded-xl bg-rose-950/40 flex items-center justify-center flex-shrink-0">
              <WifiOff :size="15" class="text-rose-400" :stroke-width="2" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[12px] font-mono font-bold text-rose-300">daemon_disconnected</p>
              <p class="text-[10px] font-mono text-rose-700 mt-0.5">Last seen {{ formatLastSeen(viewingDevice.lastSeen)
              }}</p>
            </div>
            <!-- ✅ FIX: Reconnect button replaces just "back" -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button @click="handleReconnect" :disabled="reconnecting"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold active:scale-95 transition-all disabled:opacity-50"
                :style="{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }">
                <RefreshCw :size="11" :stroke-width="2.5" :class="reconnecting ? 'animate-spin' : ''" />
                {{ reconnecting ? 'connecting' : 'reconnect' }}
              </button>
              <button @click="viewingDeviceId = null"
                class="px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold active:scale-95"
                style="background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.2);">
                back
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
        :style="{ background: viewingDevice.online ? accent + '07' : 'rgba(255,255,255,0.02)', border: `1px solid ${viewingDevice.online ? accent + '20' : 'rgba(255,255,255,0.06)'}` }">
        <div class="flex items-center gap-3 px-4 py-3.5">
          <div class="relative flex-shrink-0" style="width:44px;height:44px;">
            <div class="absolute inset-0 rounded-full"
              :style="{ border: `1px solid ${viewingDevice.online ? accent + '55' : 'rgba(255,255,255,0.1)'}`, animation: viewingDevice.online ? 'dev-spin-cw 8s linear infinite' : 'none' }">
            </div>
            <div class="absolute rounded-full"
              :style="{ inset: '4px', background: 'radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 60%,#000 100%)', boxShadow: viewingDevice.online ? `0 0 12px 3px ${accent}44, inset 0 0 10px rgba(0,0,0,0.9)` : 'none' }">
            </div>
            <div v-if="viewingDevice.online" class="absolute rounded-full"
              :style="{ inset: '4px', background: `radial-gradient(circle at 28% 26%, ${accent}28 0%, transparent 55%)` }">
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-black font-mono" :style="{ color: viewingDevice.online ? accent : '#71717a' }">{{
              viewingDevice.name }}</p>
            <p class="text-[10px] font-mono text-zinc-500 mt-0.5">{{ viewingDevice.os }} {{ viewingDevice.osVersion }} ·
              {{ viewingDevice.ip }}:{{ viewingDevice.port }}</p>
          </div>
          <div v-if="viewingDevice.online" class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span class="text-[10px] font-mono font-bold text-emerald-400">live</span>
          </div>
        </div>
        <div class="border-t border-white/5 px-4 py-2.5 grid grid-cols-3 gap-0">
          <div v-for="(spec, i) in deviceSpecs" :key="spec.label"
            :class="['flex flex-col gap-0.5', i < 2 ? 'border-r border-white/5 pr-3' : 'pl-3']">
            <span class="text-[8px] font-mono text-zinc-700 uppercase tracking-widest">{{ spec.label }}</span>
            <span class="text-[11px] font-black font-mono text-zinc-300">{{ spec.value }}</span>
          </div>
        </div>
      </div>

      <template v-if="viewingDevice.online">
        <div class="grid grid-cols-2 gap-2.5 px-4 mb-4">
          <div v-for="metric in topMetrics" :key="metric.label" class="rounded-2xl px-4 py-3.5 relative overflow-hidden"
            :style="{ background: metric.color + '0D', border: `1px solid ${metric.color}25` }">
            <div class="absolute top-0 right-0 w-16 h-16 pointer-events-none"
              :style="{ background: `radial-gradient(circle at 80% 20%, ${metric.color}18 0%, transparent 70%)`, filter: 'blur(8px)' }">
            </div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-[9px] font-mono font-bold uppercase tracking-widest"
                :style="{ color: metric.color + '99' }">{{ metric.label }}</span>
              <component :is="metric.icon" :size="13" :style="{ color: metric.color + '88' }" :stroke-width="2" />
            </div>
            <p class="text-[26px] font-black font-mono leading-none" :style="{ color: metric.color }">{{ metric.value }}
            </p>
            <p class="text-[9px] font-mono mt-1" :style="{ color: metric.color + '66' }">{{ metric.sub }}</p>
            <div class="mt-2 h-1 rounded-full overflow-hidden" style="background:rgba(255,255,255,0.06)">
              <div class="h-full rounded-full transition-all duration-1000"
                :style="{ width: metric.pct + '%', background: metric.color }"></div>
            </div>
          </div>
        </div>

        <div class="px-5 pb-2 flex items-center justify-between">
          <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">cpu_cores</p>
          <span class="text-[10px] font-mono font-bold" :style="{ color: cpuColor }">{{ simCpu }}% avg</span>
        </div>
        <div class="mx-4 mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
          <div class="grid grid-cols-4 gap-2 mb-4">
            <div v-for="(core, i) in coreUsage" :key="i" class="flex flex-col items-center gap-1.5">
              <div class="w-full h-16 rounded-lg overflow-hidden flex items-end"
                style="background:rgba(255,255,255,0.04);">
                <div class="w-full rounded-t-sm transition-all duration-700"
                  :style="{ height: core + '%', background: coreColor(core) }"></div>
              </div>
              <span class="text-[8px] font-mono text-zinc-600">C{{ i }}</span>
              <span class="text-[9px] font-black font-mono" :style="{ color: coreColor(core) }">{{ core }}%</span>
            </div>
          </div>
          <div class="relative h-12 rounded-xl overflow-hidden" style="background:rgba(255,255,255,0.03);">
            <svg class="absolute inset-0 w-full h-full" preserveAspectRatio="none" :viewBox="`0 0 ${GW} 48`">
              <line v-for="y in [12, 24, 36]" :key="y" x1="0" :y1="y" :x2="GW" :y2="y" stroke="rgba(255,255,255,0.04)"
                stroke-width="1" />
              <path :d="cpuFill" :fill="cpuColor + '22'" />
              <path :d="cpuLine" :stroke="cpuColor" stroke-width="1.5" fill="none" stroke-linejoin="round" />
            </svg>
            <span class="absolute top-1 left-2 text-[7px] font-mono text-zinc-700">100%</span>
            <span class="absolute bottom-1 left-2 text-[7px] font-mono text-zinc-700">0%</span>
          </div>
        </div>

        <div class="px-5 pb-2 flex items-center justify-between">
          <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">memory</p>
          <span class="text-[10px] font-mono font-bold text-violet-400">{{ simRam.toFixed(1) }}GB / {{
            viewingDevice.ramGb }}GB</span>
        </div>
        <div class="mx-4 mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
          <div class="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
            <div class="h-full transition-all duration-700 rounded-l-full"
              :style="{ width: ramActP + '%', background: accent }"></div>
            <div class="h-full transition-all duration-700" style="background:rgba(139,92,246,0.45);"
              :style="{ width: ramCacP + '%' }"></div>
            <div class="flex-1 h-full rounded-r-full" style="background:rgba(255,255,255,0.06);"></div>
          </div>
          <div class="flex items-center gap-4 text-[10px] font-mono">
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-sm" :style="{ background: accent }"></div>
              <span class="text-zinc-500">Active <b class="text-zinc-200">{{ (simRam * 0.55).toFixed(1) }}GB</b></span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-sm bg-violet-500/40"></div>
              <span class="text-zinc-500">Cached <b class="text-zinc-200">{{ (simRam * 0.3).toFixed(1) }}GB</b></span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 rounded-sm" style="background:rgba(255,255,255,0.08)"></div>
              <span class="text-zinc-500">Free <b class="text-zinc-200">{{ (viewingDevice.ramGb - simRam).toFixed(1)
                  }}GB</b></span>
            </div>
          </div>
        </div>

        <div class="px-5 pb-2">
          <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">network_io</p>
        </div>
        <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
          style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
          <div class="grid grid-cols-2 divide-x divide-white/5">
            <div class="px-4 py-4 flex flex-col gap-1">
              <div class="flex items-center gap-2 mb-1">
                <ArrowDown :size="12" class="text-emerald-400" :stroke-width="2.5" />
                <span class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest">download</span>
              </div>
              <span class="text-[22px] font-black font-mono text-emerald-400">{{ netDown }}</span>
              <span class="text-[9px] font-mono text-zinc-700">MB/s</span>
            </div>
            <div class="px-4 py-4 flex flex-col gap-1">
              <div class="flex items-center gap-2 mb-1">
                <ArrowUp :size="12" :style="{ color: accent }" :stroke-width="2.5" />
                <span class="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest">upload</span>
              </div>
              <span class="text-[22px] font-black font-mono" :style="{ color: accent }">{{ netUp }}</span>
              <span class="text-[9px] font-mono text-zinc-700">MB/s</span>
            </div>
          </div>
        </div>

        <p class="text-[9px] font-mono text-zinc-700 text-center pb-2 px-4 leading-relaxed">
          Simulated data · Real metrics require the Orb desktop daemon
        </p>
      </template>

      <!-- Offline state inside device view -->
      <template v-else>
        <div class="mx-4 flex flex-col items-center gap-4 py-16 rounded-2xl"
          style="border:2px dashed rgba(255,255,255,0.06);">
          <MonitorOff :size="36" class="text-zinc-700" :stroke-width="1.5" />
          <div class="text-center">
            <p class="text-[15px] font-bold text-zinc-500">Device offline</p>
            <p class="text-[12px] font-mono text-zinc-700 mt-1">Start the daemon then reconnect</p>
          </div>
          <!-- ✅ FIX: Reconnect button in the body too -->
          <button @click="handleReconnect" :disabled="reconnecting"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-mono font-bold active:scale-95 disabled:opacity-50"
            :style="{ background: accent + '18', border: `1px solid ${accent}33`, color: accent }">
            <RefreshCw :size="15" :stroke-width="2" :class="reconnecting ? 'animate-spin' : ''" />
            {{ reconnecting ? 'connecting…' : 'reconnect' }}
          </button>
          <button @click="showDeviceActions = true"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-mono font-bold active:scale-95"
            style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#f87171;">
            <Trash2 :size="14" :stroke-width="2" />
            unpair device
          </button>
        </div>
      </template>
    </template>

    <div class="h-4"></div>
  </div>

  <!-- Pair daemon modal -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showPairing" class="fixed inset-0 z-[300] overflow-y-auto" style="background:#060810;">
        <PairDaemon @close="showPairing = false" />
      </div>
    </Transition>
  </Teleport>

  <!-- Device Actions Sheet -->
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="showDeviceActions" class="fixed inset-0 z-[400] flex items-end justify-center"
        style="background:rgba(0,0,0,0.75);backdrop-filter:blur(14px);" @click.self="showDeviceActions = false">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t px-5 pt-5"
          style="background:#0e0b1e;border-color:rgba(239,68,68,0.25);"
          :style="[{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom))' }, actionsSheetStyle]"
          @touchstart="actionsTouchStart" @touchmove="actionsTouchMove" @touchend="actionsTouchEnd">
          <div class="w-10 h-1 rounded-full mx-auto mb-5" style="background:rgba(239,68,68,0.3)"></div>

          <div class="flex items-center gap-3 mb-5 px-1">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.18);">
              <Monitor :size="18" class="text-rose-400" :stroke-width="1.8" />
            </div>
            <div>
              <p class="text-[14px] font-black text-zinc-100">{{ viewingDevice?.name }}</p>
              <p class="text-[11px] font-mono text-zinc-600">{{ viewingDevice?.ip }}:{{ viewingDevice?.port }}</p>
            </div>
          </div>

          <!-- Disconnect (when online) -->
          <button v-if="viewingDevice?.online" @click="handleDisconnect"
            class="w-full flex items-center gap-3 px-4 py-4 rounded-2xl mb-3 active:scale-[0.98] transition-all"
            style="background:rgba(251,146,60,0.08);border:1px solid rgba(251,146,60,0.2);">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style="background:rgba(251,146,60,0.12);">
              <WifiOff :size="18" class="text-orange-400" :stroke-width="1.8" />
            </div>
            <div class="flex-1 text-left">
              <p class="text-[14px] font-bold text-orange-300">Disconnect</p>
              <p class="text-[11px] text-zinc-500 mt-0.5">Close connection — use reconnect to restore</p>
            </div>
          </button>

          <!-- Unpair -->
          <button @click="confirmUnpairTarget = viewingDevice; showDeviceActions = false"
            class="w-full flex items-center gap-3 px-4 py-4 rounded-2xl mb-3 active:scale-[0.98] transition-all"
            style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style="background:rgba(239,68,68,0.12);">
              <Trash2 :size="18" class="text-rose-400" :stroke-width="1.8" />
            </div>
            <div class="flex-1 text-left">
              <p class="text-[14px] font-bold text-rose-300">Unpair &amp; Remove</p>
              <p class="text-[11px] text-zinc-500 mt-0.5">Sends Reset to daemon, removes local pairing</p>
            </div>
          </button>

          <button @click="showDeviceActions = false"
            class="w-full py-3.5 rounded-2xl text-[15px] font-bold text-zinc-500 active:scale-[0.98]"
            style="background:rgba(255,255,255,0.05);">
            Cancel
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Unpair Confirmation -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="confirmUnpairTarget" class="fixed inset-0 z-[500] flex items-end justify-center"
        style="background:rgba(0,0,0,0.8);backdrop-filter:blur(16px);" @click.self="confirmUnpairTarget = null">
        <div class="w-full max-w-[430px] rounded-t-[28px] border-t px-5 pt-5"
          style="background:#150808;border-color:rgba(239,68,68,0.3);"
          :style="[{ paddingBottom: 'calc(40px + env(safe-area-inset-bottom))' }, unpairSheetStyle]"
          @touchstart="unpairTouchStart" @touchmove="unpairTouchMove" @touchend="unpairTouchEnd">
          <div class="w-10 h-1 rounded-full mx-auto mb-5" style="background:rgba(239,68,68,0.4)"></div>
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center"
              style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.25);">
              <Trash2 :size="26" class="text-rose-400" :stroke-width="1.8" />
            </div>
          </div>
          <p class="text-[18px] font-black text-center mb-2 text-zinc-100">Unpair device?</p>
          <p class="text-[13px] text-center leading-relaxed mb-2 text-zinc-500">
            <span class="text-zinc-300 font-bold">{{ confirmUnpairTarget?.name }}</span> will be removed. The daemon's
            data will be reset and you'll need to run <span class="text-rose-400 font-bold">orb-daemon pair</span>
            again.
          </p>
          <p class="text-[11px] font-mono text-rose-700 text-center mb-6">This cannot be undone.</p>
          <button @click="executeUnpair" class="w-full py-4 rounded-2xl text-[16px] font-black active:scale-[0.98] mb-3"
            style="background:rgba(239,68,68,0.85);color:white;box-shadow:0 8px 28px rgba(239,68,68,0.3);">
            Yes, unpair
          </button>
          <button @click="confirmUnpairTarget = null"
            class="w-full py-3.5 rounded-2xl text-[15px] font-bold text-zinc-400 active:scale-[0.98]"
            style="background:rgba(255,255,255,0.05);">
            Cancel
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  Monitor, MonitorOff, Zap, ChevronLeft, Trash2, QrCode,
  Cpu, MemoryStick, Thermometer, ArrowDown, ArrowUp,
  Activity, HardDrive, WifiOff, MoreVertical, RefreshCw,
} from 'lucide-vue-next'
import { settings, orbLog } from '../composables/useStore'
import { devMode, toggleDevMode } from '../composables/useDevMode'
import { devices, onlineDevices, removeDevice, type Device } from '../composables/useDevices'
import { useNav } from '../composables/useNav'
import { useDaemon } from '../composables/useDaemon'
import PairDaemon from '~/components/PairDaemon.vue'
import { useSwipeDown } from '~/composables/useSwipeDown'

const accent = computed(() => settings.value.accentColor)
const { navParams } = useNav()
const showPairing = ref(false)
const showDeviceActions = ref(false)
const confirmUnpairTarget = ref<Device | null>(null)
const reconnecting = ref(false)
const { sheetStyle: actionsSheetStyle, onTouchStart: actionsTouchStart, onTouchMove: actionsTouchMove, onTouchEnd: actionsTouchEnd } = useSwipeDown(() => { showDeviceActions.value = false })
const { sheetStyle: unpairSheetStyle, onTouchStart: unpairTouchStart, onTouchMove: unpairTouchMove, onTouchEnd: unpairTouchEnd } = useSwipeDown(() => { confirmUnpairTarget.value = null })

const { disconnect: daemonDisconnect, resetDaemon, connect: daemonConnect } = useDaemon()

// ── Device selection ─────────────────────────────────────
const viewingDeviceId = ref<string | null>(navParams.value.deviceId ?? null)

watch(() => navParams.value.deviceId, (id) => {
  if (id) viewingDeviceId.value = id
}, { immediate: true })

const viewingDevice = computed<Device | null>(() =>
  devices.value.find(d => d.id === viewingDeviceId.value) ?? null
)

const offlineDevices = computed(() => devices.value.filter(d => !d.online))

function selectAndView(id: string) {
  viewingDeviceId.value = id
}

function formatLastSeen(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Device actions ───────────────────────────────────────
function handleDisconnect() {
  daemonDisconnect()
  showDeviceActions.value = false
  orbLog('Device disconnected manually')
}

// ✅ FIX: Reconnect button handler
async function handleReconnect() {
  if (reconnecting.value) return
  reconnecting.value = true
  orbLog('[Devices] Manual reconnect requested…')
  try {
    await daemonConnect()
  } finally {
    reconnecting.value = false
  }
}

// ✅ FIX: executeUnpair now sends Reset to daemon first
async function executeUnpair() {
  const target = confirmUnpairTarget.value
  if (!target) return
  await resetDaemon()           // sends Reset to daemon + clears local pairing
  removeDevice(target.id)
  confirmUnpairTarget.value = null
  viewingDeviceId.value = null
  orbLog(`Device unpaired: ${target.name}`)
}

// ── Features list ────────────────────────────────────────
const features = [
  { icon: Cpu, label: 'CPU Usage', sub: 'Per-core utilization & frequency', color: '#34d399' },
  { icon: MemoryStick, label: 'Memory', sub: 'Active, cached & free RAM', color: '#8b5cf6' },
  { icon: Activity, label: 'Processes', sub: 'Top CPU & memory consumers', color: '#60a5fa' },
  { icon: ArrowDown, label: 'Network I/O', sub: 'Real-time bandwidth monitor', color: '#34d399' },
  { icon: HardDrive, label: 'Disk I/O', sub: 'Read/write throughput', color: '#fb923c' },
]

const deviceSpecs = computed(() => {
  if (!viewingDevice.value) return []
  const d = viewingDevice.value
  return [
    { label: 'CPU', value: d.cores + ' cores' },
    { label: 'RAM', value: d.ramGb + ' GB' },
    { label: 'NET', value: d.online ? 'live' : 'offline' },
  ]
})

// ── Simulation ───────────────────────────────────────────
const GW = 60
const simCpu = ref(0)
const simRam = ref(0)
const netDown = ref('0.0')
const netUp = ref('0.0')
const coreUsage = ref<number[]>([0, 0, 0, 0, 0, 0, 0, 0])
const cpuHist = ref<number[]>([])

function pushH(arr: typeof cpuHist, v: number) {
  arr.value = [...arr.value.slice(-(GW - 1)), v]
}

function buildPath(vals: number[], max: number, h: number, fill: boolean) {
  if (vals.length < 2) return ''
  const pts = vals.map((v, i) => {
    const x = (i / (GW - 1)) * GW
    const y = h - (Math.min(v, max) / max * h)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const line = 'M ' + pts.join(' L ')
  if (!fill) return line
  const fx = pts[0].split(',')[0], lx = pts[pts.length - 1].split(',')[0]
  return line + ` L ${lx},${h} L ${fx},${h} Z`
}

const cpuColor = computed(() => simCpu.value > 70 ? '#f87171' : simCpu.value > 45 ? '#fb923c' : '#34d399')
const cpuLine = computed(() => buildPath(cpuHist.value, 100, 48, false))
const cpuFill = computed(() => buildPath(cpuHist.value, 100, 48, true))
const ramActP = computed(() => (simRam.value * 0.55 / (viewingDevice.value?.ramGb ?? 32)) * 100)
const ramCacP = computed(() => (simRam.value * 0.30 / (viewingDevice.value?.ramGb ?? 32)) * 100)
function coreColor(v: number) { return v > 70 ? '#f87171' : v > 45 ? '#fb923c' : '#34d399' }

const topMetrics = computed(() => {
  const d = viewingDevice.value
  if (!d) return []
  return [
    { label: 'CPU', icon: Cpu, value: simCpu.value + '%', sub: `${d.cores} cores`, pct: simCpu.value, color: cpuColor.value },
    { label: 'RAM', icon: MemoryStick, value: simRam.value.toFixed(1) + 'G', sub: `of ${d.ramGb}GB used`, pct: (simRam.value / d.ramGb) * 100, color: '#8b5cf6' },
    { label: 'DOWN', icon: ArrowDown, value: netDown.value, sub: 'MB/s download', pct: Math.min(100, parseFloat(netDown.value) * 10), color: '#34d399' },
    { label: 'UP', icon: ArrowUp, value: netUp.value, sub: 'MB/s upload', pct: Math.min(100, parseFloat(netUp.value) * 20), color: accent.value },
  ]
})

let simTimer: ReturnType<typeof setInterval> | null = null
let cpuT = 35, ramT = 18, ndT = 1.2, nuT = 0.4, tick = 0

function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t) }
function simTick() {
  tick++
  if (tick % 4 === 0) {
    cpuT = Math.max(5, Math.min(88, cpuT + (Math.random() - 0.45) * 14))
    ndT = Math.max(0.1, Math.min(9, ndT + (Math.random() - 0.5) * 1.4))
    nuT = Math.max(0.1, Math.min(5, nuT + (Math.random() - 0.5) * 0.7))
  }
  if (tick % 8 === 0) {
    const rMax = viewingDevice.value?.ramGb ?? 32
    ramT = Math.max(4, Math.min(rMax * 0.88, ramT + (Math.random() - 0.4) * 1.8))
  }
  simCpu.value = lerp(simCpu.value, cpuT, 0.3)
  simRam.value = parseFloat((simRam.value + (ramT - simRam.value) * 0.1).toFixed(1))
  netDown.value = (ndT + (Math.random() - 0.5) * 0.3).toFixed(1)
  netUp.value = (nuT + (Math.random() - 0.5) * 0.2).toFixed(1)
  coreUsage.value = coreUsage.value.map((c, i) => lerp(c, Math.max(1, Math.min(96, cpuT + (Math.random() - 0.5) * 28 + (i % 3 === 0 ? 8 : -4))), 0.35))
  pushH(cpuHist, simCpu.value)
}

function startSim() {
  stopSim()
  const d = viewingDevice.value
  if (!d || !d.online) return
  simCpu.value = 30; simRam.value = d.ramGb * 0.52
  coreUsage.value = Array.from({ length: d.cores }, () => Math.round(20 + Math.random() * 40))
  simTimer = setInterval(simTick, 1000)
  orbLog(`Monitoring ${d.name} (simulated)`)
}
function stopSim() {
  if (simTimer) { clearInterval(simTimer); simTimer = null }
}

watch(viewingDeviceId, (id) => {
  stopSim()
  cpuHist.value = []
  if (id && devices.value.find(d => d.id === id)?.online) startSim()
}, { immediate: true })

watch(() => viewingDevice.value?.online, (online) => {
  if (!online) stopSim()
  else if (viewingDeviceId.value) startSim()
})

onUnmounted(stopSim)
</script>

<style scoped>
.devkit-root {
  background: #060810;
  min-height: 100%;
}

@keyframes dev-spin-cw {
  from {
    transform: rotate(0deg)
  }

  to {
    transform: rotate(360deg)
  }
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity .3s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity .25s ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all .28s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 80px;
  opacity: 1;
}
</style>