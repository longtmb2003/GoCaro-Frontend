<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  Flag,
  Gem,
  Handshake,
  ShieldX,
  Sparkles,
  Target,
  X,
  Swords,
  ScrollText,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import BoardRenderer from '@/components/board-renderer/BoardRenderer.vue'
import type { MoveCueName, VictoryCueName } from '@/components/board-renderer/feedbackTiming'
import type { SpiritCueName } from '@/components/board-renderer/spiritTiming'
import { assignMatchSpirits, spiritForSymbol } from '@/spirits/spiritAssignment'
import GameResultBanner from '@/components/GameResultBanner.vue'
import MatchResultOverlay from '@/components/MatchResultOverlay.vue'
import InGameChat from '@/components/InGameChat.vue'
import OpponentLeftBanner from '@/components/OpponentLeftBanner.vue'
import ReconnectingOverlay from '@/components/ReconnectingOverlay.vue'
import RankFrame from '@/components/RankFrame.vue'
import TurnTimer from '@/components/TurnTimer.vue'
import TurnCountdownRing from '@/components/TurnCountdownRing.vue'
import TurnstileModal from '@/components/TurnstileModal.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useToast } from '@/composables/useToast'
import { useWinSequence } from '@/composables/useWinSequence'
import { useShareLink } from '@/composables/useShareLink'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { useSocketStore } from '@/stores/socket'
import { fetchPublicProfile } from '@/api/users'
import { getRankSubTier, getRankTier } from '@/config/ranks'
import type { GameResult, PlayerSymbol } from '@/types/game'

const auth = useAuthStore()
const game = useGameStore()
const socket = useSocketStore()
const router = useRouter()
const { addToast } = useToast()
const shareLink = useShareLink()
const { errorText, rankName, t } = useAppLanguage()

const confirmingResign = ref(false)
const historyScroll = ref<HTMLElement | null>(null)
const winSequence = useWinSequence(
  () => game.phase,
  () => {
    game.completeFinishing()
  },
)

const turnstileModalOpen = ref(false)
const pendingMatchmakingMode = ref<'casual' | 'ranked' | null>(null)

const yourSymbolChar = computed(() => (game.yourSymbol === 1 ? 'X' : 'O'))
const opponentSymbolChar = computed(() => (game.yourSymbol === 1 ? 'O' : 'X'))
const symbolColorClass = (symbol: string) => (symbol === 'X' ? 'text-player-x' : 'text-player-o')

/** Whether the timer is in the critical low-time zone (under 5 seconds). */
const isLowTime = computed(() => socket.turnSecondsLeft < 5 && game.phase === 'playing')

const turnTimerTone = computed<'normal' | 'warning' | 'critical'>(() => {
  if (socket.turnSecondsLeft < 5) return 'critical'
  if (socket.turnSecondsLeft <= 10) return 'warning'
  return 'normal'
})

/** The local player's ELO from their profile. */
const yourElo = computed(() => auth.user?.elo ?? 1000)
const yourTier = computed(() => getRankTier(yourElo.value))
const yourRankLabel = computed(() =>
  `${rankName(yourTier.value.name)} ${getRankSubTier(yourElo.value)}`.trim(),
)
const yourInitial = computed(() => auth.displayName.charAt(0).toUpperCase())

/** Opponent initial for rank frame (derived from opponent name). */
const opponentInitial = computed(() => game.opponent.charAt(0).toUpperCase())
const opponentElo = ref(1000)
const opponentTier = computed(() => getRankTier(opponentElo.value))
const opponentRankLabel = computed(() =>
  `${rankName(opponentTier.value.name)} ${getRankSubTier(opponentElo.value)}`.trim(),
)

watch(
  () => game.opponentId,
  async (opponentId) => {
    opponentElo.value = 1000
    if (opponentId === null) return

    try {
      const profile = await fetchPublicProfile(opponentId)
      if (game.opponentId === opponentId) {
        opponentElo.value = profile.elo
      }
    } catch {
      // Keep the name card usable with the starting rating when a public
      // profile is unavailable, such as for a temporary guest.
    }
  },
  { immediate: true },
)
/** Whether the match is ranked. */
const isRanked = computed(() => socket.mode === 'ranked')

/** Total moves played on the board. */
const moveCount = computed(() => game.board.flat().filter((val) => val !== null).length)
const recentMoves = computed(() => {
  const visibleMoves = game.moveHistory.slice(-12)
  const firstMoveNumber = game.moveHistory.length - visibleMoves.length + 1
  return visibleMoves.map((move, index) => ({
    ...move,
    moveNumber: firstMoveNumber + index,
    coordinate: `${String.fromCharCode(65 + move.x)}${String(move.y + 1)}`,
  }))
})

const winningCellKeys = computed(
  () =>
    new Set(
      game.winResult?.winningCells.map((cell) => `${String(cell.col)}:${String(cell.row)}`) ?? [],
    ),
)

const winningLine = computed(() =>
  game.phase === 'finishing' && winSequence.showWinningPattern.value
    ? (game.winResult?.winningCells.map((cell) => ({ x: cell.col, y: cell.row })) ?? [])
    : [],
)

const finishingOutcome = computed<'win' | 'loss'>(() =>
  game.result?.outcome === 'win' ? 'win' : 'loss',
)

/**
 * Both players' companions for this match, derived from the room id so the two
 * clients agree without the server being asked. Dropped once the match ends: the
 * board stays on screen behind the result overlay, and a summon replaying over a
 * finished game would read as a move still being made.
 */
const assignedMatchSpirits = computed(() => {
  if (game.roomId === null) return null
  let xEquipped = ''
  let oEquipped = ''
  if (game.yourSymbol === 1) {
    xEquipped = socket.yourSpirit
    oEquipped = socket.opponentSpirit
  } else if (game.yourSymbol === 2) {
    xEquipped = socket.opponentSpirit
    oEquipped = socket.yourSpirit
  }
  return assignMatchSpirits(xEquipped, oEquipped, game.roomId)
})

const matchSpirits = computed(() =>
  game.phase === 'playing' ? assignedMatchSpirits.value : null,
)

const resultSpirit = computed(() => {
  const spirits = assignedMatchSpirits.value
  if (spirits === null || game.yourSymbol === null) return null
  return spiritForSymbol(spirits, game.yourSymbol)
})

watch(
  () => assignedMatchSpirits.value,
  (spirits) => {
    if (spirits === null) return
    if (spirits.x.model.source !== null) {
      new Image().src = spirits.x.model.source
    }
    if (spirits.o.model.source !== null) {
      new Image().src = spirits.o.model.source
    }
  },
  { immediate: true },
)

watch(
  () => game.moveHistory.length,
  () => {
    void nextTick(() => {
      historyScroll.value?.scrollTo({ left: historyScroll.value.scrollWidth, behavior: 'smooth' })
    })
  },
)

let lastTurnCueKey = ''
watch(
  () => [game.roomId, game.yourTurn, game.phase, game.moveHistory.length] as const,
  ([roomId, isYourTurn, phase, turnNumber]) => {
    if (roomId === null || phase !== 'playing') return
    const cueKey = `${roomId}:${String(turnNumber)}:${String(isYourTurn)}`
    if (cueKey === lastTurnCueKey) return
    lastTurnCueKey = cueKey
    window.dispatchEvent(
      new CustomEvent('gocaro:turn-cue', {
        detail: { isLocalTurn: isYourTurn },
      }),
    )
  },
)

watch(
  () => game.result,
  (result, previousResult) => {
    if (
      result === null ||
      result === previousResult ||
      result.reason === 'five_in_row' ||
      result.outcome === 'draw'
    )
      return
    const eventName = result.outcome === 'loss' ? 'gocaro:defeat-cue' : 'gocaro:victory-cue'
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: { cue: 'resolve', outcome: result.outcome, reason: result.reason },
      }),
    )
  },
)

