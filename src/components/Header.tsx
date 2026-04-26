import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { Leaderboard } from './Leaderboard'
import { AuthModal } from './AuthModal'
import { ProfileModal } from './ProfileModal'
import { ScoreEntry } from '../lib/supabase'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Header() {
  const { score, personalBest, timeLeft, gamePhase, startGame, goHome } = useGameStore()
  const { user, displayName, signOut, setPendingAuth } = useAuthStore()
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ScoreEntry | null>(null)

  function handleLeaderboardUserClick(entry: ScoreEntry) {
    setShowLeaderboard(false)
    setSelectedUser(entry)
  }

  const isStart = gamePhase === 'start'
  const isUrgent = timeLeft <= 30 && gamePhase === 'playing'

  return (
    <>
      <div className="w-full mb-7">
        <div className="flex items-center justify-between w-full px-4 py-3">

          {/* 왼쪽: 점수 / 최고기록 */}
          <div className="flex gap-6 flex-1">
            {!isStart ? (
              <>
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">점수</div>
                  <div className="text-3xl font-black text-white score-display">{score}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">최고기록</div>
                  <div className="text-3xl font-black text-yellow-400">{personalBest}</div>
                </div>
              </>
            ) : personalBest > 0 ? (
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">최고기록</div>
                <div className="text-3xl font-black text-yellow-400">{personalBest}</div>
              </div>
            ) : null}
          </div>

          {/* 중앙: 타이머 */}
          <div className="text-center">
            {!isStart && (
              <>
                <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">남은 시간</div>
                <div
                  className={`text-4xl font-black tabular-nums transition-colors ${
                    isUrgent ? 'text-red-400 timer-shake' : 'text-white'
                  }`}
                >
                  {formatTime(timeLeft)}
                </div>
              </>
            )}
          </div>

          {/* 오른쪽 */}
          <div className="flex items-center justify-end gap-2 flex-1">
            {isStart ? (
              <>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                  style={{ background: '#374151', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  🏆 랭킹
                </button>

                {user ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowProfile(true)}
                      className="px-3 py-2 rounded-lg text-sm transition-all active:scale-95 hover:bg-gray-600"
                      style={{ background: '#374151', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <span className="text-gray-200 font-semibold">👤 {displayName}</span>
                    </button>
                    <button
                      onClick={signOut}
                      className="px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                      style={{ background: '#374151', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuth(true)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                    style={{ background: '#374151', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    로그인
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={goHome}
                  className="px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                  style={{ background: '#374151', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  🏠 홈
                </button>
                <button
                  onClick={startGame}
                  className="px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                  style={{ background: '#374151', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  🔄 다시하기
                </button>
              </>
            )}
          </div>
        </div>

        {/* 게이지바: 게임 중일 때만, 컨테이너 전체 너비 */}
        {!isStart && (
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${(timeLeft / 120) * 100}%`,
                background: isUrgent
                  ? 'linear-gradient(90deg, #ef4444, #f97316)'
                  : 'linear-gradient(90deg, #22c55e, #3b82f6)',
              }}
            />
          </div>
        )}
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
            <Leaderboard onUserClick={handleLeaderboardUserClick} />
            <button
              onClick={() => setShowLeaderboard(false)}
              className="w-full mt-4 py-3 rounded-2xl text-sm font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-all active:scale-95"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {showAuth && (
        <AuthModal
          onSuccess={() => setShowAuth(false)}
          onClose={() => setShowAuth(false)}
          onSignupDone={() => {
            setShowAuth(false)
            setPendingAuth({ notice: '📧 인증 메일을 확인 후 로그인해 주세요.', openLogin: true })
          }}
        />
      )}

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

      {selectedUser && (
        <ProfileModal
          onClose={() => setSelectedUser(null)}
          targetUserId={selectedUser.user_id}
          targetDisplayName={selectedUser.display_name}
        />
      )}
    </>
  )
}
