import type { Envelope } from './envelope'
import { http } from './http'
import type { MatchDetail, MatchListPage } from '@/types/match'

/** Fetches one page of the global match list, newest first. */
export async function fetchMatches(page: number, limit: number): Promise<MatchListPage> {
  const { data } = await http.get<Envelope<MatchListPage>>('/api/matches', {
    params: { page, limit },
  })
  return data.data
}

/** Fetches a single match with its ordered move list, for replay. */
export async function fetchMatch(id: string): Promise<MatchDetail> {
  const { data } = await http.get<Envelope<MatchDetail>>(`/api/matches/${id}`)
  return data.data
}
