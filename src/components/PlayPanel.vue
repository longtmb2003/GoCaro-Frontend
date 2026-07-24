<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import type { MatchmakingMode } from '@/types/game'

withDefaults(defineProps<{ isGuest?: boolean }>(), { isGuest: false })

const emit = defineEmits<{ play: [mode: MatchmakingMode]; upgrade: [] }>()
</script>

<template>
  <section
    class="border-border-subtle bg-surface rounded-lg border p-6 shadow-sm"
    aria-label="Play"
  >
    <h2 class="text-foreground text-lg font-semibold">Ready to play?</h2>
    <p class="text-foreground-muted mt-1 text-sm">
      Ranked matches move your rating. Casual matches leave it alone.
    </p>

    <div class="mt-4 space-y-3">
      <BaseButton
        class="w-full"
        :disabled="isGuest"
        :aria-describedby="isGuest ? 'ranked-locked' : undefined"
        @click="emit('play', 'ranked')"
      >
        Play ranked
      </BaseButton>

      <p v-if="isGuest" id="ranked-locked" class="text-foreground-muted text-sm">
        Ranked needs a saved account.
        <button
          type="button"
          class="text-primary-400 hover:text-primary-300 font-medium underline-offset-2 hover:underline"
          @click="emit('upgrade')"
        >
          Save progress
        </button>
      </p>

      <BaseButton variant="secondary" class="w-full" @click="emit('play', 'casual')">
        Play casual
      </BaseButton>
    </div>
  </section>
</template>
