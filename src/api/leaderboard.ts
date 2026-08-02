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
  return { entries: data.data.leaderboard, total: data.data.total }
}
