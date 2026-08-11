<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { X, RefreshCcw } from 'lucide-vue-next'

import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useSocketStore } from '@/stores/socket'
import { useMatchFoundNotification } from '@/composables/useMatchFoundNotification'
import { useCountdown } from '@/composables/useCountdown'
import TurnstileModal from '@/components/TurnstileModal.vue'

const socket = useSocketStore()
const router = useRouter()
const route = useRoute()
const matchFoundNotification = useMatchFoundNotification()
const { errorText, t } = useAppLanguage()

const turnstileModalOpen = computed(() => socket.pendingVerificationMode !== null)

// Hide tracker when in game routes
const isHidden = computed(() => route.path.startsWith('/game') || route.path.startsWith('/replay'))

const isVisible = computed(() => socket.isMatchmaking && !isHidden.value)
const isError = computed(() => socket.status === 'error')

const heading = computed(() =>
  socket.status === 'connecting'
    ? t('Connecting…', 'Đang kết nối…')
    : isError.value
      ? t('Matchmaking failed', 'Tìm trận thất bại')
      : socket.mode === 'ranked'
        ? t('Finding ranked match', 'Tìm trận xếp hạng')
        : t('Finding match', 'Tìm trận'),
)

function clock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const elapsedLabel = computed(() => clock(socket.searchProgress?.elapsed_seconds ?? 0))

// A lockout is minutes long, so the wait has to tick down rather than sit at
// the figure the server happened to send. While it runs, retrying can only be
// refused again — so the button goes away instead of inviting a pointless click.
const { secondsLeft: lockSecondsLeft } = useCountdown(computed(() => socket.retryUntil))
const isLocked = computed(() => lockSecondsLeft.value > 0)
const lockLabel = computed(() => clock(lockSecondsLeft.value))

watch(
  () => socket.status,
  (status) => {
    if (status === 'matched') {
      matchFoundNotification.notify()
      void router.push('/game')
    }
  },
)

function cancel() {
  socket.cancelMatchmaking()
}

function retry() {
  socket.requestMatchmaking(socket.mode)
}

function onTurnstileVerified(token: string) {
  socket.submitMatchmakingVerification(token)
}
</script>

<template>
  <Transition name="fade-slide">
    <aside
      v-if="isVisible"
      class="global-matchmaking-tracker"
      aria-labelledby="global-matchmaking-heading"
      aria-live="polite"
    >
      <div class="tracker-body">
        <BaseSpinner v-if="!isError" size="sm" class="shrink-0" />
        <div v-else class="status-dot shrink-0" aria-hidden="true" />

        <div class="tracker-content min-w-0">
          <strong id="global-matchmaking-heading" class="text-sm truncate block" :class="isError ? 'text-error' : 'text-foreground'">
            {{ heading }}
          </strong>

          <p v-if="isError" class="text-xs text-foreground-muted truncate">
            {{ socket.errorMessage ? errorText(socket.errorMessage) : t('Something went wrong.', 'Đã xảy ra lỗi.') }}
            <!-- A refusal that lifts by itself says when, so the player is not
                 left retrying blindly. -->
            <span v-if="isLocked" class="text-error font-mono font-bold tabular-nums">
              {{ t('Unlocks in', 'Mở khoá sau') }} {{ lockLabel }}
            </span>
          </p>
          <div v-else class="text-xs text-foreground-muted flex items-center gap-2 truncate">
            <template v-if="socket.status === 'searching'">
              <span class="text-accent font-mono font-bold tabular-nums">{{ elapsedLabel }}</span>
              <span v-if="socket.mode === 'ranked' && socket.searchProgress?.search_range" class="opacity-70">
                · ±{{ socket.searchProgress.search_range }}
              </span>
            </template>
            <template v-else>
              <span class="opacity-70">{{ t('Opening…', 'Đang mở…') }}</span>
            </template>
          </div>
        </div>
      </div>

      <div class="tracker-actions shrink-0">
        <button
          v-if="isError && !isLocked"
          type="button"
          class="tracker-btn tracker-btn--retry"
          :aria-label="t('Try again', 'Thử lại')"
          @click="retry"
        >
          <RefreshCcw :size="14" />
        </button>
        <button
          type="button"
          class="tracker-btn tracker-btn--cancel"
          :aria-label="isError ? t('Close', 'Đóng') : t('Cancel search', 'Hủy tìm trận')"
          @click="cancel"
        >
          <X :size="14" />
        </button>
      </div>
    </aside>
  </Transition>
  <TurnstileModal
    v-if="turnstileModalOpen"
    @verify="onTurnstileVerified"
    @close="socket.cancelMatchmakingVerification()"
  />
</template>

<style scoped>
.global-matchmaking-tracker {
  position: fixed;
  left: var(--space-xl);
  bottom: var(--space-xl);
  z-index: 50; /* Ensure it stays above most content, but manageable with toast */
  width: min(20rem, calc(100vw - var(--space-2xl)));
  padding: 0.5rem 0.75rem;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  background: var(--surface-glass-strong);
  box-shadow: var(--shadow-floating), var(--shadow-glow);
  backdrop-filter: blur(var(--blur-lg));
}

.tracker-body {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.tracker-content {
  display: flex;
  flex-direction: column;
}

.tracker-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border-left: 1px solid var(--color-border);
  padding-left: 0.5rem;
}

.tracker-btn {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-pill);
  color: var(--color-foreground-muted);
  background: transparent;
  transition: all 0.2s ease;
}

.tracker-btn:hover {
  color: var(--color-foreground);
  background: var(--surface-sunken);
}

.tracker-btn--retry:hover {
  color: var(--color-success);
}
.tracker-btn--cancel:hover {
  color: var(--color-error);
}

.status-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: var(--radius-pill);
  background: var(--color-error);
  box-shadow: 0 0 0.5rem color-mix(in srgb, var(--color-error) 40%, transparent);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(1rem) scale(0.95);
}

@media (max-width: 40rem) {
  .global-matchmaking-tracker {
    left: var(--space-md);
    bottom: var(--space-md);
    width: calc(100vw - var(--space-lg));
    border-radius: var(--radius-card);
  }
}
</style>
