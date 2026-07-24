/** Board symbol assigned to a player: 1 = black (moves first), 2 = white. */
export type PlayerSymbol = 1 | 2

/** A board cell: a player's symbol, or null when empty. */
export type CellValue = PlayerSymbol | null

/** Width and height of the board (see BACKEND_CONTRACT.md). */
export const BOARD_SIZE = 15

/**
 * Which queue a search runs on. Casual pairs FIFO and is open to guests; ranked
 * pairs by rating, moves elo, and requires a registered account.
 */
export type MatchmakingMode = 'casual' | 'ranked'

/**
 * Payload of a `queue_searching` frame: how long this player has waited and how
 * wide their rating search has grown. Ranked only, and sent only when the band
 * actually widens (see BACKEND_CONTRACT.md).
 */
export interface QueueSearchingPayload {
  elapsed_seconds: number
  search_range: number
}

/**
 * Payload of the `match_found` WebSocket frame (see BACKEND_CONTRACT.md). Field
 * names mirror the wire format exactly; the contract is the source of truth.
 */
export interface MatchFoundPayload {
  room_id: string
  opponent: string
  your_symbol: PlayerSymbol
  your_turn: boolean
}

/** Payload of a `board_update` frame: one accepted move, and whose turn is next. */
export interface BoardUpdatePayload {
  x: number
  y: number
  symbol: PlayerSymbol
  /** User id of the player expected to move next. */
  next_turn: string
}

/**
 * Payload of the `game_over` frame. `winner` is null on a draw.
 *
 * The rating fields describe what each seat gained or lost: black is symbol 1,
 * white is symbol 2, and the two are always opposites. They are zero on a casual
 * match, where `is_ranked` is false. Per BACKEND_CONTRACT.md this is a figure to
 * display only — the authoritative rating comes from `GET /api/profile`, so a
 * delta must never be added to a rating the client already holds.
 */
export interface GameOverPayload {
  winner: string | null
  reason: string
  is_ranked: boolean
  delta_black: number
  delta_white: number
}

/** Result of a finished game, from the local player's perspective. */
export interface GameResult {
  outcome: 'win' | 'loss' | 'draw'
  reason: string
  /** This player's rating change, or null when no rating was at stake. */
  ratingDelta: number | null
}
