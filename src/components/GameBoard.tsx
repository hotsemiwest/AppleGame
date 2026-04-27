import { useRef, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { useThemeStore } from '../store/themeStore'
import { BOARD_BG } from '../theme/tokens'
import { useDragSelect } from '../hooks/useDragSelect'
import { normalizeRect, sumRect } from '../utils/gameLogic'
import { Tile } from './Tile'
import { SelectionBox, SelectionBoxHandle } from './SelectionBox'
import { ParticleLayer } from './ParticleLayer'
import { COLS, SelectionRect } from '../types/game'

const TILE_SIZE = 52
const GAP = 2
const CELL = TILE_SIZE + GAP
const BOARD_WIDTH = COLS * CELL - GAP
const BOARD_HEIGHT = 10 * CELL - GAP

export function GameBoard() {
  const boardRef = useRef<HTMLDivElement>(null)
  const selBoxRef = useRef<SelectionBoxHandle>(null)
  const board = useGameStore(state => state.board)
  const theme = useThemeStore(s => s.theme)

  // All three callbacks are stable (no deps) — they read latest state via getState()
  const handleDrag = useCallback((rect: SelectionRect) => {
    const currentBoard = useGameStore.getState().board
    selBoxRef.current?.show(normalizeRect(rect), sumRect(currentBoard, rect))
  }, [])

  const handleCommit = useCallback((rect: SelectionRect) => {
    selBoxRef.current?.hide()
    useGameStore.getState().confirmSelection(rect)
  }, [])

  const handleCancel = useCallback(() => {
    selBoxRef.current?.hide()
  }, [])

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useDragSelect(boardRef, {
    onDrag: handleDrag,
    onCommit: handleCommit,
    onCancel: handleCancel,
  })

  return (
    <div
      ref={boardRef}
      className="relative select-none"
      style={{
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, ${TILE_SIZE}px)`,
        gridTemplateRows: `repeat(10, ${TILE_SIZE}px)`,
        gap: GAP,
        cursor: 'crosshair',
        touchAction: 'none',
        background: BOARD_BG[theme].background,
        borderRadius: 16,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {board.map((row, r) =>
        row.map((cell, c) => (
          <Tile key={`${r}-${c}`} value={cell} />
        ))
      )}

      <SelectionBox ref={selBoxRef} />
      <ParticleLayer />
    </div>
  )
}
