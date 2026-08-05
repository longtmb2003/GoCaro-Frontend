<script setup lang="ts">
import { computed } from 'vue'

import { Handshake, HeartCrack, Share2, Trophy, RotateCw, Home } from 'lucide-vue-next'
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
    :class="[
      'result-banner',
      `result-banner-${tone}`,
      tone === 'win' ? 'ring-success win-pulse ring-2' : '',
    ]"
  >
    <span v-if="tone === 'win'" class="victory-radiance" aria-hidden="true"></span>
    <div class="result-banner-content text-center">
      <span v-if="tone === 'win'" class="victory-emblem" aria-hidden="true">
        <Trophy :size="24" />
      </span>
      <h2 id="result-heading" class="victory-title text-section gap-2 flex items-center justify-center" :class="headingClass">
        <HeartCrack v-if="tone === 'loss'" :size="24" aria-hidden="true" />
        <Handshake v-if="tone === 'draw'" :size="24" aria-hidden="true" />
        {{ heading }}
      </h2>
      <p class="result-banner-message text-foreground-muted text-body mt-2">{{ message }}</p>
    </div>

    <template #footer>
      <div class="result-banner-actions space-y-2">
        <BaseButton v-if="tone === 'win'" variant="success" class="w-full" @click="$emit('share')">
          <Share2 :size="16" aria-hidden="true" /> Share Achievement (+50 Coins)
        </BaseButton>
        <BaseButton class="w-full font-bold shadow-glow" @click="$emit('playAgain')">
          <RotateCw :size="18" class="mr-2" aria-hidden="true" /> Play again
        </BaseButton>
        <BaseButton variant="secondary" class="w-full" @click="$emit('exit')">
          <Home :size="18" class="mr-2" aria-hidden="true" /> Back to lobby
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<!--
  Deliberately NOT scoped. This class is handed to BaseModal and lands on the
  dialog panel, which Teleports to <body> and therefore never carries this
  component's data-v attribute — a scoped rule here silently does nothing.
  Entry animation comes from BaseModal; these rules stage the content after
  the arena's sound-ready victory timeline completes.
-->
<style>
@keyframes win-glow {
  0% {
    box-shadow: var(--shadow-modal), 0 0 0 0 color-mix(in oklab, var(--color-success) 38%, transparent);
  }
  45% {
    box-shadow: var(--shadow-modal), 0 0 0 12px transparent, var(--shadow-glow);
  }
  100% {
    box-shadow: var(--shadow-modal), var(--shadow-glow), inset 0 1px 0 rgb(255 255 255 / 0.08);
  }
}

@keyframes victory-radiance-enter {
  from { opacity: 0; transform: scale(0.72); }
  55% { opacity: 0.7; }
  to { opacity: 0.34; transform: scale(1); }
}

@keyframes victory-content-enter {
  from { opacity: 0; transform: translateY(8px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.result-banner {
  isolation: isolate;
  overflow: hidden;
}

.result-banner-win {
  border-color: color-mix(in srgb, var(--color-success) 58%, var(--color-border-strong));
  background:
    radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--color-success) 14%, transparent), transparent 48%),
    var(--surface-3);
}

.win-pulse {
  animation: win-glow 900ms ease-out both;
}

.victory-radiance {
  position: absolute;
  inset: -40% -20% auto;
  z-index: -1;
  aspect-ratio: 1;
  border-radius: var(--radius-pill);
  background: radial-gradient(circle, var(--color-accent-glow), transparent 66%);
  filter: blur(var(--blur-md));
  pointer-events: none;
  animation: victory-radiance-enter 700ms ease-out both;
}

.victory-emblem {
  display: inline-flex;
  width: 3rem;
  height: 3rem;
  margin-bottom: 0.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--color-success) 55%, transparent);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-success) 14%, var(--surface-glass-strong));
  box-shadow: var(--shadow-glow), inset 0 1px 0 rgb(255 255 255 / 0.12);
  color: var(--color-success);
  animation: victory-content-enter 450ms 80ms ease-out both;
}

.victory-title {
  animation: victory-content-enter 350ms 140ms ease-out both;
}

.result-banner-message {
  animation: victory-content-enter 350ms 200ms ease-out both;
}

.result-banner-actions {
  animation: victory-content-enter 400ms 280ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .win-pulse,
  .victory-radiance,
  .victory-emblem,
  .victory-title,
  .result-banner-message,
  .result-banner-actions {
    animation: none;
  }

  .victory-radiance {
    display: none;
  }
}
</style>
