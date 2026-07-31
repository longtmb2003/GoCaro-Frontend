<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Flag, Handshake, X, Circle, Swords } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import GameBoard from '@/components/GameBoard.vue'
import GameResultBanner from '@/components/GameResultBanner.vue'
import InGameChat from '@/components/InGameChat.vue'
import OpponentLeftBanner from '@/components/OpponentLeftBanner.vue'
import ReconnectingOverlay from '@/components/ReconnectingOverlay.vue'
import RankFrame from '@/components/RankFrame.vue'
import TurnTimer from '@/components/TurnTimer.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { useSocketStore } from '@/stores/socket'
import { getRankTier } from '@/config/ranks'
import type { GameResult } from '@/types/game'

const auth = useAuthStore()
const game = useGameStore()
const socket = useSocketStore()
const router = useRouter()
const { addToast } = useToast()

const confirmingResign = ref(false)
const allowBannerModal = ref(true)

watch(
  () => game.phase,
  (newPhase) => {
    if (newPhase === 'over' && game.result?.reason === 'five_in_row') {
      allowBannerModal.value = false
      setTimeout(() => {
        allowBannerModal.value = true
      }, 1200)
    } else {
      allowBannerModal.value = true
    }
  },
  { immediate: true },
)

const yourSymbolChar = computed(() => (game.yourSymbol === 1 ? 'X' : 'O'))
const opponentSymbolChar = computed(() => (game.yourSymbol === 1 ? 'O' : 'X'))
const symbolColorClass = (symbol: string) => symbol === 'X' ? 'text-blue-500' : 'text-rose-500'

/** Whether the timer is in the critical low-time zone (≤5s). */
const isLowTime = computed(() => socket.turnSecondsLeft <= 5 && game.phase === 'playing')

/** The local player's ELO from their profile. */
const yourElo = computed(() => auth.user?.elo ?? 1000)
const yourTier = computed(() => getRankTier(yourElo.value))
const yourInitial = computed(() => auth.displayName.charAt(0).toUpperCase())

/** Opponent initial for rank frame (derived from opponent name). */
const opponentInitial = computed(() => game.opponent.charAt(0).toUpperCase())
/** Whether the match is ranked. */
const isRanked = computed(() => socket.mode === 'ranked')

/** Total moves played on the board. */
const moveCount = computed(() => game.board.flat().filter((val) => val !== null).length)

// The board stays playable only on a live connection. While reconnecting the
// phase is still 'playing', so without this a player could click into a socket
// that is not there — a no-op that looks like the move was accepted.
const boardInteractive = computed(() => game.canPlay && socket.connection === 'live')

const reconnecting = computed(() => socket.connection === 'reconnecting')

interface Banner {
  heading: string
  message: string
  tone: GameResult['outcome']
}

const banner = computed<Banner | null>(() => {
  if (!allowBannerModal.value) {
    return null
  }
  if (game.phase === 'connection-lost') {
    // The match may still be running on the server, so no rating is claimed here.
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
  socket.startMatchmaking(mode)
}

async function cancelInPlaceSearch(): Promise<void> {
  socket.cancelMatchmaking()
  await router.push('/')
}

async function shareAchievement(): Promise<void> {
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
      if (granted) addToast('You earned 50 Coins for sharing!', 'success')
    } catch {
      // The user dismissed the share sheet, or sharing failed; nothing to recover.
    }
  } else {
    void navigator.clipboard.writeText(window.location.origin)
    const granted = await auth.shareAchievement()
    if (granted) addToast('You earned 50 Coins for sharing!', 'success')
    addToast('Link copied to clipboard!', 'info')
  }
}
</script>

