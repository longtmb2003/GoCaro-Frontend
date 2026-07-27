<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
  }>(),
  { description: '' },
)
</script>

<template>
  <div class="gap-2 py-6 px-4 flex flex-col items-center text-center">
    <p class="text-card text-foreground">{{ title }}</p>
    <p v-if="description" class="text-small text-foreground-muted max-w-xs">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>
