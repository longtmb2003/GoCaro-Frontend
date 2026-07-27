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
  primary:
    'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-[0_0_15px_rgba(45,212,191,0.4)] hover:shadow-[0_0_25px_rgba(45,212,191,0.6)] hover:from-primary-400 hover:to-secondary-500 border border-white/20 transition-all duration-300',
  secondary:
    'bg-white/5 backdrop-blur-md text-white border border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300',
  danger:
    'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:shadow-[0_0_25px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-red-500 border border-white/20 transition-all duration-300',
}
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    class="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
