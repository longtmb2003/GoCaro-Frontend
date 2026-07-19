<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import BaseButton from '@/components/BaseButton.vue'

const props = defineProps<{
  heading: string
  message: string
  tone: 'win' | 'loss' | 'draw'
}>()

defineEmits<{ playAgain: []; exit: [] }>()

const dialog = ref<HTMLElement | null>(null)

onMounted(() => {
  dialog.value?.querySelector('button')?.focus()
})

const headingClass = computed(() =>
  props.tone === 'win'
    ? 'text-success-500'
    : props.tone === 'loss'
      ? 'text-danger-400'
      : 'text-foreground',
)
</script>

<template>
  <div
    ref="dialog"
    class="fixed inset-0 z-1300 flex items-center justify-center bg-black/60 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="result-heading"
  >
    <div
      class="result-card bg-surface-elevated w-full max-w-sm rounded-lg p-6 text-center shadow-lg"
    >
      <h2 id="result-heading" class="text-2xl font-bold" :class="headingClass">{{ heading }}</h2>
      <p class="text-foreground-muted mt-2 text-sm">{{ message }}</p>
      <div class="mt-6 space-y-2">
        <BaseButton class="w-full" @click="$emit('playAgain')">Play again</BaseButton>
        <BaseButton variant="secondary" class="w-full" @click="$emit('exit')">
          Back to lobby
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes result-in {
  from {
    transform: scale(0.94);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.result-card {
  animation: result-in 180ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .result-card {
    animation: none;
  }
}
</style>
