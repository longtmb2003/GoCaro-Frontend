<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import BaseButton from '@/components/BaseButton.vue'
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
    <div class="bg-surface/90 backdrop-blur-xl w-full max-w-sm rounded-2xl p-8 text-center shadow-2xl ring-1 ring-white/20 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 pointer-events-none"></div>
      
      <div v-if="!isError" class="mb-6 flex justify-center relative" aria-hidden="true">
        <div class="absolute inset-0 rounded-full bg-primary-500/20 blur-xl animate-pulse"></div>
        <span class="border-primary-500 size-12 animate-spin rounded-full border-4 border-t-transparent shadow-lg" />
      </div>

      <h2 id="matchmaking-heading" class="text-foreground text-xl font-bold relative">{{ heading }}</h2>

      <p v-if="isError" class="text-danger-400 mt-2 text-sm relative">
        {{ errorMessage ?? 'Something went wrong.' }}
      </p>
      <div v-else class="text-foreground-muted mt-3 text-sm relative space-y-1" aria-live="polite">
        <template v-if="status === 'searching'">
          <div class="font-mono text-lg font-medium text-primary-400">
            {{ searchProgress ? `${Math.floor(searchProgress.elapsed_seconds / 60).toString().padStart(2, '0')}:${(searchProgress.elapsed_seconds % 60).toString().padStart(2, '0')}` : '00:00' }}
          </div>
          <p v-if="mode === 'ranked' && searchProgress?.search_range" class="text-xs">
            searching within ±{{ searchProgress.search_range }} rating
          </p>
          <p v-else class="text-xs">Looking for a worthy opponent...</p>
        </template>
        <template v-else>Opening a connection…</template>
      </div>

      <div class="mt-8 flex justify-center gap-3 relative">
        <BaseButton v-if="isError" class="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 border-0 shadow-lg shadow-primary-500/30 text-white" @click="emit('retry')">Try again</BaseButton>
        <BaseButton ref="cancelButton" class="flex-1 bg-gradient-to-r from-gray-600 to-slate-700 hover:from-gray-500 hover:to-slate-600 text-white border-0 shadow-lg" @click="emit('cancel')">
          {{ isError ? 'Close' : 'Cancel' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
