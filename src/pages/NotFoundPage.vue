<script setup lang="ts">
import { useRouter } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()
const router = useRouter()
</script>

<template>
  <AppLayout title="GoCaro" fantasy>
    <section class="mx-auto max-w-md py-16 text-center">
      <p class="text-primary-400 text-5xl font-bold">404</p>
      <h1 class="text-foreground mt-4 text-xl font-semibold">
        {{ t('Page not found', 'Không tìm thấy trang') }}
      </h1>
      <p class="text-foreground-muted mt-2 text-sm">
        {{
          t(
            'The page you’re looking for doesn’t exist or has moved.',
            'Trang bạn đang tìm không tồn tại hoặc đã được chuyển.',
          )
        }}
      </p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <BaseButton @click="router.push('/')">{{ t('Back to lobby', 'Về sảnh') }}</BaseButton>
        <BaseButton variant="secondary" @click="router.push('/leaderboard')">
          {{ t('View leaderboard', 'Xem bảng xếp hạng') }}
        </BaseButton>
      </div>
    </section>
  </AppLayout>
</template>
