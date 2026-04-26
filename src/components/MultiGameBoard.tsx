import { useRef, useCallback, useEffect } from 'react'
import { useMultiStore } from '../store/multiStore'
import { registerOpponentDragCallback } from '../store/multiStore'
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

export function MultiGameBoard() {
  const boardRef = useRef<HTMLDivElement>(null)
  const selBoxRef = useRef<SelectionBoxHandle>(null)
  const opBoxRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number | null>(null)

  const board = useMultiStore(s => s.board)
  const opponentName = useMultiStore(s => s.opponentName)

  // 상대방 드래그 박스를 DOM 직접 조작 — Zustand state 업데이트 없이 처리
  useEffect(() => {
    registerOpponentDragCallback((rect) => {
      const el = opBoxRef.current
      if (!el) return
      if (!rect) {
        el.style.display = 'none'
        return
      }
      const norm = normalizeRect(rect)
      const x = norm.minCol * CELL
      const y = norm.minRow * CELL
      const w = (norm.maxCol - norm.minCol + 1) * CELL - GAP
      const h = (norm.maxRow - norm.minRow + 1) * CELL - GAP
      el.style.display = 'block'
      el.style.transform = `translate(${x}px, ${y}px)`
      el.style.width = `${w}px`
      el.style.height = `${h}px`
    })
    return () => registerOpponentDragCallback(null)
  }, [])

  const lastRectRef = useRef<SelectionRect | null>(null)

  const handleDrag = useCallback((rect: SelectionRect) => {
    lastRectRef.current = rect
    const currentBoard = useMultiStore.getState().board
    if (!currentBoard) return
    selBoxRef.current?.show(normalizeRect(rect), sumRect(currentBoard, rect))

    if (rafId.current !== null) return
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      useMultiStore.getState().broadcastDrag(rect)
    })
  }, [])

  const handleCommit = useCallback((rect: SelectionRect) => {
    lastRectRef.current = null
    selBoxRef.current?.hide()
    if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null }
    useMultiStore.getState().broadcastDrag(null)
    useMultiStore.getState().confirmSelection(rect)
  }, [])

  const handleCancel = useCallback(() => {
    lastRectRef.current = null
    selBoxRef.current?.hide()
    if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null }
    useMultiStore.getState().broadcastDrag(null)
  }, [])

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useDragSelect(
    boardRef,
    { onDrag: handleDrag, onCommit: handleCommit, onCancel: handleCancel },
    () => useMultiStore.getState().phase,
  )

  // 드래그 중 보드가 바뀌면(상대 브로드캐스트 머지) 선택 박스 sum을 즉시 재계산
  useEffect(() => {
    return useMultiStore.subscribe((state, prev) => {
      if (state.board === prev.board) return
      const rect = lastRectRef.current
      if (!rect || !state.board) return
      selBoxRef.current?.show(normalizeRect(rect), sumRect(state.board, rect))
    })
  }, [])

  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [])

  if (!board) return null

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

      {/* 내 선택 박스 */}
      <SelectionBox ref={selBoxRef} />

      {/* 파티클 이펙트 */}
      <ParticleLayer />

      {/* 상대방 드래그 박스 (오렌지) — imperative DOM 업데이트, 리렌더링 없음 */}
      <div
        ref={opBoxRef}
        style={{
          display: 'none',
          position: 'absolute',
          left: 0,
          top: 0,
          border: '2.5px solid #f97316',
          background: 'rgba(249,115,22,0.10)',
          borderRadius: 12,
          pointerEvents: 'none',
          zIndex: 9,
          boxSizing: 'border-box',
          willChange: 'transform',
        }}
      >
        {opponentName && (
          <span style={{
            position: 'absolute',
            top: -22,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#f97316',
            color: 'white',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 9999,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {opponentName}
          </span>
        )}
      </div>
    </div>
  )
}
