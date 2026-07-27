<script setup lang="ts">
import { computed } from 'vue'

type Tone = 'accent' | 'warning' | 'success'
type Size = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    /** Completion from 0 to 100. Values outside the range are clamped. */
    value: number
    tone?: Tone
    size?: Size
    label?: string
  }>(),
  { tone: 'accent', size: 'md', label: '' },
)

const TONES: Record<Tone, string> = {
  accent: 'bg-accent',
  warning: 'bg-warning',
  success: 'bg-success',
}

const SIZES: Record<Size, string> = {
  sm: 'h-1.5',
  md: 'h-2',
}

const clamped = computed(() => Math.min(100, Math.max(0, props.value)))
</script>

<template>
  <div
    class="bg-surface-sunken border-border-subtle w-full overflow-hidden rounded-pill border"
    :class="SIZES[size]"
    role="progressbar"
    :aria-valuenow="clamped"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="label || undefined"
  >
    <div
      class="duration-normal h-full rounded-pill transition-all ease-out motion-reduce:transition-none"
      :class="TONES[tone]"
      :style="{ width: `${clamped.toString()}%` }"
    />
  </div>
</template>
