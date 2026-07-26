<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/BaseButton.vue'
import GameBoard from '@/components/GameBoard.vue'
import GameResultBanner from '@/components/GameResultBanner.vue'
import OpponentLeftBanner from '@/components/OpponentLeftBanner.vue'
import ReconnectingOverlay from '@/components/ReconnectingOverlay.vue'
import TurnTimer from '@/components/TurnTimer.vue'
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

// The board stays playable only on a live connection. While reconnecting the
// phase is still 'playing', so without this a player could click into a socket
// that is not there — a no-op that looks like the move was accepted.
const boardInteractive = computed(() => game.canPlay && socket.connection === 'live')

const reconnecting = computed(() => socket.connection === 'reconnecting')

interface Banner {
  heading: string
  message: string
  tone: GameResult['outcome']
  ratingDelta: number | null
}

const banner = computed<Banner | null>(() => {
  if (game.phase === 'connection-lost') {
    // The match may still be running on the server, so no rating is claimed here.
    return {
      heading: 'Connection lost',
      message: 'You were disconnected from the match.',
      tone: 'draw',
      ratingDelta: null,
    }
  }
  if (game.phase === 'over' && game.result !== null) {
    const { heading, message } = resultText(game.result)
    return { heading, message, tone: game.result.outcome, ratingDelta: game.result.ratingDelta }
  }
  return null
})

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

/**
 * A ranked result moves both ratings, but the backend applies elo asynchronously
 * after `game_over` and never sends the new number over the socket. Reloading the
 * profile on the way out is what makes the lobby show the updated rating; it is
 * deliberately not awaited, since the rating is informational and the player
 * should not wait on it to leave.
 */
function refreshRatingIfRanked(): void {
  if (socket.mode === 'ranked') {
    void auth.refreshProfile()
  }
}

async function leave(): Promise<void> {
  refreshRatingIfRanked()
  socket.leaveGame()
  await router.push('/')
}

async function playAgain(): Promise<void> {
  const mode = socket.mode
  refreshRatingIfRanked()
  socket.leaveGame()
  await router.push('/')
  socket.startMatchmaking(mode)
}

async function shareAchievement(): Promise<void> {
  const onSuccess = () => {
    alert('Link shared! Thanks for sharing!')
  }

  // `navigator.share` is typed as always present but is absent in many browsers.
  // Cast to a possibly-undefined function so the feature check is real and the
  // fallback branch keeps full access to `navigator`.
  const nativeShare = (navigator.share as ((data: ShareData) => Promise<void>) | undefined)?.bind(
    navigator,
  )
  if (nativeShare) {
    try {
      await nativeShare({
        title: 'GoCaro - Play Gomoku Online',
        text: 'I just won a match of Gomoku on GoCaro!',
        url: window.location.origin,
      })
      const granted = await auth.shareAchievement()
      if (granted) alert('You earned 50 Coins for sharing!')
    } catch {
      // The user dismissed the share sheet, or sharing failed; nothing to recover.
    }
  } else {
    void navigator.clipboard.writeText(window.location.origin)
    const granted = await auth.shareAchievement()
    if (granted) alert('You earned 50 Coins for sharing!')
    onSuccess()
  }
}
</script>