const turnStatus = computed(() => {
  if (game.phase === 'connection-lost') {
    return {
      label: t('Connection lost', 'Mất kết nối'),
      description: t('Reconnecting to the match', 'Đang kết nối lại trận đấu'),
    }
  }
  if (game.phase === 'finishing') {
    return {
      label: t('Winning five', 'Năm quân chiến thắng'),
      description: t('Review the decisive line', 'Xem lại đường cờ quyết định'),
    }
  }
  if (game.phase === 'result') {
    return {
      label: t('Match complete', 'Trận đấu kết thúc'),
      description: t('Review the result below', 'Xem kết quả bên dưới'),
    }
  }
  return game.yourTurn
    ? {
        label: t('Your turn', 'Lượt của bạn'),
        description: t('Choose an empty cell to play', 'Chọn một ô trống để đánh'),
      }
    : {
        label: t("Opponent's turn", 'Lượt của đối thủ'),
        description: t('Waiting for the next move', 'Đang chờ nước đi tiếp theo'),
      }
})

const turnStatusClass = computed(() => {
  if (game.phase === 'connection-lost') return 'border-danger-500/30 bg-danger-500/10'
  if (game.phase === 'finishing' || game.phase === 'result')
    return 'border-border-strong bg-surface-elevated'
  return game.yourTurn
    ? 'turn-status-player border-accent/30 bg-accent/10'
    : 'turn-status-opponent border-border bg-glass-light'
})

// The board stays playable only on a live connection. While reconnecting the
// phase is still 'playing', so without this a player could click into a socket
// that is not there — a no-op that looks like the move was accepted.
const boardInteractive = computed(() => game.canPlay && socket.connection === 'live')

const showReconnectModal = computed(() => socket.connection !== 'live' && game.isInMatch)

onMounted(() => {
  socket.recoverMatchAfterRefresh()
})

interface Banner {
  heading: string
  message: string
  tone: GameResult['outcome']
}

const banner = computed<Banner | null>(() => {
  if (game.phase === 'connection-lost') {
    // The match may still be running on the server, so no rating is claimed here.
    return {
      heading: t('Connection lost', 'Mất kết nối'),
      message: t('You were disconnected from the match.', 'Bạn đã mất kết nối khỏi trận đấu.'),
      tone: 'draw',
    }
  }
  if (game.phase === 'result' && game.result !== null) {
    const { heading, message } = resultText(game.result)
    return { heading, message, tone: game.result.outcome }
  }
  return null
})

function resultText(result: GameResult): { heading: string; message: string } {
  if (result.outcome === 'draw') {
    return { heading: t('Draw', 'Hòa'), message: t('The board is full.', 'Bàn cờ đã đầy.') }
  }
  const heading = result.outcome === 'win' ? t('Victory', 'Chiến thắng') : t('Defeat', 'Thất bại')
  const messages: Record<GameResult['outcome'], Record<string, string>> = {
    win: {
      five_in_row: t('You got five in a row.', 'Bạn đã tạo được năm quân liên tiếp.'),
      resign: t('Your opponent resigned.', 'Đối thủ đã đầu hàng.'),
      timeout: t('Your opponent ran out of time.', 'Đối thủ đã hết thời gian.'),
      disconnect: t('Your opponent disconnected.', 'Đối thủ đã mất kết nối.'),
    },
    loss: {
      five_in_row: t('Your opponent got five in a row.', 'Đối thủ đã tạo được năm quân liên tiếp.'),
      resign: t('You resigned.', 'Bạn đã đầu hàng.'),
      timeout: t('You ran out of time.', 'Bạn đã hết thời gian.'),
      disconnect: t('You were disconnected.', 'Bạn đã mất kết nối.'),
    },
    draw: {},
  }
  const fallback = result.outcome === 'win' ? t('You won.', 'Bạn đã thắng.') : t('You lost.', 'Bạn đã thua.')
  return { heading, message: messages[result.outcome][result.reason] ?? fallback }
}

function onMove(x: number, y: number): void {
  socket.sendMove(x, y)
}

function onCellHover(cell: { row: number; col: number } | null): void {
  if (cell === null) return
  window.dispatchEvent(
    new CustomEvent('gocaro:hover-cue', {
      detail: { cell, symbol: game.yourSymbol },
    }),
  )
}

/** Sound systems can layer placement audio without owning visual delays. */
function onMoveCue(
  cue: MoveCueName,
  symbol: PlayerSymbol,
  cell: { row: number; col: number },
): void {
  window.dispatchEvent(
    new CustomEvent('gocaro:move-cue', {
      detail: {
        cue,
        symbol,
        cell,
        isLocalMove: symbol === game.yourSymbol,
      },
    }),
  )
}

/** Sound systems can subscribe without owning or duplicating visual delays. */
function onVictoryCue(cue: VictoryCueName): void {
  const outcome = game.result?.outcome ?? null
  const eventName = outcome === 'loss' ? 'gocaro:defeat-cue' : 'gocaro:victory-cue'
  window.dispatchEvent(
    new CustomEvent(eventName, {
      detail: { cue, outcome },
    }),
  )
}

/**
 * Spirits ride the same event bus as every other cue rather than calling the
 * audio composable directly, so the board never owns a sound and the sound
 * never owns a delay. The id is enough for a listener to look the spirit up.
 */
function onSpiritCue(cue: SpiritCueName, symbol: PlayerSymbol, spiritId: string): void {
  window.dispatchEvent(
    new CustomEvent('gocaro:spirit-cue', {
      detail: { cue, symbol, spiritId, isLocalMove: symbol === game.yourSymbol },
    }),
  )
}

