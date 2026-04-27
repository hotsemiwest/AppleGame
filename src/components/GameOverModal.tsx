import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { submitScore, fetchProfile } from '../lib/supabase'
import { Leaderboard } from './Leaderboard'
import { C } from '../theme/tokens'
import { AuthModal } from './AuthModal'
import { ScoreChart, HistoryEntry } from './ScoreChart'

type Phase = 'submitting' | 'leaderboard' | 'guest'

export function GameOverModal() {
  const { score, personalBest, isNewRecord, startGame, goHome } = useGameStore()
  const { user, displayName, setPendingAuth } = useAuthStore()

  const [phase, setPhase] = useState<Phase>(user ? 'submitting' : 'guest')
  const [submittedName, setSubmittedName] = useState<string | undefined>()
  const [showAuth, setShowAuth] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const didSubmit = useRef(false)

  async function submitAndShowHistory(dn: string) {
    const submittedAt = new Date().toISOString()
    try { await submitScore(dn, score) } catch {}
    try {
      const profile = await fetchProfile()
      const hist = profile.history
      // DB 반영 타이밍 이슈 보완: 현재 게임 항목이 없으면 직접 추가
      const hasCurrentEntry = hist.some(
        h => h.score === score && new Date(h.played_at).getTime() >= Date.now() - 10_000
      )
      setHistory(hasCurrentEntry ? hist : [...hist, { score, played_at: submittedAt }])
    } catch {
      setHistory([{ score, played_at: submittedAt }])
    }
  }

  // 로그인 상태면 자동 제출
  useEffect(() => {
    if (phase !== 'submitting' || !displayName || didSubmit.current) return
    didSubmit.current = true
    submitAndShowHistory(displayName).then(() => {
      setSubmittedName(displayName)
      setPhase('leaderboard')
    })
  }, [phase, displayName, score])

  // 게스트가 게임 오버 화면에서 로그인 성공 시 점수 제출
  async function handleAuthSuccess() {
    setShowAuth(false)
    const { displayName: dn } = useAuthStore.getState()
    if (!dn) return
    await submitAndShowHistory(dn)
    setSubmittedName(dn)
    setPhase('leaderboard')
  }

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: C.scrim75, backdropFilter: 'blur(4px)' }}
      >
        <div
          className="rounded-3xl p-6 w-full mx-4 shadow-2xl flex flex-col"
          style={{ maxWidth: 380, maxHeight: '90vh', overflowY: 'auto', background: C.surface, border: `1px solid ${C.borderStrong}` }}
        >
          {/* 헤더 */}
          <div className="text-center mb-4">
            <div className="text-4xl mb-1">{isNewRecord ? '🏆' : '⏱️'}</div>
            <h2 className="text-2xl font-black" style={{ color: C.textPrimary }}>
              {isNewRecord ? '신기록 달성!' : '게임 종료'}
            </h2>
            {isNewRecord && (
              <p className="text-xs font-semibold mt-0.5" style={{ color: C.accentYellow }}>새 최고 기록!</p>
            )}
          </div>

          {/* 점수 */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 rounded-2xl py-3 text-center" style={{ background: C.surfaceRaised }}>
              <div className="text-gray-400 text-xs uppercase tracking-widest">최종 점수</div>
              <div className="text-4xl font-black mt-0.5" style={{ color: C.textPrimary }}>{score}</div>
            </div>
            <div className="flex-1 rounded-2xl py-3 text-center" style={{ background: C.surfaceRaised }}>
              <div className="text-gray-400 text-xs uppercase tracking-widest">최고기록</div>
              <div className="text-3xl font-black mt-0.5" style={{ color: C.accentYellow }}>{personalBest}</div>
            </div>
          </div>

          {/* 자동 제출 중 */}
          {phase === 'submitting' && (
            <div className="text-center text-gray-400 text-sm mb-4 py-2">랭킹 등록 중...</div>
          )}

          {/* 게스트 안내 */}
          {phase === 'guest' && (
            <div className="mb-4">
              <button
                onClick={() => setShowAuth(true)}
                className="w-full py-3 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all active:scale-95 mb-2"
              >
                🏆 로그인 후 랭킹 등록하기
              </button>
              <button
                onClick={() => setPhase('leaderboard')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-gray-300 transition-colors"
              >
                건너뛰기
              </button>
            </div>
          )}

          {/* 랭킹 + 히스토리 */}
          {phase === 'leaderboard' && (
            <div className="mb-4 flex flex-col gap-4">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest text-center mb-2 font-semibold">
                  🏆 TOP 10
                </p>
                <Leaderboard highlightName={submittedName} highlightScore={score} />
              </div>
              {history.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">
                    점수 히스토리
                  </p>
                  <div
                    className="rounded-2xl p-3"
                    style={{ background: C.surfaceDim, border: `1px solid ${C.borderFaint}` }}
                  >
                    <ScoreChart history={history} />
                  </div>
                  <div className="text-xs text-gray-600 text-right mt-1.5">
                    ★ 최고점 &nbsp;• 최근 {history.length}게임
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-auto pt-2">
            <button
              onClick={goHome}
              className="flex-1 py-3.5 rounded-2xl text-base font-black transition-all active:scale-95 panel-hover"
              style={{ background: C.surfaceRaised, color: C.textSub, border: `1px solid ${C.borderGhost}` }}
            >
              🏠 홈
            </button>
            <button
              onClick={startGame}
              className="flex-1 py-3.5 rounded-2xl text-base font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all active:scale-95 shadow-lg"
            >
              다시 시작
            </button>
          </div>
        </div>
      </div>

      {showAuth && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuth(false)}
          onSignupDone={() => {
            setShowAuth(false)
            setPendingAuth({ notice: '📧 인증 메일을 확인 후 로그인해 주세요.', openLogin: true })
            goHome()
          }}
        />
      )}
    </>
  )
}
