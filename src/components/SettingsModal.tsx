import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useThemeStore } from '../store/themeStore'
import { DIFFICULTY_CONFIG, getDifficultyLabel } from '../config/difficultyConfig'
import { TILE_COLORS, BOARD_BG, C } from '../theme/tokens'
import { Tile } from './Tile'
import { SegmentedControl } from './SegmentedControl'
import { SelectionBox, SelectionBoxHandle } from './SelectionBox'
import { useDragSelect } from '../hooks/useDragSelect'
import { normalizeRect, sumRect, isValidSelection, clearRect } from '../utils/gameLogic'
import { Board, SelectionRect, Particle } from '../types/game'
import { buildParticles } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { generateBoardWithSize } from '../utils/boardGenerator'

const PREVIEW_COLS = 6
const PREVIEW_ROWS = 10
const TILE_S = 52
const GAP_S = 2
const CELL_S = TILE_S + GAP_S
const PREVIEW_W = PREVIEW_COLS * CELL_S - GAP_S
const PREVIEW_H = PREVIEW_ROWS * CELL_S - GAP_S

function generatePreviewBoard(): Board {
  return generateBoardWithSize(PREVIEW_ROWS, PREVIEW_COLS)
}

interface Props { onClose: () => void }

export function SettingsModal({ onClose }: Props) {
  const {
    theme,
    tileShape,
    tileColorId,
    showHintCount,
    showDifficulty,
    soloBoardDifficulty,
    showDragSelectionSum,
    showDragSelectionRangeColor,
    devMode,
    setTheme,
    setTileShape,
    setTileColor,
    setShowHintCount,
    setShowDifficulty,
    setSoloBoardDifficulty,
    setShowDragSelectionSum,
    setShowDragSelectionRangeColor,
    setDevMode,
  } = useThemeStore()

  const { user } = useAuthStore()
  const [settingsTab, setSettingsTab] = useState<'decor' | 'feature'>('decor')
  const [previewBoard, setPreviewBoard] = useState<Board>(generatePreviewBoard)
  const [previewParticles, setPreviewParticles] = useState<Particle[]>([])
  const previewRef = useRef<HTMLDivElement>(null)
  const selRef = useRef<SelectionBoxHandle>(null)

  const resetPreviewBoard = useCallback(() => {
    selRef.current?.hide()
    setPreviewParticles([])
    setPreviewBoard(generatePreviewBoard())
  }, [])

  useEffect(() => {
    const nulls = previewBoard.flat().filter(v => v === null).length
    if (nulls >= Math.floor(PREVIEW_COLS * PREVIEW_ROWS / 2)) {
      resetPreviewBoard()
    }
  }, [previewBoard, resetPreviewBoard])

  const onPreviewDrag = useCallback((rect: SelectionRect) => {
    selRef.current?.show(normalizeRect(rect), sumRect(previewBoard, rect))
  }, [previewBoard])

  const onPreviewCommit = useCallback((rect: SelectionRect) => {
    selRef.current?.hide()
    if (!isValidSelection(previewBoard, rect)) return
    const { newBoard, cleared } = clearRect(previewBoard, rect)
    setPreviewBoard(newBoard as Board)
    const [particles, duration] = buildParticles(cleared, false)
    setPreviewParticles(prev => [...prev, ...particles])
    setTimeout(() => {
      setPreviewParticles(prev => prev.filter(p => !particles.some(np => np.id === p.id)))
    }, duration + 400)
  }, [previewBoard])

  const onPreviewCancel = useCallback(() => selRef.current?.hide(), [])

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useDragSelect(
    previewRef,
    { onDrag: onPreviewDrag, onCommit: onPreviewCommit, onCancel: onPreviewCancel },
    () => 'playing',
    PREVIEW_COLS,
    PREVIEW_ROWS,
    { requireStartInside: true },
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const difficultyLabel = getDifficultyLabel(soloBoardDifficulty)

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: C.scrim75, backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-3xl p-6 w-full mx-4 shadow-2xl"
        style={{ maxWidth: 720, background: C.surface, border: `1px solid ${C.borderStrong}` }}
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
        <div className="flex gap-8 items-start">

          {/* 미리보기 */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">미리보기 (직접 드래그해보세요)</div>
              <button
                onClick={resetPreviewBoard}
                className="rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-95"
                style={{
                  color: C.textSub,
                  background: C.surfaceRaised,
                  border: `1px solid ${C.borderFaint}`,
                }}
              >
                초기화
              </button>
            </div>
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
              <SelectionBox
                ref={selRef}
                showSum={showDragSelectionSum}
                showRangeColor={showDragSelectionRangeColor}
              />
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20, overflow: 'visible' }}>
                {previewParticles.map(p => {
                  const cx = p.col * CELL_S + TILE_S / 2
                  const cy = p.row * CELL_S + TILE_S / 2
                  const angleRad = (p.angle * Math.PI) / 180
                  const dx = Math.cos(angleRad) * p.distance
                  const dy = Math.sin(angleRad) * p.distance
                  const half = p.size / 2
                  const glow = p.tier !== 'normal' ? `0 0 ${p.tier === 'big' ? p.size * 2 : p.size * 1.2}px ${p.color}` : 'none'
                  return (
                    <div
                      key={p.id}
                      className="particle"
                      style={{
                        position: 'absolute',
                        left: cx - half,
                        top: cy - half,
                        width: p.size,
                        height: p.size,
                        borderRadius: '50%',
                        background: p.color,
                        boxShadow: glow,
                        '--dx': `${dx}px`,
                        '--dy': `${dy}px`,
                        '--dur': `${p.duration}ms`,
                        animationDelay: `${p.delay ?? 0}ms`,
                      } as React.CSSProperties}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* 설정 */}
          <div className="flex-1 flex flex-col gap-5">
            {/* 탭 스위치 */}
            <SegmentedControl
              options={[
                { value: 'decor',   label: '🎨 꾸미기' },
                { value: 'feature', label: '⚙️ 기능' },
              ]}
              value={settingsTab}
              onChange={v => setSettingsTab(v as 'decor' | 'feature')}
            />
            <div className={`flex-1 border-t ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`} />
            {settingsTab === 'decor' && <>
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
                    { value: 'circle', label: '🔴 원형' },
                    { value: 'square', label: '🟥 사각형' },
                    { value: '8bit',   label: '🛑 8BIT' },
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
            </>}

            {settingsTab === 'feature' && <>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">드래그 선택 합계 표시</div>
                <SegmentedControl
                  options={[
                    { value: 'on',  label: '✅ 켜기' },
                    { value: 'off', label: '❌ 끄기' },
                  ]}
                  value={showDragSelectionSum ? 'on' : 'off'}
                  onChange={v => setShowDragSelectionSum(v === 'on')}
                />
              </div>

              <div>
                <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">드래그 범위별 박스 색상</div>
                <SegmentedControl
                  options={[
                    { value: 'on',  label: '✅ 켜기' },
                    { value: 'off', label: '❌ 끄기' },
                  ]}
                  value={showDragSelectionRangeColor ? 'on' : 'off'}
                  onChange={v => setShowDragSelectionRangeColor(v === 'on')}
                />
              </div>

              <div>
                <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">게임 중 조합 수 표시</div>
                <SegmentedControl
                  options={[
                    { value: 'on',  label: '✅ 켜기' },
                    { value: 'off', label: '❌ 끄기' },
                  ]}
                  value={showHintCount ? 'on' : 'off'}
                  onChange={v => setShowHintCount(v === 'on')}
                />
              </div>

              <div>
                <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">게임 중 난이도 표시</div>
                <SegmentedControl
                  options={[
                    { value: 'on',  label: '✅ 켜기' },
                    { value: 'off', label: '❌ 끄기' },
                  ]}
                  value={showDifficulty ? 'on' : 'off'}
                  onChange={v => setShowDifficulty(v === 'on')}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">싱글 게임 난이도</div>
                  <div className="text-sm font-semibold" style={{ color: C.textPrimary }}>{difficultyLabel}</div>
                </div>
                
                {/* 랜덤 vs 난이도 선택 토글 */}
                <div className="mb-3">
                  <SegmentedControl
                    options={[
                      { value: 'random' as const, label: '🎲 랜덤' },
                      { value: 'fixed' as const, label: '⭐️ 직접 설정' }
                    ]}
                    value={soloBoardDifficulty === DIFFICULTY_CONFIG.RANDOM ? 'random' : 'fixed'}
                    onChange={(v) => {
                      if (v === 'random') {
                        setSoloBoardDifficulty(DIFFICULTY_CONFIG.RANDOM)
                      } else {
                        setSoloBoardDifficulty(DIFFICULTY_CONFIG.DEFAULT)
                      }
                    }}
                  />
                </div>

                {/* 난이도 슬라이더 */}
                {soloBoardDifficulty !== DIFFICULTY_CONFIG.RANDOM && (
                  <>
                    <input
                      type="range"
                      min={DIFFICULTY_CONFIG.MIN}
                      max={DIFFICULTY_CONFIG.MAX}
                      step={1}
                      value={soloBoardDifficulty}
                      onChange={e => setSoloBoardDifficulty(Number(e.target.value))}
                      className="themed-slider w-full"
                      style={{ '--slider-pct': ((soloBoardDifficulty - DIFFICULTY_CONFIG.MIN) / (DIFFICULTY_CONFIG.MAX - DIFFICULTY_CONFIG.MIN)) * 100 } as React.CSSProperties}
                    />
                    <div className="mt-1 flex justify-between text-[11px]" style={{ color: C.textMuted, fontVariantNumeric: 'tabular-nums', paddingLeft: '6px', paddingRight: '6px' }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n}>{n}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {user && (
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">개발자 모드</div>
                  <SegmentedControl
                    options={[
                      { value: 'on',  label: '✅ 켜기' },
                      { value: 'off', label: '❌ 끄기' },
                    ]}
                    value={devMode ? 'on' : 'off'}
                    onChange={v => setDevMode(v === 'on')}
                  />
                  <div className="mt-1.5 text-[11px]" style={{ color: C.textMuted }}>
                    보드 내보내기 등 개발/디버그 기능을 활성화합니다.
                  </div>
                </div>
              )}
            </>}
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
