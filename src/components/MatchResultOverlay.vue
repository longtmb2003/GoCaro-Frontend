<script setup lang="ts">
import { HeartCrack, Trophy } from 'lucide-vue-next'

defineProps<{
  outcome: 'win' | 'loss'
  countdown: number
  showCountdown: boolean
}>()
</script>

<template>
  <div
    class="match-result-overlay"
    :class="`match-result-overlay-${outcome}`"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <div class="match-result-heading">
      <Trophy v-if="outcome === 'win'" :size="20" aria-hidden="true" />
      <HeartCrack v-else :size="20" aria-hidden="true" />
      <strong>{{ outcome === 'win' ? 'VICTORY' : 'DEFEAT' }}</strong>
    </div>
    <p class="match-result-detail">
      {{ outcome === 'win' ? '5 in a row' : 'Opponent completed 5 in a row' }}
    </p>
    <p v-if="showCountdown" class="match-result-countdown">Opening match result in {{ countdown }}...</p>
  </div>
</template>

<style scoped>
.match-result-overlay {
  position: absolute;
  z-index: 4;
  top: 0.25rem;
  left: 50%;
  width: min(22rem, calc(100% - 2rem));
  border: 1px solid color-mix(in srgb, var(--color-accent) 42%, var(--color-border-strong));
  border-top-color: color-mix(in srgb, var(--color-warning) 72%, var(--color-border-strong));
  border-radius: var(--radius-card);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-4) 84%, transparent), var(--surface-glass-strong));
  box-shadow: var(--shadow-floating), inset 0 1px 0 rgb(255 255 255 / 0.1);
  padding: 0.65rem 1rem;
  pointer-events: none;
  text-align: center;
  transform: translateX(-50%);
  animation: match-result-enter 350ms ease-out both;
  -webkit-backdrop-filter: blur(var(--blur-md));
  backdrop-filter: blur(var(--blur-md));
}

.match-result-heading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-success);
  font-size: var(--text-card);
  letter-spacing: 0.14em;
}

.match-result-overlay-loss .match-result-heading {
  color: var(--color-danger-400);
}

.match-result-detail,
.match-result-countdown {
  margin-top: 0.15rem;
  color: var(--text-secondary);
  font-size: var(--text-caption);
  font-weight: 600;
}

.match-result-countdown {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

@keyframes match-result-enter {
  from { opacity: 0; transform: translateX(-50%) scale(0.96); }
  to { opacity: 1; transform: translateX(-50%) scale(1); }
}

@media (max-width: 48rem) {
  .match-result-overlay {
    top: 0.15rem;
    padding: 0.5rem 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .match-result-overlay {
    animation: none;
  }
}
</style>
