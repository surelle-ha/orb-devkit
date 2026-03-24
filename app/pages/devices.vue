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
        <div v-if="viewingDevice" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          :style="viewingDevice.online
            ? { background:'#10b98118', border:'1px solid #10b98133' }
            : { background:'#ef444418', border:'1px solid #ef444433' }">
          <div :class="['w-1.5 h-1.5 rounded-full', viewingDevice.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500']"></div>
          <span class="text-[10px] font-mono font-bold" :style="{ color: viewingDevice.online ? '#34d399' : '#f87171' }">
            {{ viewingDevice.online ? 'LIVE' : 'OFFLINE' }}
          </span>
        </div>
        <button v-if="viewingDevice" @click="viewingDeviceId = null"
          class="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
          style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);">
          <ChevronLeft :size="17" class="text-zinc-400" :stroke-width="2.5" />
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════
         DEVICE LIST VIEW
    ══════════════════════════════════════════ -->
    <template v-if="!viewingDevice">

      <!-- Dev Mode OFF — no devices can connect -->
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
            Enable dev mode from the tab bar center button<br>to start receiving device connections.
          </p>
        </div>
        <button @click="toggleDevMode"
          class="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[14px] font-black font-mono active:scale-95 transition-all"
          :style="{ background: accent, color: '#fff', boxShadow: `0 8px 24px ${accent}44` }">
          <Zap :size="16" :stroke-width="2.5" />
          enable_dev_mode
        </button>
      </div>

      <!-- Dev mode ON but no devices yet -->
      <div v-else-if="!devices.length" class="mx-4 mb-4 rounded-3xl overflow-hidden relative py-10 flex flex-col items-center gap-5"
        style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);">
        <div class="absolute inset-0 pointer-events-none"
          :style="{ background:`radial-gradient(ellipse at 50% 80%, ${accent}08 0%, transparent 70%)` }"></div>
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
            Install the Orb daemon on your desktop<br>and connect it to 127.0.0.1:{{ tcpPort }}
          </p>
        </div>
      </div>

      <!-- Device list when available -->
      <template v-if="devices.length">
        <!-- Section: online -->
        <div v-if="onlineDevices.length" class="px-5 pb-2">
          <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">online</p>
        </div>
        <div class="flex flex-col gap-2.5 px-4 mb-3">
          <button v-for="device in onlineDevices" :key="device.id"
            @click="selectAndView(device.id)"
            class="rounded-2xl overflow-hidden active:scale-[0.99] transition-all text-left"
            :style="{ background: accent + '06', border: `1px solid ${accent}22` }">
            <div class="flex items-center gap-3 px-4 py-4">
              <!-- Orb avatar -->
              <div class="relative flex-shrink-0" style="width:48px;height:48px;">
                <div class="absolute inset-0 rounded-full"
                  :style="{ border: `1px solid ${accent}55`, animation:'dev-spin-cw 8s linear infinite' }"></div>
                <div class="absolute rounded-full"
                  :style="{ inset:'4px', background:'radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 60%,#000 100%)', boxShadow:`0 0 14px 3px ${accent}44, inset 0 0 12px rgba(0,0,0,0.9)` }"></div>
                <div class="absolute rounded-full"
                  :style="{ inset:'4px', background:`radial-gradient(circle at 28% 26%, ${accent}28 0%, transparent 55%)` }"></div>
                <!-- Online dot -->
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

        <!-- Section: offline -->
        <div v-if="offlineDevices.length" class="px-5 pb-2">
          <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">previously seen</p>
        </div>
        <div class="flex flex-col gap-2.5 px-4">
          <div v-for="device in offlineDevices" :key="device.id"
            class="rounded-2xl overflow-hidden"
            style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
            <div class="flex items-center gap-3 px-4 py-3.5">
              <div class="relative flex-shrink-0" style="width:40px;height:40px;">
                <div class="absolute inset-0 rounded-full" style="border:1px solid rgba(255,255,255,0.08);"></div>
                <div class="absolute rounded-full" style="inset:4px;background:radial-gradient(circle at 38% 32%,#18181b 0%,#09090b 60%,#000 100%);"></div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-black font-mono text-zinc-500">{{ device.name }}</p>
                <p class="text-[11px] font-mono text-zinc-700 mt-0.5">Last seen {{ formatLastSeen(device.lastSeen) }}</p>
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
      </template>

      <!-- Available features preview -->
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

    <!-- ══════════════════════════════════════════
         DEVICE MONITOR VIEW
    ══════════════════════════════════════════ -->
    <template v-else>
      <!-- Device summary card -->
      <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
        :style="{ background: accent + '07', border: `1px solid ${accent}20` }">
        <div class="flex items-center gap-3 px-4 py-3.5">
          <div class="relative flex-shrink-0" style="width:44px;height:44px;">
            <div class="absolute inset-0 rounded-full"
              :style="{ border:`1px solid ${accent}55`, animation:'dev-spin-cw 8s linear infinite' }"></div>
            <div class="absolute rounded-full"
              :style="{ inset:'4px', background:'radial-gradient(circle at 38% 32%,#1a1a2e 0%,#09090b 60%,#000 100%)', boxShadow:`0 0 12px 3px ${accent}44, inset 0 0 10px rgba(0,0,0,0.9)` }"></div>
            <div class="absolute rounded-full"
              :style="{ inset:'4px', background:`radial-gradient(circle at 28% 26%, ${accent}28 0%, transparent 55%)` }"></div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-black font-mono" :style="{ color: accent }">{{ viewingDevice.name }}</p>
            <p class="text-[10px] font-mono text-zinc-500 mt-0.5">{{ viewingDevice.os }} {{ viewingDevice.osVersion }} · {{ viewingDevice.ip }}:{{ viewingDevice.port }}</p>
          </div>
          <div class="flex items-center gap-1.5">
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

      <!-- ── METRIC PILLS ── -->
      <div class="grid grid-cols-2 gap-2.5 px-4 mb-4">
        <div v-for="metric in topMetrics" :key="metric.label"
          class="rounded-2xl px-4 py-3.5 relative overflow-hidden"
          :style="{ background: metric.color + '0D', border: `1px solid ${metric.color}25` }">
          <div class="absolute top-0 right-0 w-16 h-16 pointer-events-none"
            :style="{ background: `radial-gradient(circle at 80% 20%, ${metric.color}18 0%, transparent 70%)`, filter:'blur(8px)' }"></div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-[9px] font-mono font-bold uppercase tracking-widest" :style="{ color: metric.color + '99' }">{{ metric.label }}</span>
            <component :is="metric.icon" :size="13" :style="{ color: metric.color + '88' }" :stroke-width="2" />
          </div>
          <p class="text-[26px] font-black font-mono leading-none" :style="{ color: metric.color }">{{ metric.value }}</p>
          <p class="text-[9px] font-mono mt-1" :style="{ color: metric.color + '66' }">{{ metric.sub }}</p>
          <div class="mt-2 h-1 rounded-full overflow-hidden" style="background:rgba(255,255,255,0.06)">
            <div class="h-full rounded-full transition-all duration-1000"
              :style="{ width: metric.pct + '%', background: metric.color }"></div>
          </div>
        </div>
      </div>

      <!-- ── CPU CORES ── -->
      <div class="px-5 pb-2 flex items-center justify-between">
        <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">cpu_cores</p>
        <span class="text-[10px] font-mono font-bold" :style="{ color: cpuColor }">{{ simCpu }}% avg</span>
      </div>
      <div class="mx-4 mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
        <div class="grid grid-cols-4 gap-2 mb-4">
          <div v-for="(core, i) in coreUsage" :key="i" class="flex flex-col items-center gap-1.5">
            <div class="w-full h-16 rounded-lg overflow-hidden flex items-end" style="background:rgba(255,255,255,0.04);">
              <div class="w-full rounded-t-sm transition-all duration-700"
                :style="{ height: core + '%', background: coreColor(core) }"></div>
            </div>
            <span class="text-[8px] font-mono text-zinc-600">C{{ i }}</span>
            <span class="text-[9px] font-black font-mono" :style="{ color: coreColor(core) }">{{ core }}%</span>
          </div>
        </div>
        <div class="relative h-12 rounded-xl overflow-hidden" style="background:rgba(255,255,255,0.03);">
          <svg class="absolute inset-0 w-full h-full" preserveAspectRatio="none" :viewBox="`0 0 ${GW} 48`">
            <line v-for="y in [12,24,36]" :key="y" x1="0" :y1="y" :x2="GW" :y2="y" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
            <path :d="cpuFill" :fill="cpuColor + '22'" />
            <path :d="cpuLine" :stroke="cpuColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
          </svg>
          <span class="absolute top-1 left-2 text-[7px] font-mono text-zinc-700">100%</span>
          <span class="absolute bottom-1 left-2 text-[7px] font-mono text-zinc-700">0%</span>
        </div>
      </div>

      <!-- ── RAM ── -->
      <div class="px-5 pb-2 flex items-center justify-between">
        <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">memory</p>
        <span class="text-[10px] font-mono font-bold text-violet-400">{{ simRam.toFixed(1) }}GB / {{ viewingDevice.ramGb }}GB</span>
      </div>
      <div class="mx-4 mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
        <div class="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
          <div class="h-full transition-all duration-700 rounded-l-full" :style="{ width: ramActP + '%', background: accent }"></div>
          <div class="h-full transition-all duration-700" style="background:rgba(139,92,246,0.45);" :style="{ width: ramCacP + '%' }"></div>
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
            <span class="text-zinc-500">Free <b class="text-zinc-200">{{ (viewingDevice.ramGb - simRam).toFixed(1) }}GB</b></span>
          </div>
        </div>
      </div>

      <!-- ── GPU ── -->
      <div class="px-5 pb-2 flex items-center justify-between">
        <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">gpu</p>
        <span class="text-[10px] font-mono font-bold text-amber-400">{{ simGpu }}% · {{ simTemp }}°C</span>
      </div>
      <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
        style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
        <div class="px-4 py-3.5 flex items-center gap-4">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);">
            <Layers :size="19" class="text-amber-400" :stroke-width="1.8" />
          </div>
          <div class="flex-1">
            <p class="text-[13px] font-black font-mono text-zinc-200">{{ viewingDevice.gpuName }}</p>
            <p class="text-[10px] font-mono text-zinc-600 mt-0.5">{{ viewingDevice.gpuVram }} VRAM</p>
          </div>
        </div>
        <div class="border-t border-white/5 px-4 py-3 grid grid-cols-3 gap-4">
          <div v-for="gm in gpuMetrics" :key="gm.label" class="flex flex-col gap-1">
            <span class="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{{ gm.label }}</span>
            <span class="text-[15px] font-black font-mono" :style="{ color: gm.color }">{{ gm.value }}</span>
            <div class="h-1 rounded-full overflow-hidden" style="background:rgba(255,255,255,0.06)">
              <div class="h-full rounded-full transition-all duration-700" :style="{ width: gm.pct + '%', background: gm.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── PROCESSES ── -->
      <div class="px-5 pb-2">
        <p class="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">top_processes</p>
      </div>
      <div class="mx-4 mb-4 rounded-2xl overflow-hidden"
        style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
        <div class="flex items-center px-4 py-2 border-b border-white/5">
          <span class="text-[9px] font-mono font-bold text-zinc-700 flex-1">PROCESS</span>
          <span class="text-[9px] font-mono font-bold text-zinc-700 w-12 text-right">CPU%</span>
          <span class="text-[9px] font-mono font-bold text-zinc-700 w-14 text-right">MEM</span>
        </div>
        <div v-for="(proc, i) in topProcesses" :key="proc.name"
          :class="['flex items-center px-4 py-2.5', i < topProcesses.length - 1 ? 'border-b border-white/5' : '']">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="w-5 h-5 rounded flex items-center justify-center text-[11px] flex-shrink-0"
              style="background:rgba(255,255,255,0.04)">{{ proc.icon }}</span>
            <span class="text-[12px] font-mono font-bold text-zinc-300 truncate">{{ proc.name }}</span>
          </div>
          <span class="text-[12px] font-mono font-black w-12 text-right"
            :style="{ color: proc.cpu > 20 ? '#f87171' : proc.cpu > 10 ? '#fb923c' : '#34d399' }">{{ proc.cpu }}%</span>
          <span class="text-[11px] font-mono text-zinc-500 w-14 text-right">{{ proc.mem }}</span>
        </div>
      </div>

      <!-- ── NETWORK ── -->
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

    <div class="h-4"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  Monitor, MonitorOff, Zap, ChevronLeft, Trash2,
  Cpu, MemoryStick, Layers, Thermometer, ArrowDown, ArrowUp,
  Activity, HardDrive, FlaskConical, Server, Globe, Shield,
} from 'lucide-vue-next'
import { settings, orbLog } from '../composables/useStore'
import { tcpConnected, tcpPort } from '../composables/useTcp'
import { devMode, toggleDevMode } from '../composables/useDevMode'
import { devices, onlineDevices, removeDevice, type Device } from '../composables/useDevices'
import { useNav } from '../composables/useNav'

