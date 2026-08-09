<script setup lang="ts">
import { computed } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = withDefaults(
  defineProps<{
    /** Short, human explanation. Never a raw backend error. */
    message: string
    title?: string
  }>(),
  { title: '' },
)
const { errorText, t } = useAppLanguage()
const displayTitle = computed(() => props.title || t('Something went wrong', 'Đã xảy ra lỗi'))
</script>

<template>
  <div class="gap-2 py-6 px-4 flex flex-col items-center text-center" role="alert">
    <p class="text-card text-error">{{ displayTitle }}</p>
    <p class="text-small text-foreground-muted max-w-xs">{{ errorText(message) }}</p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>
