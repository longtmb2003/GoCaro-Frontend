<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import { Scroll } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import MatchHistoryList from '@/components/MatchHistoryList.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useHistoryStore } from '@/stores/history'
import { useAppLanguage } from '@/composables/useAppLanguage'

const auth = useAuthStore()
const history = useHistoryStore()
const { t } = useAppLanguage()

onMounted(() => {
  void history.load(1)
})
</script>

<template>
  <AppLayout title="Match history" fantasy>
    <template #actions>
      <RouterLink
        to="/"
        class="text-foreground-muted hover:text-foreground text-sm font-medium transition-colors"
      >
        {{ t('Back to lobby', 'Về sảnh') }}
      </RouterLink>
    </template>

    <GlassCard
      :title="t('Recent matches', 'Các trận gần đây')"
      class="mx-auto max-w-2xl"
    >
      <template #icon><Scroll :size="18" aria-hidden="true" /></template>
      <template #actions>
        <p class="text-foreground-muted text-caption tracking-wider uppercase">{{ t('All players', 'Tất cả người chơi') }}</p>
      </template>

      <p v-if="history.loading" class="text-foreground-muted py-6 text-body text-center">
        {{ t('Loading match history…', 'Đang tải lịch sử trận…') }}
      </p>

      <ErrorState v-else-if="history.error" :message="history.error">
        <template #action>
          <BaseButton variant="secondary" @click="history.load(history.page)">
            {{ t('Try again', 'Thử lại') }}
          </BaseButton>
        </template>
      </ErrorState>

      <template v-else>
        <MatchHistoryList :matches="history.matches" :current-user-id="auth.user?.id ?? ''" />

        <div
          v-if="history.total > 0"
          class="border-border-subtle mt-6 pt-4 flex items-center justify-between border-t"
        >
          <BaseButton variant="secondary" :disabled="!history.hasPrev" @click="history.prevPage()">
            {{ t('Previous', 'Trước') }}
          </BaseButton>
          <span class="text-foreground-muted text-small font-semibold tabular-nums">
            {{ t('Page', 'Trang') }} {{ history.page }} {{ t('of', 'trên') }} {{ history.totalPages }}
          </span>
          <BaseButton variant="secondary" :disabled="!history.hasNext" @click="history.nextPage()">
            {{ t('Next', 'Tiếp') }}
          </BaseButton>
        </div>
      </template>
    </GlassCard>
  </AppLayout>
</template>