function scrollHistory(direction: -1 | 1): void {
  historyScroll.value?.scrollBy({ left: direction * 180, behavior: 'smooth' })
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

function playAgain(): void {
  const mode = socket.mode
  refreshRatingIfRanked()
  socket.leaveGame()
  if (import.meta.env.VITE_TURNSTILE_SITE_KEY) {
    pendingMatchmakingMode.value = mode
    turnstileModalOpen.value = true
  } else {
    socket.startMatchmaking(mode)
  }
}

function onTurnstileVerified(token: string): void {
  turnstileModalOpen.value = false
  if (pendingMatchmakingMode.value) {
    socket.startMatchmaking(pendingMatchmakingMode.value, token)
    pendingMatchmakingMode.value = null
  }
}

async function cancelInPlaceSearch(): Promise<void> {
  socket.cancelMatchmaking()
  await router.push('/')
}

async function shareReplay(): Promise<void> {
  if (!game.roomId) return
  try {
    await shareLink.share({
      title: t('GoCaro match replay', 'Xem lại trận GoCaro'),
      text: t('Watch my GoCaro match replay!', 'Xem lại trận GoCaro của tôi!'),
      matchId: game.roomId,
    })
  } catch {
    addToast(t('Unable to create the replay link yet. Please try again.', 'Chưa thể tạo liên kết xem lại. Vui lòng thử lại.'), 'error')
  }
}
</script>

<template>
  <AppLayout :title="t('Match', 'Trận đấu')" :hide-footer="true" :full-bleed="true" :fantasy="true">
    <div class="match-room relative h-full min-h-0 w-full overflow-hidden">
      <div class="absolute inset-0 bg-background"></div>
      <div
        class="match-room-art absolute inset-0 bg-[url('/game-room-bg-v3.webp')] bg-cover bg-center"
      ></div>
      <div class="match-room-atmosphere absolute inset-0"></div>

      <div
        class="match-shell relative z-10 mx-auto flex h-full min-h-0 w-full max-w-[120rem] flex-col overflow-hidden px-3 py-1 sm:px-3"
      >
        <div
          class="match-room-grid grid min-h-0 flex-1 gap-2 lg:grid-cols-[14rem_minmax(0,1fr)_15rem]"
        >
          <!-- LEFT SIDE: Match Info (Players, Timer & Controls) -->
          <div class="match-sidebar-left side-panel-shell order-2 flex min-h-0 flex-col gap-3 lg:order-none">
            <!-- Match Mode Badge & Move Counter -->
            <div class="match-meta-strip flex items-center justify-between gap-1">
              <span
                class="match-mode-badge inline-flex items-center gap-1 rounded-pill border px-2 py-1 text-caption font-semibold uppercase tracking-widest"
                :class="
                  isRanked
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : 'bg-primary-500/10 text-primary-300 border-primary-500/20'
                "
              >
                <Swords :size="12" aria-hidden="true" />
                {{ isRanked ? t('Ranked', 'Xếp hạng') : t('Casual', 'Đấu thường') }}
              </span>
              <span
                class="move-counter rounded-pill border border-border-strong bg-surface-elevated px-2 py-1 text-caption font-semibold tabular-nums text-foreground-muted shadow-sm"
              >
                {{ t('Move', 'Nước') }} {{ moveCount }}
              </span>
            </div>

            <!-- VS Profiles -->
            <div class="player-stack flex flex-col gap-1 shrink-0">
              <!-- Opponent Card -->
              <GlassCard
                as="div"
                class="player-card player-card-opponent side-panel-material !p-2"
                body-class="player-card-body"
                :data-rank-tier="opponentTier.name.toLowerCase()"
                :class="{
                  'player-card-active': !game.yourTurn && game.phase === 'playing',
                  'player-card-critical': !game.yourTurn && game.phase === 'playing' && isLowTime,
                }"
              >
                <span class="fantasy-corner fantasy-corner-tl" aria-hidden="true"></span>
                <span class="fantasy-corner fantasy-corner-tr" aria-hidden="true"></span>
                <span class="fantasy-corner fantasy-corner-bl" aria-hidden="true"></span>
                <span class="fantasy-corner fantasy-corner-br" aria-hidden="true"></span>
                <div class="player-card-header">
                  <span class="player-role-label">{{ t('Opponent', 'Đối thủ') }}</span>
                  <span
                    class="player-symbol-badge"
                    :class="[
                      symbolColorClass(opponentSymbolChar),
                      { 'player-symbol-badge-active': !game.yourTurn && game.phase === 'playing' },
                    ]"
                  >
                    <X
                      v-if="opponentSymbolChar === 'X'"
                      :size="15"
                      stroke-width="3"
                      aria-hidden="true"
                    />
                    <Circle v-else :size="15" stroke-width="3" aria-hidden="true" />
                  </span>
                </div>
                <div class="player-portrait">
                  <BaseAvatar
                    :name="game.opponent"
                    size="xl"
                    class="player-avatar"
                    :class="{
                      'active-avatar-frame': !game.yourTurn && game.phase === 'playing',
                    }"
                  />
                  <RankFrame
                    class="player-rank-emblem"
                    :elo="opponentElo"
                    :initial="opponentInitial"
                    size="md"
                  />
                </div>
                <div class="player-details">
                  <span class="player-name truncate text-body text-foreground">{{
                    game.opponent
                  }}</span>
                  <span class="player-rank-badge">
                    <Gem :size="12" aria-hidden="true" />
                    {{ opponentRankLabel }}
                  </span>
                  <span class="player-elo">{{ opponentElo }} ELO</span>
                </div>
                <!-- Opponent Timer (visible when it's opponent's turn) -->
                <TurnTimer
                  v-if="!game.yourTurn && game.phase === 'playing'"
                  class="sr-only"
                  :seconds-left="socket.turnSecondsLeft"
                  :total-seconds="socket.turnBudgetSeconds"
                />
                <p
                  class="player-turn-banner"
                  :class="{
                    'player-turn-banner-active': !game.yourTurn && game.phase === 'playing',
                    'player-turn-banner-critical':
                      !game.yourTurn && game.phase === 'playing' && isLowTime,
                  }"
                >
                  <span class="turn-banner-crystal" aria-hidden="true"></span>
                  {{
                    game.phase !== 'playing'
                      ? t('Match complete', 'Trận đấu kết thúc')
                      : !game.yourTurn
                        ? t('Opponent turn', 'Lượt đối thủ')
                        : t('Waiting', 'Đang chờ')
                  }}
                </p>
              </GlassCard>

              <div class="vs-divider">
                <span>VS</span>
              </div>

              <!-- Your Card -->
              <GlassCard
                as="div"
                class="player-card player-card-you side-panel-material relative overflow-hidden !p-2"
                body-class="player-card-body"
                :data-rank-tier="yourTier.name.toLowerCase()"
                :class="{
                  'player-card-active': game.yourTurn && game.phase === 'playing',
                  'player-card-critical': game.yourTurn && game.phase === 'playing' && isLowTime,
                }"
              >
                <span class="fantasy-corner fantasy-corner-tl" aria-hidden="true"></span>
                <span class="fantasy-corner fantasy-corner-tr" aria-hidden="true"></span>
                <span class="fantasy-corner fantasy-corner-bl" aria-hidden="true"></span>
                <span class="fantasy-corner fantasy-corner-br" aria-hidden="true"></span>
                <div class="player-card-header relative z-10">
                  <span class="player-role-label text-accent">{{ t('You', 'Bạn') }}</span>
                  <span
                    class="player-symbol-badge"
                    :class="[
                      symbolColorClass(yourSymbolChar),
                      { 'player-symbol-badge-active': game.yourTurn && game.phase === 'playing' },
                    ]"
                  >
                    <X
                      v-if="yourSymbolChar === 'X'"
                      :size="15"
                      stroke-width="3"
                      aria-hidden="true"
                    />
                    <Circle v-else :size="15" stroke-width="3" aria-hidden="true" />
                  </span>
                </div>
                <div class="player-portrait relative z-10">
                  <BaseAvatar
                    :name="auth.displayName"
                    size="xl"
                    class="player-avatar"
                    :class="{ 'active-avatar-frame': game.yourTurn && game.phase === 'playing' }"
                  />
                  <RankFrame
                    class="player-rank-emblem"
                    :elo="yourElo"
                    :initial="yourInitial"
                    size="md"
                  />
                </div>
                <div class="player-details relative z-10">
                  <span class="player-name truncate text-body text-foreground">{{
                    auth.displayName
                  }}</span>
                  <span class="player-rank-badge">
                    <Gem :size="12" aria-hidden="true" />
                    {{ yourRankLabel }}
                  </span>
                  <span class="player-elo">{{ yourElo }} ELO</span>
                </div>
                <!-- Your Timer (visible when it's your turn) -->
                <TurnTimer
                  v-if="game.yourTurn && game.phase === 'playing'"
                  class="sr-only"
                  :seconds-left="socket.turnSecondsLeft"
                  :total-seconds="socket.turnBudgetSeconds"
                />
                <p
                  class="player-turn-banner relative z-10"
                  :class="{
                    'player-turn-banner-active': game.yourTurn && game.phase === 'playing',
                    'player-turn-banner-critical':
                      game.yourTurn && game.phase === 'playing' && isLowTime,
                  }"
                >
                  <span class="turn-banner-crystal" aria-hidden="true"></span>
                  {{
                    game.phase !== 'playing'
                      ? t('Match complete', 'Trận đấu kết thúc')
                      : game.yourTurn
                        ? t('Your turn', 'Lượt của bạn')
                        : t('Waiting', 'Đang chờ')
                  }}
                </p>
              </GlassCard>
            </div>

            <!-- Match Controls (relocated from right column) -->
            <div v-if="game.phase === 'playing'" class="match-controls mt-1 shrink-0 space-y-2">
              <div class="match-controls-header flex items-center justify-between gap-2">
                <p
                  class="text-caption font-semibold uppercase tracking-widest text-foreground-muted"
                >
                  {{ t('Match controls', 'Điều khiển trận đấu') }}
                </p>
              </div>
              <div v-if="!confirmingResign" class="grid grid-cols-2 gap-2">
                <BaseButton
                  variant="secondary"
                  class="match-control-button match-control-draw font-bold tracking-wide"
                  size="sm"
                  :aria-label="
                    socket.waitingForDrawResponse
                      ? t('Waiting for draw response', 'Đang chờ phản hồi hòa')
                      : t('Offer a draw', 'Đề nghị hòa')
                  "
                  :disabled="socket.waitingForDrawResponse || socket.drawOffersLeft === 0"
                  @click="socket.sendOfferDraw()"
                >
                  <template v-if="socket.waitingForDrawResponse">{{ t('Waiting...', 'Đang chờ...') }}</template>
                  <template v-else>
                    <FantasySystemIcon compact>
                      <Handshake aria-hidden="true" />
                    </FantasySystemIcon>
                    {{ t('Draw', 'Hòa') }}
                  </template>
                </BaseButton>
                <BaseButton
                  variant="secondary"
                  class="match-control-button match-control-resign font-bold tracking-wide"
                  size="sm"
                  :aria-label="t('Resign from match', 'Đầu hàng trận đấu')"
                  @click="confirmingResign = true"
                >
                  <FantasySystemIcon compact>
                    <Flag aria-hidden="true" />
                  </FantasySystemIcon>
                  {{ t('Resign', 'Đầu hàng') }}
                </BaseButton>
              </div>
              <div v-else class="space-y-2">
                <p class="text-foreground text-small text-center font-bold tracking-wide">
                  {{ t('Resign this match?', 'Đầu hàng trận này?') }}
                </p>
                <div class="flex gap-2">
                  <BaseButton variant="danger" size="sm" class="flex-1" @click="confirmResign">
                    {{ t('Confirm', 'Xác nhận') }}
                  </BaseButton>
                  <BaseButton
                    variant="secondary"
                    size="sm"
                    class="flex-1"
                    @click="confirmingResign = false"
                  >
                    {{ t('Cancel', 'Hủy') }}
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>

          <!-- CENTER: Game Board -->
          <div
            class="board-stage relative order-1 flex min-h-0 min-w-0 flex-col items-center justify-start overflow-hidden lg:order-none lg:justify-center"
          >
            <span class="board-environment" aria-hidden="true"></span>
            <div
              class="turn-status mb-1 w-full rounded-card border px-4 py-1 sm:px-5"
              :class="turnStatusClass"
              role="status"
              aria-live="polite"
            >
              <div class="flex items-center justify-between gap-4">
                <div class="flex min-w-0 items-center gap-3">
                  <span
                    class="turn-status-sigil"
                    :class="
                      game.yourTurn && game.phase === 'playing'
                        ? 'turn-status-sigil-active'
                        : 'opacity-50'
                    "
                    aria-hidden="true"
                  >
                    <Sparkles :size="16" stroke-width="2" />
                  </span>
                  <div class="min-w-0">
                    <p class="turn-status-title truncate text-small uppercase text-foreground">
                      {{ turnStatus.label }}
                    </p>
                    <p class="turn-status-copy mt-0.5 truncate text-caption text-foreground-muted">
                      {{ turnStatus.description }}
                    </p>
                  </div>
                </div>
                <TurnCountdownRing
                  v-if="game.phase === 'playing'"
                  :seconds-left="socket.turnSecondsLeft"
                  :total-seconds="socket.turnBudgetSeconds"
                  :tone="turnTimerTone"
                />
                <span
                  v-else
                  class="shrink-0 rounded-pill border border-border-subtle bg-surface-sunken px-2.5 py-1 text-caption font-semibold tabular-nums text-foreground-muted"
                >
                  {{ moveCount }} {{ t('moves', 'nước') }}
                </span>
              </div>
            </div>
            <MatchResultOverlay
              v-if="winSequence.showOverlay.value"
              :outcome="finishingOutcome"
              :countdown="winSequence.countdownSeconds.value"
              :show-countdown="winSequence.showCountdown.value"
            />
            <BoardRenderer
              class="game-board"
              :board="game.board"
              :interactive="boardInteractive"
              :last-move="game.lastMove"
              :winning-line="winningLine"
              :your-symbol="game.yourSymbol"
              :spirits="matchSpirits"
              @move="onMove"
              @cell-hover="onCellHover"
              @move-cue="onMoveCue"
              @victory-cue="onVictoryCue"
              @spirit-cue="onSpiritCue"
            />
          </div>

          <!-- RIGHT SIDE: Match chat and rules -->
          <div class="match-sidebar-right side-panel-shell order-3 flex h-full min-h-0 flex-col gap-2 lg:order-none">
            <OpponentLeftBanner
              v-if="socket.opponentReconnectSecondsLeft !== null"
              :seconds-left="socket.opponentReconnectSecondsLeft"
              class="shrink-0"
            />

            <p
              v-if="game.moveError"
              class="text-error text-small text-center font-medium shrink-0"
              role="alert"
            >
              {{ errorText(game.moveError) }}
            </p>

            <!-- Match chat -->
            <InGameChat
              class="side-panel-material h-72 shrink-0 sm:h-80 lg:h-auto lg:min-h-0 lg:flex-1"
            />

            <GlassCard
              as="section"
              class="game-rules-card side-panel-material shrink-0 !p-3"
              aria-labelledby="game-rules-heading"
            >
              <div class="rules-heading flex items-center gap-2 pb-2">
                <FantasySystemIcon compact>
                  <ScrollText aria-hidden="true" />
                </FantasySystemIcon>
                <h2
                  id="game-rules-heading"
                  class="text-caption font-semibold uppercase tracking-widest text-accent"
                >
                  {{ t('Game Rules', 'Luật chơi') }}
                </h2>
              </div>
              <ul class="rules-list mt-2 space-y-2 text-small text-foreground-secondary">
                <li class="rule-item">
                  <FantasySystemIcon compact>
                    <Target aria-hidden="true" />
                  </FantasySystemIcon>
                  <span>
                    <strong>{{ t('Victory', 'Chiến thắng') }}</strong>
                    {{ t('Get 5 in a row horizontally, vertically, or diagonally to win.', 'Xếp 5 quân liên tiếp theo hàng ngang, dọc hoặc chéo để thắng.') }}
                  </span>
                </li>
                <li class="rule-item">
                  <FantasySystemIcon compact>
                    <ShieldX aria-hidden="true" />
                  </FantasySystemIcon>
                  <span>
                    <strong>{{ t('International rules', 'Luật quốc tế') }}</strong>
                    {{ t('A line still wins when both ends are blocked, and 6 or more counts too.', 'Hàng bị chặn cả hai đầu vẫn thắng, và từ 6 quân trở lên cũng được tính.') }}
                  </span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>

        <div
          class="last-moves-panel relative mx-auto mt-1 flex w-full max-w-4xl shrink-0 items-center gap-2 overflow-hidden rounded-card border border-border bg-glass-strong px-3 py-1 shadow-floating backdrop-blur-glass sm:px-4"
        >
          <span
            class="hidden shrink-0 text-caption font-semibold uppercase tracking-widest text-foreground-muted sm:block"
            >{{ t('Last moves', 'Các nước gần nhất') }}</span
          >
          <button
            class="last-moves-arrow"
            type="button"
            :aria-label="t('Scroll moves left', 'Cuộn các nước sang trái')"
            @click="scrollHistory(-1)"
          >
            <ChevronLeft :size="18" aria-hidden="true" />
          </button>
          <div
            ref="historyScroll"
            class="last-moves-scroll custom-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
          >
            <button
              v-for="move in recentMoves"
              :key="`${move.moveNumber}-${move.coordinate}`"
              type="button"
              class="last-move-token"
              :class="[
                move.symbol === 1 ? 'last-move-token-x' : 'last-move-token-o',
                move.moveNumber === moveCount ? 'last-move-token-active' : '',
                winningCellKeys.has(`${String(move.x)}:${String(move.y)}`)
                  ? 'last-move-token-winning'
                  : '',
              ]"
              :aria-current="move.moveNumber === moveCount ? 'step' : undefined"
              :aria-label="`${t('Move', 'Nước')} ${move.moveNumber}, ${move.coordinate}, ${move.symbol === 1 ? 'X' : 'O'}`"
              :title="`${t('Move', 'Nước')} ${move.moveNumber} · ${move.coordinate}`"
            >
              <span class="last-move-number">{{ move.moveNumber }}</span>
              <X v-if="move.symbol === 1" :size="14" stroke-width="3" aria-hidden="true" />
              <Circle v-else :size="14" stroke-width="3" aria-hidden="true" />
              <span class="last-move-coordinate">{{ move.coordinate }}</span>
            </button>
            <span v-if="recentMoves.length === 0" class="text-caption text-foreground-muted"
              >{{ t('Moves will appear here', 'Các nước đi sẽ xuất hiện tại đây') }}</span
            >
          </div>
          <button
            class="last-moves-arrow"
            type="button"
            :aria-label="t('Scroll moves right', 'Cuộn các nước sang phải')"
            @click="scrollHistory(1)"
          >
            <ChevronRight :size="18" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ReconnectingOverlay
        v-if="showReconnectModal"
        :seconds-left="socket.reconnectSecondsLeft"
        :state="socket.connection === 'failed' ? 'failed' : 'reconnecting'"
        @retry="socket.retryReconnect"
        @leave="leave"
      />

      <GameResultBanner
        v-if="banner"
        :heading="banner.heading"
        :message="banner.message"
        :tone="banner.tone"
        :spirit="resultSpirit"
        @play-again="playAgain"
        @exit="leave"
        @share="shareReplay"
      />

      <!-- Draw Offer Dialog. Not dismissible: the offer needs an explicit answer. -->
      <BaseModal
        v-if="socket.drawOfferPending"
        :dismissible="false"
        aria-labelledby="draw-offer-heading"
      >
        <div class="text-center">
          <h2 id="draw-offer-heading" class="text-section gap-2 flex items-center justify-center">
            <Flag :size="20" aria-hidden="true" /> {{ t('Draw Offer', 'Đề nghị hòa') }}
          </h2>
          <p class="text-foreground-secondary text-body mt-3">{{ t('Your opponent has offered a draw.', 'Đối thủ đề nghị hòa.') }}</p>
          <p class="text-foreground-muted text-small mt-1">{{ t('(Making a move will decline it)', '(Đi một nước sẽ từ chối đề nghị)') }}</p>
        </div>

        <template #footer>
          <div class="gap-3 flex">
            <BaseButton variant="success" class="flex-1" @click="socket.sendRespondDraw(true)">
              {{ t('Accept', 'Chấp nhận') }}
            </BaseButton>
            <BaseButton variant="secondary" class="flex-1" @click="socket.sendRespondDraw(false)">
              {{ t('Decline', 'Từ chối') }}
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
        <h3 class="text-section font-bold text-foreground">{{ t('Finding next opponent...', 'Đang tìm đối thủ tiếp theo...') }}</h3>
        <p class="text-foreground-muted text-small">
          {{ isRanked ? t('Ranked Match', 'Trận xếp hạng') : t('Casual Match', 'Trận thường') }}
        </p>
        <BaseButton variant="secondary" size="sm" class="mt-4" @click="cancelInPlaceSearch">
          {{ t('Cancel Queue', 'Hủy hàng chờ') }}
        </BaseButton>
      </div>
      <ReconnectingOverlay
        v-else-if="socket.connection === 'reconnecting'"
        :seconds-left="socket.reconnectSecondsLeft"
        state="reconnecting"
      />

      <TurnstileModal
        v-if="turnstileModalOpen"
        @verify="onTurnstileVerified"
        @close="turnstileModalOpen = false; pendingMatchmakingMode = null"
      />
    </div>
  </AppLayout>
