<script setup lang="ts">
/**
 * The playing pieces, carved rather than drawn.
 *
 * X and O keep their identity — the last-move list, the player cards and every
 * bit of copy still call them X and O — but on the board they are objects, not
 * typography. Two crossed stone blades with a rune at the join; a rune ring
 * with knots set at uneven angles. The unevenness is the point: a mathematically
 * perfect bar and a perfect circle read as machine output no matter how they
 * are lit, and that is what kept the board looking like an interface.
 *
 * Everything here is flat fills over `currentColor`, exactly as `SpiritSigil`
 * does, for one reason: a piece renders at roughly 30px and there may be 225 of
 * them. Per-instance gradient defs would mean 225 duplicated ids and a lot of
 * compositing to express a bevel that, at this size, three flat tones express
 * better anyway.
 */
defineProps<{ shape: 'x' | 'o' }>()

/**
 * One blade, drawn horizontally and rotated into place, so the two halves of
 * the X are provably identical.
 *
 * The body is a near-constant bar and the carving lives in the chiselled ends,
 * not in the waist. A blade that swells in the middle and comes to a point at
 * both ends is a lens, and two crossed lenses read as a four-pointed sparkle
 * rather than an X — at 30px the tips disappear into the bloom and only the
 * fat centre survives. Thickness is ~18% of the piece, which is the floor for a
 * diagonal stroke to stay legible at that size.
 */
const BLADE = 'M6 24 L12 19.6 L36 19.6 L42 24 L36 28.4 L12 28.4 Z'

/** The lit bevel along a blade's upper edge — where light from above lands. */
const BLADE_FACET = 'M12.8 20.5 L35.2 20.5 L33.4 22 L14.6 22 Z'

/**
 * The join is cut into the stone, not set with a gem: a bright mark here sits
 * exactly where the two blades already pile up, and it reads as a glowing dot
 * with spikes. A dark notch gives the same "something was carved here" without
 * competing with the silhouette.
 */
const CROSS_NOTCH = 'M24 20.8 L27.2 24 L24 27.2 L20.8 24 Z'

/**
 * Knots on the ring, at 15°, 105° and 240°. Deliberately not evenly spaced:
 * three knots 120° apart would be as machined as the circle they sit on.
 */
const RING_KNOTS = [
  'M39 24.6 L42.4 28 L39 31.4 L35.6 28 Z',
  'M20 35.6 L23.4 39 L20 42.4 L16.6 39 Z',
  'M16.3 7.2 L19.7 10.6 L16.3 14 L12.9 10.6 Z',
]

/** The lit arc, from the upper left over the top — the same light as the bevel. */
const RING_FACET = 'M9.95 17.45 A 15.5 15.5 0 0 1 29.3 9.44'
</script>

<template>
  <svg class="piece-sigil" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <template v-if="shape === 'x'">
      <path class="piece-sigil-body" :d="BLADE" transform="rotate(45 24 24)" />
      <path class="piece-sigil-body" :d="BLADE" transform="rotate(-45 24 24)" />
      <path class="piece-sigil-facet" :d="BLADE_FACET" transform="rotate(45 24 24)" />
      <path class="piece-sigil-facet" :d="BLADE_FACET" transform="rotate(-45 24 24)" />
      <path class="piece-sigil-notch" :d="CROSS_NOTCH" />
    </template>
    <template v-else>
      <circle class="piece-sigil-ring" cx="24" cy="24" r="15.5" />
      <path class="piece-sigil-arc" :d="RING_FACET" />
      <path v-for="knot in RING_KNOTS" :key="knot" class="piece-sigil-mark" :d="knot" />
    </template>
  </svg>
</template>

<style scoped>
/* Above the piece's own bloom layers, which are drawn by `.game-piece::before`
   and `::after` and are meant to sit behind the carving, not wash over it. */
.piece-sigil {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.piece-sigil-body {
  fill: currentColor;
  stroke: var(--piece-rim);
  stroke-width: 1.1;
  stroke-linejoin: round;
}

.piece-sigil-ring {
  fill: none;
  stroke: currentColor;
  stroke-width: 6.5;
}

/* The bevel and the lit arc are the only bright tones, and they sit on the
   upper edge only, so a row of pieces reads as lit from one place. */
.piece-sigil-facet {
  fill: var(--piece-mark);
  opacity: 0.62;
}

.piece-sigil-arc {
  fill: none;
  stroke: var(--piece-mark);
  stroke-width: 2.2;
  stroke-linecap: round;
  opacity: 0.58;
}

.piece-sigil-mark {
  fill: var(--piece-mark);
  opacity: 0.86;
}

.piece-sigil-notch {
  fill: var(--piece-rim);
  opacity: 0.72;
}
</style>
