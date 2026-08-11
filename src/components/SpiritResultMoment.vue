<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import SpiritSigil from '@/components/board-renderer/SpiritSigil.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { ResolvedSpirit } from '@/spirits/spiritTypes'

const props = defineProps<{
  spirit: ResolvedSpirit
  outcome: 'win' | 'loss'
}>()

const { language } = useAppLanguage()
const failed = ref(false)

const resultClass = computed(() =>
  props.outcome === 'win'
    ? `spirit-result-victory-${props.spirit.result.victory}`
    : `spirit-result-defeat-${props.spirit.result.defeat}`,
)

const resultLine = computed(() => {
  const line = props.outcome === 'win'
    ? props.spirit.result.victoryLine
    : props.spirit.result.defeatLine
  return line[language.value]
})

const resultStyle = computed(() => ({
  '--spirit-result-accent': `var(${props.spirit.vfx.accentToken})`,
  '--spirit-result-trail': `var(${props.spirit.vfx.trailToken})`,
}))

watch(() => props.spirit.id, () => {
  failed.value = false
})
</script>

<template>
  <section
    class="spirit-result-moment"
    :class="[resultClass, `spirit-result-moment-${outcome}`]"
    :style="resultStyle"
    :aria-label="`${spirit.name[language]}: ${resultLine}`"
  >
    <div class="spirit-result-visual" aria-hidden="true">
      <span class="spirit-result-aura"></span>
      <span class="spirit-result-ring"></span>
      <span
        v-for="particle in 6"
        :key="particle"
        class="spirit-result-particle"
      ></span>
      <img
        v-if="spirit.model.source && !failed"
        class="spirit-result-art"
        :src="spirit.model.source"
        alt=""
        draggable="false"
        decoding="async"
        @error="failed = true"
      />
      <SpiritSigil v-else class="spirit-result-art spirit-result-sigil" :shape="spirit.sigil" />
    </div>
    <p class="spirit-result-line">{{ resultLine }}</p>
  </section>
</template>

<style scoped>
.spirit-result-moment {
  display: grid;
  justify-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  color: var(--spirit-result-accent);
}

.spirit-result-visual {
  position: relative;
  display: grid;
  width: 7rem;
  max-width: 28vw;
  aspect-ratio: 1;
  place-items: center;
  isolation: isolate;
}

.spirit-result-art {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 0.75rem color-mix(in srgb, var(--spirit-result-accent) 48%, transparent));
  animation-duration: 450ms;
  animation-timing-function: ease-out;
  animation-fill-mode: both;
}

.spirit-result-sigil {
  --spirit-accent: var(--spirit-result-accent);
  width: 72%;
  height: 72%;
}

.spirit-result-aura,
.spirit-result-ring {
  position: absolute;
  inset: 10%;
  z-index: 0;
  border-radius: var(--radius-pill);
  pointer-events: none;
}

.spirit-result-aura {
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--spirit-result-accent) 30%, transparent),
    transparent 68%
  );
  filter: blur(var(--blur-sm));
  animation: spirit-result-aura-enter 450ms ease-out both;
}

.spirit-result-ring {
  border: 1px solid color-mix(in srgb, var(--spirit-result-trail) 46%, transparent);
  opacity: 0;
}

.spirit-result-particle {
  position: absolute;
  z-index: 1;
  width: 0.3rem;
  aspect-ratio: 1;
  border-radius: var(--radius-pill);
  background: var(--spirit-result-trail);
  box-shadow: 0 0 0.45rem var(--spirit-result-accent);
  opacity: 0;
}

.spirit-result-moment-win .spirit-result-particle {
  animation: spirit-result-particle-enter 450ms ease-out both;
}

