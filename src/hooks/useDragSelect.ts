import { useRef, useCallback, useEffect } from 'react'
import { SelectionRect, ROWS, COLS } from '../types/game'
import { useGameStore } from '../store/gameStore'

const OUTSIDE_MARGIN = 40

function clampCell(x: number, y: number, boardW: number, boardH: number, cols: number, rows: number) {
  const cellW = boardW / cols
  const cellH = boardH / rows
  return {
    row: Math.max(0, Math.min(rows - 1, Math.floor(y / cellH))),
    col: Math.max(0, Math.min(cols - 1, Math.floor(x / cellW))),
  }
}

interface CachedRect { left: number; top: number; w: number; h: number }

interface DragCallbacks {
  onDrag: (rect: SelectionRect) => void
  onCommit: (rect: SelectionRect) => void
  onCancel: () => void
}

export function useDragSelect(
  boardRef: React.RefObject<HTMLDivElement | null>,
  { onDrag, onCommit, onCancel }: DragCallbacks,
  getPhase?: () => string,
  gridCols = COLS,
  gridRows = ROWS,
) {
  const startCell = useRef<{ row: number; col: number } | null>(null)
  const isDragging = useRef(false)
  const currentRect = useRef<SelectionRect | null>(null)
  const rafId = useRef<number | null>(null)
  // Cached board bounding rect — refreshed on drag start and window resize
  const cachedRect = useRef<CachedRect | null>(null)

  const onDragRef = useRef(onDrag)
  const onCommitRef = useRef(onCommit)
  const onCancelRef = useRef(onCancel)
  useEffect(() => { onDragRef.current = onDrag }, [onDrag])
  useEffect(() => { onCommitRef.current = onCommit }, [onCommit])
  useEffect(() => { onCancelRef.current = onCancel }, [onCancel])

  const refreshCache = useCallback(() => {
    if (!boardRef.current) return
    const r = boardRef.current.getBoundingClientRect()
    cachedRect.current = { left: r.left, top: r.top, w: r.width, h: r.height }
  }, [boardRef])

  // Keep cache fresh on resize/scroll so coordinate mapping stays correct
  useEffect(() => {
    window.addEventListener('resize', refreshCache, { passive: true })
    window.addEventListener('scroll', refreshCache, { passive: true })
    return () => {
      window.removeEventListener('resize', refreshCache)
      window.removeEventListener('scroll', refreshCache)
    }
  }, [refreshCache])

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const phase = getPhase ? getPhase() : useGameStore.getState().gamePhase
      if (phase !== 'playing') return
      // Always refresh rect at drag start (handles layout shifts between drags)
      refreshCache()
      const cr = cachedRect.current
      if (!cr) return
      const x = e.clientX - cr.left
      const y = e.clientY - cr.top
      const inZone =
        x >= -OUTSIDE_MARGIN && x <= cr.w + OUTSIDE_MARGIN &&
        y >= -OUTSIDE_MARGIN && y <= cr.h + OUTSIDE_MARGIN
      if (!inZone) return
      e.preventDefault()
      const cell = clampCell(x, y, cr.w, cr.h, gridCols, gridRows)
      startCell.current = cell
      isDragging.current = true
      const rect: SelectionRect = { startRow: cell.row, startCol: cell.col, endRow: cell.row, endCol: cell.col }
      currentRect.current = rect
      onDragRef.current(rect)
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !startCell.current) return
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
      const cx = e.clientX
      const cy = e.clientY
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null
        if (!isDragging.current || !startCell.current || !cachedRect.current) return
        const cr = cachedRect.current
        const { row, col } = clampCell(cx - cr.left, cy - cr.top, cr.w, cr.h, gridCols, gridRows)
        const rect: SelectionRect = {
          startRow: startCell.current.row,
          startCol: startCell.current.col,
          endRow: row,
          endCol: col,
        }
        currentRect.current = rect
        onDragRef.current(rect)
      })
    }

    const onMouseUp = () => {
      if (!isDragging.current) return
      if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null }
      isDragging.current = false
      startCell.current = null
      const rect = currentRect.current
      currentRect.current = null
      const phase = getPhase ? getPhase() : useGameStore.getState().gamePhase
      if (rect && phase === 'playing') onCommitRef.current(rect)
      else onCancelRef.current()
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [refreshCache])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const phase = getPhase ? getPhase() : useGameStore.getState().gamePhase
    if (phase !== 'playing') return
    refreshCache()
    const cr = cachedRect.current
    if (!cr) return
    const touch = e.touches[0]
    const x = touch.clientX - cr.left
    const y = touch.clientY - cr.top
    if (x < 0 || x >= cr.w || y < 0 || y >= cr.h) return
    const cell = clampCell(x, y, cr.w, cr.h, gridCols, gridRows)
    startCell.current = cell
    isDragging.current = true
    const rect: SelectionRect = { startRow: cell.row, startCol: cell.col, endRow: cell.row, endCol: cell.col }
    currentRect.current = rect
    onDragRef.current(rect)
  }, [refreshCache, getPhase])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !startCell.current || !cachedRect.current) return
    e.preventDefault()
    if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    const cx = e.touches[0].clientX
    const cy = e.touches[0].clientY
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      if (!isDragging.current || !startCell.current || !cachedRect.current) return
      const cr = cachedRect.current
      const { row, col } = clampCell(cx - cr.left, cy - cr.top, cr.w, cr.h)
      const rect: SelectionRect = {
        startRow: startCell.current.row,
        startCol: startCell.current.col,
        endRow: row,
        endCol: col,
      }
      currentRect.current = rect
      onDragRef.current(rect)
    })
  }, [refreshCache])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return
    if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null }
    isDragging.current = false
    startCell.current = null
    const rect = currentRect.current
    currentRect.current = null
    const phase = getPhase ? getPhase() : useGameStore.getState().gamePhase
    if (rect && phase === 'playing') onCommitRef.current(rect)
    else onCancelRef.current()
  }, [getPhase])

  return { handleTouchStart, handleTouchMove, handleTouchEnd }
}
