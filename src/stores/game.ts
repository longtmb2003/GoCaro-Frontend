import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { MatchFoundPayload, PlayerSymbol } from '@/types/game'

/**
 * Owns the current match context. In this phase it holds only what `match_found`
 * establishes — room, opponent, the player's symbol and whose turn it is — which
 * the game screen renders. The board, moves and result join here in Phase 4.
 */
export const useGameStore = defineStore('game', () => {
  const roomId = ref<string | null>(null)
  const opponent = ref('')
  const yourSymbol = ref<PlayerSymbol | null>(null)
  const yourTurn = ref(false)

  const isInMatch = computed(() => roomId.value !== null)

  function startMatch(payload: MatchFoundPayload): void {
    roomId.value = payload.room_id
    opponent.value = payload.opponent
    yourSymbol.value = payload.your_symbol
    yourTurn.value = payload.your_turn
  }

  function reset(): void {
    roomId.value = null
    opponent.value = ''
    yourSymbol.value = null
    yourTurn.value = false
  }

  return { roomId, opponent, yourSymbol, yourTurn, isInMatch, startMatch, reset }
})
