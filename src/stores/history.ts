import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError } from '@/api/ApiError'
import { fetchMatches } from '@/api/match'
import type { MatchSummary } from '@/types/match'

// Matches the backend's default page size, so the first request needs no
// special-casing and page counts line up with the server's.
const PAGE_SIZE = 20

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
  }
})
