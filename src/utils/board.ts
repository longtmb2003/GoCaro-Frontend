import {
  BOARD_SIZE,
  type CellValue,
  type WinDirection,
  type WinResult,
} from '@/types/game'

export interface BoardCoordinate {
  x: number
  y: number
}

interface WinningSegment {
  coordinates: BoardCoordinate[]
  direction: WinDirection
}

/** A fresh empty 15x15 board, indexed `[x][y]`. */
export function createEmptyBoard(): CellValue[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null))
}

/**
 * Returns the contiguous winning path through the final move. The server remains
 * authoritative for whether the match is won; this helper only visualizes a
 * confirmed five-in-a-row result.
 */
function findWinningSegment(
  board: CellValue[][],
  lastMove: BoardCoordinate | null,
): WinningSegment | null {
  if (lastMove === null) return null
  const symbol = board[lastMove.x]?.[lastMove.y]
  if (symbol === null || symbol === undefined) return null

  const directions: ReadonlyArray<readonly [number, number, WinDirection]> = [
    [1, 0, 'horizontal'],
    [0, 1, 'vertical'],
    [1, 1, 'diagonal-down'],
    [1, -1, 'diagonal-up'],
  ]

  for (const [dx, dy, directionName] of directions) {
    const line: BoardCoordinate[] = [{ ...lastMove }]
    for (const direction of [-1, 1] as const) {
      let x = lastMove.x + dx * direction
      let y = lastMove.y + dy * direction
      const side: BoardCoordinate[] = []
      while (board[x]?.[y] === symbol) {
        side.push({ x, y })
        x += dx * direction
        y += dy * direction
      }
      if (direction === -1) line.unshift(...side.reverse())
      else line.push(...side)
    }
    if (line.length >= 5) {
      const lastMoveIndex = line.findIndex(
        (coordinate) => coordinate.x === lastMove.x && coordinate.y === lastMove.y,
      )
      const start = Math.min(Math.max(lastMoveIndex - 2, 0), line.length - 5)
      return {
        coordinates: line.slice(start, start + 5),
        direction: directionName,
      }
    }
  }

  return null
}

export function findWinningLine(
  board: CellValue[][],
  lastMove: BoardCoordinate | null,
): BoardCoordinate[] {
  return findWinningSegment(board, lastMove)?.coordinates ?? []
}

/**
 * Derives visual coordinates from the already-confirmed final server state.
 * This never declares a winner and always returns one deterministic five-cell
 * segment containing the final move, even when a longer contiguous line exists.
 */
export function deriveWinResult(
  board: CellValue[][],
  lastMove: BoardCoordinate | null,
  winnerId: string,
): WinResult | null {
  const segment = findWinningSegment(board, lastMove)
  if (segment === null) return null
  return {
    winnerId,
    winningCells: segment.coordinates.map((coordinate) => ({
      row: coordinate.y,
      col: coordinate.x,
    })),
    direction: segment.direction,
  }
}