.spirit-result-particle:nth-of-type(3) { --particle-x: -2.6rem; --particle-y: -1.7rem; }
.spirit-result-particle:nth-of-type(4) { --particle-x: 2.7rem; --particle-y: -1.4rem; animation-delay: 40ms; }
.spirit-result-particle:nth-of-type(5) { --particle-x: -2.2rem; --particle-y: 1.8rem; animation-delay: 80ms; }
.spirit-result-particle:nth-of-type(6) { --particle-x: 2.4rem; --particle-y: 1.9rem; animation-delay: 120ms; }
.spirit-result-particle:nth-of-type(7) { --particle-x: 0; --particle-y: -2.8rem; animation-delay: 160ms; }
.spirit-result-particle:nth-of-type(8) { --particle-x: 0.5rem; --particle-y: 2.7rem; animation-delay: 200ms; }

.spirit-result-line {
  max-width: 26rem;
  color: var(--text-secondary);
  font-size: var(--text-small);
  font-style: italic;
  font-weight: 600;
  text-align: center;
}

.spirit-result-victory-radiant-rise .spirit-result-art {
  animation-name: spirit-result-radiant-rise;
}

.spirit-result-victory-power-surge .spirit-result-art {
  animation-name: spirit-result-power-surge;
}

.spirit-result-victory-swift-pounce .spirit-result-art {
  animation-name: spirit-result-swift-pounce;
}

.spirit-result-victory-rune-bloom .spirit-result-art,
.spirit-result-victory-tidal-crown .spirit-result-art {
  animation-name: spirit-result-rune-bloom;
}

.spirit-result-victory-rune-bloom .spirit-result-ring,
.spirit-result-victory-tidal-crown .spirit-result-ring {
  animation: spirit-result-ring-enter 450ms ease-out both;
}

.spirit-result-defeat-ember-fade .spirit-result-art {
  animation-name: spirit-result-ember-fade;
}

.spirit-result-defeat-guarded-retreat .spirit-result-art {
  animation-name: spirit-result-guarded-retreat;
}

.spirit-result-defeat-mist-dissolve .spirit-result-art {
  animation-name: spirit-result-mist-dissolve;
}

.spirit-result-defeat-shadow-lower .spirit-result-art {
  animation-name: spirit-result-shadow-lower;
}

@keyframes spirit-result-aura-enter {
  from { opacity: 0; transform: scale(0.72); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes spirit-result-particle-enter {
  0% { opacity: 0; transform: translate(0, 0) scale(0.6); }
  55% { opacity: 0.9; }
  100% { opacity: 0; transform: translate(var(--particle-x), var(--particle-y)) scale(1); }
}

@keyframes spirit-result-ring-enter {
  from { opacity: 0; transform: scale(0.68); }
  to { opacity: 0.7; transform: scale(1.08); }
}

@keyframes spirit-result-radiant-rise {
  from { opacity: 0; transform: translateY(0.75rem) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes spirit-result-power-surge {
  0% { opacity: 0; transform: scale(0.84); }
  60% { opacity: 1; transform: scale(1.06); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes spirit-result-swift-pounce {
  from { opacity: 0; transform: translateX(-0.75rem) scale(0.92); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes spirit-result-rune-bloom {
  from { opacity: 0; transform: translateY(0.4rem) scale(0.88); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes spirit-result-ember-fade {
  from { opacity: 0; transform: translateY(-0.25rem) scale(1.02); }
  to { opacity: 0.78; transform: translateY(0.35rem) scale(0.96); }
}

@keyframes spirit-result-guarded-retreat {
  from { opacity: 0; transform: scale(1.02); }
  to { opacity: 0.86; transform: scale(0.96); }
}

@keyframes spirit-result-mist-dissolve {
  from { opacity: 0; transform: scale(1.06); }
  to { opacity: 0.72; transform: scale(0.94); }
}

@keyframes spirit-result-shadow-lower {
  from { opacity: 0; transform: translateY(-0.35rem); }
  to { opacity: 0.72; transform: translateY(0.35rem); }
}

@media (max-width: 30rem) {
  .spirit-result-visual {
    width: 5.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spirit-result-art,
  .spirit-result-aura,
  .spirit-result-ring,
  .spirit-result-particle {
    animation: none !important;
  }

  .spirit-result-particle {
    display: none;
  }
}
</style>
