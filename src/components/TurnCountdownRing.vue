<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  secondsLeft: number
  totalSeconds: number
  tone: 'normal' | 'warning' | 'critical'
}>()

const dashOffset = computed(() => {
  if (props.totalSeconds <= 0) return 100
  const fraction = Math.min(1, Math.max(0, props.secondsLeft / props.totalSeconds))
  return 100 - fraction * 100
})
</script>

<template>
  <div
    class="turn-timer-ring"
    :data-tone="tone"
    role="timer"
    :aria-label="`${String(secondsLeft)} seconds remaining`"
  >
    <svg viewBox="0 0 52 52" aria-hidden="true">
      <circle class="turn-timer-track" cx="26" cy="26" r="22" pathLength="100" />
      <circle
        class="turn-timer-progress"
        cx="26"
        cy="26"
        r="22"
        pathLength="100"
        :style="{ strokeDashoffset: dashOffset }"
      />
    </svg>
    <span class="turn-timer-value">{{ secondsLeft }}</span>
    <span class="turn-timer-unit">Sec</span>
  </div>
</template>

<style scoped>
.turn-timer-ring {
  position: relative;
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
  place-content: center;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--surface-sunken) 88%, transparent);
  box-shadow: inset 0 0 1rem rgb(0 4 14 / 0.28), 0 0 1rem var(--color-accent-soft);
  text-align: center;
}

.turn-timer-ring svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  transform: rotate(-90deg);
}

.turn-timer-track,
.turn-timer-progress {
  fill: none;
  stroke-width: 3;
}

.turn-timer-track {
  stroke: var(--color-border);
}

.turn-timer-progress {
  stroke: var(--color-accent);
  stroke-dasharray: 100;
  stroke-linecap: round;
  filter: drop-shadow(0 0 0.18rem var(--color-accent-glow));
  transition: stroke 250ms ease-out, stroke-dashoffset 1000ms linear;
}

.turn-timer-ring[data-tone='warning'] .turn-timer-progress {
  stroke: var(--color-warning);
}

.turn-timer-ring[data-tone='critical'] .turn-timer-progress {
  stroke: var(--color-error);
}

.turn-timer-ring[data-tone='critical'] {
  animation: turn-timer-critical 800ms ease-in-out infinite;
}

.turn-timer-value {
  color: var(--text-foreground);
  font-size: var(--text-body);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.turn-timer-unit {
  margin-top: 0.15rem;
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: 700;
  letter-spacing: 0.1em;
  line-height: 1;
  text-transform: uppercase;
}

@keyframes turn-timer-critical {
  0%, 100% { box-shadow: inset 0 0 1rem rgb(0 4 14 / 0.28), 0 0 0.7rem rgb(239 68 68 / 0.1); }
  50% { box-shadow: inset 0 0 1rem rgb(0 4 14 / 0.28), 0 0 1.15rem rgb(239 68 68 / 0.28); }
}

@media (prefers-reduced-motion: reduce) {
  .turn-timer-ring,
  .turn-timer-progress {
    animation: none;
    transition: none;
  }
}
</style>
