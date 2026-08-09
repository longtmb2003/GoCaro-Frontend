import type { Envelope } from './envelope'
import { http } from './http'

export interface ShopItem {
  code: string
  type: string
  name: string
  price_coins: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  unlock_achievement: string | null
  evolves_from: string | null
  base_spirit: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  owned: boolean
  locked: boolean
}

export interface InventoryItem {
  item_code: string
  acquired_at: string
}

export interface EquipmentItem {
  slot: string
  item_code: string
  equipped_at: string
}

export async function fetchActiveShopItems(): Promise<ShopItem[]> {
  const { data } = await http.get<Envelope<ShopItem[]>>('/api/shop/items')
  return data.data
}

export async function buyItem(itemCode: string): Promise<{ coins: number }> {
  const { data } = await http.post<Envelope<{ coins: number }>>('/api/shop/buy', { item_code: itemCode })
  return data.data
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  const { data } = await http.get<Envelope<InventoryItem[]>>('/api/inventory')
  return data.data
}

export async function fetchEquipment(): Promise<EquipmentItem[]> {
  const { data } = await http.get<Envelope<EquipmentItem[]>>('/api/inventory/equipment')
  return data.data
}

export async function equipItem(slot: string, itemCode: string | null): Promise<void> {
  await http.post<Envelope<{ success: boolean }>>('/api/inventory/equip', { slot, item_code: itemCode || '' })
}
