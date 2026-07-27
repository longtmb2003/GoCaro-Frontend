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
      <div
        class="bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-5 text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden group"
      >
        <div
          class="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 pointer-events-none group-hover:from-primary-500/20 group-hover:to-secondary-500/20 transition-all duration-500"
        ></div>
        <p class="text-white font-mono text-sm relative z-10 font-bold drop-shadow-sm">
          <span class="text-primary-400 font-black">●</span> {{ summary.black }}
          <span class="text-white/50 mx-2 uppercase text-[10px] font-black tracking-widest"
            >vs</span
          >
          {{ summary.white }} <span class="text-rose-400 font-black">○</span>
        </p>
        <p class="text-white/70 mt-2 text-xs font-medium tracking-wide relative z-10">
          {{ summary.outcome }} <span class="mx-1">•</span> {{ summary.date }}
        </p>
      </div>

      <div class="flex justify-center">
        <GameBoard
          :board="history.replayBoard"
          :interactive="false"
          :last-move="history.replayLastMove"
        />
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
