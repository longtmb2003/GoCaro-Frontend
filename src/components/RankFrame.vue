<script setup lang="ts">
import { computed } from 'vue'

import { getRankTier } from '@/config/ranks'
import RankCrest from './RankCrest.vue'

const props = withDefaults(
  defineProps<{
    elo: number
    /** Kept for API compatibility with existing identity cards. */
    initial: string
    size?: 'sm' | 'md' | 'game' | 'lg' | 'xl'
    countdownFraction?: number | null
    countdownTone?: 'normal' | 'warning' | 'critical'
  }>(),
  {
    size: 'lg',
    countdownFraction: null,
    countdownTone: 'normal',
  },
)

const tier = computed(() => getRankTier(props.elo))

const countdownDashOffset = computed(() => {
  if (props.countdownFraction === null) return 100
  const fraction = Math.min(1, Math.max(0, props.countdownFraction))
  return 100 - fraction * 100
})
</script>

<template>
  <div class="rank-frame" :data-size="size" :data-tier="tier.name.toLowerCase()">
    <svg
      v-if="countdownFraction !== null"
      class="rank-countdown-ring"
      :data-tone="countdownTone"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <path
        class="rank-countdown-track"
        d="M50 3 85 19 97 50 85 81 50 97 15 81 3 50 15 19Z"
        pathLength="100"
      />
      <path
        class="rank-countdown-progress"
        d="M50 3 85 19 97 50 85 81 50 97 15 81 3 50 15 19Z"
        pathLength="100"
        :style="{ strokeDashoffset: countdownDashOffset }"
      />
    </svg>

    <RankCrest class="rank-frame__crest" :tier="tier.name" />
  </div>
</template>

<style scoped>
.rank-frame {
  position: relative;
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  flex: 0 0 auto;
  place-items: center;
}

.rank-frame[data-size='sm'] {
  width: 2rem;
  height: 2rem;
}
.rank-frame[data-size='md'] {
  width: 2.75rem;
  height: 2.75rem;
}
.rank-frame[data-size='game'] {
  width: 3.75rem;
  height: 3.75rem;
}
.rank-frame[data-size='lg'] {
  width: 4.75rem;
  height: 4.75rem;
}
.rank-frame[data-size='xl'] {
  width: 6.5rem;
  height: 6.5rem;
}

.rank-frame__crest {
  position: relative;
  z-index: 1;
}

.rank-countdown-ring {
  position: absolute;
  inset: -0.125rem;
  z-index: 2;
  width: calc(100% + 0.25rem);
  height: calc(100% + 0.25rem);
  overflow: visible;
  pointer-events: none;
  transform: rotate(-90deg);
}

.rank-countdown-track,
.rank-countdown-progress {
  fill: none;
  stroke-width: 3;
  stroke-linejoin: round;
}

.rank-countdown-track {
  stroke: color-mix(in srgb, var(--color-rank-gold) 32%, transparent);
}

.rank-countdown-progress {
  stroke: var(--color-accent);
  stroke-dasharray: 100;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  filter: drop-shadow(0 0 0.25rem var(--color-accent-glow));
  transition:
    stroke var(--transition-duration-normal) ease-out,
    stroke-dashoffset 1000ms linear;
}

.rank-countdown-ring[data-tone='warning'] .rank-countdown-progress {
  stroke: var(--color-warning);
}

.rank-countdown-ring[data-tone='critical'] .rank-countdown-progress {
  stroke: var(--color-error);
  animation: countdown-ring-critical 800ms ease-in-out infinite;
}

@keyframes countdown-ring-critical {
  0%,
  100% {
    opacity: 0.76;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rank-countdown-progress {
    transition: none;
  }
  .rank-countdown-ring[data-tone='critical'] .rank-countdown-progress {
    animation: none;
  }
}
</style>
