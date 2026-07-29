<script setup lang="ts">
import { computed } from 'vue'

import { Handshake, HeartCrack, Share2, Trophy } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps<{
  heading: string
  message: string
  tone: 'win' | 'loss' | 'draw'
}>()

defineEmits<{ playAgain: []; exit: []; share: [] }>()

const headingClass = computed(() =>
  props.tone === 'win' ? 'text-success' : props.tone === 'loss' ? 'text-error' : 'text-foreground',
)
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
        <Trophy v-if="tone === 'win'" :size="24" aria-hidden="true" />
        <HeartCrack v-if="tone === 'loss'" :size="24" aria-hidden="true" />
        <Handshake v-if="tone === 'draw'" :size="24" aria-hidden="true" />
        {{ heading }}
      </h2>
      <p class="text-foreground-muted text-body mt-2">{{ message }}</p>

    </div>

    <template #footer>
      <div class="space-y-2">
        <BaseButton v-if="tone === 'win'" variant="success" class="w-full" @click="$emit('share')">
          <Share2 :size="16" aria-hidden="true" /> Share Achievement (+50 Coins)
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
