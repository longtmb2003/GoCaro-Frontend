import type { Envelope } from './envelope'
import { http } from './http'
import type { ReplayDetail } from '@/types/replay'

/** Fetches a single match with its ordered move list, for replay. */
export async function fetchReplay(id: string): Promise<ReplayDetail> {
  const { data } = await http.get<Envelope<ReplayDetail>>(`/api/replays/${id}`)
  return data.data
}
