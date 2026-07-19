/** Board symbol assigned to a player: 1 = black (moves first), 2 = white. */
export type PlayerSymbol = 1 | 2

/** A board cell: a player's symbol, or null when empty. */
export type CellValue = PlayerSymbol | null

/** Width and height of the board (see BACKEND_CONTRACT.md). */
export const BOARD_SIZE = 15

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

/** Payload of the `game_over` frame. `winner` is null on a draw. */
export interface GameOverPayload {
  winner: string | null
  reason: string
}

/** Result of a finished game, from the local player's perspective. */
export interface GameResult {
  outcome: 'win' | 'loss' | 'draw'
  reason: string
}
