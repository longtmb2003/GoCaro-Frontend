import type { ScheduledTone } from '@/composables/useMatchAudio'

/**
 * Schema for the Spirit Companion system.
 *
 * A spirit is the player's identity during a match: it is summoned beside the
 * board, performs a signature attack on the chosen cell, and leaves. Everything
 * a spirit *is* lives in this file's types and in `definitions/`; nothing a
 * spirit is aware of leaks into gameplay. Adding a spirit means adding one
 * definition file and one registry entry — no renderer, store or page change.
 *
 * The one deliberate exception is the motion/sigil vocabularies below. They are
 * string unions rather than free text so a definition cannot name a spawn style
 * the stage has no animation for. Extending the *vocabulary* (a genuinely new
 * kind of movement) means adding a union member and its CSS class in
 * `SpiritStage.css`; that is framework work, not gameplay work, and existing
 * spirits are untouched by it.
 */

/** The natural anchor side (direction the art faces). Flipped dynamically if seated opposite. */
export type SpiritAnchor = 'left' | 'right'

/** How the spirit arrives beside the board. */
export type SpiritSpawnStyle = 'fly-in' | 'dash' | 'teleport' | 'leap' | 'feather-burst'

/** The signature wind-up the spirit performs before its attack leaves it. */
export type SpiritAttackStyle = 'fire-breath' | 'claw' | 'dive' | 'rune-cast' | 'ground-smash'

/** The projectile that carries the attack from the spirit to the cell. */
export type SpiritStrikeStyle = 'beam' | 'bolt' | 'slash' | 'orb'

/** The burst left where the attack lands, immediately before the piece appears. */
export type SpiritImpactStyle = 'ember' | 'dust' | 'flame' | 'rune' | 'quake'

/** How the spirit leaves once the piece has materialized. */
export type SpiritReturnStyle = 'fade' | 'dissolve' | 'blink'

/** Silhouette used by the procedural renderer when a spirit has no art yet. */
export type SpiritSigilShape = 'drake' | 'wolf' | 'phoenix' | 'fox' | 'tiger' | 'rune'

export interface SpiritMotionSignature {
  spawn: SpiritSpawnStyle
  attack: SpiritAttackStyle
  strike: SpiritStrikeStyle
  impact: SpiritImpactStyle
  return: SpiritReturnStyle
}

/**
 * Artwork slot. `source` is the path to the webp image.
 * If null, the stage falls back to the procedural sigil renderer.
 */
export interface SpiritModel {
  source: string | null
  /** Horizontal frame count for a sprite sheet. 1 renders as a still image. */
  frames: number
  /** Width / height of a single frame, used to reserve space before load. */
  aspectRatio: number
}

/**
 * Visual identity. Colors are token *names*, never literal values: the stage
 * resolves them with `var()` so a spirit can never introduce a color outside
 * `main.css`. The player's own cyan/magenta stays dominant — a spirit accents
 * it rather than replacing it, so symbol ownership is still readable at a
 * glance during the animation.
 */
export interface SpiritVfx {
  accentToken: string
  trailToken: string
  /** Particles emitted at impact. Kept low; this runs on every single move. */
  particleCount: number
  /** Spread of the impact particles, in degrees. */
  particleSpread: number
}

/**
 * Procedurally scheduled audio layers, one array per audible phase. These reuse
 * the match audio engine's tone scheduler, so a spirit needs no audio files to
 * sound distinct. `voice` below is where recorded audio arrives later.
 */
export interface SpiritSfx {
  spawn: ScheduledTone[]
  attack: ScheduledTone[]
  impact: ScheduledTone[]
}

/** Recorded voice lines. Null for every shipped spirit; a skin may add them. */
export interface SpiritVoice {
  spawn: string | null
  victory: string | null
  defeat: string | null
}

/** The controlled motion vocabulary used when a match result is revealed. */
export type SpiritVictoryStyle =
  | 'radiant-rise'
  | 'power-surge'
  | 'swift-pounce'
  | 'rune-bloom'
  | 'tidal-crown'

export type SpiritDefeatStyle =
  | 'ember-fade'
  | 'guarded-retreat'
  | 'mist-dissolve'
  | 'shadow-lower'

export interface SpiritResultPresentation {
  victory: SpiritVictoryStyle
  defeat: SpiritDefeatStyle
  victoryLine: { en: string; vi: string }
  defeatLine: { en: string; vi: string }
}

export interface SpiritDefinition {
  id: string
  name: { en: string; vi: string }
  /** One line of character, shown in the spirit picker and used in copy. */
  personality: { en: string; vi: string }
  anchor: SpiritAnchor
  sigil: SpiritSigilShape
  model: SpiritModel
  motion: SpiritMotionSignature
  vfx: SpiritVfx
  sfx: SpiritSfx
  voice: SpiritVoice | null
  /** Cosmetic result pose and copy. It never changes match state or timing. */
  result: SpiritResultPresentation
}

/**
 * A purchasable presentation layer over an existing spirit.
 *
 * A skin may change what the spirit looks like, how it sparkles and what it
 * sounds like. It may not change `motion` or timing — those are the spirit's
 * behavior, and keeping them out of `overrides` is what guarantees a paid skin
 * can never alter how long a turn takes or how the board reads. That property
 * is enforced by this type, not by convention.
 */
export interface SpiritSkin {
  id: string
  spiritId: string
  name: { en: string; vi: string }
  overrides: Partial<Pick<SpiritDefinition, 'name' | 'sigil' | 'model' | 'vfx' | 'sfx' | 'voice'>>
}

/** A spirit with any owned skin already applied. What the stage renders. */
export type ResolvedSpirit = SpiritDefinition & { skinId: string | null }
