import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { submitScore } from '../lib/supabase'
import { Leaderboard } from './Leaderboard'
import { AuthModal } from './AuthModal'

type Phase = 'submitting' | 'leaderboard' | 'guest'

export function GameOverModal() {
  const { score, personalBest, isNewRecord, startGame, goHome } = useGameStore()
  const { user, displayName } = useAuthStore()

  const [phase, setPhase] = useState<Phase>(user ? 'submitting' : 'guest')
  const [submittedName, setSubmittedName] = useState<string | undefined>()
  const [showAuth, setShowAuth] = useState(false)

  // 로그인 상태면 자동 제출
  useEffect(() => {
    if (phase !== 'submitting' || !displayName) return
    submitScore(displayName, score)
      .then(() => setSubmittedName(displayName))
      .catch(() => {})
      .finally(() => setPhase('leaderboard'))
  }, [phase, displayName, score])

  // 게스트가 게임 오버 화면에서 로그인 성공 시 점수 제출
  async function handleAuthSuccess() {
    setShowAuth(false)
    const { displayName: dn } = useAuthStore.getState()
    if (!dn) return
    try {
      await submitScore(dn, score)
      setSubmittedName(dn)
    } catch {}
    setPhase('leaderboard')
  }

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      >
        <div
          className="bg-gray-800 rounded-3xl p-6 w-full mx-4 shadow-2xl border border-gray-700 flex flex-col"
          style={{ maxWidth: 380, maxHeight: '90vh', overflowY: 'auto' }}
        >
          {/* 헤더 */}
          <div className="text-center mb-4">
            <div className="text-4xl mb-1">{isNewRecord ? '🏆' : '⏱️'}</div>
            <h2 className="text-2xl font-black text-white">
              {isNewRecord ? '신기록 달성!' : '게임 종료'}
            </h2>
            {isNewRecord && (
              <p className="text-yellow-400 text-xs font-semibold mt-0.5">새 최고 기록!</p>
            )}
          </div>

          {/* 점수 */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 bg-gray-700 rounded-2xl py-3 text-center">
              <div className="text-gray-400 text-xs uppercase tracking-widest">최종 점수</div>
              <div className="text-4xl font-black text-white mt-0.5">{score}</div>
            </div>
            <div className="flex-1 bg-gray-700 rounded-2xl py-3 text-center">
              <div className="text-gray-400 text-xs uppercase tracking-widest">최고기록</div>
              <div className="text-3xl font-black text-yellow-400 mt-0.5">{personalBest}</div>
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

          {/* 랭킹 */}
          {phase === 'leaderboard' && (
            <div className="mb-4">
              <p className="text-gray-400 text-xs uppercase tracking-widest text-center mb-2 font-semibold">
                🏆 TOP 10
              </p>
              <Leaderboard highlightName={submittedName} highlightScore={score} />
            </div>
          )}

          <div className="flex gap-2 mt-auto pt-2">
            <button
              onClick={goHome}
              className="flex-1 py-3.5 rounded-2xl text-base font-black text-gray-300 transition-all active:scale-95"
              style={{ background: '#374151', border: '1px solid rgba(255,255,255,0.1)' }}
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
        />
      )}
    </>
  )
}
