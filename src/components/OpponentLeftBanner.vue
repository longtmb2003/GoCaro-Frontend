<script setup lang="ts">
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

defineProps<{ secondsLeft: number }>()
const { t } = useAppLanguage()
</script>

<template>
  <div
    class="border-warning/40 bg-warning/10 gap-3 px-4 rounded-card flex items-center border py-3"
    role="status"
    aria-live="polite"
  >
    <BaseSpinner size="sm" tone="warning" />
    <p class="text-foreground text-small">
      {{ t('Opponent disconnected — waiting up to', 'Đối thủ đã mất kết nối — chờ tối đa') }}
      <span class="font-semibold tabular-nums">{{ secondsLeft }}s</span>
      {{ t('for them to return.', 'để họ quay lại.') }}
    </p>
  </div>
</template>
