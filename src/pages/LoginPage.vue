<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { ApiError } from '@/api/ApiError'
import CredentialsForm from '@/components/CredentialsForm.vue'
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
    // Only authentication failures belong in the form. Anything else is an
    // unexpected fault that should surface rather than read as a bad password.
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
  <AuthLayout title="Sign in" subtitle="Welcome back to GoCaro">
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
