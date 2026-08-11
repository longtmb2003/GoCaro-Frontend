import type { Envelope } from './envelope'
import { http } from './http'
import type { LeaderboardEntry } from '@/types/leaderboard'

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  page: number
  limit: number
  total: number
}

export async function fetchLeaderboard(page = 1, limit = 20, search = ''): Promise<{ entries: LeaderboardEntry[], total: number }> {
  const params: Record<string, string> = {}
  if (page) params.page = page.toString()
  if (limit) params.limit = limit.toString()
  if (search) params.search = search

  const { data } = await http.get<Envelope<LeaderboardData>>('/api/leaderboard', {
    params,
  })
  // Go encodes a nil slice as `null`. Search results with no matching players
  // must still satisfy the frontend contract of an array, otherwise consumers
  // that render `.length` fail before they can show the empty state.
  const payload = data.data as LeaderboardData | null | undefined
  const entries = Array.isArray(payload?.leaderboard) ? payload.leaderboard : []
  const totalValue = payload?.total
  const total = typeof totalValue === 'number' && Number.isFinite(totalValue) ? totalValue : 0
  return { entries, total }
}