</template>

<style scoped>
@keyframes turn-breathe {
  0%,
  100% {
    opacity: 0.72;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}

@keyframes symbol-crystal-pulse {
  0%,
  100% {
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.08),
      0 0 0.65rem var(--color-accent-glow);
  }
  50% {
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.12),
      0 0 1rem var(--color-accent-glow);
  }
}

@keyframes last-move-chip-enter {
  from {
    opacity: 0;
    transform: translateX(0.75rem) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.match-room > .bg-background {
  background-color: color-mix(in srgb, var(--surface-background) 95%, var(--color-piece-contact));
}

.match-room-art {
  opacity: 0.16;
  filter: blur(4px) brightness(0.55) contrast(0.68) saturate(0.58);
  transform: scale(1.04);
}

.match-room-atmosphere {
  background:
    linear-gradient(
      112deg,
      transparent 18%,
      color-mix(in srgb, var(--color-board-ambient) 58%, transparent) 48%,
      transparent 78%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--surface-background) 50%, transparent),
      var(--surface-background)
    );
  box-shadow: inset 0 0 6rem 2rem rgb(0 4 14 / 0.92);
}

.match-room-atmosphere::before,
.match-room-atmosphere::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
}

.match-room-atmosphere::before {
  background: linear-gradient(180deg, var(--color-board-surface-reflection), transparent 24%);
  opacity: 0.16;
}

