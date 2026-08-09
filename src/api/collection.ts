import type { Envelope } from './envelope'
import { http } from './http'
import type { ShopItem } from './shop'

export interface SpiritCollectionGroup {
  base_spirit: string
  equipped?: string
  forms: ShopItem[]
}

export async function fetchCollection(): Promise<SpiritCollectionGroup[]> {
  const { data } = await http.get<Envelope<SpiritCollectionGroup[]>>('/api/collection')
  return data.data
}
