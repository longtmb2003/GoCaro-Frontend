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
    variant?: Variant
  }>(),
  { title: '', as: 'section', headingTag: 'h2', variant: 'default' },
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
  default: 'rounded-card p-6 overflow-hidden backdrop-blur-glass bg-glass border-border shadow-card',
  elevated:
    'rounded-card p-6 overflow-hidden backdrop-blur-glass bg-glass-strong border-border-strong shadow-floating',
  interactive:
    'rounded-card p-6 overflow-hidden backdrop-blur-glass bg-glass border-border shadow-card transition duration-normal ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-floating motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  nested: 'rounded-sm p-3 bg-glass-light border-border-subtle',
}

/** Names the region from the visible heading, so the two never disagree. */
const headingId = useId()
</script>

<template>
  <component
    :is="as"
    class="relative border"
    :class="VARIANTS[variant]"
    :aria-labelledby="title === '' ? undefined : headingId"
  >
    <!-- Top highlight: cards receive light from above. -->
    <span
      v-if="variant !== 'nested'"
      class="via-border-strong absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
      aria-hidden="true"
    />

    <template v-if="title !== '' || $slots.header || $slots.actions">
      <div class="gap-3 mb-4 relative z-10 flex flex-wrap items-center justify-between">
        <slot name="header">
          <component
            :is="headingTag"
            :id="headingId"
            class="text-card gap-2 text-foreground flex items-center"
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
    <div v-else class="relative z-10">
      <slot />
    </div>

    <div v-if="$slots.footer" class="mt-4 relative z-10">
      <slot name="footer" />
    </div>
  </component>
</template>
