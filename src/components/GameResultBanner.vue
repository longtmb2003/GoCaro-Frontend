<script setup lang="ts">
import { computed } from 'vue'

import BaseButton from '@/components/BaseButton.vue'

const props = defineProps<{
  heading: string
  message: string
  tone: 'win' | 'loss' | 'draw'
}>()

defineEmits<{ exit: [] }>()

const headingClass = computed(() =>
  props.tone === 'win'
    ? 'text-success-500'
    : props.tone === 'loss'
      ? 'text-danger-400'
      : 'text-foreground',
)
</script>

<template>
  <div
    class="fixed inset-0 z-1300 flex items-center justify-center bg-black/60 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="result-heading"
  >
    <div class="bg-surface-elevated w-full max-w-sm rounded-lg p-6 text-center shadow-lg">
      <h2 id="result-heading" class="text-2xl font-bold" :class="headingClass">{{ heading }}</h2>
      <p class="text-foreground-muted mt-2 text-sm">{{ message }}</p>
      <BaseButton class="mt-6 w-full" @click="$emit('exit')">Back to lobby</BaseButton>
    </div>
  </div>
</template>
