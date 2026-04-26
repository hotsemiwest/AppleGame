import { Board, ROWS, COLS } from '../types/game'

export function generateBoard(): Board {
  while (true) {
    const board: Board = []
    let sum = 0

    for (let r = 0; r < ROWS; r++) {
      board[r] = []
      for (let c = 0; c < COLS; c++) {
        const v = Math.floor(Math.random() * 9) + 1
        board[r][c] = v
        sum += v
      }
    }

    if (sum % 10 === 0) return board
  }
}
