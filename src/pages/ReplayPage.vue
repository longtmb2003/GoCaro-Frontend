<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Circle, ListOrdered, Scroll, Share2 } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import BoardRenderer from '@/components/board-renderer/BoardRenderer.vue'
import ReplayControls from '@/components/ReplayControls.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useHistoryStore } from '@/stores/history'
import { useShareLink } from '@/composables/useShareLink'
import { useToast } from '@/composables/useToast'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { formatDate, shortId } from '@/utils/format'

const route = useRoute()
const auth = useAuthStore()
const history = useHistoryStore()
const shareLink = useShareLink()
const { addToast } = useToast()
const { t } = useAppLanguage()

const matchId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const playing = ref(false)
const speed = ref(700)
let timer: ReturnType<typeof setInterval> | null = null

watch(
  matchId,
  (id) => {
    pause()
    if (id) void history.loadReplay(id)
  },
  { immediate: true },
)

function clearTimer(): void {
  if (timer === null) return
  clearInterval(timer)
  timer = null
}

function startTimer(): void {
  clearTimer()
  timer = setInterval(() => {
    if (history.atEnd) {
      pause()
      return
    }
    history.stepNext()
  }, speed.value)
}

function play(): void {
  if (history.totalMoves === 0) return
  if (history.atEnd) history.first()
  playing.value = true
  startTimer()
}

function pause(): void {
  playing.value = false
  clearTimer()
}

function togglePlay(): void {
  if (playing.value) pause()
  else play()
}

function setSpeed(interval: number): void {
  speed.value = interval
  if (playing.value) startTimer()
}

function onFirst(): void {
  pause()
  history.first()
}

function onPrev(): void {
  pause()
  history.stepPrev()
}

function onNext(): void {
  pause()
  history.stepNext()
}

function onLast(): void {
  pause()
  history.last()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
  if (event.key === ' ') {
    event.preventDefault()
    togglePlay()
  } else if (event.key === 'ArrowLeft') {
    onPrev()
  } else if (event.key === 'ArrowRight') {
    onNext()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  clearTimer()
  window.removeEventListener('keydown', onKeydown)
})

function playerName(id: string): string {
  const match = history.replayMatch
  if (!match) return shortId(id)
  if (id === match.player1_id) return match.player1_name || shortId(id)
  return match.player2_name || shortId(id)
}

const summary = computed(() => {
  const match = history.replayMatch
  if (!match) return null
  const me = auth.user?.id
  const black = match.player1_id === me ? t('You', 'Bạn') : match.player1_name || shortId(match.player1_id)
  const white = match.player2_id === me ? t('You', 'Bạn') : match.player2_name || shortId(match.player2_id)

  let outcome = t('Draw', 'Hòa')
  if (match.status === 'in_progress') outcome = t('In progress', 'Đang diễn ra')
  else if (match.status === 'abandoned') outcome = t('Abandoned', 'Đã hủy')
  else if (match.winner_id)
    outcome = `${match.winner_id === me ? t('You', 'Bạn') : playerName(match.winner_id)} ${t('won', 'đã thắng')}`

  return {
    black,
    blackHandle: match.player1_username ? `@${match.player1_username}` : t('Guest', 'Khách'),
    white,
    whiteHandle: match.player2_username ? `@${match.player2_username}` : t('Guest', 'Khách'),
    outcome,
    date: formatDate(match.created_at),
    ranked: match.is_ranked,
  }
})

const canShare = computed(() => {
  const match = history.replayMatch
  const me = auth.user?.id
  return Boolean(match && me && (match.player1_id === me || match.player2_id === me))
})

async function shareReplay(): Promise<void> {
  try {
    await shareLink.share({
      title: t('GoCaro match replay', 'Xem lại trận GoCaro'),
      text: t('Watch this GoCaro match replay!', 'Xem lại trận GoCaro này!'),
      matchId: matchId.value,
    })
  } catch {
    addToast(t('Unable to create a replay link. Please try again.', 'Không thể tạo liên kết xem lại. Vui lòng thử lại.'), 'error')
  }
}
</script>

