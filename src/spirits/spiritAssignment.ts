import type { PlayerSymbol } from '@/types/game'
import { listSpirits, resolveSpirit } from './spiritRegistry'
import type { ResolvedSpirit } from './spiritTypes'

/**
 * Decides which spirit each player fields for a match.
 *
 * If a player has a spirit equipped (sent by the backend), it is used.
 * If not, the spirit is derived from the room id deterministically.
 * If both players happen to equip the same spirit, they are allowed to collide
 * (distinguished by their seat and piece color). But if an equipped spirit collides
 * with the procedural fallback of the opponent, the opponent's procedural fallback
 * is shifted to avoid unnecessary collision.
 */
export interface MatchSpirits {
  /** Spirit for symbol 1 (X). */
  x: ResolvedSpirit
  /** Spirit for symbol 2 (O). */
  o: ResolvedSpirit
}

function seedFrom(roomId: string | null): number {
  if (roomId === null) return 0
  let hash = 0
  for (let index = 0; index < roomId.length; index += 1) {
    hash = (hash * 31 + roomId.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

export function assignMatchSpirits(
  xEquipped: string,
  oEquipped: string,
  roomId: string | null,
): MatchSpirits {
  const roster = listSpirits()
  const seed = seedFrom(roomId)
  const xDefaultIndex = seed % roster.length
  const oDefaultIndex = (xDefaultIndex + 1) % roster.length

  let xId = xEquipped || roster[xDefaultIndex]?.id || ''
  let oId = oEquipped || roster[oDefaultIndex]?.id || ''

  const xWithArt = !!xEquipped
  const oWithArt = !!oEquipped

  if (xEquipped && !oEquipped && xEquipped === oId) {
    oId = roster[(oDefaultIndex + 1) % roster.length]?.id || ''
  } else if (oEquipped && !xEquipped && oEquipped === xId) {
    xId = roster[(xDefaultIndex + 1) % roster.length]?.id || ''
  }

  return {
    x: resolveSpirit(xId, null, { withArt: xWithArt }),
    o: resolveSpirit(oId, null, { withArt: oWithArt }),
  }
}

export function spiritForSymbol(spirits: MatchSpirits, symbol: PlayerSymbol): ResolvedSpirit {
  return symbol === 1 ? spirits.x : spirits.o
}
