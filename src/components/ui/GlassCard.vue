<script setup lang="ts">
import { useId } from 'vue'

import BaseDivider from './BaseDivider.vue'

type Variant = 'default' | 'elevated' | 'interactive'

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
 */
const VARIANTS: Record<Variant, string> = {
  default: 'bg-glass border-border shadow-card',
  elevated: 'bg-glass-strong border-border-strong shadow-floating',
  interactive:
    'bg-glass border-border shadow-card transition duration-normal ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-floating motion-reduce:transition-none motion-reduce:hover:translate-y-0',
}

/** Names the region from the visible heading, so the two never disagree. */
const headingId = useId()
</script>

<template>
  <component
    :is="as"
    class="rounded-card backdrop-blur-glass relative overflow-hidden border p-6"
    :class="VARIANTS[variant]"
    :aria-labelledby="title === '' ? undefined : headingId"
  >
    <!-- Top highlight: cards receive light from above. -->
    <span
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

    <div class="relative z-10">
      <slot />
    </div>

    <div v-if="$slots.footer" class="mt-4 relative z-10">
      <slot name="footer" />
    </div>
  </component>
</template>
