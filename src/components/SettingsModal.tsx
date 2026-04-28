import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useThemeStore } from '../store/themeStore'
import { TILE_COLORS, BOARD_BG, C } from '../theme/tokens'
import { Tile } from './Tile'
import { SegmentedControl } from './SegmentedControl'
import { SelectionBox, SelectionBoxHandle } from './SelectionBox'
import { useDragSelect } from '../hooks/useDragSelect'
import { normalizeRect, sumRect, isValidSelection, clearRect } from '../utils/gameLogic'
import { Board, SelectionRect } from '../types/game'

const PREVIEW_COLS = 5
const PREVIEW_ROWS = 6
const TILE_S = 52
const GAP_S = 2
const CELL_S = TILE_S + GAP_S
const PREVIEW_W = PREVIEW_COLS * CELL_S - GAP_S
const PREVIEW_H = PREVIEW_ROWS * CELL_S - GAP_S

function generatePreviewBoard(): Board {
  return Array.from({ length: PREVIEW_ROWS }, () =>
    Array.from({ length: PREVIEW_COLS }, () => Math.ceil(Math.random() * 9))
  ) as Board
}

interface Props { onClose: () => void }

export function SettingsModal({ onClose }: Props) {
  const { theme, tileShape, tileColorId, showHintCount, setTheme, setTileShape, setTileColor, setShowHintCount } = useThemeStore()

  const [previewBoard, setPreviewBoard] = useState<Board>(generatePreviewBoard)
  const previewRef = useRef<HTMLDivElement>(null)
  const selRef = useRef<SelectionBoxHandle>(null)

  useEffect(() => {
    const nulls = previewBoard.flat().filter(v => v === null).length
    if (nulls >= Math.floor(PREVIEW_COLS * PREVIEW_ROWS / 2)) {
      setPreviewBoard(generatePreviewBoard())
    }
  }, [previewBoard])

  const onPreviewDrag = useCallback((rect: SelectionRect) => {
    selRef.current?.show(normalizeRect(rect), sumRect(previewBoard, rect))
  }, [previewBoard])

  const onPreviewCommit = useCallback((rect: SelectionRect) => {
    selRef.current?.hide()
    if (!isValidSelection(previewBoard, rect)) return
    const { newBoard } = clearRect(previewBoard, rect)
    setPreviewBoard(newBoard as Board)
  }, [previewBoard])

  const onPreviewCancel = useCallback(() => selRef.current?.hide(), [])

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useDragSelect(
    previewRef,
    { onDrag: onPreviewDrag, onCommit: onPreviewCommit, onCancel: onPreviewCancel },
    () => 'playing',
    PREVIEW_COLS,
    PREVIEW_ROWS,
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: C.scrim75, backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-3xl p-6 w-full mx-4 shadow-2xl"
        style={{ maxWidth: 660, background: C.surface, border: `1px solid ${C.borderStrong}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold" style={{ color: C.textPrimary }}>⚙️ 설정</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-all"
            style={{ color: C.textMuted }}
          >
            ✕
          </button>
        </div>

        {/* 바디: 미리보기(좌) + 설정(우) */}
        <div className="flex gap-6 items-start">

          {/* 미리보기 */}
          <div className="shrink-0">
            <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">미리보기</div>
            <div
              ref={previewRef}
              style={{
                width: PREVIEW_W,
                height: PREVIEW_H,
                borderRadius: 12,
                background: BOARD_BG[theme].background,
                border: BOARD_BG[theme].border,
                display: 'grid',
                gridTemplateColumns: `repeat(${PREVIEW_COLS}, ${TILE_S}px)`,
                gridTemplateRows: `repeat(${PREVIEW_ROWS}, ${TILE_S}px)`,
                gap: GAP_S,
                position: 'relative',
                cursor: 'crosshair',
                touchAction: 'none',
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {previewBoard.flat().map((v, i) => (
                <Tile key={i} value={v} />
              ))}
              <SelectionBox ref={selRef} />
            </div>
          </div>

          {/* 설정 */}
          <div className="flex-1 flex flex-col gap-5">
            {/* 테마 */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">테마</div>
              <SegmentedControl
                options={[
                  { value: 'light', label: '☀️ 라이트' },
                  { value: 'dark',  label: '🌙 다크' }
                ]}
                value={theme}
                onChange={setTheme}
              />
            </div>

            {/* 타일 모양 */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">타일 모양</div>
              <SegmentedControl
                options={[
                  { value: 'apple',  label: '🍎 사과' },
                  { value: 'circle', label: '● 원형' },
                  { value: 'square', label: '■ 사각형' },
                ]}
                value={tileShape}
                onChange={setTileShape}
              />
            </div>

            {/* 타일 색상 */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">타일 색상</div>
              <div className="flex gap-2">
                {TILE_COLORS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setTileColor(color.id)}
                    title={color.label}
                    className="flex-1 aspect-square rounded-xl transition-all active:scale-90"
                    style={{
                      background: color.fill,
                      outline: tileColorId === color.id ? `2px solid ${color.fill}` : 'none',
                      outlineOffset: 2,
                      height: 40,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 조합 수 표시 */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">게임 중 조합 수 표시</div>
              <SegmentedControl
                options={[
                  { value: 'on',  label: '켜기' },
                  { value: 'off', label: '끄기' },
                ]}
                value={showHintCount ? 'on' : 'off'}
                onChange={v => setShowHintCount(v === 'on')}
              />
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