<template>
  <AppLayout title="Replay" fantasy>
    <div class="replay-background" aria-hidden="true"><div /></div>

    <template #actions>
      <div class="gap-3 flex items-center">
        <BaseButton v-if="canShare" variant="secondary" size="sm" @click="shareReplay">
          <Share2 :size="16" aria-hidden="true" /> {{ t('Share replay', 'Chia sẻ replay') }}
        </BaseButton>
        <RouterLink
          :to="auth.isAuthenticated ? '/history' : '/'"
          class="text-foreground-muted hover:text-foreground text-sm font-medium transition-colors"
        >
          {{ auth.isAuthenticated ? t('Back to history', 'Về lịch sử') : t('Go to GoCaro', 'Đến GoCaro') }}
        </RouterLink>
      </div>
    </template>

    <div v-if="history.replayLoading" class="text-foreground-muted py-16 text-center" aria-live="polite">
      {{ t('Loading replay…', 'Đang tải replay…') }}
    </div>

    <div v-else-if="history.replayErrorCode === 'REPLAY_EXPIRED'" class="py-16 text-center">
      <EmptyState :title="t('Replay expired', 'Replay đã hết hạn')" :description="t('Replays are kept for 3 days after a match ends.', 'Replay được lưu trong 3 ngày sau khi trận đấu kết thúc.')" />
    </div>

    <div v-else-if="history.replayError" class="py-16 text-center">
      <EmptyState :title="t('Replay unavailable', 'Replay không khả dụng')" :description="history.replayError" />
    </div>

    <div v-else-if="summary" class="replay-layout">
      <section class="gap-6 flex min-w-0 flex-col items-center" :aria-label="t('Replay board', 'Bàn cờ replay')">
        <BoardRenderer
          :board="history.replayBoard"
          :interactive="false"
          :last-move="history.replayLastMove"
          :your-symbol="null"
          class="w-full max-w-2xl"
        />
        <ReplayControls
          class="w-full max-w-2xl"
          :move-index="history.moveIndex"
          :total-moves="history.totalMoves"
          :at-start="history.atStart"
          :at-end="history.atEnd"
          :playing="playing"
          :speed="speed"
          @first="onFirst"
          @prev="onPrev"
          @next="onNext"
          @last="onLast"
          @toggle-play="togglePlay"
          @set-speed="setSpeed"
        />
        <p class="text-foreground-muted text-caption">{{ t('Keyboard: Space to play/pause · ← → to step', 'Bàn phím: Space để phát/tạm dừng · ← → để chuyển nước') }}</p>
      </section>

      <aside class="space-y-6" :aria-label="t('Replay details', 'Chi tiết replay')">
        <GlassCard :title="t('Match Summary', 'Tóm tắt trận')" heading-tag="h2">
          <template #icon><Scroll :size="18" aria-hidden="true" /></template>
          <div class="players-summary">
            <div>
              <span class="text-caption text-foreground-muted uppercase">{{ t('Black', 'Đen') }}</span>
              <strong class="text-accent"><Circle :size="14" fill="currentColor" />{{ summary.black }}</strong>
              <small>{{ summary.blackHandle }}</small>
            </div>
            <span class="text-foreground-muted text-caption font-black">VS</span>
            <div>
              <span class="text-caption text-foreground-muted uppercase">{{ t('White', 'Trắng') }}</span>
              <strong class="text-error">{{ summary.white }}<Circle :size="14" /></strong>
              <small>{{ summary.whiteHandle }}</small>
            </div>
          </div>
          <div class="border-border-subtle mt-4 border-t pt-4 text-center">
            <p class="text-foreground text-card">{{ summary.outcome }}</p>
            <p class="text-foreground-muted text-small mt-1">
              {{ summary.ranked ? t('Ranked', 'Xếp hạng') : t('Casual', 'Đấu thường') }} · {{ summary.date }}
            </p>
          </div>
        </GlassCard>

        <GlassCard :title="t('Move timeline', 'Dòng thời gian nước đi')" heading-tag="h2">
          <template #icon><ListOrdered :size="18" aria-hidden="true" /></template>
          <ol class="move-timeline" :aria-label="t('Recorded moves', 'Các nước đã ghi lại')">
            <li v-for="move in history.replayMoves" :key="move.move_no">
              <button
                type="button"
                :class="{ 'move-timeline__button--active': history.moveIndex === move.move_no }"
                class="move-timeline__button"
                @click="pause(); history.jumpTo(move.move_no)"
              >
                <span>#{{ move.move_no }}</span>
                <span class="min-w-0 flex-1 truncate">{{ playerName(move.player_id) }}</span>
                <span class="font-mono">{{ move.x + 1 }},{{ move.y + 1 }}</span>
              </button>
            </li>
          </ol>
        </GlassCard>
      </aside>
    </div>
  </AppLayout>
</template>

<style scoped>
.replay-background {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: url('/match_bg.webp') center / cover;
}

.replay-background > div {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.3);
  backdrop-filter: blur(var(--blur-sm));
}

.replay-layout {
  display: grid;
  align-items: start;
  gap: var(--space-xl);
}

.players-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-md);
  text-align: center;
}

.players-summary div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-xs);
}

.players-summary strong {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  overflow: hidden;
  text-overflow: ellipsis;
}

.players-summary small {
  color: var(--text-muted);
  font-family: monospace;
}

.move-timeline {
  max-height: 22rem;
  overflow-y: auto;
}

.move-timeline__button {
  display: flex;
  width: 100%;
  min-height: 2.75rem;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  text-align: left;
  transition: color var(--transition-duration-fast), background var(--transition-duration-fast);
}

.move-timeline__button:hover,
.move-timeline__button:focus-visible,
.move-timeline__button--active {
  background: var(--surface-glass-light);
  color: var(--text-primary);
  outline: none;
}

.move-timeline__button--active {
  box-shadow: inset 3px 0 0 var(--color-accent);
}

@media (min-width: 64rem) {
  .replay-layout {
    grid-template-columns: minmax(0, 1fr) 20rem;
  }
}
</style>
