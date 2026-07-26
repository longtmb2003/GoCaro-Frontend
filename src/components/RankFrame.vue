<script setup lang="ts">
import { computed } from 'vue'
import { getRankTier } from '@/config/ranks'

const props = defineProps<{
  elo: number
  initial: string
}>()

const tier = computed(() => getRankTier(props.elo))

const frameClasses = computed(() => {
  // Use config classes but add some tailwind magic for 'premium' feel
  return `${tier.value.border.replace('border-', 'ring-')} ring-4 ${tier.value.shadow.replace('shadow-', 'shadow-[0_0_15px_')} drop-shadow-md`
})

const innerClasses = computed(() => {
  if (tier.value.name === 'Diamond') return 'bg-gradient-to-br from-cyan-300 via-blue-500 to-purple-600 shadow-[inset_0_0_10px_rgba(255,255,255,0.5)]'
  if (tier.value.name === 'Gold') return 'bg-gradient-to-br from-yellow-200 via-yellow-500 to-amber-600 shadow-[inset_0_0_10px_rgba(255,255,255,0.4)]'
  if (tier.value.name === 'Silver') return 'bg-gradient-to-br from-gray-100 via-gray-300 to-gray-500 shadow-[inset_0_0_8px_rgba(255,255,255,0.5)] text-gray-800'
  if (tier.value.name === 'Bronze') return 'bg-gradient-to-br from-amber-500 via-orange-700 to-yellow-900 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]'
  return 'bg-gradient-to-br from-gray-500 to-gray-700 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]'
})
</script>

<template>
  <div class="relative flex items-center justify-center shrink-0">
    <div
      class="flex size-14 items-center justify-center rounded-full text-xl font-bold text-white transition-transform group-hover:scale-105"
      :class="[frameClasses, innerClasses]"
      aria-hidden="true"
    >
      <span class="drop-shadow-md">{{ initial }}</span>
    </div>
    <!-- Extra rank flair could go here -->
  </div>
</template>
