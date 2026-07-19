import { BOARD_SIZE, type CellValue } from '@/types/game'

/** A fresh empty 15x15 board, indexed `[x][y]`. */
export function createEmptyBoard(): CellValue[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null))
}
