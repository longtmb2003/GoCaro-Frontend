<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Short, human explanation. Never a raw backend error. */
    message: string
    title?: string
  }>(),
  { title: 'Something went wrong' },
)
</script>

<template>
  <div class="gap-sm py-xl px-lg flex flex-col items-center text-center" role="alert">
    <p class="text-card text-error">{{ title }}</p>
    <p class="text-small text-foreground-muted max-w-xs">{{ message }}</p>
    <div v-if="$slots.action" class="mt-sm">
      <slot name="action" />
    </div>
  </div>
</template>
