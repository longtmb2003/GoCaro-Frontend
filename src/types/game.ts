/** Board symbol assigned to a player: 1 = black (moves first), 2 = white. */
export type PlayerSymbol = 1 | 2

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
