import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError } from '@/api/ApiError'
import {
  createTournament,
  fetchBracket,
  fetchTournament,
  listTournaments,
  registerTournament,
  startTournament,
  withdrawTournament,
} from '@/api/tournament'
import type {
  BracketSlot,
  TournamentDetail,
  TournamentSummary,
} from '@/types/tournament'

const PAGE_SIZE = 20

/**
 * Owns the tournament listing and, cached by id, the detail and bracket of the
 * tournaments that have been opened.
 *
 * Detail and bracket are keyed by tournament id rather than held as a single
 * "current" pair: registering, withdrawing and starting all invalidate one
 * specific tournament, and a by-id cache lets that happen without disturbing
 * anything else on screen.
 */
export const useTournamentStore = defineStore('tournament', () => {
  const tournaments = ref<TournamentSummary[]>([])
  const page = ref(1)
  const total = ref(0)
  /** undefined lists every status. */
  const statusFilter = ref<string | undefined>(undefined)
  const listLoading = ref(false)
  const listError = ref<string | null>(null)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
  const hasPrev = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < totalPages.value)

  const detailsById = ref<Record<string, TournamentDetail>>({})
  const bracketsById = ref<Record<string, BracketSlot[]>>({})
  const detailLoading = ref(false)
  const detailError = ref<string | null>(null)
  const bracketLoading = ref(false)
  const bracketError = ref<string | null>(null)

  function detailFor(id: string): TournamentDetail | null {
    return detailsById.value[id] ?? null
  }

  function bracketFor(id: string): BracketSlot[] {
    return bracketsById.value[id] ?? []
  }

  async function loadList(targetPage: number): Promise<void> {
    listLoading.value = true
    listError.value = null
    try {
      const result = await listTournaments(targetPage, PAGE_SIZE, statusFilter.value)
      tournaments.value = result.tournaments
      page.value = result.page
      total.value = result.total
    } catch (err) {
      listError.value = err instanceof ApiError ? err.message : 'Unable to load tournaments.'
    } finally {
      listLoading.value = false
    }
  }

  /** Applies a status filter and reloads from the first page. */
  async function filterBy(status: string | undefined): Promise<void> {
    statusFilter.value = status
    await loadList(1)
  }

  function nextPage(): void {
    if (hasNext.value) {
      void loadList(page.value + 1)
    }
  }

  function prevPage(): void {
    if (hasPrev.value) {
      void loadList(page.value - 1)
    }
  }

  async function loadDetail(id: string): Promise<void> {
    detailLoading.value = true
    detailError.value = null
    try {
      detailsById.value[id] = await fetchTournament(id)
    } catch (err) {
      detailError.value = err instanceof ApiError ? err.message : 'Unable to load this tournament.'
    } finally {
      detailLoading.value = false
    }
  }

  async function loadBracket(id: string): Promise<void> {
    bracketLoading.value = true
    bracketError.value = null
    try {
      const result = await fetchBracket(id)
      bracketsById.value[id] = result.bracket
    } catch (err) {
      bracketError.value = err instanceof ApiError ? err.message : 'Unable to load the bracket.'
    } finally {
      bracketLoading.value = false
    }
  }

  /** Loads everything one tournament page shows. */
  async function loadTournament(id: string): Promise<void> {
    await Promise.all([loadDetail(id), loadBracket(id)])
  }

  async function create(name: string, maxPlayers: number): Promise<string> {
    const detail = await createTournament(name, maxPlayers)
    detailsById.value[detail.tournament.id] = detail
    // A new tournament doesn't have a bracket yet, but we initialize it empty
    bracketsById.value[detail.tournament.id] = []
    return detail.tournament.id
  }

  async function register(id: string): Promise<void> {
    await registerTournament(id)
    invalidate(id)
    await loadTournament(id)
  }

  async function withdraw(id: string): Promise<void> {
    await withdrawTournament(id)
    invalidate(id)
    await loadTournament(id)
  }

  async function start(id: string): Promise<void> {
    await startTournament(id)
    invalidate(id)
    await loadTournament(id)
  }

  /**
   * Drops one tournament from the cache so the next visit re-reads it. It is
   * the hook the participation actions will use after they change a tournament.
   */
  function invalidate(id: string): void {
    detailsById.value = Object.fromEntries(
      Object.entries(detailsById.value).filter(([key]) => key !== id),
    )
    bracketsById.value = Object.fromEntries(
      Object.entries(bracketsById.value).filter(([key]) => key !== id),
    )
  }

  function reset(): void {
    tournaments.value = []
    page.value = 1
    total.value = 0
    statusFilter.value = undefined
    listError.value = null
    detailsById.value = {}
    bracketsById.value = {}
    detailError.value = null
    bracketError.value = null
  }

  return {
    tournaments,
    page,
    total,
    statusFilter,
    listLoading,
    listError,
    totalPages,
    hasPrev,
    hasNext,
    detailLoading,
    detailError,
    bracketLoading,
    bracketError,
    detailFor,
    bracketFor,
    loadList,
    filterBy,
    nextPage,
    prevPage,
    loadDetail,
    loadBracket,
    loadTournament,
    create,
    register,
    withdraw,
    start,
    invalidate,
    reset,
  }
})
