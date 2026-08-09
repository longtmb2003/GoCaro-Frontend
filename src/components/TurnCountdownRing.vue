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

const displaySeconds = computed(() =>
  String(Math.max(0, Math.ceil(props.secondsLeft))).padStart(2, '0'),
)
</script>

<template>
  <div
    class="turn-timer-ring"
    :data-tone="tone"
    role="timer"
    :aria-label="`${String(secondsLeft)} seconds remaining`"
  >
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle class="turn-timer-track" cx="24" cy="24" r="20" pathLength="100" />
      <circle
        class="turn-timer-progress"
        cx="24"
        cy="24"
        r="20"
        pathLength="100"
        :style="{ strokeDashoffset: dashOffset }"
      />
    </svg>
    <span class="turn-timer-value">{{ displaySeconds }}</span>
    <span class="turn-timer-marker" aria-hidden="true"></span>
  </div>
</template>

<style scoped>
.turn-timer-ring {
  position: relative;
  isolation: isolate;
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--color-border-strong) 78%, transparent);
  border-radius: var(--radius-pill);
  background:
    radial-gradient(
      circle at 50% 38%,
      color-mix(in srgb, var(--surface-4) 74%, transparent),
      transparent 64%
    ),
    color-mix(in srgb, var(--surface-sunken) 94%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--text-foreground) 8%, transparent),
    inset 0 -2px 0 color-mix(in srgb, var(--surface-background) 72%, transparent),
    0 0.2rem 0.45rem color-mix(in srgb, var(--surface-background) 46%, transparent);
  text-align: center;
}

.turn-timer-ring::before {
  position: absolute;
  z-index: 0;
  inset: 0.2rem;
  border: 1px solid color-mix(in srgb, var(--color-border) 58%, transparent);
  border-radius: inherit;
  content: '';
  pointer-events: none;
}

.turn-timer-ring svg {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  transform: rotate(-90deg);
}

.turn-timer-track,
.turn-timer-progress {
  fill: none;
  stroke-width: 2.25;
  vector-effect: non-scaling-stroke;
}

.turn-timer-track {
  stroke: color-mix(in srgb, var(--color-border) 64%, transparent);
}

.turn-timer-progress {
  stroke: var(--color-accent);
  stroke-dasharray: 100;
  stroke-linecap: round;
  filter: drop-shadow(
    0 0 0.08rem color-mix(in srgb, var(--color-accent-glow) 44%, transparent)
  );
  transition:
    stroke var(--transition-duration-normal) ease-out,
    stroke-dashoffset 1000ms linear;
}

.turn-timer-ring[data-tone='warning'] .turn-timer-progress {
  stroke: var(--color-warning);
}

.turn-timer-ring[data-tone='critical'] .turn-timer-progress {
  stroke: var(--color-error);
}

.turn-timer-value {
  position: relative;
  z-index: 2;
  color: var(--text-foreground);
  font-size: var(--text-body);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  line-height: 1;
  text-shadow: 0 1px 0 var(--surface-background);
  transition: color var(--transition-duration-normal) ease-out;
}

.turn-timer-ring[data-tone='warning'] .turn-timer-value {
  color: var(--color-warning);
}

.turn-timer-ring[data-tone='critical'] .turn-timer-value {
  color: var(--color-error);
}

.turn-timer-marker {
  position: absolute;
  z-index: 3;
  top: -0.1rem;
  left: 50%;
  width: 0.3rem;
  height: 0.3rem;
  border: 1px solid color-mix(in srgb, var(--color-accent) 54%, var(--color-border-strong));
  background: var(--surface-4);
  transform: translateX(-50%) rotate(45deg);
}

.turn-timer-ring[data-tone='warning'] .turn-timer-marker {
  border-color: var(--color-warning);
}

.turn-timer-ring[data-tone='critical'] .turn-timer-marker {
  border-color: var(--color-error);
}

@media (prefers-reduced-motion: reduce) {
  .turn-timer-progress {
    transition: none;
  }
}
</style>
