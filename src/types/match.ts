/** Lifecycle of a match (see BACKEND_CONTRACT.md). */
export type MatchStatus = 'in_progress' | 'finished' | 'abandoned'

/**
 * A match as returned by GET /api/matches. Field names mirror the wire format
 * exactly. Players are identified only by id — the backend exposes no usernames
 * on this endpoint.
 */
export interface MatchSummary {
  id: string
  player1_id: string
  player2_id: string
  winner_id: string | null
  status: MatchStatus
  total_moves: number
  created_at: string
  finished_at: string | null
}

/** One page of the global match list. */
export interface MatchListPage {
  matches: MatchSummary[]
  page: number
  limit: number
  total: number
}
