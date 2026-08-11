<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useShopStore } from '@/stores/shop'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'
import { useCountUp } from '@/composables/useCountUp'
import ShopItemCard from '@/components/shop/ShopItemCard.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import { Loader2 } from 'lucide-vue-next'
import UpgradeAccountModal from '@/components/UpgradeAccountModal.vue'
import type { Credentials } from '@/types/auth'
import { ApiError } from '@/api/ApiError'

const auth = useAuthStore()
const shopStore = useShopStore()
const { t, errorText } = useAppLanguage()
const { addToast } = useToast()

const loading = ref(true)
const error = ref('')
const loadingItemAction = ref<string | null>(null)

const upgradeOpen = ref(false)
const upgradeLoading = ref(false)
const upgradeError = ref('')

const displayCoins = useCountUp(() => auth.user?.stats.coins ?? 0)

onMounted(async () => {
  await loadShopData()
})

async function loadShopData() {
  loading.value = true
  error.value = ''
  try {
    await shopStore.loadStore()
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message || t('Failed to load shop', 'Không thể tải cửa hàng')
    } else {
      error.value = t('Failed to load shop', 'Không thể tải cửa hàng')
    }
  } finally {
    loading.value = false
  }
}

const unownedItems = computed(() => {
  return shopStore.shopItems.filter((item) => !item.owned)
})

const ownedItems = computed(() => {
  return shopStore.shopItems.filter((item) => item.owned)
})

function canAfford(price: number) {
  return (auth.user?.stats.coins ?? 0) >= price
}

async function handleBuy(itemCode: string) {
  if (auth.isGuest) {
    upgradeOpen.value = true
    return
  }

  if (loadingItemAction.value) return
  loadingItemAction.value = itemCode

  try {
    await shopStore.purchase(itemCode)
    addToast(t('Item purchased successfully', 'Mua vật phẩm thành công'), 'success')
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      addToast(errorText(err.code), 'error')
    } else if (err instanceof Error) {
      addToast(err.message || t('Failed to purchase item', 'Không thể mua vật phẩm'), 'error')
    } else {
      addToast(t('Failed to purchase item', 'Không thể mua vật phẩm'), 'error')
    }
  } finally {
    loadingItemAction.value = null
  }
}

async function handleEquip(itemCode: string) {
  if (loadingItemAction.value) return
  loadingItemAction.value = itemCode

  try {
    await shopStore.equip('spirit_art', itemCode)
    addToast(t('Item equipped', 'Đã trang bị vật phẩm'), 'success')
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      addToast(errorText(err.code), 'error')
    } else {
      addToast(t('Failed to equip item', 'Không thể trang bị vật phẩm'), 'error')
    }
  } finally {
    loadingItemAction.value = null
  }
}

async function handleUnequip(itemCode: string) {
  if (loadingItemAction.value) return
  loadingItemAction.value = itemCode

  try {
    await shopStore.equip('spirit_art', null)
    addToast(t('Item unequipped', 'Đã bỏ trang bị'), 'success')
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      addToast(errorText(err.code), 'error')
    } else {
      addToast(t('Failed to unequip item', 'Không thể bỏ trang bị'), 'error')
    }
  } finally {
    loadingItemAction.value = null
  }
}

async function handleUpgrade(credentials: Credentials): Promise<void> {
  upgradeLoading.value = true
  upgradeError.value = ''
  try {
    await auth.upgrade(credentials)
    upgradeOpen.value = false
    // Reload shop data after sign in
    await loadShopData()
  } catch (err: unknown) {
    if (!(err instanceof ApiError)) {
      throw err
    }
    upgradeError.value = err.message
  } finally {
    upgradeLoading.value = false
  }
}
</script>

