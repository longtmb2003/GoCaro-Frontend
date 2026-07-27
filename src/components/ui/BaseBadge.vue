<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    /** Pill keeps the fully rounded shape; `tag` is the squarer chip form. */
    shape?: 'pill' | 'tag'
  }>(),
  { variant: 'neutral', shape: 'pill' },
)

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent-soft text-accent border-accent/30',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-error/15 text-error border-error/30',
  neutral: 'bg-glass-light text-foreground-muted border-border',
}

const classes = computed(() => [
  VARIANTS[props.variant],
  props.shape === 'pill' ? 'rounded-pill' : 'rounded-sm',
])
</script>

<template>
  <span
    class="text-caption gap-xs px-sm inline-flex items-center border py-1 font-semibold tracking-wider uppercase"
    :class="classes"
  >
    <slot />
  </span>
</template>
