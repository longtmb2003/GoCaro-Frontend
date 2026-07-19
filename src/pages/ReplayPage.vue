<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
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

// Reloading on the id (not just on mount) keeps the replay correct if the route
// param changes while this component is reused.
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
  // Restart from the beginning when replaying a finished game.
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

// Stepping by hand stops auto-play so the two don't fight over the index.
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

    <div v-else-if="summary" class="mx-auto max-w-xl space-y-5">
      <div class="border-border-subtle bg-surface rounded-lg border p-4 text-center">
        <p class="text-foreground font-mono text-sm">
          <span class="font-semibold">●</span> {{ summary.black }}
          <span class="text-foreground-muted">vs</span>
          {{ summary.white }} <span class="font-semibold">○</span>
        </p>
        <p class="text-foreground-muted mt-1 text-xs">{{ summary.outcome }} · {{ summary.date }}</p>
      </div>

      <div class="flex justify-center">
        <GameBoard :board="history.replayBoard" :interactive="false" :last-move="history.replayLastMove" />
      </div>

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
  </AppLayout>
</template>
