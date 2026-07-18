/**
 * A leaderboard row as returned by GET /api/leaderboard. Field names mirror the
 * wire format exactly (see BACKEND_CONTRACT.md). Entries carry no user id, so
 * the current player is identified by username.
 */
export interface LeaderboardEntry {
  username: string
  elo: number
}
