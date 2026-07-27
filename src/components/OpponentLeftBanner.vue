<script setup lang="ts">
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

defineProps<{ secondsLeft: number }>()
</script>

<template>
  <div
    class="border-warning/40 bg-warning/10 gap-md px-lg rounded-card flex items-center border py-3"
    role="status"
    aria-live="polite"
  >
    <BaseSpinner size="sm" tone="warning" />
    <p class="text-foreground text-small">
      Opponent disconnected — waiting up to
      <span class="font-semibold tabular-nums">{{ secondsLeft }}s</span>
      for them to return.
    </p>
  </div>
</template>
