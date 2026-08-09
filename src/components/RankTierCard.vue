<script setup lang="ts">
import RankCrest from './RankCrest.vue'
import type { RankName } from '@/config/ranks'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { Coins } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    name: RankName
    displayName?: string
    minElo: number
    /** One-off payout for reaching this tier; 0 when the tier pays nothing. */
    rewardCoins?: number
  }>(),
  { displayName: undefined, rewardCoins: 0 },
)
const { t } = useAppLanguage()
</script>

<template>
  <li class="rank-tier-card" :data-tier="name.toLowerCase()">
    <span class="rank-tier-card__corner rank-tier-card__corner--top-left" aria-hidden="true" />
    <span class="rank-tier-card__corner rank-tier-card__corner--top-right" aria-hidden="true" />
    <span class="rank-tier-card__corner rank-tier-card__corner--bottom-left" aria-hidden="true" />
    <span class="rank-tier-card__corner rank-tier-card__corner--bottom-right" aria-hidden="true" />
    <span class="rank-tier-card__reflection" aria-hidden="true" />
    <span class="rank-tier-card__particle rank-tier-card__particle--one" aria-hidden="true" />
    <span class="rank-tier-card__particle rank-tier-card__particle--two" aria-hidden="true" />
    <span class="rank-tier-card__particle rank-tier-card__particle--three" aria-hidden="true" />

    <div class="rank-tier-card__crest">
      <RankCrest :tier="name" />
    </div>

    <div class="rank-tier-card__copy">
      <h3>{{ displayName ?? name }}</h3>
      <span class="rank-tier-card__rule" aria-hidden="true" />
      <p>{{ minElo }} {{ t('Elo and above', 'Elo trở lên') }}</p>
      <p v-if="rewardCoins > 0" class="rank-tier-card__reward">
        <Coins :size="13" aria-hidden="true" />
        <span>{{ t('One-time reward', 'Thưởng một lần') }}: +{{ rewardCoins }} {{ t('coins', 'xu') }}</span>
      </p>
    </div>

    <RankCrest class="rank-tier-card__watermark" :tier="name" decorative />
  </li>
</template>

<style scoped>
.rank-tier-card {
  --tier-color: var(--color-rank-iron);
  --tier-highlight: color-mix(in srgb, var(--color-rank-iron) 48%, white);
  position: relative;
  isolation: isolate;
  display: grid;
  min-height: 8rem;
  grid-template-columns: 7rem minmax(0, 1fr) 5rem;
  align-items: center;
  gap: 1rem;
  overflow: hidden;
  padding: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--tier-color) 56%, var(--color-rank-gold));
  background:
    radial-gradient(
      circle at 14% 40%,
      color-mix(in srgb, var(--tier-color) 16%, transparent),
      transparent 34%
    ),
    linear-gradient(
      112deg,
      color-mix(in srgb, var(--color-rank-panel) 94%, white),
      var(--color-rank-panel-deep) 72%
    );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--tier-highlight) 18%, transparent),
    inset 0 -0.25rem 0 rgb(0 0 0 / 0.18),
    inset 0 0 1.5rem rgb(0 4 14 / 0.28),
    var(--shadow-card);
  clip-path: polygon(
    0 var(--radius-md),
    var(--radius-md) 0,
    calc(100% - var(--radius-md)) 0,
    100% var(--radius-md),
    100% calc(100% - var(--radius-md)),
    calc(100% - var(--radius-md)) 100%,
    var(--radius-md) 100%,
    0 calc(100% - var(--radius-md))
  );
  transform: translateZ(0);
  transition:
    transform var(--transition-duration-normal) ease-out,
    border-color var(--transition-duration-normal) ease-out,
    box-shadow var(--transition-duration-normal) ease-out;
}

.rank-tier-card[data-tier='bronze'] {
  --tier-color: var(--color-rank-bronze);
  --tier-highlight: color-mix(in srgb, var(--color-rank-bronze) 55%, white);
}

.rank-tier-card[data-tier='silver'] {
  --tier-color: var(--color-rank-silver);
  --tier-highlight: color-mix(in srgb, var(--color-rank-silver) 52%, white);
}

.rank-tier-card[data-tier='gold'] {
  --tier-color: var(--color-rank-gold);
  --tier-highlight: color-mix(in srgb, var(--color-rank-gold-warm) 58%, white);
}

.rank-tier-card[data-tier='diamond'] {
  --tier-color: var(--color-rank-diamond);
  --tier-highlight: color-mix(in srgb, var(--color-rank-diamond) 50%, white);
}

.rank-tier-card::before {
  position: absolute;
  inset: 0.25rem;
  z-index: -1;
  border: 1px solid color-mix(in srgb, var(--tier-color) 20%, transparent);
  content: '';
  clip-path: inherit;
  pointer-events: none;
}

.rank-tier-card::after {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(
    105deg,
    transparent 22%,
    color-mix(in srgb, var(--tier-highlight) 13%, transparent) 48%,
    transparent 70%
  );
  content: '';
  opacity: 0;
  pointer-events: none;
  transform: translateX(-110%);
  animation: rank-card-shimmer 6s ease-in-out infinite;
}

