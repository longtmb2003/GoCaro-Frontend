<script setup lang="ts">
import { computed } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

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

defineEmits<{ playAgain: []; exit: []; share: [] }>()

const headingClass = computed(() =>
  props.tone === 'win' ? 'text-success' : props.tone === 'loss' ? 'text-error' : 'text-foreground',
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
    return 'bg-glass-light text-foreground-muted'
  }
  return delta > 0 ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
})
</script>

<template>
  <!-- Not dismissible: the player must choose play again or exit. -->
  <BaseModal
    :dismissible="false"
    aria-labelledby="result-heading"
    :class="tone === 'win' ? 'ring-success win-pulse ring-2' : ''"
  >
    <div class="text-center">
      <h2 id="result-heading" class="text-section gap-2 flex items-center justify-center" :class="headingClass">
        <span v-if="tone === 'win'" aria-hidden="true">🏆</span>
        <span v-if="tone === 'loss'" aria-hidden="true">💔</span>
        <span v-if="tone === 'draw'" aria-hidden="true">🤝</span>
        {{ heading }}
      </h2>
      <p class="text-foreground-muted text-body mt-2">{{ message }}</p>

      <p v-if="ratingDelta !== null" class="mt-4">
        <span class="gap-1 px-3 py-1 rounded-sm inline-flex items-baseline" :class="ratingClass">
          <span class="text-card tabular-nums">{{ ratingLabel }}</span>
          <span class="text-body font-medium opacity-80">rating</span>
        </span>
      </p>
    </div>

    <template #footer>
      <div class="space-y-2">
        <BaseButton v-if="tone === 'win'" variant="success" class="w-full" @click="$emit('share')">
          🔗 Share Achievement (+50 Coins)
        </BaseButton>
        <BaseButton class="w-full" @click="$emit('playAgain')">Play again</BaseButton>
        <BaseButton variant="secondary" class="w-full" @click="$emit('exit')">
          Back to lobby
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<!--
  Deliberately NOT scoped. This class is handed to BaseModal and lands on the
  dialog panel, which Teleports to <body> and therefore never carries this
  component's data-v attribute — a scoped rule here silently does nothing.
  Entry animation comes from BaseModal; this is only the victory glow.
-->
<style>
@keyframes win-glow {
  0% {
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--color-success) 40%, transparent);
  }
  70% {
    box-shadow: 0 0 0 15px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

.win-pulse {
  animation: win-glow 2s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .win-pulse {
    animation: none;
  }
}
</style>
