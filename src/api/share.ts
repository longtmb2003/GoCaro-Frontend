import type { Envelope } from './envelope'
import { http } from './http'

export interface ShareLink {
  token: string
  kind: 'game' | 'replay'
  match_id?: string
  rewarded: boolean
}

export async function createShareLink(matchId?: string): Promise<ShareLink> {
  const { data } = await http.post<Envelope<ShareLink>>('/api/shares', {
    match_id: matchId ?? null,
  })
  return data.data
}

export async function resolveShareLink(token: string): Promise<ShareLink> {
  const { data } = await http.get<Envelope<ShareLink>>(`/api/shares/${token}`)
  return data.data
}
