<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'danger'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    type: 'button',
    loading: false,
    disabled: false,
  },
)

const isDisabled = computed(() => props.disabled || props.loading)

const variantClasses: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 border border-primary-400/20',
  secondary: 'bg-surface-elevated text-foreground border border-border-subtle hover:bg-surface hover:border-primary-500/30 hover:shadow-[0_0_10px_rgba(59,130,246,0.1)] transition-all',
  danger: 'bg-gradient-to-r from-danger-600 to-danger-500 text-white shadow-lg shadow-danger-500/20 hover:shadow-danger-500/40 hover:from-danger-500 hover:to-danger-400 border border-danger-400/20',
}
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    class="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
    :class="variantClasses[variant]"
  >
    <svg
      v-if="loading"
      class="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
    <slot />
  </button>
</template>
