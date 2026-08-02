/** Credentials submitted to the register, login and upgrade endpoints. */
export interface Credentials {
  username: string
  password: string
}

/**
 * How a player signed in. A guest and a registered player are the same entity;
 * upgrading only flips this field, keeping the id, elo and match history.
 */
export type AccountType = 'anonymous' | 'registered'

export interface UserStats {
  matches_played: number
  wins: number
  losses: number
  current_streak: number
  max_streak: number
  coins: number
  daily_matches: number
  last_match_date: string | null
  last_share_date: string | null
}

/**
 * Authenticated user as returned by the backend. Field names mirror the wire
 * format exactly (see BACKEND_CONTRACT.md); the contract is the source of truth.
 *
 * This is the caller's own account, so unlike a public profile it carries the
 * private `phone`. Never render it for anybody else.
 */
export interface AuthUser {
  id: string
  /**
   * The unique handle. `display_name` is what to render; this one is what to
   * compare, because full names are not unique.
   */
  username: string
  display_name: string
  /** The chosen name, or '' when the player has never set one. */
  full_name: string
  elo: number
  account_type: AccountType
  created_at: string
  stats: UserStats
  /**
   * When the next rename becomes allowed, or null when one is allowed now. The
   * backend sends the moment rather than the remaining window, so the cooldown
   * length lives in one place — the server.
   */
  full_name_change_available_at: string | null
}

/**
 * Body of PATCH /api/profile. An omitted field is left as it is; an empty
 * string clears the field, which is how a player drops back to their handle or
 * removes a phone number.
 */
export interface ProfileUpdate {
  full_name?: string
  phone?: string
}

/**
 * Payload returned by every endpoint that starts or replaces a session:
 * POST /api/login, /api/auth/anonymous and /api/auth/upgrade.
 */
export interface LoginResult {
  token: string
  user: AuthUser
}
