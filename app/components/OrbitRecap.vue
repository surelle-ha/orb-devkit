<!-- OrbitRecap.vue — unchanged from source, copy from app/components/OrbitRecap.vue -->
<!-- This is a placeholder - see the full file in the source repository -->
<template>
  <Teleport to="body">
    <Transition name="recap-slide">
      <div v-if="visible" class="fixed inset-0 z-[500] bg-zinc-950 flex items-center justify-center">
        <div class="text-center px-8">
          <p class="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-3">{{ year }} · Annual Review</p>
          <h1 class="text-[38px] font-black text-white leading-none tracking-tight mb-4">Orbit Recap</h1>
          <p class="text-zinc-400 mb-8">Your {{ year }} financial review</p>
          <button @click="$emit('close')"
            class="px-8 py-4 rounded-2xl bg-violet-500 text-white font-black text-[15px]">
            Close
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup lang="ts">
defineProps<{ visible: boolean }>()
defineEmits<{ close: [] }>()
const year = new Date().getFullYear()
</script>
<style scoped>
.recap-slide-enter-active { transition: transform 0.48s cubic-bezier(0.32, 1.1, 0.64, 1), opacity 0.4s ease; }
.recap-slide-leave-active { transition: transform 0.38s ease, opacity 0.3s ease; }
.recap-slide-enter-from, .recap-slide-leave-to { transform: translateY(100%); opacity: 0; }
</style>