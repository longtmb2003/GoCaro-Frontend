<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  secondsLeft: number
  totalSeconds: number
}>()

/** Below this many seconds the clock turns red to signal urgency. */
const LOW_SECONDS = 5

const fraction = computed(() =>
  props.totalSeconds > 0 ? Math.min(1, Math.max(0, props.secondsLeft / props.totalSeconds)) : 0,
)

const low = computed(() => props.secondsLeft <= LOW_SECONDS)
</script>

<template>
  <div class="flex items-center gap-2" role="timer" aria-live="off">
    <div class="bg-surface-elevated h-1.5 flex-1 overflow-hidden rounded-full">
      <div
        class="h-full rounded-full transition-[width] duration-1000 ease-linear"
        :class="low ? 'bg-danger-500' : 'bg-primary-500'"
        :style="{ width: `${(fraction * 100).toString()}%` }"
      />
    </div>
    <span
      class="w-8 text-right text-sm font-semibold tabular-nums"
      :class="low ? 'text-danger-400' : 'text-foreground-muted'"
    >
      {{ secondsLeft }}s
    </span>
  </div>
</template>
