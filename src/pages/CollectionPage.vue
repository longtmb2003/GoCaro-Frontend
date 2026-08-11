<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { fetchCollection } from '@/api/collection'
import type { SpiritCollectionGroup } from '@/api/collection'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useShopStore } from '@/stores/shop'
import { Loader2 } from 'lucide-vue-next'
import GlassCard from '@/components/ui/GlassCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseProgress from '@/components/ui/BaseProgress.vue'
import SpiritEffectBadge from '@/components/shop/SpiritEffectBadge.vue'

import { resolveSpirit } from '@/spirits/spiritRegistry'

const { language, t } = useAppLanguage()
const shopStore = useShopStore()

const loading = ref(true)
const collection = ref<SpiritCollectionGroup[]>([])

const CANONICAL_RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic']

onMounted(async () => {
  try {
    collection.value = await fetchCollection()
  } finally {
    loading.value = false
  }
})

function getSpiritSource(itemCode: string): string | null {
  const spirit = resolveSpirit(itemCode, null, { withArt: true })
  return spirit.model.source
}

async function equip(itemCode: string) {
  await shopStore.equip('spirit_art', itemCode)
  // Refresh collection state to update equipped
  collection.value = await fetchCollection()
}

const totalSpirits = computed(() => {
  return collection.value.reduce((sum, g) => sum + g.forms.length, 0)
})

const ownedSpirits = computed(() => {
  return collection.value.reduce((sum, g) => sum + g.forms.filter((f) => f.owned).length, 0)
})

const completionPercent = computed(() => {
  if (totalSpirits.value === 0) return 0
  return Math.round((ownedSpirits.value / totalSpirits.value) * 100)
})

const sortedRarityBreakdown = computed(() => {
  const counts: Record<string, { total: number; owned: number }> = {}
  for (const group of collection.value) {
    for (const form of group.forms) {
      const rarity = form.rarity
      if (!counts[rarity]) {
        counts[rarity] = { total: 0, owned: 0 }
      }
      counts[rarity].total++
      if (form.owned) {
        counts[rarity].owned++
      }
    }
  }

  return CANONICAL_RARITIES
    .filter((rarity) => counts[rarity] !== undefined)
    .map((rarity) => ({
      rarity,
      ...counts[rarity],
    }))
})

const equippedSpirit = computed(() => {
  for (const group of collection.value) {
    if (group.equipped) {
      const form = group.forms.find((f) => f.code === group.equipped)
      if (form) {
        const spirit = resolveSpirit(form.code, null, { withArt: true })
        return {
          code: form.code,
          name: form.name,
          source: spirit.model.source,
        }
      }
    }
  }
  return null
})

function getGroupStats(group: SpiritCollectionGroup) {
  const owned = group.forms.filter((f) => f.owned).length
  const total = group.forms.length
  return { owned, total }
}

function getRarityVariant(rarity: string) {
  switch (rarity) {
    case 'common': return 'neutral'
    case 'rare': return 'primary'
    case 'epic': return 'warning'
    case 'legendary': return 'danger'
    case 'mythic': return 'danger'
    default: return 'neutral'
  }
}
</script>

