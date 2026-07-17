import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError } from '@/api/ApiError'
import {
  fetchProfile,
  login as loginRequest,
  register as registerRequest,
} from '@/api/auth'
import { setAuthToken } from '@/api/http'
import type { AuthUser, Credentials } from '@/types/auth'

const TOKEN_STORAGE_KEY = 'gocaro.token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => token.value !== null && user.value !== null)

  function persistToken(value: string | null): void {
    token.value = value
    if (value === null) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    } else {
      localStorage.setItem(TOKEN_STORAGE_KEY, value)
    }
    setAuthToken(value)
  }

  function logout(): void {
    persistToken(null)
    user.value = null
  }

  /**
   * Restores a session from a persisted token on app start.
   *
   * A 401 means the token is genuinely invalid or expired, so it is discarded.
   * Network or server errors are transient: the token is kept so the session
   * can recover on a later attempt rather than logging the user out over a
   * temporary outage. The user stays unauthenticated until profile load
   * succeeds, so the route guard still gates protected pages.
   */
  async function initialize(): Promise<void> {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (stored === null) {
      return
    }
    persistToken(stored)
    try {
      user.value = await fetchProfile()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
      }
    }
  }

  async function login(credentials: Credentials): Promise<void> {
    const result = await loginRequest(credentials)
    persistToken(result.token)
    user.value = result.user
  }

  // Register does not return a token by contract, so the caller logs in
  // separately after a successful registration.
  async function register(credentials: Credentials): Promise<void> {
    await registerRequest(credentials)
  }

  return { token, user, isAuthenticated, initialize, login, register, logout }
})