.match-room-atmosphere::after {
  background:
    linear-gradient(
      112deg,
      transparent 30%,
      var(--color-board-surface-reflection) 46%,
      transparent 62%
    ),
    radial-gradient(ellipse at 50% 100%, var(--color-board-ambient), transparent 54%);
  opacity: 0.28;
}

.match-room,
.match-shell,
.match-room-grid,
.board-stage,
.match-sidebar-left,
.match-sidebar-right {
  min-height: 0;
}

.board-stage {
  --game-board-size: min(calc(100vw - 1.5rem), 38rem);

  isolation: isolate;
}

.board-environment {
  position: absolute;
  inset: 2% 0;
  background:
    radial-gradient(ellipse at 50% 52%, var(--color-board-ambient), transparent 58%),
    linear-gradient(
      108deg,
      transparent 22%,
      color-mix(in srgb, var(--color-board-crystal) 46%, transparent) 49%,
      transparent 76%
    ),
    radial-gradient(
      ellipse at 50% 82%,
      color-mix(in srgb, var(--color-board-rune) 64%, transparent),
      transparent 54%
    );
  content: '';
  opacity: 0.07;
  pointer-events: none;
}

.board-environment::after {
  position: absolute;
  inset: 4%;
  background:
    radial-gradient(circle at 12% 22%, var(--color-board-node) 0 1px, transparent 1.5px),
    radial-gradient(circle at 27% 68%, var(--color-board-node) 0 0.75px, transparent 1.25px),
    radial-gradient(circle at 43% 16%, var(--color-board-node) 0 0.75px, transparent 1.25px),
    radial-gradient(circle at 58% 76%, var(--color-board-node) 0 1px, transparent 1.5px),
    radial-gradient(circle at 72% 28%, var(--color-board-node) 0 0.75px, transparent 1.25px),
    radial-gradient(circle at 88% 62%, var(--color-board-node) 0 1px, transparent 1.5px);
  content: '';
  opacity: 0.055;
  animation: arena-dust-drift 18s ease-in-out infinite alternate;
}

@keyframes arena-dust-drift {
  from {
    transform: translate3d(0, -0.35rem, 0);
  }
  to {
    transform: translate3d(0.45rem, 0.35rem, 0);
  }
}

.match-sidebar-left,
.match-sidebar-right {
  opacity: 0.94;
  transition: opacity var(--transition-duration-normal) ease-out;
}

.side-panel-shell {
  overflow: hidden;
  padding: 0.625rem;
  border: 1px solid color-mix(in srgb, var(--color-board-frame-metal) 68%, var(--color-border));
  border-radius: var(--radius-card);
  background:
    radial-gradient(circle at 50% 0%, var(--color-board-surface-reflection), transparent 34%),
    color-mix(in srgb, var(--surface-glass) 65%, transparent);
  box-shadow:
    var(--shadow-card),
    inset 0 1px 0 color-mix(in srgb, var(--color-fantasy-stone) 12%, transparent);
  -webkit-backdrop-filter: blur(var(--blur-md));
  backdrop-filter: blur(var(--blur-md));
}

.match-sidebar-left:focus-within,
.match-sidebar-left:hover,
.match-sidebar-right:focus-within,
.match-sidebar-right:hover {
  opacity: 1;
}

.last-moves-panel {
  block-size: 3.25rem;
}

.side-panel-material {
  border-color: color-mix(in srgb, var(--color-board-frame-metal) 72%, var(--color-border));
  background:
    radial-gradient(circle at 50% 0%, var(--color-board-surface-reflection), transparent 38%),
    repeating-linear-gradient(
      118deg,
      transparent 0 0.55rem,
      color-mix(in srgb, var(--color-board-texture) 9%, transparent) 0.6rem 0.65rem
    ),
    linear-gradient(
      155deg,
      color-mix(in srgb, var(--surface-3) 86%, var(--color-fantasy-stone)),
      color-mix(in srgb, var(--surface-background) 94%, var(--color-fantasy-navy))
    );
  box-shadow:
    var(--shadow-card),
    inset 0 1px 0 color-mix(in srgb, var(--color-fantasy-stone) 16%, transparent),
    inset 0 -2px 0 color-mix(in srgb, var(--color-piece-contact) 38%, transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--color-board-frame-metal) 18%, transparent);
  border-radius: var(--radius-card);
}

.match-meta-strip {
  position: relative;
  padding-block: 0.25rem;
}

