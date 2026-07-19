import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { matchmakeUrl, SocketManager, type SocketMessage } from '@/api/websocket'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import type { MatchFoundPayload, PlayerSymbol } from '@/types/game'

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
    status.value = 'idle'
    errorMessage.value = null
    manager.close()
  }

  function handleMessage(message: SocketMessage): void {
    switch (message.type) {
      case 'queued':
        status.value = 'searching'
        break
      case 'match_found':
        if (isMatchFoundPayload(message.payload)) {
          useGameStore().startMatch(message.payload)
          status.value = 'matched'
        }
        break
      case 'error':
        status.value = 'error'
        errorMessage.value = isErrorPayload(message.payload)
          ? message.payload.message
          : 'Matchmaking failed. Please try again.'
        break
    }
  }

  function handleClose(): void {
    // A close while still connecting or searching is an unexpected drop. Once
    // matched the connection is meant to persist, and idle/error closes are
    // already accounted for.
    if (status.value === 'connecting' || status.value === 'searching') {
      status.value = 'error'
      errorMessage.value = 'Connection lost. Please try again.'
    }
  }

  // Tearing down on logout, rather than at each logout call site, means any
  // path that ends the session — the lobby button, a forced navigation, or a
  // logout added to the game screen later — never leaves a socket open or
  // stale match context behind.
  watch(
    () => auth.isAuthenticated,
    (authenticated) => {
      if (!authenticated) {
        manager.close()
        status.value = 'idle'
        errorMessage.value = null
        useGameStore().reset()
      }
    },
  )

  return { status, errorMessage, startMatchmaking, cancelMatchmaking }
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

function isErrorPayload(payload: unknown): payload is { code: string; message: string } {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }
  const record = payload as Record<string, unknown>
  return typeof record.code === 'string' && typeof record.message === 'string'
}
