import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { countSolutions, formatTime } from '../utils/gameLogic'
import { TIME_ATTACK_TARGET } from '../types/game'
import { Leaderboard } from './Leaderboard'
import { AuthModal } from './AuthModal'
import { ProfileModal } from './ProfileModal'
import { SettingsButton } from './SettingsButton'
import { C, G } from '../theme/tokens'
import { SegmentedControl } from './SegmentedControl'

export function Header() {
  const { score, personalBest, personalBestTime, timeLeft, elapsedTime, gameMode, gamePhase, startGame, goHome, board } = useGameStore()
  const { user, displayName, signOut, setPendingAuth } = useAuthStore()
  const theme = useThemeStore(s => s.theme)
  const showHintCount = useThemeStore(s => s.showHintCount)

  const solutionCount = useMemo(() => {
    if (!showHintCount || gamePhase !== 'playing') return 0
    return countSolutions(board)
  }, [board, showHintCount, gamePhase])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboardTab, setLeaderboardTab] = useState<'score' | 'time'>('score')
  const [showAuth, setShowAuth] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; display_name: string } | null>(null)

  function handleLeaderboardUserClick(entry: { user_id: string; display_name: string }) {
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
                {gameMode === 'time' ? (
                  <>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">진행도</div>
                      <div className={`text-3xl font-bold score-display ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {score}<span className="text-base font-semibold text-gray-400">/{TIME_ATTACK_TARGET}</span>
                      </div>
                    </div>
                    {personalBestTime > 0 && (
                      <div className="text-center">
                        <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">최고기록</div>
                        <div className="text-3xl font-bold" style={{ color: C.orange }}>{formatTime(personalBestTime)}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">점수</div>
                      <div className={`text-3xl font-bold score-display ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{score}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">최고기록</div>
                      <div className="text-3xl font-bold" style={{ color: C.accentYellow }}>{personalBest}</div>
                    </div>
                  </>
                )}
                {showHintCount && gamePhase === 'playing' && (
                  <div className="text-center">
                    <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">조합 수</div>
                    <div className="text-3xl font-bold" style={{ color: C.blue }}>{solutionCount}</div>
                  </div>
                )}
              </>
            ) : (personalBest > 0 || personalBestTime > 0) ? (
              <div className="flex items-center gap-2">
                {personalBest > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: C.surfaceRaised, border: `1px solid ${C.borderGhost}` }}
                  >
                    <span style={{ color: C.textSub }}>⏱️스코어 어택</span>
                    <span className="font-bold" style={{ color: C.accentYellow }}>{personalBest}점</span>
                  </div>
                )}
                {personalBestTime > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: C.surfaceRaised, border: `1px solid ${C.borderGhost}` }}
                  >
                    <span style={{ color: C.textSub }}>🎯타임 어택</span>
                    <span className="font-bold" style={{ color: C.accentYellow }}>{formatTime(personalBestTime)}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* 중앙: 타이머 */}
          <div className="text-center">
            {!isStart && (
              gameMode === 'time' ? (
                <>
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">경과 시간</div>
                  <div className={`text-4xl font-black tabular-nums ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {formatTime(elapsedTime)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">남은 시간</div>
                  <div
                    className={`text-4xl font-black tabular-nums transition-colors ${
                      isUrgent ? `${theme === 'light' ? 'text-red-600' : 'text-red-400'} timer-shake` : theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </div>
                </>
              )
            )}
          </div>

          {/* 오른쪽 */}
          <div className="flex items-center justify-end gap-2 flex-1">
            {isStart ? (
              <>
                <SettingsButton />
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
                      className="px-3 py-2 rounded-lg text-sm transition-all active:scale-95"
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
                <SettingsButton />
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
                width: gameMode === 'time'
                  ? `${Math.min((score / TIME_ATTACK_TARGET) * 100, 100)}%`
                  : `${(timeLeft / 120) * 100}%`,
                background: gameMode === 'time'
                  ? `linear-gradient(90deg, ${C.orange}, ${C.amber})`
                  : isUrgent ? G.timerUrgent : G.timerNormal,
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
            <h2 className="text-xl font-bold text-center mb-3" style={{ color: C.textPrimary }}>🏆 TOP 10</h2>
            <div className="mb-3">
              <SegmentedControl
                options={[
                  { value: 'score', label: '⏱️ 스코어 어택' },
                  { value: 'time',  label: '🎯 타임 어택' },
                ]}
                value={leaderboardTab}
                onChange={setLeaderboardTab}
              />
            </div>
            <Leaderboard mode={leaderboardTab} onUserClick={handleLeaderboardUserClick} />
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
    </>
  )
}
