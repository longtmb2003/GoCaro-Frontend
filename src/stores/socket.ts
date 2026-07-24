import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { matchmakeUrl, SocketManager, type SocketMessage } from '@/api/websocket'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import type {
  BoardUpdatePayload,
  GameOverPayload,
  MatchFoundPayload,
  MatchmakingMode,
  PlayerSymbol,
  QueueSearchingPayload,
} from '@/types/game'

/**
 * Matchmaking connection state.
 * - `idle`: no connection.
 * - `connecting`: socket opening, not yet acknowledged.
 * - `searching`: server confirmed `queued`, waiting for an opponent.
 * - `matched`: `match_found` received; the connection stays open for gameplay.
 * - `error`: the attempt failed or the connection dropped while searching.
 */
export type MatchmakingStatus = 'idle' | 'connecting' | 'searching' | 'matched' | 'error'

/**
 * Wording for the queue refusals a player can actually cause, which the backend
 * states in its own terms. Both mean the account is busy somewhere else — most
 * often a forgotten second tab — so the message says where to look. Any other
 * code falls back to the server's message.
 */
const QUEUE_ERROR_MESSAGES: Record<string, string> = {
  ALREADY_IN_MATCH: 'You are already in a match, probably in another tab. Finish it before starting another.',
  ALREADY_QUEUED: 'You are already searching for a match, probably in another tab.',
}

export const useSocketStore = defineStore('socket', () => {
  const status = ref<MatchmakingStatus>('idle')
  const errorMessage = ref<string | null>(null)
  /** Which queue the current (or last) search ran on. */
  const mode = ref<MatchmakingMode>('casual')
  /** Latest ranked search progress, reset whenever a new search starts. */
  const searchProgress = ref<QueueSearchingPayload | null>(null)

  const auth = useAuthStore()
  const game = useGameStore()

  const manager = new SocketManager()

  function startMatchmaking(searchMode: MatchmakingMode = 'casual'): void {
    if (auth.token === null) {
      status.value = 'error'
      errorMessage.value = 'You are not signed in.'
      return
    }
    // The backend refuses a guest with a 403 before the WebSocket upgrade, but a
    // browser reports a rejected handshake as a bare connection failure. Deciding
    // here is what lets the player be told why (see BACKEND_CONTRACT.md).
    if (searchMode === 'ranked' && auth.isGuest) {
      status.value = 'error'
      errorMessage.value = 'Ranked play requires a saved account.'
      return
    }

    mode.value = searchMode
    searchProgress.value = null
    status.value = 'connecting'
    errorMessage.value = null
    manager.connect(matchmakeUrl(auth.token, searchMode), {
      onMessage: handleMessage,
      onClose: handleClose,
    })
  }

  function cancelMatchmaking(): void {
    teardown()
  }

  /** Sends a move; the server validates it and answers with a board_update. */
  function sendMove(x: number, y: number): void {
    manager.send({ type: 'move', payload: { x, y } })
  }

  function sendResign(): void {
    manager.send({ type: 'resign' })
  }

  /** Leaves a finished or lost match and returns to a clean, idle state. */
  function leaveGame(): void {
    teardown()
  }

  function handleMessage(message: SocketMessage): void {
    switch (message.type) {
      case 'queued':
        status.value = 'searching'
        break
      case 'queue_searching':
        if (isQueueSearchingPayload(message.payload)) {
          searchProgress.value = message.payload
        }
        break
      case 'match_found':
        if (isMatchFoundPayload(message.payload)) {
          game.startMatch(message.payload)
          status.value = 'matched'
        }
        break
      case 'board_update':
        if (isBoardUpdatePayload(message.payload)) {
          const yourTurnNext = message.payload.next_turn === auth.user?.id
          game.applyMove(message.payload.x, message.payload.y, message.payload.symbol, yourTurnNext)
        }
        break
      case 'game_over':
        if (isGameOverPayload(message.payload)) {
          const { winner, reason } = message.payload
          const outcome = winner === null ? 'draw' : winner === auth.user?.id ? 'win' : 'loss'
          game.finish({
            outcome,
            reason,
            ratingDelta: ratingDeltaFor(message.payload, game.yourSymbol),
          })
        }
        break
      case 'error':
        handleErrorFrame(message.payload)
        break
    }
  }

  function handleErrorFrame(payload: unknown): void {
    if (game.isInMatch) {
      if (isErrorPayload(payload)) {
        game.setMoveError(payload.message)
      }
      return
    }
    status.value = 'error'
    if (!isErrorPayload(payload)) {
      errorMessage.value = 'Matchmaking failed. Please try again.'
      return
    }
    errorMessage.value = QUEUE_ERROR_MESSAGES[payload.code] ?? payload.message
  }

  function handleClose(): void {
    if (status.value === 'connecting' || status.value === 'searching') {
      status.value = 'error'
      errorMessage.value = 'Connection lost. Please try again.'
    } else if (game.phase === 'playing') {
      game.markConnectionLost()
    }
  }

  function teardown(): void {
    status.value = 'idle'
    errorMessage.value = null
    searchProgress.value = null
    manager.close()
    game.reset()
  }

  watch(
    () => auth.isAuthenticated,
    (authenticated) => {
      if (!authenticated) {
        teardown()
      }
    },
  )

  return {
    status,
    errorMessage,
    mode,
    searchProgress,
    startMatchmaking,
    cancelMatchmaking,
    sendMove,
    sendResign,
    leaveGame,
  }
})

function isPlayerSymbol(value: unknown): value is PlayerSymbol {
  return value === 1 || value === 2
}

function isMatchFoundPayload(payload: unknown): payload is MatchFoundPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }
  const record = payload as Record<string, unknown>
  return (
    typeof record.room_id === 'string' &&
    typeof record.opponent === 'string' &&
    isPlayerSymbol(record.your_symbol) &&
    typeof record.your_turn === 'boolean'
  )
}

/**
 * Picks this player's side of a ranked result: black is symbol 1, white is 2.
 *
 * Returns null whenever no rating was at stake, so the UI can stay silent rather
 * than show a misleading zero. It reads the raw frame instead of the narrowed
 * payload on purpose: a `game_over` that arrives without rating fields must
 * still end the match, since the result matters far more than the number.
 */
function ratingDeltaFor(payload: unknown, symbol: PlayerSymbol | null): number | null {
  if (typeof payload !== 'object' || payload === null || symbol === null) {
    return null
  }
  const record = payload as Record<string, unknown>
  if (record.is_ranked !== true) {
    return null
  }
  const delta = symbol === 1 ? record.delta_black : record.delta_white
  return typeof delta === 'number' ? delta : null
}

function isQueueSearchingPayload(payload: unknown): payload is QueueSearchingPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }
  const record = payload as Record<string, unknown>
  return typeof record.elapsed_seconds === 'number' && typeof record.search_range === 'number'
}

function isBoardUpdatePayload(payload: unknown): payload is BoardUpdatePayload {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }
  const record = payload as Record<string, unknown>
  return (
    typeof record.x === 'number' &&
    typeof record.y === 'number' &&
    isPlayerSymbol(record.symbol) &&
    typeof record.next_turn === 'string'
  )
}

function isGameOverPayload(payload: unknown): payload is GameOverPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }
  const record = payload as Record<string, unknown>
  return (
    (record.winner === null || typeof record.winner === 'string') &&
    typeof record.reason === 'string'
  )
}

function isErrorPayload(payload: unknown): payload is { code: string; message: string } {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }
  const record = payload as Record<string, unknown>
  return typeof record.code === 'string' && typeof record.message === 'string'
}
