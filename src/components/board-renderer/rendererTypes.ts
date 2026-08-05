import type { CellValue, PlayerSymbol } from '@/types/game'
import type { MoveCueName, VictoryCueName } from './feedbackTiming'

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
}

export interface BoardRendererEmits {
  move: [x: number, y: number]
  'cell-hover': [cell: RendererCell | null]
  'cell-click': [cell: RendererCell]
  'move-cue': [cue: MoveCueName, symbol: PlayerSymbol, cell: RendererCell]
  'victory-cue': [cue: VictoryCueName]
}