.match-meta-strip::after {
  position: absolute;
  right: 12%;
  bottom: 0;
  left: 12%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-board-frame-metal), transparent);
  content: '';
}

.match-mode-badge,
.move-counter {
  background:
    linear-gradient(145deg, var(--color-board-surface-reflection), transparent 44%),
    color-mix(in srgb, var(--surface-sunken) 90%, var(--color-board-frame-metal));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--color-fantasy-stone) 12%, transparent),
    inset 0 -1px 0 color-mix(in srgb, var(--color-piece-contact) 28%, transparent);
}

.player-card {
  --player-rank: var(--color-rank-iron);
  --player-rank-highlight: color-mix(in srgb, var(--color-rank-iron) 48%, white);
  /* Dimming the whole card also dimmed its text. The inactive state is carried
     by border and glow below, so this only needs to take the edge off. */
  opacity: 0.92;
  overflow: hidden;
  transition:
    opacity var(--transition-duration-normal) ease-out,
    border-color var(--transition-duration-normal) ease-out,
    box-shadow var(--transition-duration-normal) ease-out,
    transform var(--transition-duration-normal) ease-out;
}

/* The grid belongs on GlassCard's body wrapper, not on the card itself: a
   non-nested GlassCard wraps its slot in one div, so a grid declared on the
   card would see that wrapper as its only item and squeeze the whole card into
   the first column. `body-class` is the prop GlassCard exposes for exactly
   this, and the portrait column is wider than the 4rem portrait because the
   rank emblem and the summoning ring both hang outside the avatar.

   `:deep` is required, not decorative: a scoped style only tags this
   component's own template, and GlassCard renders the body wrapper from its
   template, so the plain selector matches nothing. */
.player-card :deep(.player-card-body) {
  display: grid;
  grid-template-areas:
    'header header'
    'portrait details'
    'banner banner';
  grid-template-columns: 4.75rem minmax(0, 1fr);
  column-gap: 0.75rem;
  row-gap: 0.375rem;
  align-items: center;
}

.player-card[data-rank-tier='bronze'] {
  --player-rank: var(--color-rank-bronze);
  --player-rank-highlight: color-mix(in srgb, var(--color-rank-bronze) 58%, white);
}

.player-card[data-rank-tier='silver'] {
  --player-rank: var(--color-rank-silver);
  --player-rank-highlight: color-mix(in srgb, var(--color-rank-silver) 52%, white);
}

.player-card[data-rank-tier='gold'] {
  --player-rank: var(--color-rank-gold);
  --player-rank-highlight: color-mix(in srgb, var(--color-rank-gold-warm) 58%, white);
}

.player-card[data-rank-tier='diamond'] {
  --player-rank: var(--color-rank-diamond);
  --player-rank-highlight: color-mix(in srgb, var(--color-rank-diamond) 50%, white);
}

.player-card::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(
      circle at 50% 38%,
      color-mix(in srgb, var(--player-rank) 12%, transparent),
      transparent 42%
    ),
    linear-gradient(105deg, transparent 32%, var(--color-board-surface-reflection), transparent 68%);
  content: '';
  opacity: 0.54;
  pointer-events: none;
}

/* Inner keyline. `clip-path: inherit` resolved to `none` — the card has no
   clip-path of its own — so this drew a square frame inside a rounded card.
   Following the card radius, minus the 2px inset, is what makes it sit true. */
.player-card::after {
  position: absolute;
  inset: 2px;
  z-index: 0;
  border: 1px solid color-mix(in srgb, var(--color-board-frame-metal) 72%, transparent);
  border-radius: calc(var(--radius-card) - 2px);
  content: '';
  pointer-events: none;
}

.player-card:hover,
.player-card:focus-within {
  border-color: color-mix(in srgb, var(--player-rank) 48%, var(--color-border-strong));
  box-shadow:
    var(--shadow-card),
    0 0 0.75rem color-mix(in srgb, var(--player-rank) 12%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--color-fantasy-stone) 18%, transparent);
  opacity: 0.96;
  transform: translateY(-2px);
}

.player-card-active {
  border-color: color-mix(in srgb, var(--color-accent) 44%, var(--player-rank));
  opacity: 1;
}

.player-card-critical {
  border-color: color-mix(in srgb, var(--color-error) 62%, var(--color-border));
}

/* Ornamental corner brackets.
   `--fantasy-corner-inset` is derived, not eyeballed: on a corner of radius r
   the arc passes closest to the corner at r(1 - 1/√2) ≈ 0.293r, so anything
   inset less than that pokes through the card edge and gets shaved by
   `overflow: hidden`. 0.35rem on a 1rem radius clears the arc with room left. */
.fantasy-corner {
  --fantasy-corner-inset: 0.35rem;

  position: absolute;
  z-index: 2;
  width: 0.85rem;
  height: 0.85rem;
  border-color: color-mix(in srgb, var(--player-rank-highlight) 72%, transparent);
  pointer-events: none;
}

.fantasy-corner-tl {
  top: var(--fantasy-corner-inset);
  left: var(--fantasy-corner-inset);
  border-top: 1px solid;
  border-left: 1px solid;
}

.fantasy-corner-tr {
  top: var(--fantasy-corner-inset);
  right: var(--fantasy-corner-inset);
  border-top: 1px solid;
  border-right: 1px solid;
}

.fantasy-corner-bl {
  bottom: var(--fantasy-corner-inset);
  left: var(--fantasy-corner-inset);
  border-bottom: 1px solid;
  border-left: 1px solid;
}

.fantasy-corner-br {
  right: var(--fantasy-corner-inset);
  bottom: var(--fantasy-corner-inset);
  border-right: 1px solid;
  border-bottom: 1px solid;
}

.player-card-header {
  position: relative;
  z-index: 2;
  display: flex;
  grid-area: header;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-inline: 0.25rem;
}

.player-role-label {
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.player-symbol-badge {
  display: inline-flex;
  height: 1.75rem;
  width: 1.75rem;
  align-items: center;
  justify-content: center;
  /* No `border`: the hexagon clip cuts the border box, so a border survives on
     the flat sides and vanishes on every diagonal. A drop-shadow traces the
     clipped shape instead, which is the only rim that follows all six edges. */
  background:
    linear-gradient(145deg, var(--color-board-surface-reflection), transparent 42%),
    color-mix(in srgb, var(--surface-sunken) 82%, var(--color-board-frame-metal));
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--color-fantasy-stone) 14%, transparent),
    inset 0 -2px 3px color-mix(in srgb, var(--color-piece-contact) 42%, transparent);
  clip-path: polygon(50% 0, 92% 25%, 92% 75%, 50% 100%, 8% 75%, 8% 25%);
  filter: drop-shadow(0 0 0.08rem color-mix(in srgb, currentColor 52%, transparent));
}

.player-symbol-badge-active {
  background:
    radial-gradient(circle, var(--color-accent-soft), transparent 68%),
    color-mix(in srgb, var(--surface-sunken) 84%, var(--color-board-crystal));
  filter: drop-shadow(0 0 0.08rem color-mix(in srgb, currentColor 68%, transparent))
    drop-shadow(0 0 0.3rem var(--color-accent-glow));
}

.player-portrait {
  position: relative;
  z-index: 1;
  grid-area: portrait;
  width: 4rem;
  height: 4rem;
  align-self: center;
  margin: 0;
}

/* Summoning ring. The conic sweep is the fantasy read; anchoring its bright
   arcs to the rank colour is what stops every card looking identical. */
.player-portrait::before {
  position: absolute;
  inset: -0.3rem;
  border: 1px solid color-mix(in srgb, var(--player-rank) 62%, var(--color-border));
  border-radius: var(--radius-pill);
  background: conic-gradient(
    from 45deg,
    transparent,
    color-mix(in srgb, var(--player-rank-highlight) 46%, var(--color-board-frame-metal)),
    transparent 25% 50%,
    color-mix(in srgb, var(--player-rank-highlight) 46%, var(--color-board-frame-metal)),
    transparent 75%
  );
  box-shadow:
    inset 0 0 0.75rem color-mix(in srgb, var(--color-piece-contact) 54%, transparent),
    0 0.35rem 0.75rem color-mix(in srgb, var(--color-piece-contact) 44%, transparent);
  content: '';
}

