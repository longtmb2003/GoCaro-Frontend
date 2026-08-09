import type { Envelope } from './envelope'
import { http } from './http'

export interface AchievementCatalogueEntry {
  id: string
  reward_coins: number
  /** Rating a rank milestone needs; 0 for every other achievement. */
  min_elo: number
}

/**
 * Payouts come from the server because they are environment-tunable: a figure
 * baked into the bundle starts lying the first time the economy is retuned.
 * No token required — what an achievement pays is the same for everyone.
 */
export async function fetchAchievementCatalogue(): Promise<AchievementCatalogueEntry[]> {
  const { data } = await http.get<Envelope<AchievementCatalogueEntry[]>>('/api/achievements')
  return data.data
}
