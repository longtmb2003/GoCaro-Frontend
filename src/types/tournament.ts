/**
 * Tournament wire shapes (see BACKEND_CONTRACT.md). Field names mirror the
 * backend JSON exactly.
 */

/** Lifecycle of a tournament. `ready` means registration has closed. */
export type TournamentStatus = 'registration' | 'ready' | 'running' | 'finished' | 'cancelled'

/** Only single elimination exists so far. */
export type TournamentType = 'single_elimination'

/** State of one bracket slot. `walkover` was awarded without a game. */
export type BracketSlotStatus = 'pending' | 'in_progress' | 'finished' | 'walkover'

/** A player's standing in a tournament. */
export type ParticipantStatus = 'registered' | 'eliminated' | 'champion'

export interface Tournament {
  id: string
  name: string
  type: TournamentType
  status: TournamentStatus
  max_players: number
  /** 0 until the tournament starts, then the round being played. */
  current_round: number
  created_by: string
  created_at: string
  start_at: string | null
  finished_at: string | null
}

/**
 * A tournament as the listing serves it: the tournament plus the aggregates a
 * lobby needs, so a list renders without a request per row.
 */
export interface TournamentSummary extends Tournament {
  current_players: number
  champion_id: string | null
  champion_display_name: string | null
}

/** One page of GET /api/tournaments. */
export interface TournamentListPage {
  tournaments: TournamentSummary[]
  page: number
  limit: number
  total: number
}

/** One entrant. `seed` is null until the field fills and the bracket is sealed. */
export interface TournamentParticipant {
  user_id: string
  display_name: string
  seed: number | null
  status: ParticipantStatus
  /** The rating this player entered with, which is what seeding used. */
  elo: number
}

/** GET /api/tournaments/:id */
export interface TournamentDetail {
  tournament: Tournament
  participants: TournamentParticipant[]
}

/**
 * One pairing of the bracket.
 *
 * Every id can be null: a later round before its feeding matches have produced
 * winners, or a deleted account. Display names are null wherever their id is,
 * so a client must never assume a name is present.
 */
export interface BracketSlot {
  id: string
  round: number
  slot: number
  player1_id: string | null
  player2_id: string | null
  winner_id: string | null
  /** The match this slot was played as, and what replay and spectating key on. */
  match_id: string | null
  status: BracketSlotStatus
  player1_display_name: string | null
  player2_display_name: string | null
  winner_display_name: string | null
  /** When the tournament summoned this slot; null before that. */
  called_at: string | null
  /** How many times a draw has forced this slot to be replayed. */
  rematch_count: number
  finished_at: string | null
}

/** GET /api/tournaments/:id/bracket */
export interface TournamentBracket {
  tournament: Tournament
  bracket: BracketSlot[]
}
