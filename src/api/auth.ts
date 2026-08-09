import type { Envelope } from './envelope'
import { http } from './http'
import type { AuthUser, Credentials, LoginResult, ProfileUpdate } from '@/types/auth'

export async function register(credentials: Credentials): Promise<AuthUser> {
  const { data } = await http.post<Envelope<AuthUser>>('/api/register', credentials)
  return data.data
}

export async function login(credentials: Credentials): Promise<LoginResult> {
  const { data } = await http.post<Envelope<LoginResult>>('/api/login', credentials)
  return data.data
}

/** Creates a play-now guest. Takes no credentials and no existing session. */
export async function anonymousLogin(): Promise<LoginResult> {
  const { data } = await http.post<Envelope<LoginResult>>('/api/auth/anonymous')
  return data.data
}

/**
 * Turns the signed-in guest into a registered account. Authenticated by the
 * guest's own bearer token, so it carries no id; the returned token replaces it.
 */
export async function upgradeAccount(credentials: Credentials): Promise<LoginResult> {
  const { data } = await http.post<Envelope<LoginResult>>('/api/auth/upgrade', credentials)
  return data.data
}

export async function fetchProfile(): Promise<AuthUser> {
  const { data } = await http.get<Envelope<AuthUser>>('/api/profile')
  return data.data
}

/**
 * Edits the signed-in player's identity fields.
 *
 * It answers with a token as well as the account, because the player's name
 * lives in the token claims and every realtime surface reads it from there. The
 * returned token replaces the current one; keeping the old one would leave the
 * player announcing their previous name over the WebSocket.
 */
export async function updateProfile(update: ProfileUpdate): Promise<LoginResult> {
  const { data } = await http.patch<Envelope<LoginResult>>('/api/profile', update)
  return data.data
}
