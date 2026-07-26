<script setup lang="ts">
defineProps<{ secondsLeft: number }>()
</script>

<template>
  <div
    class="border-warning-500/40 bg-warning-500/10 flex items-center gap-3 rounded-lg border px-4 py-3"
    role="status"
    aria-live="polite"
  >
    <span
      class="border-warning-500 size-4 shrink-0 animate-spin rounded-full border-2 border-t-transparent"
      aria-hidden="true"
    />
    <p class="text-foreground text-sm">
      Opponent disconnected — waiting up to
      <span class="font-semibold tabular-nums">{{ secondsLeft }}s</span>
      for them to return.
    </p>
  </div>
</template>
