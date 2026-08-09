import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import {
  fetchActiveShopItems,
  fetchInventory,
  fetchEquipment,
  buyItem,
  equipItem as equipItemApi,
  type ShopItem,
  type InventoryItem,
  type EquipmentItem,
} from '@/api/shop'
import { useAuthStore } from './auth'

export const useShopStore = defineStore('shop', () => {
  const shopItems = ref<ShopItem[]>([])
  const inventory = ref<InventoryItem[]>([])
  const equipment = ref<EquipmentItem[]>([])

  const isLoaded = ref(false)

  const authStore = useAuthStore()

  // Computed map to easily check if user owns an item
  const inventorySet = computed(() => {
    const set = new Set<string>()
    for (const item of inventory.value) {
      set.add(item.item_code)
    }
    return set
  })

  // Get currently equipped item for a given slot
  const getEquipped = computed(() => (slot: string): string | null => {
    const eq = equipment.value.find((e) => e.slot === slot)
    return eq ? eq.item_code : null
  })

  async function loadStore() {
    try {
      const [shop, inv, eq] = await Promise.all([
        fetchActiveShopItems(),
        fetchInventory(),
        fetchEquipment()
      ])
      shopItems.value = shop
      inventory.value = inv
      equipment.value = eq
      isLoaded.value = true
    } catch (e) {
      isLoaded.value = false
      throw e
    }
  }

  async function purchase(itemCode: string) {
    const result = await buyItem(itemCode)
    // Update coins locally if authStore user is loaded
    if (authStore.user) {
      authStore.user.stats.coins = result.coins
    }

    // We can either fetch inventory again or just push locally to avoid network trip.
    // But we don't have the exact acquired_at date locally.
    // It's safer to just fetch inventory again.
    inventory.value = await fetchInventory()

    // Update local shopItem to reflect it is owned
    const item = shopItems.value.find(i => i.code === itemCode)
    if (item) {
      item.owned = true
    }

    return result
  }

  async function equip(slot: string, itemCode: string | null) {
    await equipItemApi(slot, itemCode)
    // Update local equipment state
    equipment.value = await fetchEquipment()
  }

  return {
    shopItems,
    inventory,
    equipment,
    isLoaded,
    inventorySet,
    getEquipped,
    loadStore,
    purchase,
    equip
  }
})
