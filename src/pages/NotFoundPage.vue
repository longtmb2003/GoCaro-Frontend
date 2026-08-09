<script setup lang="ts">
import { RouterLink } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()
</script>

<template>
  <AppLayout title="GoCaro" fantasy>
    <section class="mx-auto max-w-md py-16 text-center">
      <p class="text-primary-400 text-5xl font-bold">404</p>
      <h2 class="text-foreground mt-4 text-xl font-semibold">{{ t('Page not found', 'Không tìm thấy trang') }}</h2>
      <p class="text-foreground-muted mt-2 text-sm">
        {{ t('The page you’re looking for doesn’t exist or has moved.', 'Trang bạn đang tìm không tồn tại hoặc đã được chuyển.') }}
      </p>
      <RouterLink to="/">
        <BaseButton class="mt-6">{{ t('Back to lobby', 'Về sảnh') }}</BaseButton>
      </RouterLink>
    </section>
  </AppLayout>
</template>