.player-avatar {
  position: relative;
  z-index: 1;
}

.player-avatar :deep(span[aria-hidden='true']) {
  width: 4rem;
  height: 4rem;
  border: 2px solid color-mix(in srgb, var(--player-rank-highlight) 52%, var(--color-border));
  background:
    radial-gradient(circle at 38% 28%, var(--color-board-surface-reflection), transparent 32%),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--player-rank) 34%, var(--surface-2)),
      var(--surface-sunken)
    );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--color-fantasy-stone) 18%, transparent),
    inset 0 -0.25rem 0.5rem color-mix(in srgb, var(--color-piece-contact) 42%, transparent);
}

.active-avatar-frame {
  filter: drop-shadow(0 0 0.35rem var(--color-accent-glow));
}

/* Offsets are bounded by the portrait cell widened above: the emblem is
   2.75rem wide in a 4rem portrait, so it may hang 0.75rem past the avatar
   without reaching the details column. */
.player-rank-emblem {
  position: absolute;
  right: -0.5rem;
  bottom: -0.4rem;
  z-index: 3;
  filter: drop-shadow(0 0.25rem 0.25rem var(--color-piece-contact));
}

.player-details {
  position: relative;
  z-index: 2;
  display: grid;
  grid-area: details;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  align-content: center;
  gap: 0.375rem 0.5rem;
  margin: 0;
  text-align: left;
}

.player-name {
  display: block;
  max-width: 100%;
  grid-column: 1 / -1;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.2;
  text-shadow: 0 1px 0 var(--color-piece-contact);
}

.player-rank-badge {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  justify-content: flex-start;
  justify-self: start;
  gap: 0.25rem;
  border: 1px solid color-mix(in srgb, var(--player-rank) 62%, var(--color-border));
  border-radius: var(--radius-pill);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--player-rank) 18%, transparent), transparent),
    var(--surface-sunken);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--player-rank-highlight) 20%, transparent),
    0 0.25rem 0.5rem color-mix(in srgb, var(--color-piece-contact) 34%, transparent);
  color: var(--player-rank-highlight);
  font-size: var(--text-caption);
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  text-transform: uppercase;
  white-space: nowrap;
}

.player-elo {
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: 600;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.player-turn-banner {
  position: relative;
  z-index: 2;
  display: flex;
  grid-area: banner;
  min-height: 1.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0;
  border: 1px solid var(--color-border-subtle);
  background: color-mix(in srgb, var(--surface-sunken) 88%, transparent);
  box-shadow: inset 0 1px 0 var(--color-board-surface-reflection);
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: 700;
  letter-spacing: 0.1em;
  /* Clear of the chevron cut below, so the label never runs under it. */
  padding-inline: 0.75rem;
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
  clip-path: polygon(
    0.5rem 0,
    calc(100% - 0.5rem) 0,
    100% 50%,
    calc(100% - 0.5rem) 100%,
    0.5rem 100%,
    0 50%
  );
}

.player-turn-banner-active {
  border-color: color-mix(in srgb, var(--color-accent) 24%, var(--color-border));
  background:
    linear-gradient(90deg, transparent, var(--color-accent-soft), transparent),
    color-mix(in srgb, var(--surface-sunken) 92%, var(--color-board-crystal));
  box-shadow:
    inset 0 1px 0 var(--color-board-surface-reflection),
    0 0 0.4rem color-mix(in srgb, var(--color-accent-glow) 30%, transparent);
  color: var(--color-accent);
}

.player-turn-banner-critical {
  border-color: color-mix(in srgb, var(--color-error) 58%, var(--color-border));
  background: color-mix(in srgb, var(--surface-sunken) 84%, var(--color-error));
  color: var(--color-error);
}

.turn-banner-crystal {
  width: 0.4rem;
  height: 0.4rem;
  border: 1px solid currentColor;
  background: currentColor;
  box-shadow: 0 0 0.45rem currentColor;
  opacity: 0.58;
  transform: rotate(45deg);
}

.vs-divider {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1rem;
}

.vs-divider::before,
.vs-divider::after {
  height: 1px;
  flex: 1;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--color-board-frame-metal) 82%, transparent)
  );
  content: '';
}

.vs-divider::after {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-board-frame-metal) 82%, transparent),
    transparent
  );
}

.vs-divider span {
  margin: 0 0.6rem;
  color: color-mix(in srgb, var(--color-fantasy-gold) 58%, var(--text-muted));
  font-size: var(--text-caption);
  font-weight: 700;
  letter-spacing: 0.12em;
}

.match-control-button {
  min-height: 2.75rem;
  flex-direction: column;
  gap: 0.25rem;
  border-radius: var(--radius-button);
  font-size: var(--text-caption);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.match-controls-header {
  position: relative;
  padding-bottom: 0.25rem;
}

.match-controls-header::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: linear-gradient(90deg, var(--color-board-frame-metal), transparent 72%);
  content: '';
  opacity: 0.62;
}

.match-control-button[data-variant='secondary'] {
  border-color: color-mix(in srgb, currentColor 36%, var(--color-border));
  background:
    linear-gradient(145deg, var(--color-board-surface-reflection), transparent 42%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--surface-3) 88%, var(--color-board-frame-metal)),
      color-mix(in srgb, var(--surface-sunken) 94%, var(--color-piece-contact))
    );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--color-fantasy-stone) 16%, transparent),
    inset 0 -3px 5px color-mix(in srgb, var(--color-piece-contact) 52%, transparent),
    0 0.35rem 0.75rem color-mix(in srgb, var(--color-piece-contact) 42%, transparent);
}

.match-control-button:hover:not(:disabled) {
  border-color: color-mix(in srgb, currentColor 64%, var(--color-border-strong));
  box-shadow:
    var(--shadow-card),
    0 0 0.65rem color-mix(in srgb, currentColor 14%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--color-fantasy-stone) 22%, transparent);
}

.match-control-draw {
  color: var(--color-fantasy-cyan);
}

.match-control-resign {
  color: color-mix(in srgb, var(--color-error) 76%, var(--color-fantasy-stone));
}

.turn-status {
  position: relative;
  max-width: 38rem;
  overflow: hidden;
  box-shadow:
    var(--shadow-card),
    0 1px 0 rgb(255 255 255 / 0.025),
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    inset 0 0 0 1px rgb(255 255 255 / 0.018);
  -webkit-backdrop-filter: blur(var(--blur-glass)) saturate(1.16);
  backdrop-filter: blur(var(--blur-glass)) saturate(1.16);
  transition:
    background-color var(--transition-duration-normal) ease-out,
    border-color var(--transition-duration-normal) ease-out,
    box-shadow var(--transition-duration-normal) ease-out;
}

.turn-status-title {
  font-weight: 800;
  letter-spacing: 0.11em;
}

.turn-status-copy {
  line-height: 1.35;
}

.turn-status::after {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(100deg, transparent 25%, rgb(53 216 255 / 0.08), transparent 75%);
  content: '';
  pointer-events: none;
  transform: translateX(-100%);
  transition: transform var(--transition-duration-large) ease-out;
}

.turn-status:hover::after {
  transform: translateX(100%);
}

.turn-status-sigil {
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  background: radial-gradient(circle, var(--color-accent-soft), transparent 72%);
  box-shadow:
    inset 0 1px 0 var(--color-board-frame-metal),
    0 0 1rem var(--color-board-ambient);
  color: var(--color-accent);
}

.turn-status-sigil-active {
  animation: turn-breathe 1.8s ease-in-out infinite;
}

.turn-status-player {
  box-shadow:
    var(--shadow-card),
    0 0 1.25rem var(--color-accent-glow),
    inset 0 1px 0 rgb(255 255 255 / 0.075);
}

.turn-status-opponent .turn-status-sigil {
  animation: turn-breathe 2.8s ease-in-out infinite;
}

.match-room :deep(.glass-card:not(.side-panel-material)) {
  border-color: var(--color-border);
  background-color: color-mix(in srgb, var(--surface-glass-strong) 88%, transparent);
}

.last-moves-arrow {
  display: inline-flex;
  min-height: 2.75rem;
  min-width: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--radius-button);
  color: var(--text-muted);
  transition:
    color var(--transition-duration-fast) ease-out,
    background-color var(--transition-duration-fast) ease-out,
    border-color var(--transition-duration-fast) ease-out,
    box-shadow var(--transition-duration-normal) ease-out,
    transform var(--transition-duration-instant) ease-out;
}

