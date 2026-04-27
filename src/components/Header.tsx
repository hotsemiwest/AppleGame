import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { Leaderboard } from './Leaderboard'
import { AuthModal } from './AuthModal'
import { ProfileModal } from './ProfileModal'
import { SettingsModal } from './SettingsModal'
import { ScoreEntry } from '../lib/supabase'
import { C, G } from '../theme/tokens'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Header() {
  const { score, personalBest, timeLeft, gamePhase, startGame, goHome } = useGameStore()
  const { user, displayName, signOut, setPendingAuth } = useAuthStore()
  const theme = useThemeStore(s => s.theme)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
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
                  <div className={`text-3xl font-black score-display ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{score}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">최고기록</div>
                  <div className="text-3xl font-black" style={{ color: C.accentYellow }}>{personalBest}</div>
                </div>
              </>
            ) : personalBest > 0 ? (
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">최고기록</div>
                <div className="text-3xl font-black" style={{ color: C.accentYellow }}>{personalBest}</div>
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
                    isUrgent ? 'text-red-400 timer-shake' : theme === 'light' ? 'text-gray-900' : 'text-white'
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
                  onClick={() => setShowSettings(true)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                  style={{ background: C.surfaceRaised, color: C.textSub, border: `1px solid ${C.borderGhost}` }}
                >
                  ⚙️ 설정
                </button>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                  style={{ background: C.surfaceRaised, color: C.textSub, border: `1px solid ${C.borderGhost}` }}
                >
                  🏆 랭킹
                </button>

                {user ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowProfile(true)}
                      className="px-3 py-2 rounded-lg text-sm transition-all active:scale-95 hover:bg-gray-600"
                      style={{ background: C.surfaceRaised, border: `1px solid ${C.borderGhost}` }}
                    >
                      <span className={`font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>👤 {displayName}</span>
                    </button>
                    <button
                      onClick={signOut}
                      className="px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                      style={{ background: C.surfaceRaised, color: C.textSub, border: `1px solid ${C.borderGhost}` }}
                    >
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuth(true)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                    style={{ background: C.surfaceRaised, color: C.textSub, border: `1px solid ${C.borderGhost}` }}
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
                  style={{ background: C.surfaceRaised, color: C.textSub, border: `1px solid ${C.borderGhost}` }}
                >
                  🏠 홈
                </button>
                <button
                  onClick={startGame}
                  className="px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                  style={{ background: C.surfaceRaised, color: C.textSub, border: `1px solid ${C.borderGhost}` }}
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
            style={{ background: C.borderGhost }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${(timeLeft / 120) * 100}%`,
                background: isUrgent
                  ? G.timerUrgent
                  : G.timerNormal,
              }}
            />
          </div>
        )}
      </div>

      {showLeaderboard && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: C.scrim75, backdropFilter: 'blur(4px)' }}
          onClick={() => setShowLeaderboard(false)}
        >
          <div
            className="rounded-3xl p-6 w-full mx-4 shadow-2xl"
            style={{ maxWidth: 360, maxHeight: '80vh', overflowY: 'auto', background: C.surface, border: `1px solid ${C.borderStrong}` }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-black text-center mb-4" style={{ color: C.textPrimary }}>🏆 TOP 10</h2>
            <Leaderboard onUserClick={handleLeaderboardUserClick} />
            <button
              onClick={() => setShowLeaderboard(false)}
              className="w-full mt-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 panel-hover"
              style={{ background: C.surfaceRaised, color: C.textSub }}
            >
              닫기
            </button>
          </div>
        </div>,
        document.body
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

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
