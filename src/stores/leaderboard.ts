import { ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError } from '@/api/ApiError'
import { fetchLeaderboard } from '@/api/leaderboard'
import type { LeaderboardEntry } from '@/types/leaderboard'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const entries = ref<LeaderboardEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // The lobby loads a short preview (backend default); the leaderboard page
  // loads the full board by passing a larger limit.
  async function load(limit?: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      entries.value = await fetchLeaderboard(limit)
    } catch (err) {
      // The panel renders an error state with a retry for any failure. Backend
      // messages are already user-safe (see http.ts); other faults fall back to
      // a generic message rather than surfacing internals.
      error.value = err instanceof ApiError ? err.message : 'Unable to load the leaderboard.'
    } finally {
      loading.value = false
    }
  }

  return { entries, loading, error, load }
})