const accent = computed(() => settings.value.accentColor)
const { navParams } = useNav()

// ── Device selection ────────────────────────────────────────
const viewingDeviceId = ref<string | null>(navParams.value.deviceId ?? null)

// If navigated with a deviceId param, open that device immediately
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
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Features list ────────────────────────────────────────────
const features = [
  { icon: Cpu,         label: 'CPU Usage',   sub: 'Per-core utilization & frequency', color: '#34d399' },
  { icon: MemoryStick, label: 'Memory',      sub: 'Active, cached & free RAM',        color: '#8b5cf6' },
  { icon: Layers,      label: 'GPU',         sub: 'GPU load, VRAM & temperature',     color: '#f59e0b' },
  { icon: Activity,    label: 'Processes',   sub: 'Top CPU & memory consumers',       color: '#60a5fa' },
  { icon: ArrowDown,   label: 'Network I/O', sub: 'Real-time bandwidth monitor',      color: '#34d399' },
  { icon: HardDrive,   label: 'Disk I/O',    sub: 'Read/write throughput',            color: '#fb923c' },
]

// ── Device specs row ─────────────────────────────────────────
const deviceSpecs = computed(() => {
  if (!viewingDevice.value) return []
  const d = viewingDevice.value
  return [
    { label: 'CPU',  value: d.cores + ' cores' },
    { label: 'RAM',  value: d.ramGb + ' GB'    },
    { label: 'GPU',  value: d.gpuVram + ' VRAM' },
  ]
})

