<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import BaseButton from '@/components/BaseButton.vue'
import type { MatchmakingStatus } from '@/stores/socket'

const props = defineProps<{
  status: MatchmakingStatus
  errorMessage: string | null
}>()

const emit = defineEmits<{ cancel: []; retry: [] }>()

const isError = computed(() => props.status === 'error')
const heading = computed(() =>
  props.status === 'connecting'
    ? 'Connecting…'
    : isError.value
      ? 'Matchmaking failed'
      : 'Finding an opponent',
)

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
        <template v-if="status === 'searching'">Searching for a worthy opponent…</template>
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
