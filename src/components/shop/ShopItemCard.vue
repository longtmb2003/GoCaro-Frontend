<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import FantasySystemIcon from '@/components/ui/FantasySystemIcon.vue'
import { resolveSpirit } from '@/spirits/spiritRegistry'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { ACHIEVEMENTS } from '@/config/achievements'
import { Loader2, Lock } from 'lucide-vue-next'

const props = defineProps<{
  itemCode: string
  price?: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  isOwned: boolean
  isEquipped: boolean
  isLocked: boolean
  unlockAchievement: string | null
  evolvesFrom?: string | null
  canAfford: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'buy' | 'equip' | 'unequip'): void
}>()

const { language, t } = useAppLanguage()

const spirit = computed(() => resolveSpirit(props.itemCode, null, { withArt: true }))
const spiritName = computed(() => spirit.value.name[language.value])
const spiritDescription = computed(() => spirit.value.personality[language.value])

const failed = ref(false)

const rarityVariant = computed(() => {
  switch (props.rarity) {
    case 'common': return 'neutral'
    case 'rare': return 'primary'
    case 'epic': return 'warning'
    case 'legendary': return 'danger'
    case 'mythic': return 'danger'
    default: return 'neutral'
  }
})

const rarityLabel = computed(() => {
  switch (props.rarity) {
    case 'common': return t('Common', 'Thường')
    case 'rare': return t('Rare', 'Hiếm')
    case 'epic': return t('Epic', 'Sử thi')
    case 'legendary': return t('Legendary', 'Huyền thoại')
    case 'mythic': return t('Mythic', 'Thần thoại')
    default: return props.rarity
  }
})

const unlockAchievementName = computed(() => {
  if (!props.unlockAchievement) return ''
  const ach = ACHIEVEMENTS.find(a => a.id === props.unlockAchievement)
  if (!ach) return props.unlockAchievement
  return language.value === 'vi' ? ach.name.vi : ach.name.en
})

const evolvesFromName = computed(() => {
  if (!props.evolvesFrom) return ''
  const prevSpirit = resolveSpirit(props.evolvesFrom, null, { withArt: false })
  return prevSpirit.name[language.value]
})
</script>

<template>
  <GlassCard as="div" class="shop-item-card p-0 overflow-hidden flex flex-col h-full group">
    <div class="shop-item-card__art-container">
      <div class="shop-item-card__backdrop" aria-hidden="true"></div>

      <!-- Hover Description Overlay -->
      <div class="absolute inset-0 z-20 bg-fantasy-navy/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 text-center backdrop-blur-sm pointer-events-none">
        <p class="text-sm font-serif italic text-fantasy-stone tracking-wide shadow-black drop-shadow-md">"{{ spiritDescription }}"</p>
      </div>

      <!-- Rarity Badge and Lock Icon -->
      <div class="absolute top-3 left-3 z-30">
        <BaseBadge :variant="rarityVariant" shape="tag">
          {{ rarityLabel }}
        </BaseBadge>
      </div>
      <div v-if="isLocked" class="absolute top-3 right-3 z-30 text-error/80">
        <Lock class="w-5 h-5 drop-shadow-md" />
      </div>

      <img
        v-if="!failed && spirit.model.source"
        :src="spirit.model.source"
        :alt="spiritName"
        class="shop-item-card__art group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500"
        :class="{ 'grayscale opacity-80': isLocked }"
        loading="lazy"
        decoding="async"
        @error="failed = true"
      />
      <div v-else class="shop-item-card__fallback">
        <FantasySystemIcon compact class="opacity-20"><span class="text-4xl">?</span></FantasySystemIcon>
      </div>
    </div>

    <div class="shop-item-card__content flex-1 p-5 flex flex-col gap-4">
      <div class="shop-item-card__header flex items-start justify-between gap-2">
        <h3 class="shop-item-card__title text-lg font-bold font-serif text-fantasy-stone uppercase tracking-wide">{{ spiritName }}</h3>
        <BaseBadge v-if="isEquipped" variant="success" class="shrink-0 border-fantasy-gold/30 text-fantasy-gold bg-fantasy-gold/10">
          {{ t('Equipped', 'Đang dùng') }}
        </BaseBadge>
      </div>

      <div class="shop-item-card__actions mt-auto">
        <p v-if="evolvesFromName" class="text-xs text-foreground-muted mb-2 text-center">
          {{ t('Evolving keeps the original spirit', 'Tiến hóa không làm mất hình thái cũ') }}
        </p>
        <template v-if="!isOwned">
          <BaseButton
            variant="primary"
            class="w-full fantasy-btn"
            :disabled="!canAfford || loading || isLocked"
            @click="emit('buy')"
          >
            <Loader2 v-if="loading" class="animate-spin mr-2" :size="16" />
            <span v-else-if="!isLocked" class="mr-1 text-fantasy-gold">◆</span>

            <template v-if="isLocked">
              <template v-if="unlockAchievementName">
                {{ t('Requires: ' + unlockAchievementName, 'Yêu cầu: ' + unlockAchievementName) }}
              </template>
              <template v-else-if="evolvesFromName">
                <span class="truncate">{{ t('Requires: ', 'Yêu cầu: ') }} {{ evolvesFromName }}</span>
              </template>
              <template v-else>
                {{ t('Locked', 'Đã khóa') }}
              </template>
            </template>
            <template v-else>
              {{ price }} {{ t('Coins', 'Xu') }}
            </template>
          </BaseButton>
        </template>

        <template v-else>
          <BaseButton
            v-if="!isEquipped"
            variant="secondary"
            class="w-full"
            :disabled="loading"
            @click="emit('equip')"
          >
            <Loader2 v-if="loading" class="animate-spin mr-2" :size="16" />
            {{ t('Equip', 'Trang bị') }}
          </BaseButton>

          <BaseButton
            v-else
            variant="ghost"
            class="w-full opacity-70 hover:opacity-100"
            :disabled="loading"
            @click="emit('unequip')"
          >
            <Loader2 v-if="loading" class="animate-spin mr-2" :size="16" />
            {{ t('Unequip', 'Bỏ trang bị') }}
          </BaseButton>
        </template>
      </div>
    </div>
  </GlassCard>
</template>

<style scoped>
.shop-item-card {
  border-color: var(--color-board-frame-metal);
  background: linear-gradient(180deg, rgb(10 20 34 / 0.6), rgb(5 14 27 / 0.8));
}

.shop-item-card__art-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: radial-gradient(circle at center, rgb(30 41 59 / 0.2), transparent 70%);
  padding: 1.5rem;
  border-bottom: 1px solid rgb(211 168 84 / 0.1);
}

.shop-item-card__backdrop {
  position: absolute;
  inset: 0;
  background: var(--color-fantasy-navy);
  opacity: 0.3;
  z-index: 0;
}

.shop-item-card__art {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 15px 20px rgb(0 0 0 / 0.6));
  transition: transform var(--transition-duration-normal) ease;
}

.shop-item-card:hover .shop-item-card__art {
  transform: scale(1.08) translateY(-4px);
}

.shop-item-card__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.shop-item-card__title {
  color: var(--color-fantasy-stone);
}

.fantasy-btn {
  background: linear-gradient(180deg, var(--color-primary-600), var(--color-primary-800));
  border-color: var(--color-primary-500);
}

.fantasy-btn:not(:disabled):hover {
  background: linear-gradient(180deg, var(--color-primary-500), var(--color-primary-700));
}
</style>
