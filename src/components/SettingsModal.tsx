import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useThemeStore } from '../store/themeStore'
import { TILE_COLORS, BOARD_BG, C } from '../theme/tokens'
import { Tile } from './Tile'

const PREVIEW_COLS = 8
const PREVIEW_ROWS = 4
const TILE_S = 52
const GAP_S = 2
const CELL_S = TILE_S + GAP_S
const SCALE = 0.68
const RAW_W = PREVIEW_COLS * CELL_S - GAP_S  // 430
const RAW_H = PREVIEW_ROWS * CELL_S - GAP_S  // 214

const PREVIEW_VALUES = [
  [1, 3, 2, 5, 4, 3, 2, 1],
  [2, 4, 3, 1, 5, 4, 3, 2],
  [1, 3, 5, 4, 3, 5, 4, 1],
  [2, 3, 4, 3, 4, 3, 2, 1],
]

const BTN_BASE = 'flex-1 py-2 rounded-xl text-sm font-bold transition-all active:scale-95'
const BTN_ON   = 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'

interface Props { onClose: () => void }

export function SettingsModal({ onClose }: Props) {
  const { theme, tileShape, tileColorId, setTheme, setTileShape, setTileColor } = useThemeStore()

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
        style={{ maxWidth: 400, background: C.surface, border: `1px solid ${C.borderStrong}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black" style={{ color: C.textPrimary }}>⚙️ 설정</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-all hover:opacity-60"
            style={{ color: C.textMuted }}
          >
            ✕
          </button>
        </div>

        {/* 테마 */}
        <div className="mb-5">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">테마</div>
          <div className="flex gap-2">
            <button onClick={() => setTheme('dark')}  className={`${BTN_BASE} ${theme === 'dark'  ? BTN_ON : 'panel-hover'}`} style={theme === 'dark'  ? {} : { background: C.surfaceRaised, color: C.textSub }}>🌙 다크</button>
            <button onClick={() => setTheme('light')} className={`${BTN_BASE} ${theme === 'light' ? BTN_ON : 'panel-hover'}`} style={theme === 'light' ? {} : { background: C.surfaceRaised, color: C.textSub }}>☀️ 라이트</button>
          </div>
        </div>

        {/* 타일 모양 */}
        <div className="mb-5">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">타일 모양</div>
          <div className="flex gap-2">
            <button onClick={() => setTileShape('apple')}  className={`${BTN_BASE} ${tileShape === 'apple'  ? BTN_ON : 'panel-hover'}`} style={tileShape === 'apple'  ? {} : { background: C.surfaceRaised, color: C.textSub }}>🍎 사과</button>
            <button onClick={() => setTileShape('circle')} className={`${BTN_BASE} ${tileShape === 'circle' ? BTN_ON : 'panel-hover'}`} style={tileShape === 'circle' ? {} : { background: C.surfaceRaised, color: C.textSub }}>● 원형</button>
            <button onClick={() => setTileShape('square')} className={`${BTN_BASE} ${tileShape === 'square' ? BTN_ON : 'panel-hover'}`} style={tileShape === 'square' ? {} : { background: C.surfaceRaised, color: C.textSub }}>■ 사각형</button>
          </div>
        </div>

        {/* 타일 색상 */}
        <div className="mb-5">
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
                  border: tileColorId === color.id
                    ? `3px solid ${C.textPrimary}`
                    : '3px solid transparent',
                  outline: tileColorId === color.id ? `2px solid ${color.fill}` : 'none',
                  outlineOffset: 2,
                  height: 40,
                }}
              />
            ))}
          </div>
        </div>

        {/* 미리보기 */}
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">미리보기</div>
          <div
            style={{
              width: Math.round(RAW_W * SCALE),
              height: Math.round(RAW_H * SCALE),
              overflow: 'hidden',
              borderRadius: 12,
              background: BOARD_BG[theme].background,
              border: BOARD_BG[theme].border,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${PREVIEW_COLS}, ${TILE_S}px)`,
                gridTemplateRows: `repeat(${PREVIEW_ROWS}, ${TILE_S}px)`,
                gap: GAP_S,
                transform: `scale(${SCALE})`,
                transformOrigin: 'top left',
                width: RAW_W,
                height: RAW_H,
              }}
            >
              {PREVIEW_VALUES.flat().map((v, i) => (
                <Tile key={i} value={v} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
