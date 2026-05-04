import { useState, useCallback, useMemo, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { countSolutions } from '../utils/gameLogic'
import { C } from '../theme/tokens'
import { AI_API_BASE, aiHeaders } from '../lib/aiApi'

type ModelEntry = { label: string; path: string }
type ModelRun = { name: string; models: ModelEntry[] }

const PANEL_WIDTH = 264

function formatRunName(name: string) {
  const m = name.match(/^(.+?)_(\d{10})$/)
  if (!m) return name
  const tag = m[1].replace(/_/g, ' ')
  const d = new Date(parseInt(m[2]) * 1000)
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dy = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${tag} · ${mo}/${dy} ${hh}:${mm}`
}

function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1400
  )
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

function Divider() {
  return <div style={{ height: 1, background: C.borderFaint, margin: '12px 0' }} />
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: C.textSub }}>
      {children}
    </div>
  )
}

export function DevSidePanel() {
  const devMode = useThemeStore(s => s.devMode)
  const user = useAuthStore(s => s.user)
  const gamePhase = useGameStore(s => s.gamePhase)
  const board = useGameStore(s => s.board)
  const score = useGameStore(s => s.score)
  const aiSolving = useGameStore(s => s.aiSolving)
  const aiWaiting = useGameStore(s => s.aiWaiting)
  const runAISolver = useGameStore(s => s.runAISolver)
  const stopAISolver = useGameStore(s => s.stopAISolver)

  const [modelRuns, setModelRuns] = useState<ModelRun[]>([])
  const [selectedRun, setSelectedRun] = useState('')
  const [modelPath, setModelPath] = useState('')
  const [modelsLoading, setModelsLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const windowWidth = useWindowWidth()
  const isWide = windowWidth >= 1200
  const isNarrow = windowWidth < 768

  const fetchModels = useCallback(async () => {
    setModelsLoading(true)
    setFetchError(null)
    try {
      const resp = await fetch(`${AI_API_BASE}/models`)
      if (!resp.ok) {
        setFetchError(`서버 오류 ${resp.status}`)
        return
      }
      const data = await resp.json()
      const runs: ModelRun[] = data.runs ?? []
      setModelRuns(runs)
      if (runs.length > 0) {
        setSelectedRun(runs[0].name)
        if (runs[0].models.length > 0) setModelPath(runs[0].models[0].path)
      }
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : '네트워크 오류')
    } finally {
      setModelsLoading(false)
    }
  }, [])

  useEffect(() => { fetchModels() }, [fetchModels])

  const isPlaying = gamePhase === 'playing'

  const validCombos = useMemo(() => {
    if (!isPlaying) return 0
    return countSolutions(board)
  }, [board, isPlaying])

  const remaining = useMemo(() => {
    if (!isPlaying) return 0
    return board.flat().filter(c => c !== null && c !== 0).length
  }, [board, isPlaying])

  const handleExport = useCallback(async () => {
    const numeric = board.map(row => row.map(cell => cell ?? 0))
    const json = JSON.stringify(numeric)
    try {
      await navigator.clipboard.writeText(json)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = json
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [board])

  const handleAIDemo = useCallback(async () => {
    setAiError(null)
    try {
      await runAISolver(modelPath.trim())
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e))
    }
  }, [modelPath, runAISolver])

  if (!devMode || !user) return null

  const panelBody = (showClose: boolean) => (
    <>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🛠️</span>
        <span className="font-bold text-sm" style={{ color: C.textPrimary }}>개발자 패널</span>
        <div className="ml-auto flex items-center gap-2">
          {aiSolving && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: '#3b82f620', color: '#60a5fa', border: '1px solid #3b82f640' }}
            >
              AI 실행 중
            </span>
          )}
          {showClose && (
            <button
              onClick={() => setIsOpen(false)}
              className="rounded px-2 py-0.5 text-xs transition-all active:scale-95"
              style={{ color: C.textSub, background: C.surfaceRaised, border: `1px solid ${C.borderFaint}` }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <Label>보드 통계</Label>
      {isPlaying ? (
        <div className="grid grid-cols-3 gap-2 mb-1">
          {[
            { label: '점수', value: score },
            { label: '잔여', value: remaining },
            { label: '유효 조합', value: validCombos },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg px-2 py-2 text-center"
              style={{ background: C.surfaceRaised, border: `1px solid ${C.borderFaint}` }}
            >
              <div className="text-xs" style={{ color: C.textSub }}>{label}</div>
              <div className="text-base font-bold tabular-nums" style={{ color: C.textPrimary }}>{value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs py-2" style={{ color: C.textSub }}>게임 중일 때 표시됩니다.</div>
      )}

      <Divider />

      <Label>보드 데이터</Label>
      <button
        onClick={handleExport}
        disabled={!isPlaying}
        className="w-full rounded-lg py-2 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
        style={{ background: C.surfaceRaised, border: `1px solid ${C.borderFaint}`, color: C.textPrimary }}
      >
        {copied ? '✅ 클립보드에 복사됨' : '📋 JSON으로 내보내기'}
      </button>

      <Divider />

      {/* AI 데모 헤더 — 라벨 + 연결 상태 + 새로고침 */}
      <div className="flex items-center gap-2 mb-1.5">
        <Label>AI 데모</Label>
        <div className="ml-auto flex items-center gap-1.5">
          <div style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: modelsLoading ? '#f59e0b' : modelRuns.length > 0 ? '#22c55e' : '#4b5563',
            boxShadow: modelsLoading ? '0 0 6px #f59e0b80' : modelRuns.length > 0 ? '0 0 6px #22c55e80' : 'none',
            transition: 'all 0.3s',
          }} />
          <span className="text-xs" style={{
            color: modelsLoading ? '#f59e0b' : modelRuns.length > 0 ? '#22c55e' : C.textSub,
            transition: 'color 0.3s',
          }}>
            {modelsLoading ? '조회 중' : modelRuns.length > 0 ? `${modelRuns.length}개 런` : '미연결'}
          </span>
          <button
            onClick={fetchModels}
            disabled={modelsLoading}
            title="새로고침"
            className="rounded px-1.5 py-0.5 text-xs transition-all active:scale-95 disabled:opacity-40"
            style={{ color: C.textSub, background: C.surfaceRaised, border: `1px solid ${C.borderFaint}` }}
          >
            {modelsLoading ? '…' : '↺'}
          </button>
        </div>
      </div>

      {/* 모델 선택 카드 */}
      <div style={{
        borderRadius: 10,
        border: `1px solid ${C.borderFaint}`,
        overflow: 'hidden',
        opacity: modelRuns.length === 0 ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}>
        {/* 런 선택 */}
        <div style={{ padding: '7px 10px', borderBottom: `1px solid ${C.borderFaint}`, background: C.surfaceRaised }}>
          <div className="text-xs mb-1" style={{ color: C.textSub, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>런</div>
          <select
            value={selectedRun}
            onChange={e => {
              const run = modelRuns.find(r => r.name === e.target.value)
              setSelectedRun(e.target.value)
              if (run?.models.length) setModelPath(run.models[0].path)
            }}
            disabled={modelsLoading || modelRuns.length === 0}
            className="w-full text-xs"
            style={{
              background: 'transparent',
              border: 'none',
              color: modelRuns.length === 0 ? C.textSub : C.textPrimary,
              outline: 'none',
              padding: 0,
              fontWeight: 500,
            }}
          >
            {modelRuns.length === 0
              ? <option value="">서버 미연결</option>
              : modelRuns.map(r => (
                  <option key={r.name} value={r.name}>{formatRunName(r.name)}</option>
                ))
            }
          </select>
        </div>

        {/* 모델 선택 */}
        <div style={{ padding: '7px 10px', background: C.surfaceRaised }}>
          <div className="text-xs mb-1" style={{ color: C.textSub, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>모델</div>
          <select
            value={modelPath}
            onChange={e => setModelPath(e.target.value)}
            disabled={modelsLoading || modelRuns.length === 0}
            className="w-full text-xs"
            style={{
              background: 'transparent',
              border: 'none',
              color: modelRuns.length === 0 ? C.textSub : C.textPrimary,
              outline: 'none',
              padding: 0,
              fontWeight: 500,
            }}
          >
            {(modelRuns.find(r => r.name === selectedRun)?.models ?? []).map(m => (
              <option key={m.path} value={m.path}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 실행/중지 버튼 */}
      <div className="mt-2">
        {aiSolving ? (
          <button
            onClick={stopAISolver}
            className="w-full rounded-lg py-2 text-xs font-bold transition-all active:scale-95"
            style={{ background: '#ef444418', border: '1px solid #ef444460', color: '#ef4444' }}
          >
            {aiWaiting ? '⏳ 서버 응답 대기 중...' : '⏹ 중지'}
          </button>
        ) : (
          <button
            onClick={handleAIDemo}
            disabled={!isPlaying || modelRuns.length === 0}
            className="w-full rounded-lg py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-35"
            style={{
              background: isPlaying && modelRuns.length > 0 ? 'rgba(34,197,94,0.12)' : C.surfaceRaised,
              border: `1px solid ${isPlaying && modelRuns.length > 0 ? 'rgba(34,197,94,0.4)' : C.borderFaint}`,
              color: isPlaying && modelRuns.length > 0 ? '#22c55e' : C.textPrimary,
              transition: 'all 0.2s',
            }}
          >
            🤖 AI 데모 시작
          </button>
        )}
      </div>

      {/* 안내 / 에러 */}
      {!isPlaying && (
        <div className="text-xs mt-1" style={{ color: C.textSub }}>게임을 시작한 뒤 실행하세요.</div>
      )}
      {aiError && (
        <div
          className="rounded-lg px-3 py-2 text-xs break-all mt-1"
          style={{ background: '#ef444415', border: '1px solid #ef444440', color: '#ef4444' }}
        >
          {aiError}
        </div>
      )}

      {/* fetch 에러 */}
      {fetchError && (
        <div
          className="rounded-lg px-3 py-2 text-xs break-all mt-1"
          style={{ background: '#f59e0b15', border: '1px solid #f59e0b40', color: '#f59e0b' }}
        >
          {fetchError}
        </div>
      )}
    </>
  )

  // ─── Wide (≥1200px): 항상 표시되는 우측 고정 패널 ─────────────────────────
  if (isWide) {
    return (
      <div
        style={{
          position: 'fixed',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          width: PANEL_WIDTH,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: C.surface,
          border: `1px solid ${C.borderStrong}`,
          borderRadius: 16,
          zIndex: 50,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {panelBody(false)}
      </div>
    )
  }

  // ─── Narrow (<768px): FAB + 바텀시트 ─────────────────────────────────────
  if (isNarrow) {
    return (
      <>
        <button
          onClick={() => setIsOpen(v => !v)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: C.surface,
            border: `1px solid ${C.borderStrong}`,
            zIndex: 53,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {aiSolving ? <span className="animate-pulse" style={{ fontSize: 14 }}>⚡</span> : '🛠️'}
        </button>

        {isOpen && (
          <>
            <div
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 51,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(2px)',
                animation: 'dev-fade-in 0.2s ease both',
              }}
            />
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '80vh',
                overflowY: 'auto',
                background: C.surface,
                borderTop: `1px solid ${C.borderStrong}`,
                borderRadius: '16px 16px 0 0',
                zIndex: 52,
                padding: '12px 16px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                animation: 'dev-slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: C.borderStrong,
                  margin: '0 auto 16px',
                  flexShrink: 0,
                }}
              />
              {panelBody(true)}
            </div>
          </>
        )}
      </>
    )
  }

  // ─── Medium (768–1199px): 우측 엣지 탭 + 슬라이드인 패널 ──────────────────
  return (
    <>
      {/* 토글 탭 — 항상 우측 엣지에 표시 */}
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          position: 'fixed',
          right: isOpen ? PANEL_WIDTH : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 51,
          padding: '14px 8px',
          background: C.surface,
          border: `1px solid ${C.borderStrong}`,
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 14 }}>🛠️</span>
        {aiSolving && (
          <div
            className="animate-pulse"
            style={{ width: 5, height: 5, borderRadius: '50%', background: '#60a5fa' }}
          />
        )}
        <span
          style={{
            fontSize: 9,
            color: C.textMuted,
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            letterSpacing: '0.08em',
            fontWeight: 700,
          }}
        >
          DEV
        </span>
        <span style={{ fontSize: 10, color: C.textSub }}>{isOpen ? '›' : '‹'}</span>
      </button>

      {/* 슬라이드인 패널 — 항상 DOM에 존재, right 값으로 위치 제어 */}
      <div
        style={{
          position: 'fixed',
          right: isOpen ? 0 : -PANEL_WIDTH,
          top: '50%',
          transform: 'translateY(-50%)',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: PANEL_WIDTH,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: C.surface,
          border: `1px solid ${C.borderStrong}`,
          borderRight: 'none',
          borderRadius: '16px 0 0 16px',
          zIndex: 50,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {panelBody(true)}
      </div>
    </>
  )
}
