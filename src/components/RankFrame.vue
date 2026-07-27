<script setup lang="ts">
import { computed } from 'vue'
import { getRankTier } from '@/config/ranks'

const props = withDefaults(defineProps<{
  elo: number
  initial: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'lg'
})

const tier = computed(() => getRankTier(props.elo))

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'size-6 text-[10px] ring-2'
    case 'md': return 'size-8 text-xs ring-2'
    case 'lg': return 'size-14 text-xl ring-4'
    case 'xl': return 'size-20 text-3xl ring-4'
    default: return 'size-14 text-xl ring-4'
  }
})

const frameClasses = computed(() => {
  // The border uses the rank color
  return `${tier.value.border.replace('border-', 'ring-')} ${tier.value.shadow.replace('shadow-', 'shadow-[0_0_15px_')} drop-shadow-md`
})

const innerClasses = computed(() => {
  return 'bg-gradient-to-br from-neutral-800 to-neutral-950 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]'
})
</script>

<template>
  <div class="relative flex items-center justify-center shrink-0">
    <div
      class="flex items-center justify-center rounded-full font-bold text-white"
      :class="[sizeClasses, frameClasses, innerClasses]"
      aria-hidden="true"
    >
      <span class="drop-shadow-md">{{ initial }}</span>
    </div>
  </div>
</template>
