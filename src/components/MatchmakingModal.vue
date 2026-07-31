<script setup lang="ts">
import { computed } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import type { MatchmakingStatus } from '@/stores/socket'
import type { MatchmakingMode } from '@/types/game'

const props = withDefaults(
  defineProps<{
    status: MatchmakingStatus
    errorMessage: string | null
    mode?: MatchmakingMode
    searchProgress?: { elapsed_seconds: number; search_range?: number } | null
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

const elapsedLabel = computed(() => {
  const progress = props.searchProgress
  if (progress === null) {
    return '00:00'
  }
  const minutes = Math.floor(progress.elapsed_seconds / 60)
  const seconds = progress.elapsed_seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})
</script>

<template>
  <BaseModal aria-labelledby="matchmaking-heading" @close="emit('cancel')">
    <div class="text-center">
      <div v-if="!isError" class="mb-6 flex justify-center">
        <BaseSpinner size="lg" />
      </div>

      <h2 id="matchmaking-heading" class="text-card text-foreground">{{ heading }}</h2>

      <p v-if="isError" class="text-error text-body mt-2">
        {{ errorMessage ?? 'Something went wrong.' }}
      </p>
      <div v-else class="text-foreground-muted text-body mt-3 space-y-2" aria-live="polite">
        <template v-if="status === 'searching'">
          <p class="text-accent text-card font-mono tabular-nums">{{ elapsedLabel }}</p>
          <p v-if="mode === 'ranked' && searchProgress?.search_range" class="text-small">
            searching within ±{{ searchProgress.search_range }} rating
          </p>
          <p v-else class="text-small">Looking for a worthy opponent...</p>
        </template>
        <template v-else>Opening a connection…</template>
      </div>
    </div>

    <template #footer>
      <div class="gap-3 flex justify-center">
        <BaseButton v-if="isError" class="flex-1" @click="emit('retry')">Try again</BaseButton>
        <BaseButton variant="secondary" class="flex-1" @click="emit('cancel')">
          {{ isError ? 'Close' : 'Cancel' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
