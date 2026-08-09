import { dragonSpirit } from './definitions/dragon'
import { wolfSpirit } from './definitions/wolf'
import { foxSpirit } from './definitions/fox'
import { eagleSpirit } from './definitions/eagle'
import { tigerSpirit } from './definitions/tiger'
import { serpentSpirit } from './definitions/serpent'
import { silverWolfSpirit } from './definitions/silver_wolf'
import { fenrirSpirit } from './definitions/fenrir'
import { leviathanSpirit } from './definitions/leviathan'
import { whiteTigerAscendedSpirit } from './definitions/white_tiger_ascended'
import type { ResolvedSpirit, SpiritDefinition, SpiritSkin } from './spiritTypes'

/**
 * The roster. Adding a spirit is one import and one array entry — the stage,
 * the sequence and the board all read the roster through `resolveSpirit`, so
 * nothing downstream needs to learn the new id.
 */
const SPIRIT_DEFINITIONS: readonly SpiritDefinition[] = [
  dragonSpirit,
  wolfSpirit,
  foxSpirit,
  eagleSpirit,
  tigerSpirit,
  serpentSpirit,
  silverWolfSpirit,
  fenrirSpirit,
  leviathanSpirit,
  whiteTigerAscendedSpirit,
]

/**
 * Purchasable skins. Empty at launch; the resolution path below is already
 * live, so shipping the first skin is a data change plus an ownership check in
 * whatever grants `skinId` — never a change to the animation code.
 */
const SPIRIT_SKINS: readonly SpiritSkin[] = []

const definitionsById = new Map(SPIRIT_DEFINITIONS.map((spirit) => [spirit.id, spirit]))
const skinsById = new Map(SPIRIT_SKINS.map((skin) => [skin.id, skin]))

/** Every spirit, in roster order. Used by pickers and by deterministic assignment. */
export function listSpirits(): readonly SpiritDefinition[] {
  return SPIRIT_DEFINITIONS
}

export function listSkinsForSpirit(spiritId: string): readonly SpiritSkin[] {
  return SPIRIT_SKINS.filter((skin) => skin.spiritId === spiritId)
}

/** The spirit used whenever an id is unknown, so a bad id can never blank the stage. */
export const DEFAULT_SPIRIT_ID = dragonSpirit.id

/**
 * Resolves a spirit id, plus an optional owned skin, into the single object the
 * stage renders.
 *
 * A skin may only override presentation — `overrides` is typed to exclude
 * `motion` and `anchor`, so a purchase can never change how long a turn takes
 * or where the spirit stands. That is the property that keeps monetization from
 * touching competitive balance, and it is enforced by the type rather than by
 * reviewer discipline.
 */
export function resolveSpirit(
  spiritId: string,
  skinId: string | null = null,
  options: { withArt: boolean } = { withArt: true },
): ResolvedSpirit {
  const definition = definitionsById.get(spiritId) ?? dragonSpirit
  const isUnknownId = !definitionsById.has(spiritId)
  const skin = skinId === null ? undefined : skinsById.get(skinId)
  let resolved: ResolvedSpirit
  if (skin === undefined || skin.spiritId !== definition.id) {
    resolved = { ...definition, skinId: null }
  } else {
    resolved = { ...definition, ...skin.overrides, skinId: skin.id }
  }

  if (!options.withArt || isUnknownId) {
    resolved = { ...resolved, model: { ...resolved.model, source: null } }
  }
  return resolved
}
