import { useState, useCallback, useMemo, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { useThemeStore } from '../store/themeStore'
import { countSolutions } from '../utils/gameLogic'
import { C } from '../theme/tokens'

type ModelEntry = { label: string; path: string }
type ModelRun = { name: string; models: ModelEntry[] }

const PANEL_WIDTH = 264

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
  const gamePhase = useGameStore(s => s.gamePhase)
  const board = useGameStore(s => s.board)
  const score = useGameStore(s => s.score)
  const aiSolving = useGameStore(s => s.aiSolving)
  const runAISolver = useGameStore(s => s.runAISolver)
  const stopAISolver = useGameStore(s => s.stopAISolver)

  const [modelRuns, setModelRuns] = useState<ModelRun[]>([])
  const [selectedRun, setSelectedRun] = useState('')
  const [modelPath, setModelPath] = useState('')
  const [modelsLoading, setModelsLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchModels = useCallback(async () => {
    setModelsLoading(true)
    try {
      const resp = await fetch('http://localhost:8000/models')
      if (resp.ok) {
        const data = await resp.json()
        const runs: ModelRun[] = data.runs ?? []
        setModelRuns(runs)
        if (runs.length > 0) {
          setSelectedRun(runs[0].name)
          if (runs[0].models.length > 0) setModelPath(runs[0].models[0].path)
        }
      }
    } catch {
      // 서버 미실행 상태면 조용히 무시
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

  if (!devMode) return null

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
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🛠️</span>
        <span className="font-bold text-sm" style={{ color: C.textPrimary }}>개발자 패널</span>
        {aiSolving && (
          <span
            className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse"
            style={{ background: '#3b82f620', color: '#60a5fa', border: '1px solid #3b82f640' }}
          >
            AI 실행 중
          </span>
        )}
      </div>

      {/* 보드 통계 */}
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

      {/* 보드 내보내기 */}
      <Label>보드 데이터</Label>
      <button
        onClick={handleExport}
        disabled={!isPlaying}
        className="w-full rounded-lg py-2 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40"
        style={{
          background: C.surfaceRaised,
          border: `1px solid ${C.borderFaint}`,
          color: C.textPrimary,
        }}
      >
        {copied ? '✅ 클립보드에 복사됨' : '📋 JSON으로 내보내기'}
      </button>

      <Divider />

      {/* AI 데모 */}
      <Label>AI 데모</Label>
      <div className="flex flex-col gap-2">
        {/* 런 선택 */}
        <div className="flex gap-1">
          <select
            value={selectedRun}
            onChange={e => {
              const run = modelRuns.find(r => r.name === e.target.value)
              setSelectedRun(e.target.value)
              if (run?.models.length) setModelPath(run.models[0].path)
            }}
            disabled={modelsLoading || modelRuns.length === 0}
            className="flex-1 rounded-lg px-3 py-2 text-xs min-w-0"
            style={{
              background: C.surfaceRaised,
              border: `1px solid ${C.borderFaint}`,
              color: modelRuns.length === 0 ? C.textSub : C.textPrimary,
              outline: 'none',
            }}
          >
            {modelRuns.length === 0
              ? <option value="">서버 미연결</option>
              : modelRuns.map(r => <option key={r.name} value={r.name}>{r.name}</option>)
            }
          </select>
          <button
            onClick={fetchModels}
            disabled={modelsLoading}
            title="새로고침"
            className="rounded-lg px-2 py-2 text-xs transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: C.surfaceRaised,
              border: `1px solid ${C.borderFaint}`,
              color: C.textSub,
              flexShrink: 0,
            }}
          >
            {modelsLoading ? '⏳' : '↺'}
          </button>
        </div>

        {/* 체크포인트 선택 */}
        <select
          value={modelPath}
          onChange={e => setModelPath(e.target.value)}
          disabled={modelsLoading || modelRuns.length === 0}
          className="w-full rounded-lg px-3 py-2 text-xs"
          style={{
            background: C.surfaceRaised,
            border: `1px solid ${C.borderFaint}`,
            color: modelRuns.length === 0 ? C.textSub : C.textPrimary,
            outline: 'none',
          }}
        >
          {(modelRuns.find(r => r.name === selectedRun)?.models ?? []).map(m => (
            <option key={m.path} value={m.path}>{m.label}</option>
          ))}
        </select>

        {aiSolving ? (
          <button
            onClick={stopAISolver}
            className="w-full rounded-lg py-2 text-xs font-bold transition-all active:scale-95"
            style={{ background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444' }}
          >
            ⏹ 중지
          </button>
        ) : (
          <button
            onClick={handleAIDemo}
            disabled={!isPlaying}
            className="w-full rounded-lg py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: C.surfaceRaised,
              border: `1px solid ${C.borderFaint}`,
              color: C.textPrimary,
            }}
          >
            🤖 AI 데모 시작
          </button>
        )}

        {!isPlaying && (
          <div className="text-xs" style={{ color: C.textSub }}>
            게임을 시작한 뒤 실행하세요.
          </div>
        )}

        {aiError && (
          <div
            className="rounded-lg px-3 py-2 text-xs break-all"
            style={{ background: '#ef444415', border: '1px solid #ef444440', color: '#ef4444' }}
          >
            {aiError}
          </div>
        )}

        <div className="text-xs leading-relaxed" style={{ color: C.textSub }}>
          서버: <code className="px-1 rounded" style={{ background: C.surfaceRaised }}>uvicorn ai_solver.server:app --port 8000</code>
        </div>
      </div>
    </div>
  )
}
