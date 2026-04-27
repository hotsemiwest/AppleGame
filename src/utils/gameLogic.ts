import { Board, SelectionRect, NormalizedRect, CellRef, TARGET_SUM } from '../types/game'

export function normalizeRect(rect: SelectionRect): NormalizedRect {
  return {
    minRow: Math.min(rect.startRow, rect.endRow),
    maxRow: Math.max(rect.startRow, rect.endRow),
    minCol: Math.min(rect.startCol, rect.endCol),
    maxCol: Math.max(rect.startCol, rect.endCol),
  }
}

export function getCellsInRect(board: Board, rect: SelectionRect): CellRef[] {
  const { minRow, maxRow, minCol, maxCol } = normalizeRect(rect)
  const cells: CellRef[] = []
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const value = board[r]?.[c]
      if (value !== null && value !== undefined) {
        cells.push({ row: r, col: c, value })
      }
    }
  }
  return cells
}

export function sumRect(board: Board, rect: SelectionRect): number {
  const { minRow, maxRow, minCol, maxCol } = normalizeRect(rect)
  let total = 0
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      total += board[r]?.[c] ?? 0
    }
  }
  return total
}

export function isValidSelection(board: Board, rect: SelectionRect): boolean {
  return sumRect(board, rect) === TARGET_SUM
}

export function hasAnySolution(board: Board): boolean {
  const R = board.length, C = board[0]?.length ?? 0
  for (let r1 = 0; r1 < R; r1++)
    for (let c1 = 0; c1 < C; c1++)
      for (let r2 = r1; r2 < R; r2++)
        for (let c2 = c1; c2 < C; c2++)
          if (sumRect(board, { startRow: r1, startCol: c1, endRow: r2, endCol: c2 }) === TARGET_SUM)
            return true
  return false
}

export function countSolutions(board: Board): number {
  const R = board.length, C = board[0]?.length ?? 0
  let count = 0
  for (let r1 = 0; r1 < R; r1++)
    for (let c1 = 0; c1 < C; c1++)
      for (let r2 = r1; r2 < R; r2++)
        for (let c2 = c1; c2 < C; c2++)
          if (sumRect(board, { startRow: r1, startCol: c1, endRow: r2, endCol: c2 }) === TARGET_SUM)
            count++
  return count
}

export function clearRect(board: Board, rect: SelectionRect): { newBoard: Board; cleared: CellRef[] } {
  const cells = getCellsInRect(board, rect)
  const newBoard = board.map(row => [...row])
  for (const { row, col } of cells) {
    newBoard[row][col] = null
  }
  return { newBoard, cleared: cells }
}
