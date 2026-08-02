import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { matchmakeUrl, reconnectUrl, SocketManager, type SocketMessage } from '@/api/websocket'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import type {
  BoardUpdatePayload,
  GameOverPayload,
  MatchFoundPayload,
  MatchmakingMode,
  OpponentReconnectingPayload,
  PlayerSymbol,
  QueueSearchingPayload,
  SyncStatePayload,
  ChatPayload,
} from '@/types/game'

/**
 * How long the client keeps trying to rejoin a match after its own socket drops.
 * It mirrors the backend's GRACE_PERIOD: the server holds the room open for that
 * long, then forfeits. The backend does not tell the dropped player their grace
 * (only the opponent is told), so this is the one place the two can drift — keep
 * it in step with GRACE_PERIOD on the server.
 */
const RECONNECT_BUDGET_MS = 60_000
/** Pause between reconnect attempts, so a failing rejoin does not busy-loop. */
const RECONNECT_RETRY_DELAY_MS = 2_000

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
  const searchProgress = ref<{ elapsed_seconds: number; search_range?: number } | null>(null)
  let searchTimer: number | null = null

  /**
   * Health of the in-game connection: `reconnecting` while the client is trying
   * to rejoin after its own socket dropped mid-match.
   */
  const connection = ref<'live' | 'reconnecting'>('live')
  /** Seconds left in the reconnect window, counted down for the overlay. */
  const reconnectSecondsLeft = ref(0)
  /** Seconds until the opponent forfeits, or null while they are connected. */
  const opponentReconnectSecondsLeft = ref<number | null>(null)

  /** True if the opponent has offered a draw and we must respond. */
  const drawOfferPending = ref(false)
  /** True if we have offered a draw and are waiting for the opponent's response. */
  const waitingForDrawResponse = ref(false)
  /** Number of draw offers remaining for this match (max 2). */
  const drawOffersLeft = ref(2)

  /** The list of in-game chat messages. Ephemeral, cleared on unmount/teardown. */
  const chatHistory = ref<ChatPayload[]>([])
  /** Whether the local user has muted the opponent's messages. */
  const isMuted = ref(false)

  /** Per-turn budget from match_found, reused to reset the clock each turn. */
  const turnBudgetSeconds = ref(0)
  /**
   * Seconds left on the current turn, for display only. The server owns the real
   * timeout, so this clock never decides an outcome: at zero it waits for the
   * server's `game_over`.
   */
  const turnSecondsLeft = ref(0)

  const auth = useAuthStore()
  const game = useGameStore()

  const manager = new SocketManager()

  // Timer handles for the reconnect lifecycle, cleared together in teardown.
  // reconnectDeadline is when the client gives up; the interval ticks the
  // countdown, the retry schedules the next attempt, and the opponent interval
  // ticks the opponent's own grace.
  let reconnectDeadline: number | null = null
  let countdownTimer: ReturnType<typeof setInterval> | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let opponentTimer: ReturnType<typeof setInterval> | null = null
  let turnTimer: ReturnType<typeof setInterval> | null = null

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
    searchProgress.value = { elapsed_seconds: 0 }
    status.value = 'connecting'
    errorMessage.value = null

    if (searchTimer !== null) clearInterval(searchTimer)
    searchTimer = window.setInterval(() => {
      if (searchProgress.value) {
        searchProgress.value.elapsed_seconds++
      }
    }, 1000)

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

  function sendOfferDraw(): void {
    if (drawOffersLeft.value > 0) {
      drawOffersLeft.value--
      waitingForDrawResponse.value = true
      manager.send({ type: 'offer_draw' })
    }
  }

  function sendGameChat(content: string): void {
    manager.send({ type: 'chat', payload: { content } })
  }

  function sendRespondDraw(accept: boolean): void {
    drawOfferPending.value = false
    manager.send({ type: 'respond_draw', payload: { accept } })
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
          // If server sends progress, update range. Don't overwrite elapsed_seconds as local timer is smoother.
          if (searchProgress.value) {
            searchProgress.value.search_range = message.payload.search_range
          } else {
            searchProgress.value = message.payload
          }
        }
        break
      case 'match_found':
        if (isMatchFoundPayload(message.payload)) {
          game.startMatch(message.payload)
          status.value = 'matched'
          turnBudgetSeconds.value = message.payload.turn_seconds
          drawOffersLeft.value = 2
          startTurnClock(message.payload.turn_seconds)
          if (searchTimer !== null) clearInterval(searchTimer)
        }
        break
      case 'board_update':
        if (isBoardUpdatePayload(message.payload)) {
          const yourTurnNext = message.payload.next_turn === auth.user?.id
          game.applyMove(message.payload.x, message.payload.y, message.payload.symbol, yourTurnNext)
          // A new turn has begun; the budget is constant, so reset to it.
          startTurnClock(turnBudgetSeconds.value)
        }
        break
      case 'sync_state':
        if (isSyncStatePayload(message.payload)) {
          resumeFromSync(message.payload)
        }
        break
      case 'opponent_reconnecting':
        if (isOpponentReconnectingPayload(message.payload)) {
          startOpponentCountdown(message.payload.remaining_seconds)
        }
        break
      case 'opponent_reconnected':
        clearOpponentCountdown()
        // The server resumes the same turn it paused; pick the clock back up.
        resumeTurnClock()
        break
      case 'draw_offered':
        if (isDrawOfferedPayload(message.payload)) {
          if (message.payload.by !== auth.user?.id) {
            drawOfferPending.value = true
          }
        }
        break
      case 'draw_rejected':
        waitingForDrawResponse.value = false
        drawOfferPending.value = false
        break
      case 'game_over':
        if (isGameOverPayload(message.payload)) {
          // The match is settled: no reconnect can help either side now.
          clearReconnectState()
          clearOpponentCountdown()
          clearTurnClock()
          const { winner, reason } = message.payload
          const outcome = winner === null ? 'draw' : winner === auth.user?.id ? 'win' : 'loss'
          game.finish({
            outcome,
            reason,
          })
        }
        break
      case 'chat':
        if (isChatPayload(message.payload) && !isMuted.value) {
          chatHistory.value.push(message.payload)
        }
        break
      case 'error':
        handleErrorFrame(message.payload)
        break
    }
  }

  /**
   * Restores the match from a `sync_state` frame: the reconnect landed. The
   * board is rebuilt from the frame, the socket is live again, and the countdown
   * stops.
   */
  function resumeFromSync(payload: SyncStatePayload): void {
    clearReconnectState()
    connection.value = 'live'
    game.syncFromState(payload.moves, payload.your_symbol, payload.turn === auth.user?.id)
    // sync_state carries the current turn's true remaining, so the clock lands
    // back in step with the server after the gap.
    startTurnClock(payload.remaining_turn_seconds)
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
      return
    }
    if (game.phase !== 'playing') {
      // A clean end: game_over already ran, or the match was left on purpose.
      return
    }
    // The socket dropped mid-match. A live connection begins the reconnect
    // window; a drop while already reconnecting is a failed attempt, retried
    // until the window closes.
    if (connection.value === 'live') {
      beginReconnect()
    } else {
      scheduleReconnectAttempt()
    }
  }

  /** Opens the reconnect window and makes the first attempt straight away. */
  function beginReconnect(): void {
    connection.value = 'reconnecting'
    reconnectDeadline = Date.now() + RECONNECT_BUDGET_MS
    reconnectSecondsLeft.value = Math.ceil(RECONNECT_BUDGET_MS / 1000)
    countdownTimer = setInterval(tickReconnectCountdown, 1000)
    // The turn clock is out of touch with the server while the socket is down;
    // sync_state re-anchors it on a successful rejoin.
    freezeTurnClock()
    attemptReconnect()
  }

  function tickReconnectCountdown(): void {
    if (reconnectDeadline === null) {
      return
    }
    const remaining = reconnectDeadline - Date.now()
    reconnectSecondsLeft.value = Math.max(0, Math.ceil(remaining / 1000))
    if (remaining <= 0) {
      giveUpReconnect()
    }
  }

  /** Opens a fresh socket to the reconnect endpoint; success arrives as sync_state. */
  function attemptReconnect(): void {
    if (auth.token === null) {
      giveUpReconnect()
      return
    }
    manager.connect(reconnectUrl(auth.token), { onMessage: handleMessage, onClose: handleClose })
  }

  /** Queues the next attempt after a failed one, unless the window has closed. */
  function scheduleReconnectAttempt(): void {
    if (reconnectDeadline !== null && Date.now() >= reconnectDeadline) {
      giveUpReconnect()
      return
    }
    retryTimer = setTimeout(attemptReconnect, RECONNECT_RETRY_DELAY_MS)
  }

  /**
   * Ends reconnection unsuccessfully: the window closed. The match is treated as
   * lost on the client — the server has forfeited it — through the same
   * connection-lost state a drop showed before this feature.
   */
  function giveUpReconnect(): void {
    clearReconnectState()
    manager.close()
    game.markConnectionLost()
  }

  /** Stops every reconnect timer and returns the connection to a live baseline. */
  function clearReconnectState(): void {
    if (countdownTimer !== null) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    if (retryTimer !== null) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    reconnectDeadline = null
    reconnectSecondsLeft.value = 0
    connection.value = 'live'
  }

  /** Ticks the opponent's grace down locally from the single figure the server sends. */
  function startOpponentCountdown(seconds: number): void {
    clearOpponentCountdown()
    opponentReconnectSecondsLeft.value = seconds
    // The server pauses the turn clock only for a player who dropped while on
    // turn, so freeze the display to match — but only when it is the opponent's
    // turn; if the drop happened on my turn, my clock keeps running server-side.
    if (!game.yourTurn) {
      freezeTurnClock()
    }
    opponentTimer = setInterval(() => {
      const left = (opponentReconnectSecondsLeft.value ?? 0) - 1
      opponentReconnectSecondsLeft.value = Math.max(0, left)
      if (left <= 0 && opponentTimer !== null) {
        clearInterval(opponentTimer)
        opponentTimer = null
      }
    }, 1000)
  }

  function clearOpponentCountdown(): void {
    if (opponentTimer !== null) {
      clearInterval(opponentTimer)
      opponentTimer = null
    }
    opponentReconnectSecondsLeft.value = null
  }

  // --- Turn clock ---------------------------------------------------------
  // For display only; the server is the sole authority on timeouts. All four
  // helpers are cleared through teardown, like the reconnect timers.

  /** Sets the clock to `seconds` and starts ticking it down to zero. */
  function startTurnClock(seconds: number): void {
    turnSecondsLeft.value = Math.max(0, seconds)
    restartTurnTicker()
  }

  /** Stops the clock without changing its value (a server-side pause). */
  function freezeTurnClock(): void {
    if (turnTimer !== null) {
      clearInterval(turnTimer)
      turnTimer = null
    }
  }

  /** Resumes ticking from the frozen value; a no-op if already running or at zero. */
  function resumeTurnClock(): void {
    if (turnTimer === null && turnSecondsLeft.value > 0) {
      restartTurnTicker()
    }
  }

  function restartTurnTicker(): void {
    freezeTurnClock()
    if (turnSecondsLeft.value <= 0) {
      return
    }
    turnTimer = setInterval(() => {
      turnSecondsLeft.value = Math.max(0, turnSecondsLeft.value - 1)
      if (turnSecondsLeft.value <= 0) {
        freezeTurnClock()
      }
    }, 1000)
  }

  function clearTurnClock(): void {
    freezeTurnClock()
    turnSecondsLeft.value = 0
  }

  function teardown(): void {
    status.value = 'idle'
    errorMessage.value = null
    searchProgress.value = null
    clearReconnectState()
    clearOpponentCountdown()
    clearTurnClock()
    turnBudgetSeconds.value = 0
    drawOfferPending.value = false
    waitingForDrawResponse.value = false
    drawOffersLeft.value = 2
    chatHistory.value = []
    isMuted.value = false
    if (searchTimer !== null) {
      clearInterval(searchTimer)
      searchTimer = null
    }
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
    connection,
    reconnectSecondsLeft,
    opponentReconnectSecondsLeft,
    turnBudgetSeconds,
    turnSecondsLeft,
    drawOfferPending,
    waitingForDrawResponse,
    drawOffersLeft,
    chatHistory,
    isMuted,
    startMatchmaking,
    cancelMatchmaking,
    sendMove,
    sendResign,
    sendOfferDraw,
    sendRespondDraw,
    sendGameChat,
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

function isSyncStatePayload(payload: unknown): payload is SyncStatePayload {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }
  const record = payload as Record<string, unknown>
  return (
    Array.isArray(record.moves) &&
    typeof record.turn === 'string' &&
    isPlayerSymbol(record.your_symbol)
  )
}

function isOpponentReconnectingPayload(
  payload: unknown,
): payload is OpponentReconnectingPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }
  return typeof (payload as Record<string, unknown>).remaining_seconds === 'number'
}

function isDrawOfferedPayload(payload: unknown): payload is { by: string } {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }
  return typeof (payload as Record<string, unknown>).by === 'string'
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

function isChatPayload(payload: unknown): payload is ChatPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }
  const record = payload as Record<string, unknown>
  return (
    typeof record.sender_id === 'string' &&
    typeof record.display_name === 'string' &&
    typeof record.content === 'string'
  )
}
