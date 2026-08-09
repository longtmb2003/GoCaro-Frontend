import axios from 'axios'
import { readonly, ref } from 'vue'

const HEALTH_CHECK_TIMEOUT_MS = 5_000

const healthClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: HEALTH_CHECK_TIMEOUT_MS,
})

const isUnavailable = ref(false)
const isChecking = ref(false)
let activeCheck: Promise<boolean> | null = null

/**
 * A cancelled request is a client-side lifecycle event, not a backend outage.
 * Connection failures and 5xx responses indicate that the backend cannot serve
 * the application and should switch the UI to its maintenance state.
 */
export function isServerFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.code === 'ERR_CANCELED') {
    return false
  }

  const status = error.response?.status
  return status === undefined || status >= 500
}

export function markServerUnavailable(): void {
  isUnavailable.value = true
}

/**
 * Uses a dedicated Axios client so the readiness probe does not pass through
 * the application's response interceptor and recursively classify itself.
 */
export function checkServerAvailability(): Promise<boolean> {
  if (activeCheck !== null) {
    return activeCheck
  }

  isChecking.value = true
  const check = healthClient
    .get('/health/ready')
    .then(() => {
      isUnavailable.value = false
      return true
    })
    .catch(() => {
      isUnavailable.value = true
      return false
    })
    .finally(() => {
      isChecking.value = false
      activeCheck = null
    })

  activeCheck = check
  return check
}

export function useServerAvailability() {
  return {
    isUnavailable: readonly(isUnavailable),
    isChecking: readonly(isChecking),
  }
}
