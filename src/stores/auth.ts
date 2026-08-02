import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError } from '@/api/ApiError'
import {
  anonymousLogin as anonymousLoginRequest,
  fetchProfile,
  login as loginRequest,
  register as registerRequest,
  shareAchievement as shareAchievementRequest,
  updateProfile as updateProfileRequest,
  upgradeAccount as upgradeRequest,
} from '@/api/auth'
import { setAuthToken } from '@/api/http'
import type { AuthUser, Credentials, ProfileUpdate } from '@/types/auth'

const TOKEN_STORAGE_KEY = 'gocaro.token'

/** Length of the id prefix the backend derives a guest's display name from. */
const GUEST_NAME_ID_LENGTH = 8

/**
 * How many times to try loading the profile when restoring a session, and the
 * base delay between tries (it grows each attempt). Sized to ride out a backend
 * cold start without giving up the session.
 */
const PROFILE_LOAD_ATTEMPTS = 3
const PROFILE_LOAD_RETRY_MS = 1500

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => token.value !== null && user.value !== null)

  const isGuest = computed(() => user.value?.account_type === 'anonymous')

  /**
   * The name to show anywhere a player is named.
   *
   * The backend already resolves this and sends it as `display_name`, so that
   * is what wins. The rest repeats the server's own fallback chain — full name,
   * then handle, then a name derived from the id — so that a payload from
   * before this field existed, or a guest whose name is never stored, still
   * renders a stable name instead of a blank.
   */
  const displayName = computed(() => {
    const current = user.value
    if (current === null) {
      return ''
    }
    if (current.display_name) {
      return current.display_name
    }
    if (current.full_name) {
      return current.full_name
    }
    if (current.username !== '') {
      return current.username
    }
    return `Guest-${current.id.slice(0, GUEST_NAME_ID_LENGTH)}`
  })

  /**
   * When the player may next change their full name, or null when they may now.
   * A guest never can, because they have no profile.
   */
  const fullNameChangeAvailableAt = computed(() => {
    const at = user.value?.full_name_change_available_at
    return at ? new Date(at) : null
  })

  const canChangeFullName = computed(() => {
    if (user.value === null || isGuest.value) {
      return false
    }
    const at = fullNameChangeAvailableAt.value
    return at === null || at.getTime() <= Date.now()
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
   * Restores a session from a persisted token on app start (e.g. after a reload).
   *
   * Only a 401 ends the session: it means the token is genuinely invalid or
   * expired. Every other failure is treated as transient — a backend still
   * waking from cold start, a slow network, a 5xx — and is retried rather than
   * silently dropping the user to the login page. This is what keeps the session
   * alive across a refresh until the user logs out or the token actually expires.
   * The token is kept regardless, so a later action can still recover.
   */
  async function initialize(): Promise<void> {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (stored === null) {
      return
    }
    persistToken(stored)

    for (let attempt = 1; attempt <= PROFILE_LOAD_ATTEMPTS; attempt++) {
      try {
        user.value = await fetchProfile()
        return
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        if (attempt < PROFILE_LOAD_ATTEMPTS) {
          await delay(PROFILE_LOAD_RETRY_MS * attempt)
        }
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

  /**
   * Saves the player's identity fields.
   *
   * The token is replaced, not just the user: the backend puts the display name
   * in the token claims, and the lobby list, lobby chat and opponent banner all
   * read it from there. App.vue watches the token and reconnects the social
   * socket, so swapping it here is what makes the new name appear in realtime.
   */
  async function updateProfile(update: ProfileUpdate): Promise<void> {
    const result = await updateProfileRequest(update)
    persistToken(result.token)
    user.value = result.user
  }

  async function shareAchievement(): Promise<boolean> {
    const granted = await shareAchievementRequest()
    if (granted && user.value) {
      user.value.stats.coins += 50
      user.value.stats.last_share_date = new Date().toISOString()
    }
    return granted
  }

  return {
    token,
    user,
    isAuthenticated,
    isGuest,
    displayName,
    canChangeFullName,
    fullNameChangeAvailableAt,
    updateProfile,
    initialize,
    refreshProfile,
    login,
    register,
    anonymousLogin,
    upgrade,
    logout,
    shareAchievement,
  }
})
