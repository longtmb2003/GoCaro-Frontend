import { ref, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError } from '@/api/ApiError'
import { useAuthStore } from '@/stores/auth'

interface GuestLogin {
  loading: Ref<boolean>
  error: Ref<string>
  playAsGuest: () => Promise<void>
}

/**
 * Starts a play-now session and lands the visitor where they were headed.
 * Shared by the sign-in and sign-up pages, which both offer the guest entry
 * point, so the two never drift on redirect or error handling.
 */
export function useGuestLogin(): GuestLogin {
  const auth = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  const loading = ref(false)
  const error = ref('')

  async function playAsGuest(): Promise<void> {
    if (loading.value) {
      return
    }
    loading.value = true
    error.value = ''
    try {
      await auth.anonymousLogin()
      // A guard may have sent the visitor here from a protected page; honour
      // that destination, exactly as a normal sign-in does.
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
      await router.push(redirect)
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      error.value = caught.message
    } finally {
      loading.value = false
    }
  }

  return { loading, error, playAsGuest }
}
