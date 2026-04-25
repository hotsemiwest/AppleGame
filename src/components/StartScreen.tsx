import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { Leaderboard } from './Leaderboard'

export function StartScreen() {
  const { startGame, personalBest } = useGameStore()
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-6">
        <div className="text-center max-w-md w-full">
          <div className="text-6xl mb-4">🍎</div>
          <h1 className="text-5xl font-black mb-2 tracking-tight">후루츠 박스</h1>
          <p className="text-gray-400 mb-8 text-lg">드래그로 합이 10이 되는 숫자들을 선택하세요</p>

          <div className="bg-gray-800 rounded-2xl p-5 mb-8 text-left space-y-2 text-sm text-gray-300">
            <p>• <span className="text-white font-semibold">직사각형 영역</span>을 드래그하여 숫자를 선택</p>
            <p>• 선택 영역의 합이 <span className="text-green-400 font-bold">정확히 10</span>이면 블록 제거</p>
            <p>• 제거한 블록 수만큼 점수 획득</p>
            <p>• <span className="text-yellow-400 font-semibold">2분</span> 안에 최고 점수를 달성하세요!</p>
            <p>• 최대 점수: <span className="text-white font-bold">170점</span> (올 클리어)</p>
          </div>

          {personalBest > 0 && (
            <p className="text-yellow-400 font-semibold mb-4">
              개인 최고기록: {personalBest}점
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowLeaderboard(true)}
              className="flex-shrink-0 px-5 py-4 rounded-2xl text-base font-black transition-all active:scale-95"
              style={{ background: '#374151', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              🏆 랭킹
            </button>
            <button
              onClick={startGame}
              className="flex-1 py-4 rounded-2xl text-xl font-black bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all active:scale-95 shadow-lg shadow-green-500/30"
            >
              게임 시작
            </button>
          </div>
        </div>
      </div>

      {showLeaderboard && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowLeaderboard(false)}
        >
          <div
            className="bg-gray-800 rounded-3xl p-6 w-full mx-4 shadow-2xl border border-gray-700"
            style={{ maxWidth: 360, maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-black text-white text-center mb-4">🏆 TOP 10</h2>
            <Leaderboard />
            <button
              onClick={() => setShowLeaderboard(false)}
              className="w-full mt-4 py-3 rounded-2xl text-sm font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-all active:scale-95"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  )
}