// ══════════════════════════════════════════════════════════
// SIMULATION (per-device, starts when viewing a device)
// ══════════════════════════════════════════════════════════

const GW = 60

const simCpu  = ref(0)
const simRam  = ref(0)
const simGpu  = ref(0)
const simTemp = ref(0)
const netDown = ref('0.0')
const netUp   = ref('0.0')
const coreUsage = ref<number[]>([0, 0, 0, 0, 0, 0, 0, 0])

const cpuHist  = ref<number[]>([])
const ramHist  = ref<number[]>([])

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
  const fx = pts[0].split(',')[0], lx = pts[pts.length-1].split(',')[0]
  return line + ` L ${lx},${h} L ${fx},${h} Z`
}

const cpuColor = computed(() => simCpu.value > 70 ? '#f87171' : simCpu.value > 45 ? '#fb923c' : '#34d399')
const cpuLine  = computed(() => buildPath(cpuHist.value, 100, 48, false))
const cpuFill  = computed(() => buildPath(cpuHist.value, 100, 48, true))

const ramActP  = computed(() => (simRam.value * 0.55 / (viewingDevice.value?.ramGb ?? 32)) * 100)
const ramCacP  = computed(() => (simRam.value * 0.30 / (viewingDevice.value?.ramGb ?? 32)) * 100)

