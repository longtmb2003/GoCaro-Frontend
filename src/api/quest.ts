import type { Envelope } from './envelope'
import { http } from './http'

export interface Quest {
  code: string
  description: string
  target: number
  reward_coins: number
  progress: number
  claimed_at: string | null
  date: string
}

export async function fetchQuests(): Promise<Quest[]> {
  const { data } = await http.get<Quest[] | Envelope<Quest[]>>('/api/quests')
  if (Array.isArray(data)) {
    return data
  }
  return data.data
}

export async function claimQuestReward(code: string, date: string): Promise<{ quest: Quest, new_balance: number }> {
  const { data } = await http.post<{ quest: Quest, new_balance: number } | Envelope<{ quest: Quest, new_balance: number }>>(`/api/quests/${code}/claim`, { date })
  return 'data' in data ? data.data : data
}
