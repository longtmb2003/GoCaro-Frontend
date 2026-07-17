/** Credentials submitted to the register and login endpoints. */
export interface Credentials {
  username: string
  password: string
}

/**
 * Authenticated user as returned by the backend. Field names mirror the wire
 * format exactly (see BACKEND_CONTRACT.md); the contract is the source of truth.
 */
export interface AuthUser {
  id: string
  username: string
  elo: number
  created_at: string
}

/** Payload returned by POST /api/login. */
export interface LoginResult {
  token: string
  user: AuthUser
}
