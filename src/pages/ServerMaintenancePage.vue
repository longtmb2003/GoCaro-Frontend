<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw, ServerCog } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

defineProps<{
  retrying: boolean
}>()

defineEmits<{
  retry: []
}>()

const COPY = {
  en: {
    eyebrow: 'Service temporarily unavailable',
    title: 'Server maintenance in progress',
    description:
      'We cannot connect to the GoCaro server right now. Your account and match history remain safe. Please try again shortly.',
    retry: 'Try again',
    retrying: 'Checking server',
  },
  vi: {
    eyebrow: 'Dịch vụ tạm thời gián đoạn',
    title: 'Máy chủ đang bảo trì',
    description:
      'Hiện tại không thể kết nối tới máy chủ GoCaro. Tài khoản và lịch sử đấu của bạn vẫn được bảo toàn. Vui lòng thử lại sau ít phút.',
    retry: 'Thử lại',
    retrying: 'Đang kiểm tra máy chủ',
  },
} as const

const appLanguage = useAppLanguage()
const ui = computed(() => COPY[appLanguage.language.value])
</script>

<template>
  <main
    class="bg-background text-foreground p-4 sm:p-6 flex h-full items-center justify-center overflow-y-auto"
    aria-labelledby="maintenance-title"
  >
    <GlassCard
      as="section"
      variant="elevated"
      class="w-full max-w-lg"
      body-class="flex flex-col items-center text-center"
      role="alert"
      aria-live="assertive"
    >
      <div
        class="bg-warning-500/10 border-warning-400/30 text-warning mb-6 flex h-16 w-16 items-center justify-center rounded-pill border"
        aria-hidden="true"
      >
        <ServerCog class="h-6 w-6" :stroke-width="1.75" />
      </div>

      <p class="text-caption text-warning mb-3 font-semibold uppercase tracking-wide">
        {{ ui.eyebrow }}
      </p>
      <h1 id="maintenance-title" class="text-page text-foreground font-bold tracking-tight">
        {{ ui.title }}
      </h1>
      <p class="text-body text-foreground-muted mt-4 max-w-md">
        {{ ui.description }}
      </p>

      <BaseButton
        class="mt-6 w-full sm:w-auto"
        size="lg"
        :loading="retrying"
        @click="$emit('retry')"
      >
        <RefreshCw v-if="!retrying" class="h-5 w-5" aria-hidden="true" />
        {{ retrying ? ui.retrying : ui.retry }}
      </BaseButton>
    </GlassCard>
  </main>
</template>
