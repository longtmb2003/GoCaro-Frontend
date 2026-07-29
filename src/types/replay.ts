import type { MatchSummary } from './match'

/** A single recorded move for replay, including the symbol. */
export interface ReplayMove {
  move_no: number
  player_id: string
  symbol: number
  x: number
  y: number
  played_at: string
}

/** A match with its full ordered move list, returned by GET /api/replays/:id. */
export interface ReplayDetail {
  match: MatchSummary
  moves: ReplayMove[]
}
