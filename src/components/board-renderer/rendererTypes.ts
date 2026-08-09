import type { CellValue, PlayerSymbol } from '@/types/game'
import type { MoveCueName, VictoryCueName } from './feedbackTiming'
import type { SpiritCueName } from './spiritTiming'
import type { MatchSpirits } from '@/spirits/spiritAssignment'

export interface BoardPoint {
  x: number
  y: number
}

export interface RendererCell {
  row: number
  col: number
}

export interface BoardRendererProps {
  board: CellValue[][]
  size?: number
  interactive: boolean
  lastMove?: BoardPoint | null
  winningLine?: BoardPoint[]
  yourSymbol?: PlayerSymbol | null
  /**
   * Which companion each player fields. Null falls back to no spirits and the
   * original instant placement, so the board stays renderable in contexts that
   * have no match identity — the replay page, for one.
   */
  spirits?: MatchSpirits | null
}

export interface BoardRendererEmits {
  move: [x: number, y: number]
  'cell-hover': [cell: RendererCell | null]
  'cell-click': [cell: RendererCell]
  'move-cue': [cue: MoveCueName, symbol: PlayerSymbol, cell: RendererCell]
  'victory-cue': [cue: VictoryCueName]
  'spirit-cue': [cue: SpiritCueName, symbol: PlayerSymbol, spiritId: string]
}
