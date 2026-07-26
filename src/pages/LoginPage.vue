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
const loginSuccess = ref(false)

async function handleSubmit(credentials: Credentials): Promise<void> {
  loading.value = true
  serverError.value = ''
  try {
    await auth.login(credentials)
    loginSuccess.value = true
    
    // Simulate premium login transition (500-700ms)
    setTimeout(async () => {
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
      await router.push(redirect)
    }, 600)
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error
    }
    serverError.value = error.message
    loading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Fullscreen Success Overlay -->
    <div v-if="loginSuccess" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background [animation:fade-in_0.3s_ease-out_forwards]">
      <div class="relative">
        <div class="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        <h1 class="text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600 relative z-10 [animation:float_2s_ease-in-out_infinite]">
          GOCARO
        </h1>
      </div>
      <div class="mt-8 text-primary-400 text-sm font-semibold uppercase tracking-widest animate-pulse">
        Entering Lobby...
      </div>
    </div>

    <AuthLayout title="Compete. Climb. Conquer." subtitle="Play real-time Gomoku, climb the ranked ladder, unlock exclusive cosmetics, and challenge players worldwide.">
      <PlayAsGuestButton :disabled="loading || loginSuccess" />

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
  </div>
</template>
