import { useRef, useCallback, useState, useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { useThemeStore } from '../store/themeStore'
import { BOARD_BG, C } from '../theme/tokens'
import { useDragSelect } from '../hooks/useDragSelect'
import { normalizeRect, sumRect, countSolutions } from '../utils/gameLogic'
import { Tile } from './Tile'
import { SelectionBox, SelectionBoxHandle } from './SelectionBox'
import { ParticleLayer } from './ParticleLayer'
import { COLS, SelectionRect, Board } from '../types/game'

const TILE_SIZE = 52
const GAP = 2
const CELL = TILE_SIZE + GAP
const BOARD_WIDTH = COLS * CELL - GAP
const BOARD_HEIGHT = 10 * CELL - GAP

export function GameBoard() {
  const boardRef = useRef<HTMLDivElement>(null)
  const selBoxRef = useRef<SelectionBoxHandle>(null)
  const board = useGameStore(state => state.board)
  const gamePhase = useGameStore(s => s.gamePhase)
  const theme = useThemeStore(s => s.theme)
  const showDragSelectionSum = useThemeStore(s => s.showDragSelectionSum)
  const showDragSelectionRangeColor = useThemeStore(s => s.showDragSelectionRangeColor)
  const devMode = useThemeStore(s => s.devMode)
  const hideTiles = gamePhase === 'countdown'

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
    <div className="relative" style={{ width: BOARD_WIDTH }}>
      {devMode && gamePhase === 'playing' && <DevPanel board={board} />}
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
        {!hideTiles && board.map((row, r) =>
          row.map((cell, c) => (
            <Tile key={`${r}-${c}`} value={cell} />
          ))
        )}

        <SelectionBox
          ref={selBoxRef}
          showSum={showDragSelectionSum}
          showRangeColor={showDragSelectionRangeColor}
        />
        <ParticleLayer />
      </div>
    </div>
  )
}

function DevPanel({ board }: { board: Board }) {
  const [copied, setCopied] = useState(false)

  const validCombos = useMemo(() => countSolutions(board), [board])

  const handleExport = useCallback(async () => {
    const numeric = board.map(row => row.map(cell => cell ?? 0))
    const json = JSON.stringify(numeric)
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback for environments without clipboard API
      const ta = document.createElement('textarea')
      ta.value = json
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [board])

  return (
    <div
      className="absolute flex items-center gap-2 text-xs font-semibold"
      style={{
        top: -36,
        right: 0,
        color: C.textSub,
      }}
    >
      <span
        className="rounded-md px-2 py-1"
        style={{
          background: C.surfaceRaised,
          border: `1px solid ${C.borderFaint}`,
          fontVariantNumeric: 'tabular-nums',
        }}
        title="현재 보드의 합이 10인 사각형 개수 (countSolutions)"
      >
        🔢 유효 조합 {validCombos}
      </span>
      <button
        onClick={handleExport}
        className="rounded-md px-2.5 py-1 transition-all active:scale-95"
        style={{
          background: C.surfaceRaised,
          border: `1px solid ${C.borderFaint}`,
          color: C.textPrimary,
        }}
      >
        {copied ? '✅ 복사됨!' : '📋 보드 내보내기 (JSON)'}
      </button>
    </div>
  )
}
