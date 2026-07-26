<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BaseButton from './BaseButton.vue'
import { RANK_TIERS } from '@/config/ranks'
import RankFrame from './RankFrame.vue'

const emit = defineEmits<{ (e: 'close'): void }>()

const dialog = ref<HTMLElement | null>(null)

onMounted(() => {
  dialog.value?.querySelector('button')?.focus()
})

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <div
    ref="dialog"
    class="fixed inset-0 z-1300 flex items-center justify-center bg-black/60 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="rank-rules-heading"
    @keydown="onKeydown"
  >
    <div class="bg-surface-elevated w-full max-w-md rounded-lg p-6 shadow-lg">
      <div class="flex justify-between items-center mb-4">
        <h2 id="rank-rules-heading" class="text-foreground text-lg font-semibold">
          Rank System
        </h2>
        <button class="text-foreground-muted hover:text-foreground" @click="emit('close')">✕</button>
      </div>
      <div class="space-y-4">
      <p class="text-sm text-foreground-muted">
        Your rank is determined by your Elo rating. Win ranked matches to gain Elo, but be careful—losing will drop your rating!
      </p>

      <div class="space-y-3">
        <div v-for="tier in RANK_TIERS.slice().reverse()" :key="tier.name" class="flex items-center gap-4 bg-surface rounded-lg p-3 border border-border-subtle">
          <RankFrame :elo="tier.minElo" initial="R" />
          <div>
            <h3 class="font-bold text-foreground" :class="tier.color">{{ tier.name }}</h3>
            <p class="text-xs text-foreground-muted">{{ tier.minElo }} Elo and above</p>
          </div>
        </div>
      </div>
      
      <p class="text-[10px] text-foreground-muted italic mt-4 text-center">
        Each tier is divided into sub-tiers (IV, III, II, I) for every 100 Elo points gained within the tier.
      </p>

      <div class="mt-6 flex justify-end">
        <BaseButton variant="primary" @click="emit('close')">Understood</BaseButton>
      </div>
    </div>
  </div>
</div>
</template>
