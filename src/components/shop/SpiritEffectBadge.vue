<script setup lang="ts">
import { computed } from 'vue'
import { Coins, ShieldCheck, TrendingUp } from 'lucide-vue-next'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { SpiritEffectCode } from '@/api/shop'

const props = defineProps<{
  effectCode: SpiritEffectCode | null
  effectValue: number
}>()

const { t } = useAppLanguage()

const effect = computed(() => {
  switch (props.effectCode) {
    case 'coin_bonus_percent':
      return {
        icon: Coins,
        short: t(`+${String(props.effectValue)}% match coins`, `+${String(props.effectValue)}% coin trận`),
        detail: t(
          `Earn ${String(props.effectValue)}% more coins from ranked match rewards.`,
          `Nhận thêm ${String(props.effectValue)}% coin từ phần thưởng trận xếp hạng.`,
        ),
      }
    case 'elo_win_bonus_percent':
      return {
        icon: TrendingUp,
        short: t(`+${String(props.effectValue)}% win Elo`, `+${String(props.effectValue)}% Elo khi thắng`),
        detail: t(
          `Gain ${String(props.effectValue)}% more Elo when winning a ranked match.`,
          `Nhận thêm ${String(props.effectValue)}% Elo khi thắng trận xếp hạng.`,
        ),
      }
    case 'daily_loss_shield':
      return {
        icon: ShieldCheck,
        short: t('Daily loss shield', 'Khiên thua hằng ngày'),
        detail: t(
          'Prevents Elo loss on the first eligible ranked defeat each UTC day.',
          'Không mất Elo ở trận thua xếp hạng hợp lệ đầu tiên mỗi ngày UTC.',
        ),
      }
    default:
      return null
  }
})
</script>

<template>
  <BaseBadge
    v-if="effect"
    variant="primary"
    shape="pill"
    class="spirit-effect-badge"
    :title="effect.detail"
  >
    <component :is="effect.icon" :size="14" aria-hidden="true" />
    <span>{{ effect.short }}</span>
  </BaseBadge>
</template>

<style scoped>
.spirit-effect-badge {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: var(--space-xs);
  white-space: normal;
}
</style>
