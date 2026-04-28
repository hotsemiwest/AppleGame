import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useThemeStore } from '../store/themeStore'
import { TILE_COLORS, BOARD_BG, C } from '../theme/tokens'
import { Tile } from './Tile'
import { SegmentedControl } from './SegmentedControl'

const PREVIEW_COLS = 8
const PREVIEW_ROWS = 4
const TILE_S = 52
const GAP_S = 2
const CELL_S = TILE_S + GAP_S
const SCALE = 0.68
const RAW_W = PREVIEW_COLS * CELL_S - GAP_S
const RAW_H = PREVIEW_ROWS * CELL_S - GAP_S

const PREVIEW_VALUES = [
  [1, 3, 2, 5, 4, 3, 2, 1],
  [2, 4, 3, 1, 5, 4, 3, 2],
  [1, 3, 5, 4, 3, 5, 4, 1],
  [2, 3, 4, 3, 4, 3, 2, 1],
]

interface Props { onClose: () => void }

export function SettingsModal({ onClose }: Props) {
  const { theme, tileShape, tileColorId, showHintCount, setTheme, setTileShape, setTileColor, setShowHintCount } = useThemeStore()

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
          <h2 className="text-xl font-bold" style={{ color: C.textPrimary }}>⚙️ 설정</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-all"
            style={{ color: C.textMuted }}
          >
            ✕
          </button>
        </div>

        {/* 테마 */}
        <div className="mb-5">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">테마</div>
          <SegmentedControl
            options={[
              { value: 'dark',  label: '🌙 다크' },
              { value: 'light', label: '☀️ 라이트' },
            ]}
            value={theme}
            onChange={setTheme}
          />
        </div>

        {/* 타일 모양 */}
        <div className="mb-5">
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
                  outline: tileColorId === color.id ? `2px solid ${color.fill}` : 'none',
                  outlineOffset: 2,
                  height: 40,
                }}
              />
            ))}
          </div>
        </div>

        {/* 조합 수 표시 */}
        <div className="mb-5">
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
