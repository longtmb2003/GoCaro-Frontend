import type { Envelope } from './envelope'
import { http } from './http'
import type { LeaderboardEntry } from '@/types/leaderboard'

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
}

export async function fetchLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
  const { data } = await http.get<Envelope<LeaderboardData>>('/api/leaderboard', {
    params: limit === undefined ? undefined : { limit },
  })
  return data.data.leaderboard
}
