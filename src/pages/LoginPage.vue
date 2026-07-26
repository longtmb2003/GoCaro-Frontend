<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { ApiError } from '@/api/ApiError'
import CredentialsForm from '@/components/CredentialsForm.vue'
import PlayAsGuestButton from '@/components/PlayAsGuestButton.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import type { Credentials } from '@/types/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const serverError = ref('')

async function handleSubmit(credentials: Credentials): Promise<void> {
  loading.value = true
  serverError.value = ''
  try {
    await auth.login(credentials)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
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
  <AuthLayout title="Play GoCaro" subtitle="Jump straight in, or sign in to your account">
    <PlayAsGuestButton :disabled="loading" />

    <div class="my-6 flex items-center gap-3">
      <span class="bg-border-subtle h-px flex-1" aria-hidden="true" />
      <span class="text-foreground-muted text-xs font-medium uppercase">or</span>
      <span class="bg-border-subtle h-px flex-1" aria-hidden="true" />
    </div>

    <CredentialsForm
      submit-label="Sign in"
      :loading="loading"
      :server-error="serverError"
      @submit="handleSubmit"
    />
    <template #footer>
      <p class="text-foreground-muted text-sm">
        No account?
        <RouterLink to="/register" class="text-primary-400 hover:text-primary-300 font-medium">
          Create one
        </RouterLink>
      </p>
    </template>
  </AuthLayout>
</template>
