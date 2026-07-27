<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
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
      <!-- Ranked: the primary action, marked out by the accent fill. -->
      <GlassCard
        as="button"
        type="button"
        variant="interactive"
        class="from-primary-600 via-primary-500 to-secondary-500 cursor-pointer bg-gradient-to-br text-left"
        :aria-describedby="isGuest ? 'ranked-locked' : undefined"
        @click="isGuest ? emit('upgrade') : emit('play', 'ranked')"
      >
        <h3 class="text-card text-white">Ranked</h3>
        <p class="text-small mt-1 text-white/90">Play for ELO rating</p>

        <BaseBadge v-if="isGuest" id="ranked-locked" variant="neutral" class="mt-3">
          🔒 Sign in required
        </BaseBadge>
      </GlassCard>

      <!-- Casual: the secondary action, on the plain card surface. -->
      <GlassCard
        as="button"
        type="button"
        variant="interactive"
        class="cursor-pointer text-left"
        @click="emit('play', 'casual')"
      >
        <h3 class="text-card text-foreground">Casual</h3>
        <p class="text-small text-foreground-muted mt-1">Just for fun, no pressure</p>

        <BaseBadge variant="primary" class="mt-3">🎮 Practice mode</BaseBadge>
      </GlassCard>
    </div>
  </section>
</template>
