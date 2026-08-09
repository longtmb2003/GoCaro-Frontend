<script setup lang="ts">
import { computed, ref } from 'vue'

export type FantasyIconType =
  | 'create-room'
  | 'join-code'
  | 'match-history'
  | 'share-game'
  | 'leaderboard'
  | 'daily-missions'
  | 'tournament'
  | 'history'
  | 'ranked-match'
  | 'casual-match'
  | 'shop'
  | 'collection'
  | 'achievements'
  | 'explore'
  | 'friends'

type FantasyIconSize = 'small' | 'medium' | 'large' | 'hero'

const props = withDefaults(
  defineProps<{
    type: FantasyIconType
    size?: FantasyIconSize
    label?: string
    eager?: boolean
  }>(),
  { size: 'medium', label: '', eager: false },
)

const ASSET_PATHS: Record<FantasyIconType, string> = {
  'create-room': '/assets/fantasy-icons/create-room.webp',
  'join-code': '/assets/fantasy-icons/join-code.webp',
  'match-history': '/assets/fantasy-icons/match-history.webp',
  'share-game': '/assets/fantasy-icons/share-game.webp',
  leaderboard: '/assets/fantasy-icons/leaderboard.webp',
  'daily-missions': '/assets/fantasy-icons/daily-missions.webp',
  tournament: '/assets/fantasy-icons/tournament.webp',
  history: '/assets/fantasy-icons/history.webp',
  'ranked-match': '/assets/modes/ranked-emblem-v2.webp',
  'casual-match': '/assets/modes/casual-swords-v2.webp',
  shop: '/assets/fantasy-icons/shop.webp',
  collection: '/assets/fantasy-icons/collection.webp',
  achievements: '/assets/fantasy-icons/achievements.webp',
  explore: '/assets/fantasy-icons/tournament.webp',
  friends: '/assets/fantasy-icons/friends.webp',
}

const failed = ref(false)
const assetPath = computed(() => ASSET_PATHS[props.type])
</script>

<template>
  <span
    class="fantasy-icon"
    :class="`fantasy-icon--${size}`"
    :data-type="type"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <span class="fantasy-icon__aura" aria-hidden="true" />
    <img
      v-if="!failed"
      :src="assetPath"
      alt=""
      width="1254"
      height="1254"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      @error="failed = true"
    />
    <span v-else class="fantasy-icon__fallback" aria-hidden="true" />
  </span>
</template>

<style scoped>
.fantasy-icon {
  --fantasy-icon-size: 3rem;
  position: relative;
  isolation: isolate;
  display: inline-grid;
  width: var(--fantasy-icon-size);
  height: var(--fantasy-icon-size);
  flex: 0 0 var(--fantasy-icon-size);
  place-items: center;
}

.fantasy-icon--small {
  --fantasy-icon-size: 1.75rem;
}

.fantasy-icon--medium {
  --fantasy-icon-size: 3rem;
}

.fantasy-icon--large {
  --fantasy-icon-size: 4.5rem;
}

.fantasy-icon--hero {
  --fantasy-icon-size: 7rem;
}

.fantasy-icon__aura {
  position: absolute;
  inset: 22%;
  z-index: -1;
  border-radius: var(--radius-pill);
  background: var(--color-accent-glow);
  filter: blur(0.75rem);
  opacity: 0.42;
  transition:
    opacity var(--transition-duration-normal) ease-out,
    transform var(--transition-duration-normal) ease-out;
}

.fantasy-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0.35rem 0.35rem rgb(0 0 0 / 0.38));
  transition:
    filter var(--transition-duration-normal) ease-out,
    transform var(--transition-duration-normal) ease-out;
}

.fantasy-icon__fallback {
  width: 58%;
  height: 58%;
  border: 0.15rem double var(--color-warning);
  background: linear-gradient(135deg, var(--surface-3), var(--color-primary-700));
  box-shadow: inset 0 0 0.75rem var(--color-accent-glow), var(--shadow-glow);
  transform: rotate(45deg);
}

:where(button, a, [data-variant='interactive']):hover .fantasy-icon img,
:where(button, a, [data-variant='interactive']):focus-visible .fantasy-icon img {
  filter:
    drop-shadow(0 0.45rem 0.4rem rgb(0 0 0 / 0.44))
    drop-shadow(0 0 0.45rem var(--color-accent-glow));
  transform: translateY(-0.125rem) scale(1.035);
}

:where(button, a, [data-variant='interactive']):hover .fantasy-icon__aura,
:where(button, a, [data-variant='interactive']):focus-visible .fantasy-icon__aura {
  opacity: 0.68;
  transform: scale(1.14);
}

@media (prefers-reduced-motion: reduce) {
  .fantasy-icon img,
  .fantasy-icon__aura {
    transition: none;
  }

  :where(button, a, [data-variant='interactive']):hover .fantasy-icon img,
  :where(button, a, [data-variant='interactive']):focus-visible .fantasy-icon img,
  :where(button, a, [data-variant='interactive']):hover .fantasy-icon__aura,
  :where(button, a, [data-variant='interactive']):focus-visible .fantasy-icon__aura {
    transform: none;
  }
}
</style>
