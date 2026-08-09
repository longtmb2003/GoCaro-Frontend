import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { matchmakeUrl, reconnectUrl, SocketManager, type SocketMessage } from '@/api/websocket'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { useMatchAudio } from '@/composables/useMatchAudio'
import type {
  BoardUpdatePayload,
  GameOverPayload,
  MatchFoundPayload,
  MatchmakingMode,
  MatchProposalClosedPayload,
  MatchProposedPayload,
  OpponentReconnectingPayload,
  PlayerSymbol,
  QueueSearchingPayload,
  SyncStatePayload,
  ChatPayload,
} from '@/types/game'
import { deriveWinResult } from '@/utils/board'
import {
  clearMatchRecovery,
  loadMatchRecovery,
  saveMatchRecovery,
} from '@/utils/matchRecovery'

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
export type MatchmakingStatus =
  | 'idle'
  | 'connecting'
  | 'searching'
  /** A pairing has been offered and is waiting on this player's answer. */
  | 'proposed'
  | 'matched'
  | 'error'
export type GameConnectionStatus = 'live' | 'reconnecting' | 'failed'

/**
 * Wording for the queue refusals a player can actually cause, which the backend
 * states in its own terms. Both mean the account is busy somewhere else — most
 * often a forgotten second tab — so the message says where to look. Any other
 * code falls back to the server's message.
 */
const QUEUE_ERROR_MESSAGES: Record<string, string> = {
  ALREADY_IN_MATCH:
    'You are already in a match, probably in another tab. Finish it before starting another.',
  ALREADY_QUEUED: 'You are already searching for a match, probably in another tab.',
  // The server's own wording carries a second count that would go untranslated,
  // so the code is worded here and the number is read from retry_after_seconds.
  QUEUE_LOCKED: 'Matchmaking is locked because too many matches were abandoned.',
}

