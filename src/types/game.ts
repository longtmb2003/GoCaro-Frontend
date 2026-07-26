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
  /**
   * Per-turn time budget in seconds, fixed for the whole match. Sent only here;
   * the client keeps it and resets its turn clock to it on every `board_update`.
   */
  turn_seconds: number
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

/**
 * One move in a `sync_state` frame. Unlike a stored `MatchMove`, the symbol is
 * already resolved from seating, so the board can be rebuilt without knowing
 * which id owns which colour.
 */
export interface SyncMove {
  x: number
  y: number
  symbol: PlayerSymbol
}

/**
 * Payload of `sync_state`, the first frame a reconnecting player receives. It is
 * the whole match: every move so far, whose turn it is, which side they play,
 * the current turn's remaining seconds, and the status. The board is rebuilt
 * from `moves` alone — no game logic runs on the client.
 */
export interface SyncStatePayload {
  moves: SyncMove[]
  turn: string
  your_symbol: PlayerSymbol
  remaining_turn_seconds: number
  status: string
}

export interface LobbyUser {
  id: string
  username: string
}

export interface LobbyStatePayload {
  online_users: LobbyUser[]
}

/**
 * Payload of `opponent_reconnecting`: how many seconds the dropped opponent has
 * to return before forfeiting. `opponent_reconnected` clears it and carries no
 * payload.
 */
export interface OpponentReconnectingPayload {
  remaining_seconds: number
}
