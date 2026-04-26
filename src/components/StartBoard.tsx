import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { AuthModal } from './AuthModal'

const BOARD_HEIGHT = 538

export function StartBoard() {
  const { personalBest, startGame } = useGameStore()
  const { user } = useAuthStore()
  const [showAuth, setShowAuth] = useState(false)

  return (
    <>
      <div
        className="flex flex-col items-center justify-between w-full py-10 px-8"
        style={{
          height: BOARD_HEIGHT,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="text-center w-full max-w-lg">
          <div className="text-5xl mb-5">🍎</div>
          <h2 className="text-3xl font-black text-white mb-1">AppleBox</h2>
          <p className="text-gray-400 mb-7">드래그로 합이 10이 되는 숫자들을 선택하세요</p>

          <div className="bg-gray-800 rounded-2xl p-5 text-left space-y-2.5 text-sm text-gray-300">
            <p>• <span className="text-white font-semibold">직사각형 영역</span>을 드래그하여 숫자를 선택</p>
            <p>• 선택 영역의 합이 <span className="text-green-400 font-bold">정확히 10</span>이면 블록 제거</p>
            <p>• 제거한 블록 수만큼 점수 획득</p>
            <p>• <span className="text-yellow-400 font-semibold">2분</span> 안에 최고 점수를 달성하세요!</p>
            <p>• 최대 점수: <span className="text-white font-bold">170점</span> (올 클리어)</p>
          </div>

          {personalBest > 0 && (
            <p className="text-yellow-400 font-semibold mt-5">
              개인 최고기록: {personalBest}점
            </p>
          )}
        </div>

        <div className="flex gap-3 w-full max-w-lg">
          {!user && (
            <button
              onClick={() => setShowAuth(true)}
              className="flex-1 py-4 rounded-2xl text-xl font-black text-white transition-all active:scale-95 shadow-lg"
              style={{ background: '#374151', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              로그인
            </button>
          )}
          <button
            onClick={startGame}
            className="flex-1 py-4 rounded-2xl text-xl font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all active:scale-95 shadow-lg shadow-green-500/20"
          >
            {user ? '게임 시작' : '게스트로 게임 시작'}
          </button>
        </div>
      </div>

      {showAuth && (
        <AuthModal
          onSuccess={() => setShowAuth(false)}
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  )
}