<template>
  <AppLayout title="Match">
    <div class="fixed inset-0 z-[-1] bg-surface-sunken"></div>

    <div class="grid gap-6 lg:grid-cols-[14rem_1fr_18rem] xl:grid-cols-[16rem_1fr_22rem]">
      
      <!-- LEFT SIDE: Match Info (Players, Timer & Controls) -->
      <div class="flex flex-col gap-4">

        <!-- Match Mode Badge & Move Counter -->
        <div class="flex items-center justify-between">
          <span
            class="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
            :class="isRanked
              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
              : 'bg-primary-500/10 text-primary-300 border border-primary-500/20'"
          >
            <Swords :size="12" aria-hidden="true" />
            {{ isRanked ? 'Ranked' : 'Casual' }}
          </span>
          <span class="text-[10px] font-mono font-semibold text-foreground-muted bg-surface-elevated border border-border-strong px-2.5 py-0.5 rounded-full shadow-sm">
            Move {{ moveCount }}
          </span>
        </div>

        <!-- VS Profiles -->
        <div class="flex flex-col gap-3 shrink-0">
          <!-- Opponent Card -->
          <GlassCard
            as="div"
            class="px-3 py-2.5 transition-all duration-300"
            :class="[
              !game.yourTurn && game.phase === 'playing'
                ? isLowTime
                  ? 'ring-2 ring-danger-500 shadow-[0_0_20px_rgba(239,68,68,0.2)] active-card-pulse-danger'
                  : 'ring-2 ring-cyan-400/80 shadow-[0_0_20px_rgba(46,230,255,0.15)] active-card-pulse'
                : 'ring-1 ring-transparent brightness-[0.6]'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <RankFrame :elo="1000" :initial="opponentInitial" size="sm" />
              <div class="min-w-0 flex-1">
                <div class="flex items-baseline gap-2 truncate">
                  <span class="font-bold text-sm text-foreground truncate">{{ game.opponent }}</span>
                  <div class="w-5 h-5 rounded flex items-center justify-center bg-surface-sunken border border-border-strong shrink-0 shadow-inner" :class="symbolColorClass(opponentSymbolChar)">
                    <X v-if="opponentSymbolChar === 'X'" class="w-3 h-3" stroke-width="4" />
                    <Circle v-else class="w-2.5 h-2.5" stroke-width="4" />
                  </div>
                </div>
              </div>
            </div>
            <!-- Opponent Timer (visible when it's opponent's turn) -->
            <TurnTimer
              v-if="!game.yourTurn && game.phase === 'playing'"
              class="mt-2.5"
              :seconds-left="socket.turnSecondsLeft"
              :total-seconds="socket.turnBudgetSeconds"
            />
          </GlassCard>

          <div class="flex items-center justify-center -my-1 relative z-10">
            <span class="text-foreground-muted text-[10px] font-black uppercase tracking-widest bg-surface-elevated px-2 py-0.5 rounded-full border border-border-strong shadow-sm">VS</span>
          </div>

          <!-- Your Card -->
          <GlassCard
            as="div"
            class="px-3 py-2.5 relative overflow-hidden transition-all duration-300"
            :class="[
              game.yourTurn && game.phase === 'playing'
                ? isLowTime
                  ? 'ring-2 ring-danger-500 shadow-[0_0_20px_rgba(239,68,68,0.2)] active-card-pulse-danger'
                  : 'ring-2 ring-cyan-400/80 shadow-[0_0_20px_rgba(46,230,255,0.15)] active-card-pulse'
                : 'ring-1 ring-transparent brightness-[0.6]'
            ]"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent pointer-events-none"></div>
            <div class="flex items-center gap-2.5 relative z-10">
              <RankFrame :elo="yourElo" :initial="yourInitial" size="sm" />
              <div class="min-w-0 flex-1">
                <div class="flex items-baseline gap-2 truncate">
                  <span class="font-bold text-sm text-foreground truncate">{{ auth.displayName }}</span>
                  <div class="w-5 h-5 rounded flex items-center justify-center bg-surface-sunken border border-border-strong shrink-0 shadow-inner" :class="symbolColorClass(yourSymbolChar)">
                    <X v-if="yourSymbolChar === 'X'" class="w-3 h-3" stroke-width="4" />
                    <Circle v-else class="w-2.5 h-2.5" stroke-width="4" />
                  </div>
                </div>
                <span class="text-foreground-muted font-medium text-[10px]">{{ yourElo }} ELO · {{ yourTier.name }}</span>
              </div>
            </div>
            <!-- Your Timer (visible when it's your turn) -->
            <TurnTimer
              v-if="game.yourTurn && game.phase === 'playing'"
              class="mt-2.5 relative z-10"
              :seconds-left="socket.turnSecondsLeft"
              :total-seconds="socket.turnBudgetSeconds"
            />
            <p
              v-if="game.yourTurn && game.phase === 'playing'"
              class="text-[10px] uppercase tracking-widest font-black text-center mt-1.5 relative z-10"
              :class="isLowTime ? 'text-danger-400 animate-pulse' : 'text-accent'"
            >
              Your turn
            </p>
          </GlassCard>
        </div>

        <!-- Match Controls (relocated from right column) -->
        <div v-if="game.phase === 'playing'" class="space-y-3 shrink-0 mt-2">
          <div v-if="!confirmingResign" class="flex gap-3">
            <BaseButton
              variant="secondary"
              class="flex-1 border-dashed border-2 hover:bg-surface-sunken"
              size="sm"
              :disabled="socket.waitingForDrawResponse || socket.drawOffersLeft === 0"
              @click="socket.sendOfferDraw()"
            >
              <template v-if="socket.waitingForDrawResponse">Waiting...</template>
              <template v-else>
                <Handshake :size="16" class="mr-1.5" aria-hidden="true" /> Draw
              </template>
            </BaseButton>
            <BaseButton
              variant="ghost"
              class="flex-1 text-danger-400 border border-danger-600/30 hover:bg-danger-950/20 hover:border-danger-500/50"
              size="sm"
              @click="confirmingResign = true"
            >
              <Flag :size="16" class="mr-1.5" aria-hidden="true" /> Resign
            </BaseButton>
          </div>
          <div v-else class="space-y-3">
            <p class="text-foreground text-small text-center font-bold tracking-wide">
              Resign this match?
            </p>
            <div class="flex gap-3">
              <BaseButton variant="danger" size="sm" class="flex-1" @click="confirmResign">
                Confirm
              </BaseButton>
              <BaseButton variant="secondary" size="sm" class="flex-1" @click="confirmingResign = false">
                Cancel
              </BaseButton>
            </div>
          </div>
        </div>
      </div>

      <!-- CENTER: Game Board -->
      <div class="flex justify-center items-start lg:items-center">
        <GameBoard
          :board="game.board"
          :interactive="boardInteractive"
          :last-move="game.lastMove"
          :your-symbol="game.yourSymbol"
          @move="onMove"
        />
      </div>

      <!-- RIGHT SIDE: Chat -->
      <div class="flex flex-col gap-4 min-h-[450px] lg:min-h-0 h-full lg:justify-center">
        <OpponentLeftBanner
          v-if="socket.opponentReconnectSecondsLeft !== null"
          :seconds-left="socket.opponentReconnectSecondsLeft"
          class="shrink-0"
        />

        <p v-if="game.moveError" class="text-error text-small text-center font-medium shrink-0" role="alert">
          {{ game.moveError }}
        </p>

        <!-- Chat (right column is now purely social) -->
        <InGameChat class="h-[400px] sm:h-[480px] shrink-0" />
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
          <Flag :size="20" aria-hidden="true" /> Draw Offer
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

    <!-- In-place Searching Overlay -->
    <div
      v-if="socket.status === 'searching' || socket.status === 'connecting'"
      class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-4"
    >
      <BaseSpinner size="lg" />
      <h3 class="text-section font-bold text-foreground">Finding next opponent...</h3>
      <p class="text-foreground-muted text-small">{{ isRanked ? 'Ranked Match' : 'Casual Match' }}</p>
      <BaseButton variant="secondary" size="sm" class="mt-4" @click="cancelInPlaceSearch">
        Cancel Queue
      </BaseButton>
    </div>
  </AppLayout>
</template>

<style scoped>
@keyframes card-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(46, 230, 255, 0.15); }
  50% { box-shadow: 0 0 30px rgba(46, 230, 255, 0.25); }
}

@keyframes card-glow-danger {
  0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.2); }
  50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.35); }
}

.active-card-pulse {
  animation: card-glow 2s ease-in-out infinite;
}

.active-card-pulse-danger {
  animation: card-glow-danger 0.8s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .active-card-pulse,
  .active-card-pulse-danger {
    animation: none;
  }
}
</style>