function coreColor(v: number) { return v > 70 ? '#f87171' : v > 45 ? '#fb923c' : '#34d399' }

const topMetrics = computed(() => {
  const d = viewingDevice.value
  if (!d) return []
  return [
    { label: 'CPU', icon: Cpu, value: simCpu.value + '%', sub: `${d.cores} cores · ${coreUsage.value.filter(c => c > 50).length} busy`, pct: simCpu.value, color: cpuColor.value },
    { label: 'RAM', icon: MemoryStick, value: simRam.value.toFixed(1) + 'G', sub: `of ${d.ramGb}GB · ${Math.round(simRam.value/d.ramGb*100)}% used`, pct: (simRam.value/d.ramGb)*100, color: '#8b5cf6' },
    { label: 'GPU', icon: Layers, value: simGpu.value + '%', sub: `${simTemp.value}°C · ${d.gpuVram}`, pct: simGpu.value, color: '#f59e0b' },
    { label: 'TEMP', icon: Thermometer, value: simTemp.value + '°', sub: `GPU pkg`, pct: Math.min(100,(simTemp.value/90)*100), color: simTemp.value > 75 ? '#f87171' : simTemp.value > 60 ? '#fb923c' : '#34d399' },
  ]
})

const gpuMetrics = computed(() => [
  { label: 'Load', value: simGpu.value + '%', pct: simGpu.value, color: '#f59e0b' },
  { label: 'VRAM', value: '4.1GB', pct: 34, color: '#f59e0b' },
  { label: 'Temp', value: simTemp.value + '°C', pct: (simTemp.value/90)*100, color: simTemp.value > 75 ? '#f87171' : '#fb923c' },
])

