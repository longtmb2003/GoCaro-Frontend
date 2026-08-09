<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { ApiError } from '@/api/ApiError'
import CredentialsForm from '@/components/CredentialsForm.vue'
import PlayAsGuestButton from '@/components/PlayAsGuestButton.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import type { Credentials } from '@/types/auth'
import { useAppLanguage } from '@/composables/useAppLanguage'

const auth = useAuthStore()
const router = useRouter()
const { t } = useAppLanguage()

const loading = ref(false)
const serverError = ref('')

async function handleSubmit(credentials: Credentials): Promise<void> {
  loading.value = true
  serverError.value = ''
  try {
    await auth.register(credentials)
    await auth.login(credentials)
    await router.push('/')
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error
    }
    serverError.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout :title="t('Create account', 'Tạo tài khoản')" :subtitle="t('Join GoCaro and start playing', 'Tham gia GoCaro và bắt đầu chơi')">
    <PlayAsGuestButton :disabled="loading" />

    <div class="my-6 flex items-center gap-3">
      <span class="bg-white/20 h-px flex-1" aria-hidden="true" />
      <span class="text-white/50 text-xs font-bold uppercase tracking-widest">{{ t('or', 'hoặc') }}</span>
      <span class="bg-white/20 h-px flex-1" aria-hidden="true" />
    </div>

    <CredentialsForm
      :submit-label="t('Create account', 'Tạo tài khoản')"
      password-autocomplete="new-password"
      :loading="loading"
      :server-error="serverError"
      @submit="handleSubmit"
    />
    <template #footer>
      <p class="text-foreground-muted text-sm">
        {{ t('Already have an account?', 'Đã có tài khoản?') }}
        <RouterLink to="/login" class="text-primary-400 hover:text-primary-300 font-medium">
          {{ t('Sign in', 'Đăng nhập') }}
        </RouterLink>
      </p>
    </template>
  </AuthLayout>
</template>
