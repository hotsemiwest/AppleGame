import { Board, ROWS, COLS } from '../types/game'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateBoard(): Board {
  // 85 pairs summing to 10: 17 pairs each of (1,9),(2,8),(3,7),(4,6),(5,5)
  const tiles: number[] = []
  const pairs: [number, number][] = [[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]]
  for (const [a, b] of pairs) {
    for (let i = 0; i < 17; i++) {
      tiles.push(a, b)
    }
  }

  const shuffled = shuffle(tiles)
  const board: Board = []
  for (let r = 0; r < ROWS; r++) {
    board.push(shuffled.slice(r * COLS, r * COLS + COLS))
  }
  return board
}
