<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { RANK_TIERS } from '@/config/ranks'
import RankTierCard from './RankTierCard.vue'

const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <BaseModal title="Rank System" size="lg" variant="fantasy" @close="emit('close')">
    <div class="rank-rules">
      <p class="rank-rules__description">
        Your rank is determined by your Elo rating. Win ranked matches to gain Elo, but be
        careful—losing will drop your rating!
      </p>

      <ul class="rank-rules__tiers">
        <RankTierCard
          v-for="tier in RANK_TIERS.slice().reverse()"
          :key="tier.name"
          :name="tier.name"
          :min-elo="tier.minElo"
        />
      </ul>

      <p class="rank-rules__note">
        Each tier is divided into sub-tiers (IV, III, II, I) for every 100 Elo points gained within
        the tier.
      </p>
    </div>

    <template #footer>
      <div class="rank-rules__footer">
        <BaseButton variant="primary" @click="emit('close')">Understood</BaseButton>
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
