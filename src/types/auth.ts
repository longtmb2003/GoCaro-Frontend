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
 */
export interface AuthUser {
  id: string
  username: string
  elo: number
  account_type: AccountType
  created_at: string
  stats: UserStats
}

/**
 * Payload returned by every endpoint that starts or replaces a session:
 * POST /api/login, /api/auth/anonymous and /api/auth/upgrade.
 */
export interface LoginResult {
  token: string
  user: AuthUser
}
