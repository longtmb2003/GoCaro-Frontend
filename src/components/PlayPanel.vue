<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'
import type { MatchmakingMode } from '@/types/game'

withDefaults(defineProps<{ isGuest?: boolean }>(), { isGuest: false })

const emit = defineEmits<{ play: [mode: MatchmakingMode]; upgrade: [] }>()
</script>

<template>
  <section aria-label="Play">
    <div class="mb-4 flex items-center gap-2">
      <h2 class="text-foreground text-lg font-bold flex items-center gap-2">
        <span class="text-2xl animate-pulse">⚔️</span> Ready for Battle?
      </h2>
      <div class="h-px flex-1 bg-gradient-to-r from-border-subtle to-transparent ml-2"></div>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Ranked Card -->
      <button
        class="cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 p-6 text-left shadow-card ring-1 ring-white/20 transition-all hover:-translate-y-1 hover:shadow-floating group"
        :aria-describedby="isGuest ? 'ranked-locked' : undefined"
        @click="isGuest ? emit('upgrade') : emit('play', 'ranked')"
      >
        <div class="absolute -right-4 -top-4 text-6xl opacity-20 transition-transform group-hover:scale-110 group-hover:rotate-12">🏆</div>
        <h3 class="text-xl font-bold text-white drop-shadow-sm">Ranked</h3>
        <p class="mt-1 text-xs font-medium text-white/90">Play for ELO rating</p>
        
        <BaseBadge v-if="isGuest" id="ranked-locked" variant="neutral" class="mt-3">
          🔒 Sign in required
        </BaseBadge>
      </button>

      <!-- Casual Card -->
      <button
        class="cursor-pointer relative overflow-hidden rounded-2xl bg-surface-elevated p-6 text-left shadow-card ring-1 ring-border-subtle transition-all hover:-translate-y-1 hover:shadow-floating hover:bg-surface/80 group"
        @click="emit('play', 'casual')"
      >
        <div class="absolute -right-4 -top-4 text-6xl opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-12">😊</div>
        <h3 class="text-xl font-bold text-foreground drop-shadow-sm">Casual</h3>
        <p class="mt-1 text-xs font-medium text-foreground-muted">Just for fun, no pressure</p>
        
        <BaseBadge variant="primary" class="mt-3">🎮 Practice mode</BaseBadge>
      </button>
    </div>
  </section>
</template>
