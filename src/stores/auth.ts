import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError } from '@/api/ApiError'
import {
  anonymousLogin as anonymousLoginRequest,
  fetchProfile,
  login as loginRequest,
  register as registerRequest,
  upgradeAccount as upgradeRequest,
} from '@/api/auth'
import { setAuthToken } from '@/api/http'
import type { AuthUser, Credentials } from '@/types/auth'

const TOKEN_STORAGE_KEY = 'gocaro.token'

/** Length of the id prefix the backend derives a guest's display name from. */
const GUEST_NAME_ID_LENGTH = 8

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => token.value !== null && user.value !== null)

  const isGuest = computed(() => user.value?.account_type === 'anonymous')

  /**
   * The name to show anywhere a player is named. The backend derives a guest's
   * name from their id rather than storing one, so this repeats that derivation
   * as a fallback: should any endpoint answer with an empty username, the guest
   * keeps a stable name instead of rendering blank.
   */
  const displayName = computed(() => {
    const current = user.value
    if (current === null) {
      return ''
    }
    if (current.username !== '') {
      return current.username
    }
    return `Guest-${current.id.slice(0, GUEST_NAME_ID_LENGTH)}`
  })

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

  /**
   * Reloads the profile so a rating changed by a finished ranked match is shown.
   *
   * Failures are deliberately quiet: the rating is informational here, and the
   * backend applies elo asynchronously after `game_over`, so a refresh can
   * legitimately arrive early. A 401 is different — the token is genuinely gone,
   * and the session must not survive it.
   */
  async function refreshProfile(): Promise<void> {
    if (token.value === null) {
      return
    }
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

  async function register(credentials: Credentials): Promise<void> {
    await registerRequest(credentials)
  }

  /** Starts a play-now session. The guest token is persisted like any other. */
  async function anonymousLogin(): Promise<void> {
    const result = await anonymousLoginRequest()
    persistToken(result.token)
    user.value = result.user
  }

  /**
   * Saves the current guest as a registered account. The backend answers with a
   * fresh token naming the player, so the guest token is replaced rather than
   * kept: the old one still carries the `Guest-…` name in its claims, which is
   * what an opponent would see over the WebSocket.
   */
  async function upgrade(credentials: Credentials): Promise<void> {
    const result = await upgradeRequest(credentials)
    persistToken(result.token)
    user.value = result.user
  }

  return {
    token,
    user,
    isAuthenticated,
    isGuest,
    displayName,
    initialize,
    refreshProfile,
    login,
    register,
    anonymousLogin,
    upgrade,
    logout,
  }
})
