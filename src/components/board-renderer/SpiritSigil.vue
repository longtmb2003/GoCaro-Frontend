<script setup lang="ts">
import type { SpiritSigilShape } from '@/spirits/spiritTypes'

/**
 * Procedural stand-in for spirit artwork.
 *
 * These are heraldic emblems used as fallbacks for spirits that do not have
 * a dedicated artwork. When a spirit definition provides a `model.source`,
 * the stage renders the image and this component is not used.
 */
defineProps<{ shape: SpiritSigilShape }>()

/**
 * Two layers per shape: a solid body carrying the player's symbol color, and a
 * lighter mark carrying the spirit's accent token, so ownership stays readable
 * while the spirit still looks like itself.
 */
const BODY: Record<SpiritSigilShape, string> = {
  drake:
    'M4 27 L19 5 L23 20 L44 13 L37 26 L46 31 L26 35 L29 45 L18 37 L7 43 L12 33 Z',
  wolf: 'M10 7 L19 21 L29 21 L38 7 L42 22 L37 35 L24 44 L11 35 L6 22 Z',
  phoenix:
    'M24 8 L33 21 L46 14 L38 28 L24 44 L10 28 L2 14 L15 21 Z',
  fox: 'M8 6 L18 20 L30 20 L40 6 L43 21 L24 42 L5 21 Z',
  tiger: 'M6 14 L14 8 L20 18 L28 18 L34 8 L42 14 L40 30 L24 43 L8 30 Z',
  rune: 'M24 3 L41 24 L24 45 L7 24 Z',
}

const MARK: Record<SpiritSigilShape, string> = {
  drake: 'M23 20 L37 16 L33 24 Z',
  wolf: 'M18 26 L24 34 L30 26 Z',
  phoenix: 'M24 18 L29 28 L24 36 L19 28 Z',
  fox: 'M17 25 L24 33 L31 25 Z',
  tiger: 'M15 24 L21 26 L21 31 Z M33 24 L27 26 L27 31 Z',
  rune: 'M24 13 L32 24 L24 35 L16 24 Z',
}
</script>

<template>
  <svg class="spirit-sigil" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path class="spirit-sigil-body" :d="BODY[shape]" />
    <path class="spirit-sigil-mark" :d="MARK[shape]" />
  </svg>
</template>

<style scoped>
.spirit-sigil {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.spirit-sigil-body {
  fill: currentColor;
  stroke: var(--spirit-accent);
  stroke-width: 1.25;
  stroke-linejoin: round;
  opacity: 0.92;
}

.spirit-sigil-mark {
  fill: var(--spirit-accent);
  opacity: 0.85;
}
</style>