.last-moves-panel {
  box-shadow:
    var(--shadow-floating),
    inset 0 1px 0 rgb(255 255 255 / 0.06);
  -webkit-backdrop-filter: blur(var(--blur-glass)) saturate(1.18);
  backdrop-filter: blur(var(--blur-glass)) saturate(1.18);
  transition:
    border-color var(--transition-duration-normal) ease-out,
    box-shadow var(--transition-duration-normal) ease-out;
}

.last-moves-panel::before {
  position: absolute;
  inset: 0 12% auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border-strong), transparent);
  content: '';
  pointer-events: none;
}

.last-moves-panel:focus-within {
  border-color: var(--color-border-strong);
  box-shadow:
    var(--shadow-floating),
    var(--shadow-glow),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.last-moves-scroll {
  scroll-behavior: smooth;
  scrollbar-width: none;
}

.last-moves-scroll::-webkit-scrollbar {
  display: none;
}

.last-moves-arrow:hover,
.last-moves-arrow:focus-visible {
  border-color: var(--color-border-strong);
  background-color: var(--color-accent-soft);
  box-shadow: var(--shadow-glow);
  color: var(--color-accent);
  transform: translateY(-2px);
}

.last-moves-arrow:active {
  box-shadow: var(--shadow-sm);
  transform: translateY(1px) scale(0.98);
}

.last-move-token {
  position: relative;
  display: inline-flex;
  min-height: 2.75rem;
  min-width: 5rem;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  background: color-mix(in srgb, var(--surface-3) 88%, transparent);
  padding: 0 0.6rem;
  animation: last-move-chip-enter 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  transition:
    transform var(--transition-duration-fast) ease-out,
    border-color var(--transition-duration-fast) ease-out,
    background-color var(--transition-duration-fast) ease-out,
    box-shadow var(--transition-duration-normal) ease-out;
}

.last-move-token:hover,
.last-move-token:focus-visible {
  border-color: var(--color-border-strong);
  background: var(--surface-4);
  box-shadow:
    var(--shadow-md),
    0 0 0 1px var(--color-accent-soft),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
  transform: translateY(-2px) scale(1.02);
}

.last-move-token:active {
  transform: scale(0.98);
}

.last-move-token-x {
  color: var(--color-player-x-hover);
  box-shadow: 0 0 14px var(--color-player-x-soft);
}

.last-move-token-o {
  color: var(--color-player-o-hover);
  box-shadow: 0 0 1rem var(--color-player-o-soft);
}

.last-move-token-winning {
  border-color: color-mix(in srgb, var(--color-accent) 60%, var(--color-border));
  background: color-mix(in srgb, var(--surface-4) 82%, var(--color-accent-soft));
  box-shadow:
    0 0 1.1rem var(--color-accent-glow),
    inset 0 1px 0 rgb(255 255 255 / 0.1);
}

.last-move-token-active {
  border-color: color-mix(in srgb, currentColor 54%, var(--color-border));
  background: color-mix(in srgb, var(--surface-4) 86%, var(--color-accent-soft));
  box-shadow:
    0 0 0 1px color-mix(in srgb, currentColor 38%, transparent),
    var(--shadow-md),
    inset 0 1px 0 var(--color-board-frame-metal);
}

.last-move-token-active::after {
  position: absolute;
  inset: 2px 24% auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  content: '';
  opacity: 0.82;
}

.last-move-number {
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: 700;
}

.last-move-coordinate {
  color: var(--text-foreground);
  font-size: var(--text-small);
  font-weight: 800;
  letter-spacing: 0.04em;
}

.game-rules-card {
  opacity: 0.8;
  transition:
    opacity var(--transition-duration-normal) ease-out,
    border-color var(--transition-duration-normal) ease-out,
    box-shadow var(--transition-duration-normal) ease-out;
}

.game-rules-card:hover {
  border-color: color-mix(in srgb, var(--color-board-frame-metal) 82%, var(--color-border));
  box-shadow:
    var(--shadow-card),
    0 0 0.75rem color-mix(in srgb, var(--color-board-crystal) 10%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--color-fantasy-stone) 18%, transparent);
  opacity: 0.96;
}

.rules-heading {
  position: relative;
  border-bottom: 1px solid var(--color-border-subtle);
}

.rules-heading::after {
  position: absolute;
  right: 16%;
  bottom: -1px;
  left: 16%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-board-crystal), transparent);
  content: '';
  opacity: 0.48;
}

.rule-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 0.5rem;
  line-height: 1.45;
}

.rule-item strong {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--color-fantasy-stone);
  font-size: var(--text-caption);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (prefers-reduced-motion: reduce) {
  .turn-status-sigil-active {
    animation: none;
  }

  .board-environment::after {
    animation: none;
  }

  .last-move-token {
    animation: none;
  }

  .player-symbol-badge-active {
    animation: none;
  }

  .turn-status::after {
    display: none;
  }

  .player-card {
    transition: none;
  }

  .player-card:hover,
  .player-card:focus-within {
    transform: none;
  }

  .match-sidebar-left,
  .match-sidebar-right {
    transition: none;
  }

  .last-moves-arrow:hover,
  .last-move-token:hover {
    transform: none;
  }
}

@media (max-width: 39.99rem) {
  .board-stage {
    --game-board-size: calc(100vw - 1.5rem);
  }

  .game-board {
    overflow: hidden;
    border-radius: var(--radius-card);
  }

  .game-board :deep(.board-renderer-surface) {
    transform: scale(1.14);
    transform-origin: center;
  }

  .game-board :deep(.fantasy-playfield) {
    --playable-grid-gutter: 0.5rem;
  }
}

@media (max-width: 63.99rem) {
  .match-room {
    overflow-y: auto;
    min-height: auto;
  }

  .match-shell {
    height: auto;
    min-height: 100%;
    overflow: visible;
  }

  .match-room-grid {
    flex: none;
  }

  .match-sidebar-left,
  .match-sidebar-right {
    opacity: 1;
  }

  .last-moves-panel {
    block-size: auto;
  }

  .game-rules-card {
    opacity: 1;
  }
}

@media (min-width: 64rem) {
  .match-shell {
    padding-block: 0.125rem;
    padding-inline: 0.5rem;
  }

  .match-room-grid {
    grid-template-columns:
      clamp(14rem, 16vw, 16rem)
      minmax(0, 1fr)
      clamp(15rem, 17vw, 17rem);
    gap: 0.75rem;
  }

  .match-sidebar-left {
    max-height: 100%;
    align-self: start;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
  }

  .match-sidebar-left::-webkit-scrollbar {
    display: none;
  }

  .match-controls {
    position: sticky;
    bottom: 0;
    z-index: 8;
    margin-inline: -0.25rem;
    border-top: 1px solid var(--color-border-subtle);
    background: linear-gradient(
      180deg,
      transparent,
      color-mix(in srgb, var(--surface-background) 94%, var(--color-fantasy-navy)) 18%
    );
    padding: 0.5rem 0.25rem 0.25rem;
    -webkit-backdrop-filter: blur(var(--blur-sm));
    backdrop-filter: blur(var(--blur-sm));
  }

  .board-stage {
    --game-board-size: clamp(20rem, min(100%, calc(100dvh - 9.625rem)), 82rem);
  }

  .turn-status {
    margin-bottom: 0.125rem;
    padding-block: 0.125rem;
    padding-inline: 1rem;
  }

  .turn-status :deep(.turn-timer-ring) {
    width: 2.5rem;
    height: 2.5rem;
  }

  .turn-status-sigil {
    width: 1.75rem;
    height: 1.75rem;
  }

  .last-moves-panel {
    block-size: 2.75rem;
    gap: 0.375rem;
    margin-top: 0.125rem;
    padding-block: 0.125rem;
    padding-inline: 0.75rem;
  }

  .last-moves-arrow,
  .last-move-token {
    min-height: 2.25rem;
  }
}

@media (min-width: 120rem) {
  .match-room-grid {
    grid-template-columns: 16rem minmax(0, 1fr) 17rem;
  }
}
</style>
