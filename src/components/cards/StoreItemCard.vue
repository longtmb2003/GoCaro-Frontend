<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

withDefaults(
  defineProps<{
    image: string
    /** Describes the artwork for assistive tech. */
    alt: string
    name: string
    collection: string
    price: number
    rarity?: string
    /** Feature tiles span the grid and show the artwork contained, not cropped. */
    wide?: boolean
  }>(),
  { rarity: '', wide: false },
)
</script>

<template>
  <div
    class="bg-glass-light border-border rounded-card p-4 gap-3 flex flex-col border"
  >
    <div
      class="rounded-card ring-border-strong overflow-hidden ring-2"
      :class="wide ? 'bg-surface-sunken size-16 shrink-0 p-1' : 'aspect-square w-full'"
    >
      <img
        :src="image"
        :alt="alt"
        loading="lazy"
        decoding="async"
        class="h-full w-full"
        :class="wide ? 'object-contain' : 'object-cover'"
      />
    </div>

    <div class="flex flex-1 flex-col justify-between">
      <div>
        <h4 class="text-body gap-2 text-foreground flex items-center font-bold">
          {{ name }}
          <BaseBadge v-if="rarity" variant="warning" shape="tag">{{ rarity }}</BaseBadge>
        </h4>
        <p class="text-caption text-foreground-muted mt-1 tracking-wider uppercase">
          {{ collection }}
        </p>
      </div>
      <!-- The shop is not built yet: the price is roadmap information, not an
           offer, so the control must not behave like one. -->
      <BaseButton size="sm" disabled class="mt-3 w-full">
        <span aria-hidden="true">💰</span> {{ price }}
      </BaseButton>
    </div>
  </div>
</template>