const topProcesses = ref([
  { icon: '💻', name: 'node',       cpu: 0, mem: '0MB' },
  { icon: '🌐', name: 'chrome',     cpu: 0, mem: '0MB' },
  { icon: '⚡', name: 'vscode',     cpu: 0, mem: '0MB' },
  { icon: '🐳', name: 'docker',     cpu: 0, mem: '0MB' },
  { icon: '🔮', name: 'orb-daemon', cpu: 0, mem: '0MB' },
])

let simTimer: ReturnType<typeof setInterval> | null = null
let cpuT = 35, ramT = 18, gpuT = 28, tempT = 58, ndT = 1.2, nuT = 0.4, tick = 0

function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t) }

function simTick() {
  tick++
  if (tick % 4 === 0) {
    cpuT = Math.max(5,  Math.min(88, cpuT  + (Math.random()-0.45)*14))
    gpuT = Math.max(5,  Math.min(75, gpuT  + (Math.random()-0.48)*9))
    ndT  = Math.max(0.1, Math.min(9, ndT   + (Math.random()-0.5)*1.4))
    nuT  = Math.max(0.1, Math.min(5, nuT   + (Math.random()-0.5)*0.7))
  }
  if (tick % 8 === 0) {
    const rMax = viewingDevice.value?.ramGb ?? 32
    ramT  = Math.max(4, Math.min(rMax * 0.88, ramT  + (Math.random()-0.4)*1.8))
    tempT = Math.max(42, Math.min(80,         tempT + (Math.random()-0.5)*2.5))
  }
  simCpu.value   = lerp(simCpu.value,  cpuT,  0.3)
  simRam.value   = parseFloat((simRam.value + (ramT - simRam.value) * 0.1).toFixed(1))
  simGpu.value   = lerp(simGpu.value,  gpuT,  0.25)
  simTemp.value  = lerp(simTemp.value, tempT, 0.1)
  netDown.value  = (ndT + (Math.random()-0.5)*0.3).toFixed(1)
  netUp.value    = (nuT + (Math.random()-0.5)*0.2).toFixed(1)
  coreUsage.value = coreUsage.value.map((c, i) => lerp(c, Math.max(1, Math.min(96, cpuT + (Math.random()-0.5)*28 + (i%3===0?8:-4))), 0.35))
  topProcesses.value = topProcesses.value.map((p, i) => ({
    ...p,
    cpu: Math.max(0, Math.round(simCpu.value * [0.3,0.22,0.18,0.12,0.05][i] + (Math.random()-0.5)*3)),
    mem: `${Math.round([178,644,315,205,43][i] + (Math.random()-0.5)*28)}MB`,
  }))
  pushH(cpuHist, simCpu.value)
  pushH(ramHist, simRam.value)
}

function startSim() {
  stopSim()
  const d = viewingDevice.value
  if (!d) return
  simCpu.value   = 30; simRam.value  = d.ramGb * 0.52
  simGpu.value   = 22; simTemp.value = 53
  coreUsage.value = Array.from({ length: d.cores }, () => Math.round(20 + Math.random()*40))
  simTimer = setInterval(simTick, 1000)
  orbLog(`Monitoring ${d.name} (simulated)`)
}

function stopSim() {
  if (simTimer) { clearInterval(simTimer); simTimer = null }
}

watch(viewingDeviceId, (id) => {
  stopSim()
  cpuHist.value = []; ramHist.value = []
  if (id && devices.value.find(d => d.id === id)?.online) startSim()
}, { immediate: true })

onUnmounted(stopSim)
</script>

<style scoped>
.devkit-root { background:#060810; min-height:100%; }
@keyframes dev-spin-cw  { from{transform:rotate(0deg)}   to{transform:rotate(360deg)}  }
</style>