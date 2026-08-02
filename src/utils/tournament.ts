import type { BracketSlot, TournamentStatus } from '@/types/tournament'

/** One round of a bracket, in slot order. */
export interface BracketRound {
  round: number
  label: string
  slots: BracketSlot[]
}

/**
 * Names a round from where it sits in the bracket rather than from its number,
 * so the last round reads "Final" whether the field held 4 players or 16.
 */
export function roundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round
  if (fromEnd === 0) return 'Final'
  if (fromEnd === 1) return 'Semi-finals'
  if (fromEnd === 2) return 'Quarter-finals'
  return `Round ${String(round)}`
}

/**
 * Groups a flat bracket into rounds, ascending. The backend serves slots
 * ordered by round then slot, but grouping does not rely on that.
 */
export function groupByRound(slots: BracketSlot[]): BracketRound[] {
  const byRound = new Map<number, BracketSlot[]>()
  for (const slot of slots) {
    const existing = byRound.get(slot.round)
    if (existing === undefined) {
      byRound.set(slot.round, [slot])
    } else {
      existing.push(slot)
    }
  }

  const rounds = [...byRound.keys()].sort((a, b) => a - b)
  const totalRounds = rounds.length

  return rounds.map((round, index) => ({
    round,
    label: roundLabel(index + 1, totalRounds),
    slots: (byRound.get(round) ?? []).slice().sort((a, b) => a.slot - b.slot),
  }))
}

/** How a tournament status is shown. */
export interface StatusPresentation {
  label: string
  variant: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
}

/**
 * `ready` is deliberately labelled "Full", not "Ready": from a player's side the
 * meaningful fact is that registration has closed.
 */
const STATUS_PRESENTATION: Record<TournamentStatus, StatusPresentation> = {
  registration: { label: 'Open', variant: 'primary' },
  ready: { label: 'Full', variant: 'warning' },
  running: { label: 'Live', variant: 'success' },
  finished: { label: 'Finished', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
}

export function statusPresentation(status: TournamentStatus): StatusPresentation {
  return STATUS_PRESENTATION[status]
}