.rank-tier-card:hover {
  border-color: color-mix(in srgb, var(--tier-highlight) 76%, var(--color-rank-gold));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--tier-highlight) 28%, transparent),
    inset 0 -0.25rem 0 rgb(0 0 0 / 0.22),
    0 1.25rem 2.25rem rgb(0 0 0 / 0.38),
    0 0 1.25rem color-mix(in srgb, var(--tier-color) 24%, transparent);
  transform: translateY(-0.25rem);
}

.rank-tier-card:hover::after {
  animation: rank-card-hover-shimmer 900ms ease-out;
}

.rank-tier-card__crest {
  position: relative;
  z-index: 2;
  width: 7rem;
  height: 7rem;
}
.rank-tier-card__copy {
  position: relative;
  z-index: 2;
  min-width: 0;
  text-align: center;
}

.rank-tier-card__copy h3 {
  color: var(--tier-highlight);
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-card);
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: var(--text-card--line-height);
  text-shadow:
    0 1px 0 black,
    0 0 0.65rem color-mix(in srgb, var(--tier-color) 36%, transparent);
  text-transform: uppercase;
}

.rank-tier-card__copy p {
  margin-top: 0.25rem;
  color: var(--color-foreground-secondary);
  font-size: var(--text-small);
  line-height: var(--text-small--line-height);
}

/* The payout is the reason to keep climbing, so it reads as gold against the
   muted Elo line rather than as another grey detail. */
.rank-tier-card__reward {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  margin-top: 0.35rem;
  color: var(--color-fantasy-gold);
  font-size: var(--text-caption);
  font-weight: 700;
  line-height: var(--text-caption--line-height);
  text-shadow: 0 1px 0 black;
}

.rank-tier-card__rule {
  display: block;
  width: min(100%, 8rem);
  height: 1px;
  margin: 0.25rem auto;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--tier-color) 70%, white),
    transparent
  );
}

.rank-tier-card__watermark {
  position: relative;
  z-index: 1;
  width: 6rem;
  height: 6rem;
  opacity: 0.06;
  transform: scale(1.2);
}

.rank-tier-card__corner {
  position: absolute;
  z-index: 3;
  width: 1rem;
  height: 1rem;
  border-color: color-mix(in srgb, var(--color-rank-gold) 76%, var(--tier-color));
  pointer-events: none;
}

.rank-tier-card__corner--top-left {
  top: 0.375rem;
  left: 0.375rem;
  border-top: 1px solid;
  border-left: 1px solid;
}
.rank-tier-card__corner--top-right {
  top: 0.375rem;
  right: 0.375rem;
  border-top: 1px solid;
  border-right: 1px solid;
}
.rank-tier-card__corner--bottom-left {
  bottom: 0.375rem;
  left: 0.375rem;
  border-bottom: 1px solid;
  border-left: 1px solid;
}
.rank-tier-card__corner--bottom-right {
  right: 0.375rem;
  bottom: 0.375rem;
  border-right: 1px solid;
  border-bottom: 1px solid;
}

.rank-tier-card__reflection {
  position: absolute;
  top: 0;
  left: 6%;
  width: 52%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--tier-highlight) 34%, transparent),
    transparent
  );
  pointer-events: none;
}

.rank-tier-card__particle {
  position: absolute;
  z-index: 1;
  width: 0.1875rem;
  height: 0.1875rem;
  border-radius: var(--radius-pill);
  background: var(--tier-highlight);
  box-shadow: 0 0 0.45rem var(--tier-color);
  opacity: 0;
  pointer-events: none;
  animation: rank-particle-drift 5s ease-in-out infinite;
}

.rank-tier-card__particle--one {
  top: 72%;
  left: 17%;
}
.rank-tier-card__particle--two {
  top: 28%;
  left: 54%;
  animation-delay: 1.4s;
}
.rank-tier-card__particle--three {
  top: 64%;
  right: 12%;
  animation-delay: 2.8s;
}

@keyframes rank-card-shimmer {
  0%,
  70%,
  100% {
    opacity: 0;
    transform: translateX(-110%);
  }
  8% {
    opacity: 1;
  }
  18% {
    opacity: 0;
    transform: translateX(110%);
  }
}

@keyframes rank-card-hover-shimmer {
  0% {
    opacity: 0;
    transform: translateX(-110%);
  }
  32% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(110%);
  }
}

@keyframes rank-particle-drift {
  0%,
  100% {
    opacity: 0;
    transform: translateY(0);
  }
  42% {
    opacity: 0.3;
  }
  70% {
    opacity: 0;
    transform: translateY(-0.75rem);
  }
}

@media (max-width: 39.99rem) {
  .rank-tier-card {
    min-height: 7rem;
    grid-template-columns: 5rem minmax(0, 1fr);
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .rank-tier-card__crest {
    width: 5rem;
    height: 5rem;
  }

  .rank-tier-card__watermark {
    position: absolute;
    right: 0.5rem;
    width: 5rem;
    height: 5rem;
  }

  .rank-tier-card__copy {
    padding-right: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rank-tier-card,
  .rank-tier-card::after {
    transition: none;
    animation: none;
  }
  .rank-tier-card:hover {
    transform: none;
  }
  .rank-tier-card__particle {
    display: none;
  }
}
</style>
