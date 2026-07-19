import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { matchmakeUrl, SocketManager, type SocketMessage } from '@/api/websocket'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import type {
  BoardUpdatePayload,
  GameOverPayload,
  MatchFoundPayload,
  PlayerSymbol,
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

export const useSocketStore = defineStore('socket', () => {
  const status = ref<MatchmakingStatus>('idle')
  const errorMessage = ref<string | null>(null)

  const auth = useAuthStore()
  const game = useGameStore()

  // The manager lives on the store so the connection outlives the components
  // that start it and survives navigation into the game (ADR-008).
  const manager = new SocketManager()

  function startMatchmaking(): void {
    if (auth.token === null) {
      status.value = 'error'
      errorMessage.value = 'You are not signed in.'
      return
    }

    status.value = 'connecting'
    errorMessage.value = null
    manager.connect(matchmakeUrl(auth.token), {
      onMessage: handleMessage,
      onClose: handleClose,
    })
  }

  // Cancelling a search is a plain disconnect: the backend drops a client from
  // the queue when its socket closes. Status is cleared first so the resulting
  // close is not misread as a lost connection.
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
          game.finish({ outcome, reason })
        }
        break
      case 'error':
        handleErrorFrame(message.payload)
        break
    }
  }

  // An error frame during a game is a rejected move, shown in the board's own
  // status line. Before a game it is a matchmaking failure, shown in the modal.
  function handleErrorFrame(payload: unknown): void {
    if (game.isInMatch) {
      if (isErrorPayload(payload)) {
        game.setMoveError(payload.message)
      }
      return
    }
    status.value = 'error'
    errorMessage.value = isErrorPayload(payload)
      ? payload.message
      : 'Matchmaking failed. Please try again.'
  }

  function handleClose(): void {
    if (status.value === 'connecting' || status.value === 'searching') {
      // Dropped before a match: surface it in the matchmaking modal.
      status.value = 'error'
      errorMessage.value = 'Connection lost. Please try again.'
    } else if (game.phase === 'playing') {
      // Dropped mid-game with no game_over: the game screen shows the loss of
      // connection. A game_over always moves the phase off 'playing' first, so
      // a normal finish never reaches here.
      game.markConnectionLost()
    }
  }

  // Closes the connection and clears all match state. Status is set before the
  // close so the resulting onClose is not misread as an unexpected drop.
  function teardown(): void {
    status.value = 'idle'
    errorMessage.value = null
    manager.close()
    game.reset()
  }

  // Any end of session tears the connection down, from any screen, so a logout
  // never leaves a socket open or stale match context behind.
  watch(
    () => auth.isAuthenticated,
    (authenticated) => {
      if (!authenticated) {
        teardown()
      }
    },
  )

  return { status, errorMessage, startMatchmaking, cancelMatchmaking, sendMove, sendResign, leaveGame }
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
