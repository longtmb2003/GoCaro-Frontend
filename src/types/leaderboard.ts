/**
 * A leaderboard row as returned by GET /api/leaderboard. Field names mirror the
 * wire format exactly (see BACKEND_CONTRACT.md).
 *
 * `display_name` is what to render and `username` is what to compare: the row
 * belonging to the signed-in player is marked by handle, because full names are
 * not unique and two players may share one.
 */
export interface LeaderboardEntry {
  id: string
  username: string
  display_name: string
  title: string
  profile_frame: string
  elo: number
}
