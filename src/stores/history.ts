import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError } from '@/api/ApiError'
import { fetchMatches } from '@/api/match'
import { fetchReplay } from '@/api/replay'
import type { CellValue } from '@/types/game'
import type { MatchSummary } from '@/types/match'
import type { ReplayMove } from '@/types/replay'
import { createEmptyBoard } from '@/utils/board'

const PAGE_SIZE = 20

/**
 * Owns the match list (with pagination) and replay. Replay rebuilds the board
 * from the recorded moves — no game logic runs locally; the board is a pure
 * function of the move index.
 */
export const useHistoryStore = defineStore('history', () => {
  const matches = ref<MatchSummary[]>([])
  const page = ref(1)
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
  const hasPrev = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < totalPages.value)

  async function load(targetPage: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const result = await fetchMatches(targetPage, PAGE_SIZE)
      matches.value = result.matches
      page.value = result.page
      total.value = result.total
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Unable to load match history.'
    } finally {
      loading.value = false
    }
  }

  function nextPage(): void {
    if (hasNext.value) {
      void load(page.value + 1)
    }
  }

  function prevPage(): void {
    if (hasPrev.value) {
      void load(page.value - 1)
    }
  }

  const replayMatch = ref<MatchSummary | null>(null)
  const moves = ref<ReplayMove[]>([])
  const moveIndex = ref(0)
  const replayLoading = ref(false)
  const replayError = ref<string | null>(null)
  const replayErrorCode = ref<string | null>(null)

  const totalMoves = computed(() => moves.value.length)
  const atStart = computed(() => moveIndex.value === 0)
  const atEnd = computed(() => moveIndex.value >= moves.value.length)

  const replayBoard = computed<CellValue[][]>(() => {
    const board = createEmptyBoard()
    for (let i = 0; i < moveIndex.value; i++) {
      const move = moves.value[i]
      if (move === undefined) {
        continue
      }
      const column = board[move.x]
      if (column !== undefined && move.y >= 0 && move.y < column.length) {
        column[move.y] = move.symbol as CellValue
      }
    }
    return board
  })

  const replayLastMove = computed<{ x: number; y: number } | null>(() => {
    const move = moves.value[moveIndex.value - 1]
    return move === undefined ? null : { x: move.x, y: move.y }
  })

  async function loadReplay(id: string): Promise<void> {
    replayLoading.value = true
    replayError.value = null
    replayMatch.value = null
    moves.value = []
    moveIndex.value = 0
    try {
      const detail = await fetchReplay(id)
      replayMatch.value = detail.match
      moves.value = detail.moves
    } catch (err) {
      if (err instanceof ApiError) {
        replayError.value = err.message
        replayErrorCode.value = err.code
      } else {
        replayError.value = 'Unable to load the replay.'
        replayErrorCode.value = 'UNKNOWN'
      }
    } finally {
      replayLoading.value = false
    }
  }

  function first(): void {
    moveIndex.value = 0
  }

  function last(): void {
    moveIndex.value = moves.value.length
  }

  function stepNext(): void {
    if (!atEnd.value) {
      moveIndex.value += 1
    }
  }

  function stepPrev(): void {
    if (!atStart.value) {
      moveIndex.value -= 1
    }
  }

  return {
    matches,
    page,
    total,
    loading,
    error,
    totalPages,
    hasPrev,
    hasNext,
    load,
    nextPage,
    prevPage,
    replayMatch,
    moveIndex,
    replayLoading,
    replayError,
    replayErrorCode,
    totalMoves,
    atStart,
    atEnd,
    replayBoard,
    replayLastMove,
    loadReplay,
    first,
    last,
    stepNext,
    stepPrev,
  }
})
