<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
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
    <!-- Match Specific Background Wallpaper -->
    <div class="fixed inset-0 z-[-1]" style="background-image: url('/match_bg.png'); background-size: cover; background-position: center;">
      <!-- Subtle dark overlay so the board stands out -->
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
    </div>

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

        <GlassCard as="div">
          <p
            class="text-foreground text-body text-center font-bold tracking-wide uppercase"
            aria-live="polite"
          >
            {{ turnLabel }}
          </p>
          <TurnTimer
            v-if="game.phase === 'playing'"
            class="mt-3"
            :seconds-left="socket.turnSecondsLeft"
            :total-seconds="socket.turnBudgetSeconds"
          />
        </GlassCard>

        <div class="grid grid-cols-2 gap-3">
          <GlassCard as="div" class="text-center">
            <p class="text-foreground-muted text-caption font-black tracking-widest uppercase">
              You
            </p>
            <p class="text-foreground mt-1.5 truncate font-bold">🧑‍💻 {{ auth.displayName }}</p>
            <p class="text-accent text-small mt-1 font-semibold">{{ yourColor }}</p>
          </GlassCard>
          <GlassCard as="div" class="text-center">
            <p class="text-foreground-muted text-caption font-black tracking-widest uppercase">
              Opponent
            </p>
            <p class="text-foreground mt-1.5 truncate font-bold">🧑‍💻 {{ game.opponent }}</p>
            <p class="text-error text-small mt-1 font-semibold">{{ opponentColor }}</p>
          </GlassCard>
        </div>

        <p v-if="game.moveError" class="text-error text-small text-center font-medium" role="alert">
          {{ game.moveError }}
        </p>

        <div v-if="game.phase === 'playing'" class="border-border-subtle border-t pt-5 space-y-3">
          <div v-if="!confirmingResign" class="flex gap-3">
            <BaseButton
              variant="secondary"
              class="flex-1"
              :disabled="socket.waitingForDrawResponse || socket.drawOffersLeft === 0"
              @click="socket.sendOfferDraw()"
            >
              {{
                socket.waitingForDrawResponse ? 'Waiting...' : `🏳️ Draw (${socket.drawOffersLeft})`
              }}
            </BaseButton>
            <BaseButton variant="danger" class="flex-1" @click="confirmingResign = true">
              Resign
            </BaseButton>
          </div>
          <div v-else class="space-y-3">
            <p class="text-foreground text-body text-center font-bold tracking-wide">
              Resign this match?
            </p>
            <div class="flex gap-3">
              <BaseButton variant="danger" class="flex-1" @click="confirmResign">
                Confirm
              </BaseButton>
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

    <!-- Draw Offer Dialog. Not dismissible: the offer needs an explicit answer. -->
    <BaseModal
      v-if="socket.drawOfferPending"
      :dismissible="false"
      aria-labelledby="draw-offer-heading"
    >
      <div class="text-center">
        <h2 id="draw-offer-heading" class="text-section gap-2 flex items-center justify-center">
          <span aria-hidden="true">🏳️</span> Draw Offer
        </h2>
        <p class="text-foreground-secondary text-body mt-3">Your opponent has offered a draw.</p>
        <p class="text-foreground-muted text-small mt-1">(Making a move will decline it)</p>
      </div>

      <template #footer>
        <div class="gap-3 flex">
          <BaseButton variant="success" class="flex-1" @click="socket.sendRespondDraw(true)">
            Accept
          </BaseButton>
          <BaseButton variant="secondary" class="flex-1" @click="socket.sendRespondDraw(false)">
            Decline
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </AppLayout>
</template>
