<script setup lang="ts">
import { computed } from 'vue'

import BaseSpinner from './BaseSpinner.vue'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    loading: false,
    disabled: false,
  },
)

const isDisabled = computed(() => props.disabled || props.loading)

/**
 * Accent is the primary fill. The spec pairs it with white text, but the raw
 * accent is too light for that to reach AA, so the primary button uses the
 * accent family's darkest AA-safe step instead.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-500 hover:shadow-glow',
  secondary:
    'bg-glass-light text-foreground border border-border hover:bg-surface-4 hover:border-border-strong',
  ghost: 'text-foreground-muted hover:bg-glass-light hover:text-foreground',
  danger: 'bg-danger-600 text-white hover:bg-danger-500',
  success: 'bg-success-600 text-white hover:bg-success-500',
}

/**
 * All sizes clear the 44px minimum touch target; they differ in weight of
 * padding and label, not in hit area.
 */
const SIZES: Record<Size, string> = {
  sm: 'h-11 px-3 text-small',
  md: 'h-11 px-4 text-body',
  lg: 'h-12 px-6 text-body',
}

const classes = computed(() => [VARIANTS[props.variant], SIZES[props.size]])
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading"
    class="gap-2 rounded-button duration-fast inline-flex cursor-pointer items-center justify-center font-semibold transition ease-out active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100"
    :class="classes"
  >
    <BaseSpinner v-if="loading" size="sm" tone="current" />
    <slot />
  </button>
</template>
