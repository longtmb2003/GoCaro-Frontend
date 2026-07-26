<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import BaseButton from '@/components/BaseButton.vue'

const props = withDefaults(
  defineProps<{
    heading: string
    message: string
    tone: 'win' | 'loss' | 'draw'
    /** Rating won or lost, or null when nothing was at stake. */
    ratingDelta?: number | null
  }>(),
  { ratingDelta: null },
)

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

// A rating change is shown even when it is zero — that is a real ranked outcome
// between evenly matched players, and saying so is clearer than silence. Only a
// casual match, which stakes nothing, shows nothing.
const ratingLabel = computed(() => {
  const delta = props.ratingDelta
  if (delta === null) {
    return ''
  }
  return delta > 0 ? `+${delta.toString()}` : delta.toString()
})

const ratingClass = computed(() => {
  const delta = props.ratingDelta
  if (delta === null || delta === 0) {
    return 'bg-foreground/5 text-foreground-muted'
  }
  return delta > 0
    ? 'bg-success-500/15 text-success-500'
    : 'bg-danger-500/15 text-danger-400'
})
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
      :class="{ 'ring-2 ring-success-500 shadow-success-500/20 win-pulse': tone === 'win' }"
    >
      <h2 id="result-heading" class="text-2xl font-bold flex items-center justify-center gap-2" :class="headingClass">
        <span v-if="tone === 'win'" class="text-3xl">🏆</span>
        <span v-if="tone === 'loss'" class="text-3xl">💔</span>
        <span v-if="tone === 'draw'" class="text-3xl">🤝</span>
        {{ heading }}
      </h2>
      <p class="text-foreground-muted mt-2 text-sm">{{ message }}</p>

      <p v-if="ratingDelta !== null" class="mt-4">
        <span
          class="inline-flex items-baseline gap-1.5 rounded-md px-3 py-1.5"
          :class="ratingClass"
        >
          <span class="text-lg font-bold tabular-nums">{{ ratingLabel }}</span>
          <span class="text-sm font-medium opacity-80">rating</span>
        </span>
      </p>

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
  animation: result-in 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes win-glow {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.win-pulse {
  animation: result-in 300ms cubic-bezier(0.16, 1, 0.3, 1), win-glow 2s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .result-card, .win-pulse {
    animation: none;
  }
}
</style>
