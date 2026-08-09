/**
 * One source of truth for spirit sequence timing, shared by the stage animation,
 * the piece materialization and the audio layer — the same arrangement
 * `feedbackTiming.ts` already uses for placement cues, for the same reason: a
 * sound must never own a visual delay, or the two drift.
 *
 * Offsets are seconds from the moment the confirmed move reaches the client.
 */

export type SpiritCueName =
  | 'spawn'
  | 'attack'
  | 'strike'
  | 'impact'
  | 'materialize'
  | 'return'
  | 'clear'

export interface SpiritCue {
  name: SpiritCueName
  at: number
}

/**
 * How much of the sequence a player sees.
 *
 * `full` is the designed experience. `quick` exists because a 15x15 match runs
 * 40-80 moves: at the full length that is up to 45 seconds of animation per
 * match, and a player who has seen the dragon sixty times wants their turn
 * back. `off` restores the pre-spirit behaviour exactly — the piece appears the
 * instant the server confirms it.
 */
export type SpiritMotionProfile = 'full' | 'quick' | 'off'

/**
 * Total sequence length is 560ms, inside the 400-800ms gameplay budget. The
 * piece lands at 400ms; everything after it is the spirit leaving, which the
 * player can already play through.
 */
const FULL_CUES: readonly SpiritCue[] = [
  { name: 'spawn', at: 0 },
  { name: 'attack', at: 0.12 },
  { name: 'strike', at: 0.26 },
  { name: 'impact', at: 0.36 },
  { name: 'materialize', at: 0.4 },
  { name: 'return', at: 0.46 },
  { name: 'clear', at: 0.56 },
]

/** The same beats at roughly 45% length, so the sequence still reads as a strike. */
const QUICK_CUES: readonly SpiritCue[] = [
  { name: 'spawn', at: 0 },
  { name: 'attack', at: 0.05 },
  { name: 'strike', at: 0.11 },
  { name: 'impact', at: 0.15 },
  { name: 'materialize', at: 0.17 },
  { name: 'return', at: 0.2 },
  { name: 'clear', at: 0.26 },
]

/** Every beat collapses onto frame zero: no stage, no withheld piece. */
const OFF_CUES: readonly SpiritCue[] = [
  { name: 'spawn', at: 0 },
  { name: 'attack', at: 0 },
  { name: 'strike', at: 0 },
  { name: 'impact', at: 0 },
  { name: 'materialize', at: 0 },
  { name: 'return', at: 0 },
  { name: 'clear', at: 0 },
]

const CUES_BY_PROFILE: Record<SpiritMotionProfile, readonly SpiritCue[]> = {
  full: FULL_CUES,
  quick: QUICK_CUES,
  off: OFF_CUES,
}

export function spiritCues(profile: SpiritMotionProfile): readonly SpiritCue[] {
  return CUES_BY_PROFILE[profile]
}

/** When the piece becomes visible. Placement audio is re-anchored to this. */
export function materializeOffset(profile: SpiritMotionProfile): number {
  return spiritCues(profile).find((cue) => cue.name === 'materialize')?.at ?? 0
}

/** Full sequence length, used to size the stage's CSS animations. */
export function sequenceDuration(profile: SpiritMotionProfile): number {
  return spiritCues(profile).at(-1)?.at ?? 0
}
