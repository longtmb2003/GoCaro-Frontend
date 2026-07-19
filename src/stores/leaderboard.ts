import { ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError } from '@/api/ApiError'
import { fetchLeaderboard } from '@/api/leaderboard'
import type { LeaderboardEntry } from '@/types/leaderboard'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const entries = ref<LeaderboardEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(limit?: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      entries.value = await fetchLeaderboard(limit)
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Unable to load the leaderboard.'
    } finally {
      loading.value = false
    }
  }

  return { entries, loading, error, load }
})
