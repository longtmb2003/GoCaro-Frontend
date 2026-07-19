import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { CellValue, GameResult, MatchFoundPayload, PlayerSymbol } from '@/types/game'
import { createEmptyBoard } from '@/utils/board'

/**
 * A match's lifecycle on the client:
 * - `playing`: moves are exchanged.
 * - `over`: the server sent `game_over`; the result is set.
 * - `connection-lost`: the socket dropped mid-game with no `game_over`.
 */
type GamePhase = 'playing' | 'over' | 'connection-lost'

/**
 * Owns the current match: the board and turn as the server reports them, and
 * the outcome. The board is never derived locally — it is rebuilt move by move
 * from `board_update`, so the backend stays the single source of truth.
 */
export const useGameStore = defineStore('game', () => {
  const roomId = ref<string | null>(null)
  const opponent = ref('')
  const yourSymbol = ref<PlayerSymbol | null>(null)
  const yourTurn = ref(false)
  const phase = ref<GamePhase>('playing')

  const board = ref<CellValue[][]>(createEmptyBoard())
  const lastMove = ref<{ x: number; y: number } | null>(null)
  const result = ref<GameResult | null>(null)
  const moveError = ref<string | null>(null)

  const isInMatch = computed(() => roomId.value !== null)
  const canPlay = computed(() => phase.value === 'playing' && yourTurn.value)

  function startMatch(payload: MatchFoundPayload): void {
    roomId.value = payload.room_id
    opponent.value = payload.opponent
    yourSymbol.value = payload.your_symbol
    yourTurn.value = payload.your_turn
    phase.value = 'playing'
    board.value = createEmptyBoard()
    lastMove.value = null
    result.value = null
    moveError.value = null
  }

  function applyMove(x: number, y: number, symbol: PlayerSymbol, yourTurnNext: boolean): void {
    const column = board.value[x]
    if (column === undefined || column[y] === undefined) {
      return
    }
    column[y] = symbol
    lastMove.value = { x, y }
    yourTurn.value = yourTurnNext
    moveError.value = null
  }

  function finish(gameResult: GameResult): void {
    result.value = gameResult
    phase.value = 'over'
    yourTurn.value = false
  }

  function markConnectionLost(): void {
    phase.value = 'connection-lost'
    yourTurn.value = false
  }

  function setMoveError(message: string): void {
    moveError.value = message
  }

  function reset(): void {
    roomId.value = null
    opponent.value = ''
    yourSymbol.value = null
    yourTurn.value = false
    phase.value = 'playing'
    board.value = createEmptyBoard()
    lastMove.value = null
    result.value = null
    moveError.value = null
  }

  return {
    roomId,
    opponent,
    yourSymbol,
    yourTurn,
    phase,
    board,
    lastMove,
    result,
    moveError,
    isInMatch,
    canPlay,
    startMatch,
    applyMove,
    finish,
    markConnectionLost,
    setMoveError,
    reset,
  }
})
