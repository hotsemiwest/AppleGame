import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { submitScore } from '../lib/supabase'
import { Leaderboard } from './Leaderboard'

type Phase = 'entry' | 'submitting' | 'leaderboard'

export function GameOverModal() {
  const { score, personalBest, isNewRecord, startGame } = useGameStore()
  const [phase, setPhase] = useState<Phase>(score > 0 ? 'entry' : 'leaderboard')
  const [name, setName] = useState('')
  const [submittedName, setSubmittedName] = useState<string | undefined>()
  const [submitError, setSubmitError] = useState(false)

  async function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed || phase !== 'entry') return
    setPhase('submitting')
    setSubmitError(false)
    try {
      await submitScore(trimmed, score)
      setSubmittedName(trimmed)
    } catch {
      setSubmitError(true)
    }
    setPhase('leaderboard')
  }

  return (
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

        {/* 이름 입력 */}
        {phase === 'entry' && (
          <div className="mb-4">
            <p className="text-gray-300 text-sm text-center mb-2">랭킹에 이름을 등록하세요</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.slice(0, 16))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="닉네임 입력 (최대 16자)"
              className="w-full bg-gray-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none border border-gray-600 focus:border-green-500 transition-colors mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setPhase('leaderboard')}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-all active:scale-95"
              >
                건너뛰기
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                등록
              </button>
            </div>
          </div>
        )}

        {phase === 'submitting' && (
          <div className="text-center text-gray-400 text-sm mb-4 py-2">등록 중...</div>
        )}

        {/* 랭킹 */}
        {phase === 'leaderboard' && (
          <div className="mb-4">
            {submitError && (
              <p className="text-red-400 text-xs text-center mb-2">등록에 실패했습니다</p>
            )}
            <p className="text-gray-400 text-xs uppercase tracking-widest text-center mb-2 font-semibold">
              🏆 TOP 10
            </p>
            <Leaderboard highlightName={submittedName} highlightScore={score} />
          </div>
        )}

        <button
          onClick={startGame}
          className="w-full py-3.5 rounded-2xl text-base font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all active:scale-95 shadow-lg mt-auto"
        >
          다시 시작
        </button>
      </div>
    </div>
  )
}
