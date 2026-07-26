import type { Envelope } from './envelope'
import { http } from './http'
import type { LeaderboardEntry } from '@/types/leaderboard'

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
}

export async function fetchLeaderboard(limit = 20, search = ''): Promise<LeaderboardEntry[]> {
  const params: Record<string, string> = {}
  if (limit) params.limit = limit.toString()
  if (search) params.search = search

  const { data } = await http.get<Envelope<LeaderboardData>>('/api/leaderboard', {
    params,
  })
  return data.data.leaderboard
}
