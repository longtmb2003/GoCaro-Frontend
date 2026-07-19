<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import GameBoard from '@/components/GameBoard.vue'
import GameResultBanner from '@/components/GameResultBanner.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { useSocketStore } from '@/stores/socket'
import type { GameResult } from '@/types/game'

const auth = useAuthStore()
const game = useGameStore()
const socket = useSocketStore()
const router = useRouter()

const confirmingResign = ref(false)

const yourColor = computed(() => (game.yourSymbol === 1 ? 'Black' : 'White'))
const opponentColor = computed(() => (game.yourSymbol === 1 ? 'White' : 'Black'))

const turnLabel = computed(() => (game.yourTurn ? 'Your turn' : `${game.opponent}'s turn`))

const banner = computed<{ heading: string; message: string; tone: GameResult['outcome'] } | null>(
  () => {
    if (game.phase === 'connection-lost') {
      return {
        heading: 'Connection lost',
        message: 'You were disconnected from the match.',
        tone: 'draw',
      }
    }
    if (game.phase === 'over' && game.result !== null) {
      const { heading, message } = resultText(game.result)
      return { heading, message, tone: game.result.outcome }
    }
    return null
  },
)

function resultText(result: GameResult): { heading: string; message: string } {
  if (result.outcome === 'draw') {
    return { heading: 'Draw', message: 'The board is full.' }
  }
  const heading = result.outcome === 'win' ? 'Victory' : 'Defeat'
  const messages: Record<GameResult['outcome'], Record<string, string>> = {
    win: {
      five_in_row: 'You got five in a row.',
      resign: 'Your opponent resigned.',
      timeout: 'Your opponent ran out of time.',
      disconnect: 'Your opponent disconnected.',
    },
    loss: {
      five_in_row: 'Your opponent got five in a row.',
      resign: 'You resigned.',
      timeout: 'You ran out of time.',
      disconnect: 'You were disconnected.',
    },
    draw: {},
  }
  const fallback = result.outcome === 'win' ? 'You won.' : 'You lost.'
  return { heading, message: messages[result.outcome][result.reason] ?? fallback }
}

function onMove(x: number, y: number): void {
  socket.sendMove(x, y)
}

function confirmResign(): void {
  socket.sendResign()
  confirmingResign.value = false
}

async function leave(): Promise<void> {
  socket.leaveGame()
  await router.push('/')
}
</script>

<template>
  <AppLayout title="Match">
    <div class="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div class="flex justify-center">
        <GameBoard
          :board="game.board"
          :interactive="game.canPlay"
          :last-move="game.lastMove"
          @move="onMove"
        />
      </div>

      <div class="space-y-4">
        <div
          class="border-border-subtle bg-surface rounded-lg border p-4 text-center"
          aria-live="polite"
        >
          <p class="text-foreground font-semibold">{{ turnLabel }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="border-border-subtle bg-surface rounded-lg border p-3 text-center">
            <p class="text-foreground-muted text-xs font-medium tracking-wide uppercase">You</p>
            <p class="text-foreground mt-1 truncate font-semibold">{{ auth.user?.username }}</p>
            <p class="text-foreground-muted mt-0.5 text-sm">{{ yourColor }}</p>
          </div>
          <div class="border-border-subtle bg-surface rounded-lg border p-3 text-center">
            <p class="text-foreground-muted text-xs font-medium tracking-wide uppercase">
              Opponent
            </p>
            <p class="text-foreground mt-1 truncate font-semibold">{{ game.opponent }}</p>
            <p class="text-foreground-muted mt-0.5 text-sm">{{ opponentColor }}</p>
          </div>
        </div>

        <p v-if="game.moveError" class="text-danger-400 text-center text-sm" role="alert">
          {{ game.moveError }}
        </p>

        <div v-if="game.phase === 'playing'" class="border-border-subtle border-t pt-4">
          <BaseButton
            v-if="!confirmingResign"
            variant="danger"
            class="w-full"
            @click="confirmingResign = true"
          >
            Resign
          </BaseButton>
          <div v-else class="space-y-2">
            <p class="text-foreground text-center text-sm">Resign this match?</p>
            <div class="flex gap-2">
              <BaseButton variant="danger" class="flex-1" @click="confirmResign">Confirm</BaseButton>
              <BaseButton variant="secondary" class="flex-1" @click="confirmingResign = false">
                Keep playing
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <GameResultBanner
      v-if="banner"
      :heading="banner.heading"
      :message="banner.message"
      :tone="banner.tone"
      @exit="leave"
    />
  </AppLayout>
</template>
