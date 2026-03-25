<template>
  <!-- Floating status pill — shown on env, vibecode, passwords pages -->
  <Teleport to="body">
    <Transition name="daemon-pill">
      <div v-if="visible"
        class="fixed z-[500] flex items-center gap-2 px-3.5 py-2 rounded-2xl"
        :style="pillStyle"
        style="bottom:calc(90px + env(safe-area-inset-bottom));right:16px;backdrop-filter:blur(20px);">

        <!-- Status dot -->
        <div class="w-2 h-2 rounded-full flex-shrink-0"
          :class="connected ? 'animate-pulse' : ''"
          :style="{ background: connected ? '#34d399' : '#ef4444' }">
        </div>

        <!-- Label -->
        <span class="text-[11px] font-mono font-bold"
          :style="{ color: connected ? '#34d399' : '#f87171' }">
          {{ connected ? `daemon · ${latency != null ? latency + 'ms' : 'live'}` : 'daemon · offline' }}
        </span>

        <!-- Sync button (when connected) -->
        <button v-if="connected && showSync"
          @click="doSync"
          :disabled="syncing"
          class="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-black active:scale-90 transition-all"
          :style="{ background: accent + '20', border: `1px solid ${accent}33`, color: accent }"
          :class="syncing ? 'opacity-60' : ''">
          <ArrowUpDown :size="11" :stroke-width="2.5" :class="syncing ? 'animate-spin' : ''" />
          {{ syncing ? 'syncing' : 'sync' }}
        </button>

        <!-- Pair button (when disconnected) -->
        <button v-else-if="!connected"
          @click="$emit('open-pair')"
          class="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-black active:scale-90"
          style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.2);color:#f87171;">
          <Link :size="11" :stroke-width="2.5" />
          pair
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowUpDown, Link } from 'lucide-vue-next'
import { settings } from '../composables/useStore'
import { useDaemon } from '../composables/useDaemon'

const props = defineProps<{
  visible?: boolean
  showSync?: boolean
  onSync?: () => Promise<void>
}>()

const emit = defineEmits<{
  'open-pair': []
  'sync-done': []
}>()

const { connected, latency } = useDaemon()
const accent = computed(() => settings.value.accentColor)
const syncing = ref(false)

const pillStyle = computed(() => ({
  background: connected.value
    ? 'rgba(6, 22, 14, 0.85)'
    : 'rgba(22, 6, 6, 0.85)',
  border: connected.value
    ? '1px solid rgba(52, 211, 153, 0.2)'
    : '1px solid rgba(239, 68, 68, 0.2)',
}))

async function doSync() {
  if (!props.onSync || syncing.value) return
  syncing.value = true
  try {
    await props.onSync()
    emit('sync-done')
  } finally {
    syncing.value = false
  }
}
</script>

<style scoped>
.daemon-pill-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.1, 0.64, 1); }
.daemon-pill-leave-active { transition: all 0.2s ease; }
.daemon-pill-enter-from   { opacity: 0; transform: translateY(12px) scale(0.9); }
.daemon-pill-leave-to     { opacity: 0; transform: translateY(8px) scale(0.95); }
</style>