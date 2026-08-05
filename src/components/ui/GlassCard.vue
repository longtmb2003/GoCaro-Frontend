<script setup lang="ts">
import { useId } from 'vue'

import BaseDivider from './BaseDivider.vue'

type Variant = 'default' | 'elevated' | 'interactive' | 'nested'

withDefaults(
  defineProps<{
    /** Card heading. Omit for a bare surface with no header row. */
    title?: string
    /** Element to render as, so callers keep their existing semantics. */
    as?: string
    /** Heading level, so callers keep their existing document outline. */
    headingTag?: 'h2' | 'h3' | 'h4'
    /** Optional layout classes for the slot body wrapper. */
    bodyClass?: string
    variant?: Variant
  }>(),
  { title: '', as: 'section', headingTag: 'h2', bodyClass: '', variant: 'default' },
)

/**
 * Every glass surface carries tint + blur + border + shadow + top highlight.
 * Blur and tint alone do not make glass.
 *
 * `nested` is the exception, and deliberately so: it is a tile *inside* an
 * already-elevated card, so it takes no shadow (shadows mean elevation, and a
 * tile is not elevated), no second backdrop-filter (stacking them costs
 * compositing for no visual gain), no top highlight (light falls on the card,
 * not on its contents) and no overflow clip (so focus rings on controls inside
 * a tile are never cut off).
 */
const VARIANTS: Record<Variant, string> = {
  default: 'rounded-card p-4 sm:p-6 overflow-hidden backdrop-blur-glass bg-glass border-border',
  elevated:
    'rounded-card p-4 sm:p-6 overflow-hidden backdrop-blur-glass bg-glass-strong border-border-strong',
  interactive:
    'rounded-card p-4 sm:p-6 overflow-hidden backdrop-blur-glass bg-glass border-border',
  nested: 'rounded-sm p-3 bg-glass-light border-border-subtle',
}

/** Names the region from the visible heading, so the two never disagree. */
const headingId = useId()
</script>

<template>
  <component
    :is="as"
    class="glass-card relative isolate border"
    :class="VARIANTS[variant]"
    :data-variant="variant"
    :aria-labelledby="title === '' ? undefined : headingId"
  >
    <!-- Top highlight: cards receive light from above. -->
    <span
      v-if="variant !== 'nested'"
      class="via-border-strong absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
      aria-hidden="true"
    />

    <template v-if="title !== '' || $slots.header || $slots.actions">
      <div class="gap-3 mb-3 relative z-10 flex flex-wrap items-center justify-between">
        <slot name="header">
          <component
            :is="headingTag"
            :id="headingId"
            class="text-card gap-2 text-foreground flex items-center font-bold tracking-tight"
          >
            <slot name="icon" />
            {{ title }}
          </component>
        </slot>
        <slot name="actions" />
      </div>
      <BaseDivider class="mb-4 relative z-10" />
    </template>

    <!--
      Cards stack their body above the decorative highlight. A nested tile has
      no highlight, so it renders its slot directly — which also means layout
      classes passed by the caller land on an element that actually contains
      the children, instead of being swallowed by this wrapper.
    -->
    <slot v-if="variant === 'nested'" />
    <div v-else class="relative z-10" :class="bodyClass">
      <slot />
    </div>

    <div v-if="$slots.footer" class="mt-4 relative z-10">
      <slot name="footer" />
    </div>
  </component>
</template>

<style scoped>
.glass-card:not([data-variant='nested']) {
  box-shadow:
    var(--shadow-card),
    0 1px 0 rgb(255 255 255 / 0.025),
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    inset 0 0 0 1px rgb(255 255 255 / 0.018);
  -webkit-backdrop-filter: blur(var(--blur-glass)) saturate(1.18);
  backdrop-filter: blur(var(--blur-glass)) saturate(1.18);
  transition:
    transform var(--transition-duration-normal) ease-out,
    background-color var(--transition-duration-normal) ease-out,
    border-color var(--transition-duration-normal) ease-out,
    box-shadow var(--transition-duration-normal) ease-out;
}

.glass-card:not([data-variant='nested'])::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 18% 0%, var(--color-accent-soft), transparent 38%),
    linear-gradient(180deg, rgb(255 255 255 / 0.045), transparent 34%),
    linear-gradient(115deg, transparent 72%, rgb(255 255 255 / 0.018));
  content: '';
  opacity: 0.42;
  pointer-events: none;
  transition: opacity var(--transition-duration-normal) ease-out;
}

.glass-card[data-variant='elevated'] {
  box-shadow: var(--shadow-floating), inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.glass-card[data-variant='interactive']:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-floating), var(--shadow-glow), inset 0 1px 0 rgb(255 255 255 / 0.08);
  transform: translateY(-2px) scale(1.005);
}

.glass-card[data-variant='interactive']:hover::before,
.glass-card:not([data-variant='nested']):focus-within::before {
  opacity: 0.68;
}

.glass-card:not([data-variant='nested']):focus-within {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-card), 0 0 0 1px var(--color-accent-soft), inset 0 1px 0 rgb(255 255 255 / 0.08);
}

@media (prefers-reduced-motion: reduce) {
  .glass-card:not([data-variant='nested']),
  .glass-card:not([data-variant='nested'])::before {
    transition: none;
  }

  .glass-card[data-variant='interactive']:hover {
    transform: none;
  }
}
</style>
