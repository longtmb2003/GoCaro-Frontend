<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { RANK_TIERS } from '@/config/ranks'
import RankFrame from './RankFrame.vue'

const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <BaseModal title="Rank System" size="md" @close="emit('close')">
    <div class="space-y-4">
      <p class="text-foreground-muted text-body">
        Your rank is determined by your Elo rating. Win ranked matches to gain Elo, but be
        careful—losing will drop your rating!
      </p>

      <ul class="space-y-3">
        <li
          v-for="tier in RANK_TIERS.slice().reverse()"
          :key="tier.name"
          class="gap-4 bg-glass-light border-border-subtle rounded-sm p-3 flex items-center border"
        >
          <RankFrame :elo="tier.minElo" initial="R" />
          <div>
            <h3 class="text-card" :class="tier.color">{{ tier.name }}</h3>
            <p class="text-foreground-muted text-small">{{ tier.minElo }} Elo and above</p>
          </div>
        </li>
      </ul>

      <p class="text-caption text-foreground-muted text-center italic">
        Each tier is divided into sub-tiers (IV, III, II, I) for every 100 Elo points gained within
        the tier.
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <BaseButton variant="primary" @click="emit('close')">Understood</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
