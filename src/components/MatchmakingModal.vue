<script setup lang="ts">
import { computed } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
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
const { errorText, t } = useAppLanguage()

const isError = computed(() => props.status === 'error')
const heading = computed(() =>
  props.status === 'connecting'
    ? t('Connecting…', 'Đang kết nối…')
    : isError.value
      ? t('Matchmaking failed', 'Tìm trận thất bại')
      : props.mode === 'ranked'
        ? t('Finding a ranked opponent', 'Đang tìm đối thủ xếp hạng')
        : t('Finding an opponent', 'Đang tìm đối thủ'),
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
  <aside
    class="matchmaking-card"
    aria-labelledby="matchmaking-heading"
    aria-live="polite"
  >
    <div class="matchmaking-card__body">
      <BaseSpinner v-if="!isError" size="md" />
      <div class="min-w-0 flex-1">
        <h2 id="matchmaking-heading" class="text-card text-foreground">{{ heading }}</h2>
        <p v-if="isError" class="text-error text-small mt-1">
          {{ errorMessage ? errorText(errorMessage) : t('Something went wrong.', 'Đã xảy ra lỗi.') }}
        </p>
        <div v-else class="text-foreground-muted text-small mt-1">
        <template v-if="status === 'searching'">
            <span class="text-accent font-mono font-bold tabular-nums">{{ elapsedLabel }}</span>
            <span v-if="mode === 'ranked' && searchProgress?.search_range">
              · ±{{ searchProgress.search_range }} {{ t('rating', 'điểm') }}
            </span>
            <span v-else> · {{ t('You can keep using the lobby', 'Bạn vẫn có thể sử dụng sảnh') }}</span>
        </template>
        <template v-else>{{ t('Opening a connection…', 'Đang mở kết nối…') }}</template>
        </div>
      </div>
    </div>
    <div class="matchmaking-card__actions">
      <BaseButton v-if="isError" size="sm" @click="emit('retry')">{{ t('Try again', 'Thử lại') }}</BaseButton>
      <BaseButton variant="secondary" size="sm" @click="emit('cancel')">
        {{ isError ? t('Close', 'Đóng') : t('Cancel search', 'Hủy tìm trận') }}
      </BaseButton>
    </div>
  </aside>
</template>

<style scoped>
.matchmaking-card {
  position: fixed;
  right: var(--space-lg);
  bottom: var(--space-lg);
  z-index: 40;
  width: min(24rem, calc(100vw - var(--space-2xl)));
  padding: var(--space-lg);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-card);
  background: var(--surface-glass-strong);
  box-shadow: var(--shadow-floating), var(--shadow-glow);
  backdrop-filter: blur(var(--blur-lg));
}

.matchmaking-card__body,
.matchmaking-card__actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.matchmaking-card__actions {
  justify-content: flex-end;
  margin-top: var(--space-lg);
}

@media (max-width: 40rem) {
  .matchmaking-card {
    right: var(--space-md);
    bottom: var(--space-md);
    width: calc(100vw - var(--space-xl));
  }
}
</style>
