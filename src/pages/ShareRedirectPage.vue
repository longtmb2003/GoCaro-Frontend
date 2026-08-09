<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { resolveShareLink } from '@/api/share'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const route = useRoute()
const router = useRouter()
const error = ref('')
const { t } = useAppLanguage()

onMounted(async () => {
  const token = typeof route.params.token === 'string' ? route.params.token : ''
  try {
    const link = await resolveShareLink(token)
    await router.replace(link.kind === 'replay' && link.match_id ? `/replay/${link.match_id}` : '/')
  } catch {
    error.value = t('This share link is invalid or no longer available.', 'Liên kết chia sẻ không hợp lệ hoặc không còn khả dụng.')
  }
})
</script>

<template>
  <AppLayout title="GoCaro" fantasy>
    <div v-if="!error" class="text-foreground-muted py-16 text-center" aria-live="polite">
      {{ t('Opening shared content…', 'Đang mở nội dung được chia sẻ…') }}
    </div>
    <EmptyState v-else :title="t('Link unavailable', 'Liên kết không khả dụng')" :description="error">
      <template #action>
        <BaseButton @click="router.push('/')">{{ t('Go to GoCaro', 'Đến GoCaro') }}</BaseButton>
      </template>
    </EmptyState>
  </AppLayout>
</template>
