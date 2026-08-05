import type { MatchFoundPayload, MatchmakingMode } from '@/types/game'

const MATCH_RECOVERY_KEY = 'gocaro.active-match'

export interface MatchRecoverySnapshot {
  match: MatchFoundPayload
  mode: MatchmakingMode
  playerId: string
}

export function saveMatchRecovery(snapshot: MatchRecoverySnapshot): void {
  const encoded = JSON.stringify(snapshot)
  try {
    localStorage.setItem(MATCH_RECOVERY_KEY, encoded)
    sessionStorage.removeItem(MATCH_RECOVERY_KEY)
    return
  } catch {
    // Fall back to tab-scoped storage in privacy-restricted browser contexts.
  }
  try {
    sessionStorage.setItem(MATCH_RECOVERY_KEY, encoded)
  } catch {
    // The live socket still works; only reload/reopen recovery is unavailable.
  }
}

export function loadMatchRecovery(playerId?: string): MatchRecoverySnapshot | null {
  let stored: string | null = null
  let fromLegacyStorage = false
  try {
    stored = localStorage.getItem(MATCH_RECOVERY_KEY)
  } catch {
    // Try the tab-scoped fallback below.
  }
  if (stored === null) {
    try {
      stored = sessionStorage.getItem(MATCH_RECOVERY_KEY)
      fromLegacyStorage = stored !== null
    } catch {
      return null
    }
  }
  if (stored === null) return null

  let snapshot: unknown
  try {
    snapshot = JSON.parse(stored)
  } catch {
    clearMatchRecovery()
    return null
  }
  if (!isMatchRecoverySnapshot(snapshot)) {
    clearMatchRecovery()
    return null
  }
  if (playerId !== undefined && snapshot.playerId !== playerId) {
    clearMatchRecovery()
    return null
  }
  // Migrate snapshots written by the previous sessionStorage implementation.
  if (fromLegacyStorage) saveMatchRecovery(snapshot)
  return snapshot
}

export function hasMatchRecovery(playerId?: string): boolean {
  return loadMatchRecovery(playerId) !== null
}

export function clearMatchRecovery(): void {
  try {
    localStorage.removeItem(MATCH_RECOVERY_KEY)
  } catch {
    // Continue clearing the tab-scoped fallback below.
  }
  try {
    sessionStorage.removeItem(MATCH_RECOVERY_KEY)
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

function isMatchRecoverySnapshot(value: unknown): value is MatchRecoverySnapshot {
  if (typeof value !== 'object' || value === null) return false

  const snapshot = value as Record<string, unknown>
  if (snapshot.mode !== 'casual' && snapshot.mode !== 'ranked') return false
  if (typeof snapshot.playerId !== 'string') return false
  if (typeof snapshot.match !== 'object' || snapshot.match === null) return false

  const match = snapshot.match as Record<string, unknown>
  return (
    typeof match.room_id === 'string' &&
    (match.opponent_id === undefined || typeof match.opponent_id === 'string') &&
    typeof match.opponent === 'string' &&
    (match.your_symbol === 1 || match.your_symbol === 2) &&
    typeof match.your_turn === 'boolean' &&
    typeof match.turn_seconds === 'number' &&
    Number.isFinite(match.turn_seconds) &&
    match.turn_seconds > 0
  )
}
