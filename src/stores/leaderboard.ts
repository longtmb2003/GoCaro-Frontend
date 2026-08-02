import { ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError } from '@/api/ApiError'
import { fetchLeaderboard } from '@/api/leaderboard'
import type { LeaderboardEntry } from '@/types/leaderboard'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const entries = ref<LeaderboardEntry[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(page: number = 1, limit: number = 20, search: string = ''): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await fetchLeaderboard(page, limit, search)
      entries.value = res.entries
      total.value = res.total
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Unable to load the leaderboard.'
    } finally {
      loading.value = false
    }
  }

  return { entries, total, loading, error, load }
})
