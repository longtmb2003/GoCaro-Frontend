<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import BaseButton from '@/components/BaseButton.vue'
import type { MatchmakingStatus } from '@/stores/socket'
import type { MatchmakingMode, QueueSearchingPayload } from '@/types/game'

const props = withDefaults(
  defineProps<{
    status: MatchmakingStatus
    errorMessage: string | null
    mode?: MatchmakingMode
    searchProgress?: QueueSearchingPayload | null
  }>(),
  {
    mode: 'casual',
    searchProgress: null,
  },
)

const emit = defineEmits<{ cancel: []; retry: [] }>()

const isError = computed(() => props.status === 'error')
const heading = computed(() =>
  props.status === 'connecting'
    ? 'Connecting…'
    : isError.value
      ? 'Matchmaking failed'
      : props.mode === 'ranked'
        ? 'Finding a ranked opponent'
        : 'Finding an opponent',
)

/**
 * Ranked widens the rating it accepts the longer a player waits, and the server
 * reports each widening. Showing it turns a silent wait into visible progress.
 */
const progressLabel = computed(() => {
  const progress = props.searchProgress
  if (props.mode !== 'ranked' || progress === null) {
    return null
  }
  return (
    `Waited ${progress.elapsed_seconds.toString()}s · ` +
    `searching within ±${progress.search_range.toString()} rating`
  )
})

const dialog = ref<HTMLElement | null>(null)

onMounted(() => {
  dialog.value?.querySelector('button')?.focus()
})

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('cancel')
  }
}
</script>

<template>
  <div
    ref="dialog"
    class="fixed inset-0 z-1300 flex items-center justify-center bg-black/60 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="matchmaking-heading"
    @keydown="onKeydown"
  >
    <div class="bg-surface-elevated w-full max-w-sm rounded-lg p-6 text-center shadow-lg">
      <div v-if="!isError" class="mb-4 flex justify-center" aria-hidden="true">
        <span
          class="border-primary-500 size-10 animate-spin rounded-full border-3 border-t-transparent"
        />
      </div>

      <h2 id="matchmaking-heading" class="text-foreground text-lg font-semibold">{{ heading }}</h2>

      <p v-if="isError" class="text-danger-400 mt-2 text-sm">
        {{ errorMessage ?? 'Something went wrong.' }}
      </p>
      <p v-else class="text-foreground-muted mt-2 text-sm" aria-live="polite">
        <template v-if="status === 'searching'">
          {{ progressLabel ?? 'Searching for a worthy opponent…' }}
        </template>
        <template v-else>Opening a connection…</template>
      </p>

      <div class="mt-6 flex justify-center gap-3">
        <BaseButton v-if="isError" @click="emit('retry')">Try again</BaseButton>
        <BaseButton ref="cancelButton" variant="secondary" @click="emit('cancel')">
          {{ isError ? 'Close' : 'Cancel' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
