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
  const board: number[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(0))

  for (let c = 0; c < COLS; c++) {
    // 각 열에 (1,9),(2,8),(3,7),(4,6),(5,5) 한 쌍씩 → 10개
    const col = shuffle([1, 9, 2, 8, 3, 7, 4, 6, 5, 5])

    // 9와 1이 두 칸 간격 안에 없으면 1을 9에서 정확히 2행 거리로 이동
    const nineRow = col.indexOf(9)
    const oneRow = col.indexOf(1)
    if (Math.abs(nineRow - oneRow) !== 2) {
      const up = nineRow - 2
      const down = nineRow + 2
      const canUp = up >= 0
      const canDown = down < ROWS
      const targetRow =
        canUp && canDown ? (Math.random() < 0.5 ? up : down)
        : canUp ? up
        : down
      ;[col[oneRow], col[targetRow]] = [col[targetRow], col[oneRow]]
    }

    for (let r = 0; r < ROWS; r++) {
      board[r][c] = col[r]
    }
  }

  return board
}
