<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { RANK_TIERS } from '@/config/ranks'
import RankTierCard from './RankTierCard.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useAchievementRewards } from '@/composables/useAchievementRewards'
import { onMounted } from 'vue'

const emit = defineEmits<{ (e: 'close'): void }>()
const { rankName, t } = useAppLanguage()

// The payout shown here is the one the server will actually pay: it is
// env-tunable, so reading it from the API is the only way this screen cannot
// end up advertising a figure the player never receives.
const { load: loadRewards, rewardCoins, rankMinElo } = useAchievementRewards()

onMounted(() => {
  void loadRewards()
})
</script>

<template>
  <BaseModal :title="t('Rank System', 'Hệ thống xếp hạng')" size="lg" variant="fantasy" @close="emit('close')">
    <div class="rank-rules">
      <p class="rank-rules__description">
        {{ t('Your rank is determined by your Elo rating. Win ranked matches to gain Elo, but be careful—losing will drop your rating!', 'Hạng của bạn được xác định bởi điểm Elo. Thắng trận xếp hạng để tăng Elo, nhưng thua sẽ làm giảm điểm!') }}
      </p>

      <ul class="rank-rules__tiers">
        <RankTierCard
          v-for="tier in RANK_TIERS.slice().reverse()"
          :key="tier.name"
          :name="tier.name"
          :display-name="rankName(tier.name)"
          :min-elo="tier.achievement ? rankMinElo(tier.achievement, tier.minElo) : tier.minElo"
          :reward-coins="tier.achievement ? rewardCoins(tier.achievement) : 0"
        />
      </ul>

      <p class="rank-rules__note">
        {{ t('Each tier is divided into sub-tiers (IV, III, II, I) for every 100 Elo points gained within the tier.', 'Mỗi bậc được chia thành các hạng nhỏ (IV, III, II, I), tương ứng mỗi 100 điểm Elo trong bậc đó.') }}
      </p>
    </div>

    <template #footer>
      <div class="rank-rules__footer">
        <BaseButton variant="primary" @click="emit('close')">{{ t('Understood', 'Đã hiểu') }}</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.rank-rules {
  position: relative;
}

.rank-rules__description {
  max-width: 30rem;
  margin: 0 auto 1.5rem;
  color: var(--color-foreground-secondary);
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
  text-align: center;
  text-wrap: balance;
}

.rank-rules__tiers {
  display: grid;
  gap: 1.125rem;
}

.rank-rules__note {
  max-width: 30rem;
  margin: 1.5rem auto 0;
  color: var(--color-foreground-muted);
  font-size: var(--text-caption);
  font-style: italic;
  line-height: var(--text-caption--line-height);
  text-align: center;
}

.rank-rules__footer {
  display: flex;
  justify-content: center;
}

@media (max-width: 39.99rem) {
  .rank-rules__description {
    margin-bottom: 1rem;
  }
  .rank-rules__tiers {
    gap: 0.75rem;
  }
  .rank-rules__note {
    margin-top: 1rem;
  }
  .rank-rules__footer :deep(.base-button) {
    width: 100%;
  }
}
</style>
