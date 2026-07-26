<script setup lang="ts">
import { onMounted, ref } from 'vue'

import BaseButton from '@/components/BaseButton.vue'

defineProps<{ secondsLeft: number }>()

const emit = defineEmits<{ leave: [] }>()

const dialog = ref<HTMLElement | null>(null)

onMounted(() => {
  dialog.value?.querySelector('button')?.focus()
})
</script>

<template>
  <div
    ref="dialog"
    class="fixed inset-0 z-1300 flex items-center justify-center bg-black/60 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="reconnecting-heading"
  >
    <div class="bg-surface-elevated w-full max-w-sm rounded-lg p-6 text-center shadow-lg">
      <div class="mb-4 flex justify-center" aria-hidden="true">
        <span
          class="border-primary-500 size-10 animate-spin rounded-full border-3 border-t-transparent"
        />
      </div>

      <h2 id="reconnecting-heading" class="text-foreground text-lg font-semibold">
        Reconnecting…
      </h2>
      <p class="text-foreground-muted mt-2 text-sm" aria-live="polite">
        Your match is still going. Trying to rejoin —
        <span class="font-semibold tabular-nums">{{ secondsLeft }}s</span>
        left before it is lost.
      </p>

      <BaseButton variant="secondary" class="mt-6 w-full" @click="emit('leave')">
        Leave match
      </BaseButton>
    </div>
  </div>
</template>
