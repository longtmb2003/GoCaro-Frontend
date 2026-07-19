import type { Envelope } from './envelope'
import { http } from './http'
import type { MatchListPage } from '@/types/match'

/** Fetches one page of the global match list, newest first. */
export async function fetchMatches(page: number, limit: number): Promise<MatchListPage> {
  const { data } = await http.get<Envelope<MatchListPage>>('/api/matches', {
    params: { page, limit },
  })
  return data.data
}
