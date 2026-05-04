import { Board, ROWS, COLS } from '../types/game'
import { getDifficultyRange, calculateBoardDifficulty } from '../config/difficultyConfig'

export function sumBoard(board: Board): number {
  let total = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell !== null) total += cell
    }
  }
  return total
}

export function getBoardDifficulty(board: Board): number {
  const sum = sumBoard(board)
  return calculateBoardDifficulty(sum)
}

export function getBoardDifficultyRange(difficulty: number): string {
  return getDifficultyRange(difficulty).label
}

function getTargetSumRange(difficulty: number): [number, number] {
  const range = getDifficultyRange(difficulty)
  return [range.min, range.max]
}

export function generateBoardForDifficulty(targetDifficulty: number): Board {
  if (targetDifficulty === -1) return generateBoard()

  const [minSum, maxSum] = getTargetSumRange(targetDifficulty)
  const MAX_ATTEMPTS = 2000

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const board = generateBoard()
    const sum = sumBoard(board)
    if (sum >= minSum && sum <= maxSum) return board
  }
  return generateBoard()
}

export function generateBoardWithSize(rows: number, cols: number): Board {
  while (true) {
    const board: Board = []
    let sum = 0

    for (let r = 0; r < rows; r++) {
      board[r] = []
      for (let c = 0; c < cols; c++) {
        const v = Math.floor(Math.random() * 9) + 1
        board[r][c] = v
        sum += v
      }
    }

    if (sum % 10 === 0) return board
  }
}

export function generateBoard(): Board {
  return generateBoardWithSize(ROWS, COLS)
}