<template>
  <AppLayout title="Match">
    <div class="grid gap-6 lg:grid-cols-[1fr_16rem] xl:grid-cols-[1fr_18rem]">
      <div class="flex justify-center">
        <GameBoard
          :board="game.board"
          :interactive="boardInteractive"
          :last-move="game.lastMove"
          @move="onMove"
        />
      </div>

      <div class="space-y-4">
        <OpponentLeftBanner
          v-if="socket.opponentReconnectSecondsLeft !== null"
          :seconds-left="socket.opponentReconnectSecondsLeft"
        />

        <div class="border-border-subtle bg-surface/80 backdrop-blur-md rounded-2xl border p-4 shadow-lg ring-1 ring-white/10 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 pointer-events-none"></div>
          <p class="text-foreground text-center font-semibold" aria-live="polite">
            {{ turnLabel }}
          </p>
          <TurnTimer
            v-if="game.phase === 'playing'"
            class="mt-3"
            :seconds-left="socket.turnSecondsLeft"
            :total-seconds="socket.turnBudgetSeconds"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="border-border-subtle bg-surface/80 backdrop-blur-sm rounded-xl border p-3 text-center shadow-md relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none"></div>
            <p class="text-foreground-muted text-xs font-medium tracking-wide uppercase">You</p>
            <p class="text-foreground mt-1 truncate font-semibold">🧑‍💻 {{ auth.displayName }}</p>
            <p class="text-foreground-muted mt-0.5 text-sm">{{ yourColor }}</p>
          </div>
          <div class="border-border-subtle bg-surface/80 backdrop-blur-sm rounded-xl border p-3 text-center shadow-md relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-bl from-red-500/10 to-transparent pointer-events-none"></div>
            <p class="text-foreground-muted text-xs font-medium tracking-wide uppercase">
              Opponent
            </p>
            <p class="text-foreground mt-1 truncate font-semibold">🧑‍💻 {{ game.opponent }}</p>
            <p class="text-foreground-muted mt-0.5 text-sm">{{ opponentColor }}</p>
          </div>
        </div>

        <p v-if="game.moveError" class="text-danger-400 text-center text-sm" role="alert">
          {{ game.moveError }}
        </p>

        <div v-if="game.phase === 'playing'" class="border-border-subtle border-t pt-4 space-y-3">
          <div v-if="!confirmingResign" class="flex gap-2">
            <BaseButton
              variant="secondary"
              class="flex-1"
              :disabled="socket.waitingForDrawResponse || socket.drawOffersLeft === 0"
              @click="socket.sendOfferDraw()"
            >
              {{ socket.waitingForDrawResponse ? 'Waiting...' : `🏳️ Draw (${socket.drawOffersLeft})` }}
            </BaseButton>
            <BaseButton
              class="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white border-0 shadow-lg shadow-red-500/30"
              @click="confirmingResign = true"
            >
              Resign
            </BaseButton>
          </div>
          <div v-else class="space-y-2">
            <p class="text-foreground text-center text-sm">Resign this match?</p>
            <div class="flex gap-2">
              <BaseButton class="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white border-0 shadow-lg shadow-red-500/30" @click="confirmResign"
                >Confirm</BaseButton
              >
              <BaseButton variant="secondary" class="flex-1" @click="confirmingResign = false">
                Keep playing
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ReconnectingOverlay
      v-if="reconnecting"
      :seconds-left="socket.reconnectSecondsLeft"
      @leave="leave"
    />

    <GameResultBanner
      v-if="banner"
      :heading="banner.heading"
      :message="banner.message"
      :tone="banner.tone"
      :rating-delta="banner.ratingDelta"
      @play-again="playAgain"
      @exit="leave"
      @share="shareAchievement"
    />

    <!-- Draw Offer Dialog -->
    <div
      v-if="socket.drawOfferPending"
      class="fixed inset-0 z-1300 flex items-center justify-center bg-black/60 p-4"
    >
      <div class="bg-surface/90 backdrop-blur-xl w-full max-w-sm rounded-2xl p-8 text-center shadow-2xl ring-1 ring-white/20 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 pointer-events-none"></div>
        <h2 class="text-xl font-bold flex justify-center items-center gap-2">
          <span class="text-3xl">🏳️</span> Draw Offer
        </h2>
        <p class="text-foreground-muted mt-2 text-sm">Your opponent has offered a draw.</p>
        <p class="text-foreground-muted mt-1 text-xs">(Making a move will decline it)</p>
        <div class="mt-8 flex gap-3 relative">
          <BaseButton class="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 border-0 shadow-lg shadow-emerald-500/30" @click="socket.sendRespondDraw(true)">
            Accept
          </BaseButton>
          <BaseButton class="flex-1 bg-gradient-to-r from-gray-600 to-slate-700 hover:from-gray-500 hover:to-slate-600 text-white border-0 shadow-lg" @click="socket.sendRespondDraw(false)">
            Decline
          </BaseButton>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