export const useSocketStore = defineStore('socket', () => {
  const status = ref<MatchmakingStatus>('idle')
  const errorMessage = ref<string | null>(null)

  const isMatchmaking = computed(
    () =>
      status.value === 'connecting' ||
      status.value === 'searching' ||
      status.value === 'proposed' ||
      status.value === 'error'
  )

  /** The pairing awaiting this player's answer, or null. */
  const proposal = ref<MatchProposedPayload | null>(null)
  /** Seconds left to answer, ticked locally; the server owns the real deadline. */
  const proposalSecondsLeft = ref(0)
  /** Set when a refusal will lift by itself, so the UI can count it down. */
  const retryAfterSeconds = ref(0)
  // The deadline the refusal expires at, derived once from retry_after_seconds.
  // The raw count is a snapshot taken when the frame arrived; a view that shows
  // it verbatim keeps printing the same number while the wait actually shrinks,
  // so anything counting down needs a fixed point in time to count towards.
  const retryUntil = ref<string | null>(null)
  let proposalTimer: number | null = null

  const yourSpirit = ref<string>('')
  const opponentSpirit = ref<string>('')

  /** Which queue the current (or last) search ran on. */
  const mode = ref<MatchmakingMode>('casual')
  /** Latest ranked search progress, reset whenever a new search starts. */
  const searchProgress = ref<{ elapsed_seconds: number; search_range?: number } | null>(null)
  let searchTimer: number | null = null

  /**
   * Health of the in-game connection: `reconnecting` while the client is trying
   * to rejoin after its own socket dropped mid-match.
   */
  const connection = ref<GameConnectionStatus>('live')
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
  const matchAudio = useMatchAudio()

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

  // Set per matchmaking attempt, read by handleClose to explain a failure.
  let matchmakingUsedCaptcha = false
  let socketOpened = false

  function startMatchmaking(searchMode: MatchmakingMode = 'casual', captchaToken?: string): void {
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
    matchAudio.playMatchmakingLoop()
    searchProgress.value = { elapsed_seconds: 0 }
    status.value = 'connecting'
    errorMessage.value = null

    if (searchTimer !== null) clearInterval(searchTimer)
    searchTimer = window.setInterval(() => {
      if (searchProgress.value) {
        searchProgress.value.elapsed_seconds++
      }
    }, 1000)

    // A rejected handshake reaches the browser as a bare connection failure:
    // the 403 body is unreadable. Remembering that this attempt carried a
    // captcha, and whether the socket ever opened, is what lets a player who
    // failed verification be told so instead of seeing "connection lost".
    matchmakingUsedCaptcha = captchaToken !== undefined
    socketOpened = false

    manager.connect(matchmakeUrl(auth.token, searchMode, captchaToken), {
      onOpen: () => {
        socketOpened = true
      },
      onMessage: handleMessage,
      onClose: handleClose,
    })
  }

  function cancelMatchmaking(): void {
    clearProposal()
    teardown('cancelled')
  }

  /**
   * A pairing was offered. The countdown is drawn locally so the dialog can
   * show one; the server holds the authoritative deadline and will close the
   * proposal itself, so reaching zero here is never what decides anything.
   */
  function openProposal(payload: MatchProposedPayload): void {
    clearProposal()
    proposal.value = payload
    proposalSecondsLeft.value = payload.timeout_seconds
    status.value = 'proposed'
    matchAudio.playMatchFound()

    proposalTimer = window.setInterval(() => {
      proposalSecondsLeft.value = Math.max(0, proposalSecondsLeft.value - 1)
    }, 1000)
  }

  function closeProposal(payload: MatchProposalClosedPayload): void {
    clearProposal()
    if (payload.reason === 'you_declined') {
      teardown('cancelled')
      return
    }
    if (payload.requeued) {
      // Still in the queue, so the search simply resumes rather than erroring.
      status.value = 'searching'
      errorMessage.value = null
      return
    }
    status.value = 'error'
    matchAudio.cancelMatchmakingAudio()
    errorMessage.value = 'The match was cancelled because nobody accepted in time.'
  }

  function clearProposal(): void {
    if (proposalTimer !== null) {
      clearInterval(proposalTimer)
      proposalTimer = null
    }
    proposal.value = null
    proposalSecondsLeft.value = 0
  }

  /** Answers a proposal. Both are no-ops once the offer has already closed. */
  function acceptMatch(): void {
    if (proposal.value === null) return
    manager.send({ type: 'accept_match' })
  }

  function declineMatch(): void {
    if (proposal.value === null) return
    manager.send({ type: 'decline_match' })
  }

  /** Sends a move; the server validates it and answers with a board_update. */
  function sendMove(x: number, y: number): void {
    if (!game.canPlay || connection.value !== 'live') return
    manager.send({ type: 'move', payload: { x, y } })
  }

  function sendResign(): void {
    if (game.phase !== 'playing' || connection.value !== 'live') return
    manager.send({ type: 'resign' })
  }

  function sendOfferDraw(): void {
    if (game.phase === 'playing' && connection.value === 'live' && drawOffersLeft.value > 0) {
      drawOffersLeft.value--
      waitingForDrawResponse.value = true
      manager.send({ type: 'offer_draw' })
    }
  }

  function sendGameChat(content: string): void {
    manager.send({ type: 'chat', payload: { content } })
  }

  function sendRespondDraw(accept: boolean): void {
    if (game.phase !== 'playing' || connection.value !== 'live') return
    drawOfferPending.value = false
    manager.send({ type: 'respond_draw', payload: { accept } })
  }

  /** Leaves a finished or lost match and returns to a clean, idle state. */
  function leaveGame(): void {
    yourSpirit.value = ''
    opponentSpirit.value = ''
    teardown()
  }

  function handleMessage(message: SocketMessage): void {
    switch (message.type) {
      case 'queued':
        status.value = 'searching'
        // Reaching the queue proves any lockout has lifted. This is the only
        // place it clears: teardown must not, or dismissing the notice would
        // erase a lock the server is still enforcing, and the play buttons
        // would go back to inviting a search that can only be refused.
        retryUntil.value = null
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
      case 'match_proposed':
        if (isMatchProposedPayload(message.payload)) {
          openProposal(message.payload)
        }
        break
      case 'match_proposal_closed':
        if (isMatchProposalClosedPayload(message.payload)) {
          closeProposal(message.payload)
        }
        break
      case 'match_found':
        // Whether or not there was a proposal, the match starting ends it.
        clearProposal()
        if (isMatchFoundPayload(message.payload)) {
          yourSpirit.value = message.payload.your_spirit
          opponentSpirit.value = message.payload.opponent_spirit
          game.startMatch(message.payload)
          if (auth.user !== null) {
            saveMatchRecovery({ match: message.payload, mode: mode.value, playerId: auth.user.id })
          }
          status.value = 'matched'
          matchAudio.playMatchFound()
          turnBudgetSeconds.value = message.payload.turn_seconds
          drawOffersLeft.value = 2
          startTurnClock(message.payload.turn_seconds)
          if (searchTimer !== null) clearInterval(searchTimer)
        }
        break
      case 'board_update':
        if (game.phase === 'playing' && isBoardUpdatePayload(message.payload)) {
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
          if (game.phase === 'finishing' || game.phase === 'result') break
          // The match is settled: no reconnect can help either side now.
          clearMatchRecovery()
          clearReconnectState()
          clearOpponentCountdown()
          clearTurnClock()
          const { winner, reason } = message.payload
          const outcome = winner === null ? 'draw' : winner === auth.user?.id ? 'win' : 'loss'
          matchAudio.finishMatch()
          const confirmedWin =
            reason === 'five_in_row' && winner !== null
              ? deriveWinResult(game.board, game.lastMove, winner)
              : null
          drawOfferPending.value = false
          waitingForDrawResponse.value = false
          game.finish(
            {
              outcome,
              reason,
            },
            confirmedWin,
          )
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
    yourSpirit.value = payload.your_spirit
    opponentSpirit.value = payload.opponent_spirit
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
    clearProposal()
    status.value = 'error'
    matchAudio.cancelMatchmakingAudio()
    if (!isErrorPayload(payload)) {
      errorMessage.value = 'Matchmaking failed. Please try again.'
      return
    }
    // A refusal that lifts by itself carries its own countdown, so the player
    // is told how long rather than left to keep retrying.
    const retry = (payload as { retry_after_seconds?: unknown }).retry_after_seconds
    retryAfterSeconds.value = typeof retry === 'number' ? retry : 0
    retryUntil.value =
      retryAfterSeconds.value > 0
        ? new Date(Date.now() + retryAfterSeconds.value * 1000).toISOString()
        : null
    errorMessage.value = QUEUE_ERROR_MESSAGES[payload.code] ?? payload.message
  }

  function handleClose(): void {
    if (status.value === 'connecting' || status.value === 'searching') {
      matchAudio.cancelMatchmakingAudio()
      status.value = 'error'
      // Never opening the socket on a captcha-gated attempt means the server
      // refused the handshake, and verification is the reason it added. The
      // wording stays honest about the alternative: an unreachable server
      // looks identical from here.
      errorMessage.value =
        matchmakingUsedCaptcha && !socketOpened
          ? 'Security verification failed or expired. Please try again.'
          : 'Connection lost. Please try again.'
      return
    }
    if (game.phase !== 'playing' && connection.value !== 'reconnecting') {
      // A clean end: game_over already ran, or the match was left on purpose.
      return
    }
    // The socket dropped mid-match. A live connection begins the reconnect
    // window; a drop while already reconnecting is a failed attempt, retried
    // until the window closes.
    if (connection.value === 'live') {
      beginReconnect()
    } else if (connection.value === 'reconnecting') {
      scheduleReconnectAttempt()
    }
  }

  /**
   * Rehydrates the minimum match identity lost by a browser refresh, then asks
   * the server for the authoritative board through its reconnect endpoint.
   */
  function recoverMatchAfterRefresh(): boolean {
    if (game.isInMatch) return true

    const snapshot = loadMatchRecovery(auth.user?.id)
    if (snapshot === null || auth.token === null) return false

    mode.value = snapshot.mode
    status.value = 'matched'
    game.startMatch(snapshot.match)
    turnBudgetSeconds.value = snapshot.match.turn_seconds
    drawOffersLeft.value = 2
    beginReconnect()
    return true
  }

  /** Opens the reconnect window and makes the first attempt straight away. */
  function beginReconnect(): void {
    stopReconnectTimers()
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
    stopReconnectTimers()
    manager.close()
    reconnectSecondsLeft.value = 0
    connection.value = 'failed'
    game.markConnectionLost()
  }

  /** Gives the player another explicit reconnect window after an attempt failed. */
  function retryReconnect(): void {
    if (!game.isInMatch || auth.token === null) return
    beginReconnect()
  }

  /** Stops every reconnect timer and returns the connection to a live baseline. */
  function clearReconnectState(): void {
    stopReconnectTimers()
    reconnectSecondsLeft.value = 0
    connection.value = 'live'
  }

  function stopReconnectTimers(): void {
    if (countdownTimer !== null) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    if (retryTimer !== null) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    reconnectDeadline = null
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

  function teardown(audioExit: 'idle' | 'cancelled' = 'idle'): void {
    status.value = 'idle'
    errorMessage.value = null
    retryAfterSeconds.value = 0
    searchProgress.value = null
    clearProposal()
    clearReconnectState()
    clearOpponentCountdown()
    clearTurnClock()
    turnBudgetSeconds.value = 0
    drawOfferPending.value = false
    waitingForDrawResponse.value = false
    drawOffersLeft.value = 2
    chatHistory.value = []
    isMuted.value = false
    clearMatchRecovery()
    if (searchTimer !== null) {
      clearInterval(searchTimer)
      searchTimer = null
    }
    manager.close()
    if (audioExit === 'cancelled') matchAudio.cancelMatchmakingAudio()
    else matchAudio.stopAll()
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
    isMatchmaking,
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
    yourSpirit,
    opponentSpirit,
    proposal,
    proposalSecondsLeft,
    retryAfterSeconds,
    retryUntil,
    acceptMatch,
    declineMatch,
    startMatchmaking,
    cancelMatchmaking,
    sendMove,
    sendResign,
    sendOfferDraw,
    sendRespondDraw,
    sendGameChat,
    leaveGame,
    recoverMatchAfterRefresh,
    retryReconnect,
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
    (record.opponent_id === undefined || typeof record.opponent_id === 'string') &&
    typeof record.opponent === 'string' &&
    isPlayerSymbol(record.your_symbol) &&
    typeof record.your_turn === 'boolean'
  )
}

function isMatchProposedPayload(payload: unknown): payload is MatchProposedPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }
  const record = payload as Record<string, unknown>
  return (
    typeof record.opponent_id === 'string' &&
    typeof record.opponent === 'string' &&
    typeof record.ranked === 'boolean' &&
    typeof record.timeout_seconds === 'number'
  )
}

function isMatchProposalClosedPayload(payload: unknown): payload is MatchProposalClosedPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }
  const record = payload as Record<string, unknown>
  return typeof record.reason === 'string' && typeof record.requeued === 'boolean'
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

function isOpponentReconnectingPayload(payload: unknown): payload is OpponentReconnectingPayload {
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
