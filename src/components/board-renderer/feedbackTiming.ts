export type MoveCueName = 'intersection' | 'rune' | 'energy' | 'summon' | 'settle'

export interface MoveCue {
  name: MoveCueName
  at: number
}

/** One source of truth shared by the 2D board animation and game audio. */
export const MOVE_CUES: readonly MoveCue[] = [
  { name: 'intersection', at: 0 },
  { name: 'rune', at: 0.03 },
  { name: 'energy', at: 0.07 },
  { name: 'summon', at: 0.1 },
  { name: 'settle', at: 0.26 },
]

export type VictoryCueName = 'impact' | 'beam' | 'rune' | 'resolve' | 'banner'

export interface VictoryCue {
  name: VictoryCueName
  at: number
}

export const VICTORY_CUES: readonly VictoryCue[] = [
  { name: 'impact', at: 0 },
  { name: 'rune', at: 0.1 },
  { name: 'beam', at: 0.42 },
  { name: 'resolve', at: 0.84 },
  { name: 'banner', at: 0.95 },
]