<template>
  <AppLayout :title="t('Shop', 'Cửa hàng')" fantasy @upgrade="upgradeOpen = true">
    <div class="shop-container">
      <div class="shop-hero">
        <img
          src="/assets/shop/fantasy-shop-bg.webp"
          alt=""
          fetchpriority="high"
          decoding="async"
          class="shop-hero__art"
        />
        <span class="shop-hero__vignette" aria-hidden="true" />
        <span class="shop-hero__ray" aria-hidden="true" />

        <div class="shop-hero__content">
          <div>
            <h1 class="shop-title">{{ t('Cosmetics Store', 'Cửa hàng ngoại trang') }}</h1>
            <p class="shop-subtitle">{{ t('Discover new spirits and forge your legend.', 'Khám phá linh thú mới và viết nên huyền thoại.') }}</p>
          </div>

          <GlassCard class="coin-balance">
            <span class="coin-icon" aria-hidden="true">◆</span>
            <div class="coin-balance-content">
              <span class="coin-label">{{ t('Your balance', 'Số dư của bạn') }}</span>
              <strong class="coin-amount">{{ displayCoins }}</strong>
            </div>
          </GlassCard>
        </div>
      </div>

      <div v-if="loading" class="shop-loading">
        <Loader2 class="animate-spin mb-4" :size="48" />
        <p>{{ t('Summoning items...', 'Đang tải vật phẩm...') }}</p>
      </div>

      <ErrorState v-else-if="error" :message="error" class="shop-error">
        <template #action>
          <BaseButton variant="secondary" @click="loadShopData">
            {{ t('Retry', 'Thử lại') }}
          </BaseButton>
        </template>
      </ErrorState>

      <div v-else class="shop-content">
        <!-- Shop Section -->
        <section v-if="unownedItems.length > 0" class="shop-section">
          <h2 class="section-title">
            {{ t('Spirits', 'Danh mục linh thú') }}
          </h2>

          <div class="shop-grid">
            <ShopItemCard
              v-for="item in unownedItems"
              :key="item.code"
              :item-code="item.code"
              :price="item.price_coins"
              :rarity="item.rarity"
              :is-owned="false"
              :is-equipped="false"
              :is-locked="item.locked"
              :unlock-achievement="item.unlock_achievement"
              :evolves-from="item.evolves_from"
              :effect-code="item.effect_code"
              :effect-value="item.effect_value"
              :can-afford="canAfford(item.price_coins)"
              :loading="loadingItemAction === item.code"
              @buy="handleBuy(item.code)"
            />
          </div>
        </section>

        <!-- Inventory Section -->
        <section class="shop-section">
          <h2 class="section-title">
            {{ t('Inventory', 'Kho trang bị') }}
          </h2>

          <div v-if="ownedItems.length > 0" class="shop-grid">
            <ShopItemCard
              v-for="item in ownedItems"
              :key="item.code"
              :item-code="item.code"
              :rarity="item.rarity"
              :is-owned="true"
              :is-equipped="shopStore.getEquipped('spirit_art') === item.code"
              :is-locked="false"
              :unlock-achievement="null"
              :evolves-from="null"
              :effect-code="item.effect_code"
              :effect-value="item.effect_value"
              :can-afford="true"
              :loading="loadingItemAction === item.code"
              @equip="handleEquip(item.code)"
              @unequip="handleUnequip(item.code)"
            />
          </div>
          <GlassCard v-else class="p-8 text-center bg-transparent border-dashed">
            <p class="text-foreground-muted">
              {{ t('You haven\'t unlocked any spirits yet. Visit the store above to summon your first companion!', 'Bạn chưa sở hữu linh thú nào. Hãy ghé cửa hàng phía trên để triệu hồi người bạn đồng hành đầu tiên nhé!') }}
            </p>
          </GlassCard>
        </section>

        <!-- Empty States -->
        <GlassCard v-if="unownedItems.length === 0 && ownedItems.length === 0" class="p-12 text-center">
          <p class="text-foreground-muted">
            {{ t('No items available at the moment.', 'Hiện không có vật phẩm nào.') }}
          </p>
        </GlassCard>
      </div>
    </div>

    <UpgradeAccountModal
      v-if="upgradeOpen"
      :loading="upgradeLoading"
      :server-error="upgradeError"
      @submit="handleUpgrade"
      @close="upgradeOpen = false"
    />
  </AppLayout>
</template>

<style scoped>
.shop-container {
  max-width: 62.5rem; /* 1000px */
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  padding-bottom: var(--space-2xl);
}

.shop-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 24rem;
  border-radius: var(--radius-card);
  border: 1px solid rgb(211 168 84 / 0.16);
  background: var(--color-fantasy-navy);
  overflow: hidden;
  box-shadow: 0 12px 30px rgb(0 0 0 / 0.24);
  margin-bottom: var(--space-xl);
}

.shop-hero__art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  z-index: 0;
  opacity: 0.8;
  mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
}

.shop-hero__vignette {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(circle at 50% 50%, transparent 20%, rgb(5 10 20 / 0.8) 100%),
    linear-gradient(to top, rgb(5 10 20) 0%, transparent 40%);
  pointer-events: none;
}

.shop-hero__ray {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(circle at 50% -20%, rgb(211 168 84 / 0.15) 0%, transparent 60%);
  pointer-events: none;
}

.shop-hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  align-items: flex-start;
  padding: var(--space-2xl);
  width: 100%;
}

@media (min-width: 768px) {
  .shop-hero__content {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}

.shop-title {
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-hero);
  font-weight: 700;
  margin: 0 0 var(--space-sm);
  color: var(--color-fantasy-stone);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.5);
}

.shop-subtitle {
  font-size: var(--text-card);
  color: var(--text-muted);
  margin: 0;
}

.coin-balance {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
  background: linear-gradient(135deg, rgb(30 41 59 / 0.6), rgb(15 23 42 / 0.8));
  border-color: var(--color-fantasy-gold);
  border-width: 1px;
}

.coin-icon {
  font-size: var(--text-page);
  color: var(--color-fantasy-gold);
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--color-fantasy-gold) 50%, transparent));
}

.coin-balance-content {
  display: flex;
  flex-direction: column;
}

.coin-label {
  font-size: var(--text-caption);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 700;
}

.coin-amount {
  font-size: var(--text-section);
  font-weight: 800;
  font-family: var(--font-mono);
  color: var(--color-fantasy-gold);
  line-height: 1.2;
}

.shop-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 0;
  color: var(--text-muted);
}

.shop-error {
  margin-top: var(--space-2xl);
}

.shop-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.shop-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.section-title {
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-section);
  font-weight: 700;
  margin: 0;
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-fantasy-stone);
  display: flex;
  align-items: center;
}

.section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 1.5rem;
  background: var(--color-fantasy-gold);
  margin-right: var(--space-md);
  border-radius: 2px;
  box-shadow: 0 0 10px var(--color-fantasy-gold);
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
</style>
