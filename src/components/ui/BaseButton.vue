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
  primary:
    'border border-warning-400/60 bg-primary-600 text-white hover:border-warning-400/80 hover:bg-primary-500',
  secondary:
    'border border-warning-400/30 bg-glass-light text-foreground hover:border-warning-400/60 hover:bg-surface-4',
  ghost:
    'border border-transparent text-foreground-muted hover:border-border-subtle hover:bg-glass-light hover:text-foreground',
  danger:
    'border border-danger-400/40 bg-danger-600 text-white hover:border-danger-400/70 hover:bg-danger-500',
  success:
    'border border-success-400/40 bg-success-600 text-white hover:border-success-400/70 hover:bg-success-500',
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
    :data-variant="variant"
    class="base-button gap-2 rounded-button inline-flex cursor-pointer items-center justify-center font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed motion-reduce:transition-none"
    :class="classes"
  >
    <BaseSpinner v-if="loading" size="sm" tone="current" />
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  letter-spacing: 0.01em;
  box-shadow: var(--shadow-sm), inset 0 1px 0 rgb(255 255 255 / 0.1);
  transform: translateZ(0);
  transition:
    transform var(--transition-duration-instant) ease-out,
    color var(--transition-duration-fast) ease-out,
    background-color var(--transition-duration-fast) ease-out,
    border-color var(--transition-duration-fast) ease-out,
    box-shadow var(--transition-duration-normal) ease-out,
    opacity var(--transition-duration-fast) ease-out;
}

.base-button[data-variant='primary'] {
  background:
    radial-gradient(circle at 50% -40%, rgb(107 227 255 / 0.38), transparent 68%),
    linear-gradient(180deg, #2869aa, #164779);
  box-shadow:
    inset 0 1px 0 rgb(229 222 210 / 0.26),
    inset 0 -3px 6px rgb(4 19 40 / 0.32),
    0 0 0.75rem rgb(86 183 255 / 0.12);
}

.base-button[data-variant='secondary'] {
  background: linear-gradient(180deg, rgb(34 54 70 / 0.88), rgb(10 25 42 / 0.9));
  box-shadow:
    inset 0 1px 0 rgb(229 222 210 / 0.12),
    inset 0 -2px 4px rgb(0 7 18 / 0.24);
}

.base-button::before {
  position: absolute;
  inset: 1px;
  border: 1px solid transparent;
  border-radius: calc(var(--radius-button) - 2px);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.055);
  content: '';
  opacity: 0.72;
  pointer-events: none;
  transition:
    border-color var(--transition-duration-fast) ease-out,
    box-shadow var(--transition-duration-normal) ease-out,
    opacity var(--transition-duration-fast) ease-out;
}

.base-button::after {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(105deg, transparent 20%, rgb(255 255 255 / 0.12) 48%, transparent 76%);
  content: '';
  opacity: 0;
  pointer-events: none;
  transform: translateX(-110%);
  transition:
    opacity var(--transition-duration-fast) ease-out,
    transform var(--transition-duration-normal) ease-out;
}

.base-button:hover:not(:disabled)::before,
.base-button:focus-visible::before {
  border-color: color-mix(in srgb, currentColor 18%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.11);
  opacity: 1;
}

.base-button:hover:not(:disabled) {
  box-shadow: var(--shadow-card), inset 0 1px 0 rgb(255 255 255 / 0.14);
  transform: translateY(-2px) scale(1.01);
}

.base-button[data-variant='primary']:hover:not(:disabled) {
  box-shadow: var(--shadow-glow), var(--shadow-card), inset 0 1px 0 rgb(255 255 255 / 0.16);
}

.base-button[data-variant='danger']:hover:not(:disabled) {
  box-shadow: 0 0 1.25rem color-mix(in srgb, var(--color-error) 24%, transparent), var(--shadow-card), inset 0 1px 0 rgb(255 255 255 / 0.14);
}

.base-button[data-variant='success']:hover:not(:disabled) {
  box-shadow: 0 0 1.25rem color-mix(in srgb, var(--color-success) 22%, transparent), var(--shadow-card), inset 0 1px 0 rgb(255 255 255 / 0.14);
}

.base-button[data-variant='ghost']:hover:not(:disabled) {
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.base-button:hover:not(:disabled)::after {
  opacity: 1;
  transform: translateX(110%);
}

.base-button:active:not(:disabled) {
  box-shadow: var(--shadow-sm), inset 0 2px 6px rgb(0 0 0 / 0.2);
  transform: translateY(1px) scale(0.98);
  transition-duration: var(--transition-duration-instant);
}

.base-button:focus-visible {
  box-shadow: var(--shadow-glow), var(--shadow-card), inset 0 1px 0 rgb(255 255 255 / 0.12);
}

.base-button:disabled {
  border-color: var(--color-border-subtle);
  box-shadow: none;
  filter: saturate(0.5);
  opacity: 0.48;
}

.base-button:disabled::before,
.base-button:disabled::after {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .base-button,
  .base-button::before,
  .base-button::after {
    transition: none;
  }

  .base-button:hover:not(:disabled),
  .base-button:active:not(:disabled) {
    transform: none;
  }

  .base-button::after {
    display: none;
  }
}
</style>
