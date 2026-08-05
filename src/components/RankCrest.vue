<script setup lang="ts">
import { computed, useId } from 'vue'

import type { RankName } from '@/config/ranks'

const props = withDefaults(
  defineProps<{
    tier: RankName
    decorative?: boolean
  }>(),
  { decorative: false },
)

const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const metalId = `rank-metal-${rawId}`
const gemId = `rank-gem-${rawId}`
const ariaLabel = computed(() => (props.decorative ? undefined : `${props.tier} rank crest`))
</script>

<template>
  <svg
    class="rank-crest"
    :data-tier="tier.toLowerCase()"
    viewBox="0 0 180 180"
    :role="decorative ? undefined : 'img'"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="ariaLabel"
  >
    <defs>
      <linearGradient :id="metalId" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--rank-highlight)" />
        <stop offset="0.42" stop-color="var(--rank-primary)" />
        <stop offset="1" stop-color="var(--rank-shadow)" />
      </linearGradient>
      <radialGradient :id="gemId" cx="35%" cy="25%" r="78%">
        <stop offset="0" stop-color="white" />
        <stop offset="0.28" stop-color="var(--rank-gem)" />
        <stop offset="1" stop-color="var(--rank-shadow)" />
      </radialGradient>
    </defs>

    <g class="rank-crest__wings" :fill="`url(#${metalId})`" stroke="var(--rank-highlight)">
      <path
        d="M75 67C54 47 31 38 13 42c13 7 22 16 26 28-11-6-22-7-32-4 13 10 22 22 28 37-8-2-16-1-23 3 18 13 37 17 57 12l16-34Z"
      />
      <path
        d="M105 67c21-20 44-29 62-25-13 7-22 16-26 28 11-6 22-7 32-4-13 10-22 22-28 37 8-2 16-1 23 3-18 13-37 17-57 12L95 84Z"
      />
    </g>
    <g class="rank-crest__wing-lines" fill="none" stroke="var(--rank-shadow)">
      <path d="M66 72 28 51M62 84 21 72M61 97l-34 10M114 72l38-21M118 84l41-12M119 97l34 10" />
    </g>

    <path
      class="rank-crest__crown"
      :fill="`url(#${metalId})`"
      d="m66 49 12-18 12 14 12-14 12 18-8 18H74Z"
    />
    <path
      class="rank-crest__frame"
      :fill="`url(#${metalId})`"
      d="M90 47 130 70l-7 52-33 35-33-35-7-52Z"
    />
    <path class="rank-crest__frame-inset" d="m90 57 29 17-5 42-24 27-24-27-5-42Z" />
    <path
      class="rank-crest__gem"
      :fill="`url(#${gemId})`"
      d="m90 67 20 15-7 37-13 14-13-14-7-37Z"
    />
    <path class="rank-crest__gem-light" d="m90 72 5 49-5 7-5-7Z" />

    <g class="rank-crest__mark" fill="none" stroke="var(--rank-mark)">
      <path d="M82 91h16M90 83v34" />
      <path d="m80 105 10 12 10-12" />
    </g>
    <circle class="rank-crest__rivet" cx="57" cy="79" r="2.5" />
    <circle class="rank-crest__rivet" cx="123" cy="79" r="2.5" />
    <path
      class="rank-crest__base"
      :fill="`url(#${metalId})`"
      d="m65 130 25 28 25-28-7 27-18 15-18-15Z"
    />
  </svg>
</template>

<style scoped>
.rank-crest {
  --rank-primary: var(--color-rank-iron);
  --rank-highlight: color-mix(in srgb, var(--color-rank-iron) 48%, white);
  --rank-shadow: color-mix(in srgb, var(--color-rank-iron) 62%, black);
  --rank-gem: var(--color-rank-iron);
  --rank-mark: color-mix(in srgb, var(--color-rank-silver) 78%, white);
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 0.375rem 0.25rem rgb(0 0 0 / 0.52))
    drop-shadow(0 0 0.55rem color-mix(in srgb, var(--rank-primary) 34%, transparent));
}

.rank-crest[data-tier='bronze'] {
  --rank-primary: var(--color-rank-bronze);
  --rank-highlight: color-mix(in srgb, var(--color-rank-bronze) 58%, white);
  --rank-shadow: color-mix(in srgb, var(--color-rank-bronze) 62%, black);
  --rank-gem: color-mix(in srgb, var(--color-rank-bronze) 74%, var(--color-warning));
  --rank-mark: color-mix(in srgb, var(--color-rank-gold-warm) 76%, white);
}

.rank-crest[data-tier='silver'] {
  --rank-primary: var(--color-rank-silver);
  --rank-highlight: color-mix(in srgb, var(--color-rank-silver) 46%, white);
  --rank-shadow: color-mix(in srgb, var(--color-rank-silver) 58%, black);
  --rank-gem: color-mix(in srgb, var(--color-rank-silver) 68%, var(--color-fantasy-blue));
  --rank-mark: white;
}

.rank-crest[data-tier='gold'] {
  --rank-primary: var(--color-rank-gold);
  --rank-highlight: color-mix(in srgb, var(--color-rank-gold-warm) 54%, white);
  --rank-shadow: color-mix(in srgb, var(--color-rank-gold) 60%, black);
  --rank-gem: var(--color-rank-gold-warm);
  --rank-mark: white;
}

.rank-crest[data-tier='diamond'] {
  --rank-primary: var(--color-rank-diamond);
  --rank-highlight: color-mix(in srgb, var(--color-rank-diamond) 45%, white);
  --rank-shadow: color-mix(in srgb, var(--color-primary-700) 70%, black);
  --rank-gem: var(--color-rank-diamond);
  --rank-mark: white;
}

.rank-crest__wings {
  stroke-width: 1.25;
  stroke-linejoin: round;
}
.rank-crest__wing-lines {
  stroke-width: 1.4;
  stroke-linecap: round;
  opacity: 0.58;
}

.rank-crest__crown,
.rank-crest__frame,
.rank-crest__base {
  stroke: var(--rank-highlight);
  stroke-width: 1.25;
  stroke-linejoin: round;
}

.rank-crest__frame-inset {
  fill: var(--color-rank-panel-deep);
  stroke: var(--rank-shadow);
  stroke-width: 2;
}
.rank-crest__gem {
  stroke: var(--rank-highlight);
  stroke-width: 1.5;
}
.rank-crest__gem-light {
  fill: color-mix(in srgb, var(--rank-highlight) 52%, transparent);
}

.rank-crest__mark {
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 0.25rem var(--rank-primary));
}

.rank-crest__rivet {
  fill: var(--rank-highlight);
  filter: drop-shadow(0 0 0.18rem var(--rank-primary));
}

.rank-crest[data-tier='diamond'] .rank-crest__gem {
  animation: rank-gem-pulse 3.5s ease-in-out infinite;
}

@keyframes rank-gem-pulse {
  0%,
  100% {
    filter: drop-shadow(0 0 0.2rem color-mix(in srgb, var(--rank-primary) 42%, transparent));
  }
  50% {
    filter: drop-shadow(0 0 0.65rem color-mix(in srgb, var(--rank-primary) 72%, transparent));
  }
}

@media (prefers-reduced-motion: reduce) {
  .rank-crest[data-tier='diamond'] .rank-crest__gem {
    animation: none;
  }
}
</style>
