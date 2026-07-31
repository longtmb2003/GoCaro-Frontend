<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { Circle, Scroll } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import GameBoard from '@/components/GameBoard.vue'
import ReplayControls from '@/components/ReplayControls.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useHistoryStore } from '@/stores/history'
import { formatDate, shortId } from '@/utils/format'

const route = useRoute()
const auth = useAuthStore()
const history = useHistoryStore()

const matchId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))

const playing = ref(false)
const speed = ref(700)
let timer: ReturnType<typeof setInterval> | null = null

watch(
  matchId,
  (id) => {
    pause()
    if (id !== '') {
      void history.loadReplay(id)
    }
  },
  { immediate: true },
)

onUnmounted(clearTimer)

function clearTimer(): void {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
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
  if (history.totalMoves === 0) {
    return
  }
  if (history.atEnd) {
    history.first()
  }
  playing.value = true
  startTimer()
}

function pause(): void {
  playing.value = false
  clearTimer()
}

function togglePlay(): void {
  if (playing.value) {
    pause()
  } else {
    play()
  }
}

function setSpeed(interval: number): void {
  speed.value = interval
  if (playing.value) {
    startTimer()
  }
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

const summary = computed(() => {
  const match = history.replayMatch
  if (match === null) {
    return null
  }
  const me = auth.user?.id
  const black = match.player1_id === me ? 'You' : shortId(match.player1_id)
  const white = match.player2_id === me ? 'You' : shortId(match.player2_id)

  let outcome: string
  if (match.status === 'in_progress') {
    outcome = 'In progress'
  } else if (match.status === 'abandoned') {
    outcome = 'Abandoned'
  } else if (match.winner_id === null) {
    outcome = 'Draw'
  } else {
    outcome = `${match.winner_id === me ? 'You' : shortId(match.winner_id)} won`
  }

  return { black, white, outcome, date: formatDate(match.created_at) }
})
</script>

<template>
  <AppLayout title="Replay">
    <!-- Match Specific Background Wallpaper -->
    <div class="fixed inset-0 z-[-1]" style="background-image: url('/match_bg.webp'); background-size: cover; background-position: center;">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
    </div>

    <template #actions>
      <RouterLink
        to="/history"
        class="text-foreground-muted hover:text-foreground text-sm font-medium transition-colors"
      >
        Back to history
      </RouterLink>
    </template>

    <div v-if="history.replayLoading" class="text-foreground-muted py-16 text-center text-sm">
      Loading replay…
    </div>

    <div v-else-if="history.replayError" class="py-16 text-center">
      <p class="text-danger-400 text-sm">{{ history.replayError }}</p>
      <RouterLink to="/history">
        <BaseButton variant="secondary" class="mt-4">Back to history</BaseButton>
      </RouterLink>
    </div>

    <div v-else-if="summary" class="grid gap-6 lg:grid-cols-[1fr_16rem] xl:grid-cols-[1fr_20rem] items-start">
      <!-- Left side: Board & Controls -->
      <div class="flex flex-col items-center gap-6 w-full">
        <GameBoard
          :board="history.replayBoard"
          :interactive="false"
          :last-move="history.replayLastMove"
          :your-symbol="null"
          class="w-full max-w-2xl"
        />
        
        <div class="w-full max-w-2xl">
          <ReplayControls
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
        </div>
      </div>

      <!-- Right side: Match Summary -->
      <div class="space-y-6">
        <GlassCard title="Match Summary" heading-tag="h3">
          <template #icon><Scroll :size="18" aria-hidden="true" /></template>

          <GlassCard
            as="p"
            variant="nested"
            class="text-foreground text-body flex items-center justify-between font-mono font-bold"
          >
            <span class="text-accent flex flex-col items-center font-black">
              <span class="text-caption text-foreground-muted mb-1 tracking-widest uppercase">
                Black
              </span>
              <span class="gap-2 flex items-center"><Circle :size="16" fill="currentColor" aria-hidden="true" />{{ summary.black }}</span>
            </span>
            <span class="text-foreground-muted text-caption font-black tracking-widest uppercase">
              vs
            </span>
            <span class="text-error flex flex-col items-center font-black">
              <span class="text-caption text-foreground-muted mb-1 tracking-widest uppercase">
                White
              </span>
              <span class="gap-2 flex items-center">{{ summary.white }}<Circle :size="16" aria-hidden="true" /></span>
            </span>
          </GlassCard>

          <div class="border-border-subtle mt-4 pt-4 border-t text-center">
            <p class="text-foreground text-card">{{ summary.outcome }}</p>
            <p class="text-foreground-muted text-small mt-1 font-semibold">{{ summary.date }}</p>
          </div>
        </GlassCard>
      </div>
    </div>
  </AppLayout>
</template>
