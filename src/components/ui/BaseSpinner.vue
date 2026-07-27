<script setup lang="ts">
import { computed } from 'vue'

type Size = 'sm' | 'md' | 'lg'
type Tone = 'accent' | 'warning' | 'current'

const props = withDefaults(
  defineProps<{
    size?: Size
    tone?: Tone
  }>(),
  { size: 'md', tone: 'accent' },
)

const SIZES: Record<Size, string> = {
  sm: 'size-4 border-2',
  md: 'size-10 border-3',
  lg: 'size-12 border-4',
}

const TONES: Record<Tone, string> = {
  accent: 'border-accent',
  warning: 'border-warning',
  current: 'border-current',
}

const classes = computed(() => [SIZES[props.size], TONES[props.tone]])
</script>

<template>
  <!--
    Presentational only. Every call site pairs the spinner with its own
    heading or live region, so announcing it here would double up.
  -->
  <span
    class="inline-block shrink-0 animate-spin rounded-pill border-t-transparent"
    :class="classes"
    aria-hidden="true"
  />
</template>