<template>
  <AppLayout :title="t('My Collection', 'Bộ sưu tập của tôi')" fantasy>
    <div class="collection-container">
      <!-- Vault Hero Banner -->
      <div class="collection-hero">
        <GlassCard class="collection-hero__card">
          <div class="collection-hero__content">
            <div class="collection-hero__main">
              <h1 class="collection-hero__title">
                {{ t('Spirit Vault', 'Kho Linh Thú') }}
              </h1>
              <p class="collection-hero__subtitle">
                {{ t('Unlock companions, evolve forms, and showcase your collection.', 'Mở khóa đồng hành, tiến hóa hình thái và viết nên huyền thoại.') }}
              </p>

              <!-- Progress Bar & Count -->
              <div class="collection-progress">
                <div class="collection-progress__header">
                  <span class="collection-progress__label">
                    {{ t('Collection Progress', 'Tiến độ sưu tầm') }}
                  </span>
                  <strong class="collection-progress__count">
                    {{ ownedSpirits }} / {{ totalSpirits }} ({{ completionPercent }}%)
                  </strong>
                </div>
                <BaseProgress :value="completionPercent" tone="warning" size="sm" />
              </div>

              <!-- Dynamic Rarity Breakdown Badges (Sorted Canonical) -->
              <div v-if="sortedRarityBreakdown.length > 0" class="collection-rarities">
                <BaseBadge
                  v-for="stat in sortedRarityBreakdown"
                  :key="stat.rarity"
                  :variant="getRarityVariant(stat.rarity)"
                  shape="tag"
                  class="capitalize text-xs"
                >
                  {{ stat.rarity }}: {{ stat.owned }} / {{ stat.total }}
                </BaseBadge>
              </div>
            </div>

            <!-- Equipped Active Companion Slot -->
            <div v-if="equippedSpirit" class="collection-equipped-slot">
              <span class="equipped-label">{{ t('Active Companion', 'Đồng hành hiện tại') }}</span>
              <div class="equipped-art-wrap">
                <img
                  v-if="equippedSpirit.source"
                  :src="equippedSpirit.source"
                  :alt="equippedSpirit.name"
                  class="equipped-art"
                />
              </div>
              <span class="equipped-name">{{ equippedSpirit.name }}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="collection-loading">
        <Loader2 class="animate-spin mb-4 text-warning-400" :size="44" />
        <p>{{ t('Gathering spirits...', 'Đang tập hợp linh thú...') }}</p>
      </div>

      <!-- Empty state -->
      <GlassCard v-else-if="collection.length === 0" class="p-12 text-center">
        <p class="text-foreground-muted">
          {{ t('You do not own any spirits yet.', 'Bạn chưa sở hữu linh thú nào.') }}
        </p>
      </GlassCard>

      <!-- Families Section -->
      <div v-else class="collection-families">
        <section v-for="group in collection" :key="group.base_spirit" class="family-section">
          <div class="family-header">
            <!-- The spirit code arrives lowercase ("wolf"), so only that word is
                 capitalised. Capitalising the whole heading would also hit the
                 Vietnamese words and render "Dòng Họ Wolf". -->
            <h2 v-if="language === 'vi'" class="family-title">
              Dòng họ <span class="family-title__name">{{ group.base_spirit }}</span>
            </h2>
            <h2 v-else class="family-title">
              <span class="family-title__name">{{ group.base_spirit }}</span> Family
            </h2>
            <BaseBadge variant="neutral" shape="pill" class="family-progress-badge">
              {{ getGroupStats(group).owned }} / {{ getGroupStats(group).total }} {{ t('Collected', 'Đã sở hữu') }}
            </BaseBadge>
          </div>

          <div class="family-grid">
            <GlassCard
              v-for="form in group.forms"
              :key="form.code"
              as="div"
              class="spirit-card group cursor-pointer"
              :class="{ 'spirit-card--equipped': group.equipped === form.code, 'spirit-card--unowned': !form.owned }"
              @click="form.owned ? equip(form.code) : null"
            >
              <div class="spirit-card__art-wrap">
                <img
                  v-if="getSpiritSource(form.code)"
                  :src="getSpiritSource(form.code)!"
                  :alt="form.name"
                  class="spirit-card__art"
                  :class="{ 'opacity-60': !form.owned }"
                  loading="lazy"
                  decoding="async"
                />
                <div v-else class="spirit-card__fallback">?</div>

                <BaseBadge
                  v-if="group.equipped === form.code"
                  variant="warning"
                  class="spirit-card__badge"
                >
                  {{ t('Equipped', 'Đang dùng') }}
                </BaseBadge>
              </div>

              <div class="spirit-card__footer">
                <h3 class="spirit-card__name" :class="form.owned ? 'text-fantasy-stone' : 'text-foreground-muted'">
                  {{ form.name }}
                </h3>
                <SpiritEffectBadge
                  :effect-code="form.effect_code"
                  :effect-value="form.effect_value"
                />
              </div>
            </GlassCard>
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.collection-container {
  max-width: 62.5rem; /* 1000px */
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg) var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.collection-hero__card {
  border-color: var(--color-fantasy-border-subtle);
  background: linear-gradient(145deg, var(--surface-glass), var(--surface-glass-strong));
  padding: var(--space-xl);
}

.collection-hero__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

@media (min-width: 768px) {
  .collection-hero__content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.collection-hero__title {
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-hero);
  font-weight: 700;
  color: var(--color-fantasy-stone);
  margin: 0 0 var(--space-xs);
}

.collection-hero__subtitle {
  font-size: var(--text-body);
  color: var(--text-muted);
  margin: 0 0 var(--space-lg);
}

.collection-progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  max-width: 26rem;
  margin-bottom: var(--space-md);
}

.collection-progress__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-caption);
}

.collection-progress__label {
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.collection-progress__count {
  color: var(--color-fantasy-gold);
  font-family: var(--font-mono);
  font-weight: 700;
}

.collection-rarities {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.collection-equipped-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-fantasy-border-subtle);
  background: var(--surface-sunken);
  flex-shrink: 0;
}

.equipped-label {
  font-size: var(--text-caption);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 700;
}

.equipped-art-wrap {
  width: 5.5rem;
  height: 5.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.equipped-art {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 15px rgb(0 0 0 / 0.5));
}

.equipped-name {
  font-family: 'Cinzel', serif;
  font-size: var(--text-small);
  font-weight: 700;
  color: var(--color-fantasy-stone);
}

.collection-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 0;
  color: var(--text-muted);
}

.collection-families {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.family-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.family-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--color-border);
}

.family-title {
  font-family: 'Cinzel', 'Marcellus', Georgia, serif;
  font-size: var(--text-section);
  font-weight: 700;
  color: var(--color-fantasy-stone);
  margin: 0;
}

.family-title__name {
  text-transform: capitalize;
}

.family-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12.5rem, 15rem));
  justify-content: center;
  gap: 1.25rem;
}

.spirit-card {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-color: var(--color-fantasy-border-subtle);
  transition: transform var(--transition-duration-normal) ease, border-color var(--transition-duration-normal) ease;
}

.spirit-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--color-fantasy-gold) 50%, transparent);
}

.spirit-card--equipped {
  border-color: var(--color-fantasy-gold);
  box-shadow: 0 0 15px color-mix(in srgb, var(--color-fantasy-gold) 30%, transparent);
}

.spirit-card__art-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  background: radial-gradient(circle at center, color-mix(in srgb, var(--color-fantasy-gold) 12%, transparent), transparent 70%);
}

.spirit-card__art {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 15px rgb(0 0 0 / 0.5));
  transition: transform var(--transition-duration-normal) ease;
}

.spirit-card:hover .spirit-card__art {
  transform: scale(1.08);
}

.spirit-card__fallback {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-muted);
  opacity: 0.3;
}

.spirit-card__badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.spirit-card__footer {
  padding: var(--space-sm) var(--space-md);
  background: var(--surface-sunken);
  border-top: 1px solid var(--color-border);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
}

.spirit-card__name {
  font-family: 'Cinzel', serif;
  font-size: var(--text-small);
  font-weight: 700;
  margin: 0;
}
</style>
