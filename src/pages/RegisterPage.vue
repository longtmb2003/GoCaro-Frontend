<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { ApiError } from '@/api/ApiError'
import CredentialsForm from '@/components/CredentialsForm.vue'
import PlayAsGuestButton from '@/components/PlayAsGuestButton.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import type { Credentials } from '@/types/auth'

const auth = useAuthStore()
const router = useRouter()

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
  <AuthLayout title="Create account" subtitle="Join GoCaro and start playing">
    <PlayAsGuestButton :disabled="loading" />

    <div class="my-6 flex items-center gap-3">
      <span class="bg-white/20 h-px flex-1" aria-hidden="true" />
      <span class="text-white/50 text-xs font-bold uppercase tracking-widest">or</span>
      <span class="bg-white/20 h-px flex-1" aria-hidden="true" />
    </div>

    <CredentialsForm
      submit-label="Create account"
      password-autocomplete="new-password"
      :loading="loading"
      :server-error="serverError"
      @submit="handleSubmit"
    />
    <template #footer>
      <p class="text-foreground-muted text-sm">
        Already have an account?
        <RouterLink to="/login" class="text-primary-400 hover:text-primary-300 font-medium">
          Sign in
        </RouterLink>
      </p>
    </template>
  </AuthLayout>
</template>
