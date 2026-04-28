import { useEffect, useState } from 'react'
import { useMultiStore } from '../store/multiStore'
import { MultiGameBoard } from './MultiGameBoard'
import { C, G } from '../theme/tokens'
import { TIME_ATTACK_TARGET } from '../types/game'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MultiGame() {
  const {
    myName, opponentName, isHost,
    myScore, opponentScore, timeLeft, elapsedTime, gameMode,
    deadlockNotice, tick, forfeit,
  } = useMultiStore()

  const [showDeadlock, setShowDeadlock] = useState(false)

  useEffect(() => {
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tick])

  useEffect(() => {
    if (deadlockNotice) {
      setShowDeadlock(true)
      const id = setTimeout(() => setShowDeadlock(false), 2000)
      return () => clearTimeout(id)
    }
  }, [deadlockNotice])

  const hostName = isHost ? myName : opponentName
  const guestName = isHost ? opponentName : myName
  const hostScore = isHost ? myScore : opponentScore
  const guestScore = isHost ? opponentScore : myScore
  const isUrgent = gameMode === 'score' && timeLeft <= 30

  return (
    <div className="flex flex-col items-center w-full">
      {/* 데드락 토스트 */}
      {showDeadlock && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-xl"
          style={{ background: G.purple, border: `1px solid ${C.borderLit}`, whiteSpace: 'nowrap' }}
        >
          🔄 보드가 초기화되었습니다
        </div>
      )}

      {/* HUD */}
      <div className="w-full mb-4 flex items-center justify-between px-2">
        {/* 호스트 점수 */}
        <div className={`flex-1 text-left ${isHost ? 'opacity-100' : 'opacity-70'}`}>
          <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold truncate max-w-[120px]">
            {isHost ? '👤 나' : `👤 ${hostName ?? '호스트'}`}
          </div>
          {gameMode === 'time' ? (
            <div className="text-3xl font-bold" style={{ color: C.textPrimary }}>
              {hostScore}<span className="text-base font-semibold text-gray-400">/{TIME_ATTACK_TARGET}</span>
            </div>
          ) : (
            <div className="text-3xl font-bold" style={{ color: C.textPrimary }}>{hostScore}</div>
          )}
        </div>

        {/* 타이머 */}
        <div className="text-center mx-4">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
            {gameMode === 'time' ? '경과 시간' : '남은 시간'}
          </div>
          <div
            className={`text-4xl font-black tabular-nums transition-colors ${isUrgent ? 'text-red-400' : ''}`}
            style={isUrgent ? {} : { color: C.textPrimary }}
          >
            {gameMode === 'time' ? formatTime(elapsedTime) : formatTime(timeLeft)}
          </div>
        </div>

        {/* 게스트 점수 */}
        <div className={`flex-1 text-right ${!isHost ? 'opacity-100' : 'opacity-70'}`}>
          <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold truncate max-w-[120px] ml-auto">
            {!isHost ? '👤 나' : `👤 ${guestName ?? '게스트'}`}
          </div>
          {gameMode === 'time' ? (
            <div className="text-3xl font-bold" style={{ color: C.textPrimary }}>
              {guestScore}<span className="text-base font-semibold text-gray-400">/{TIME_ATTACK_TARGET}</span>
            </div>
          ) : (
            <div className="text-3xl font-bold" style={{ color: C.textPrimary }}>{guestScore}</div>
          )}
        </div>
      </div>

      {/* 게이지바 */}
      <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ background: C.borderGhost }}>
        {gameMode === 'time' ? (
          <div className="h-full flex gap-0.5">
            <div
              className="h-full rounded-l-full transition-all duration-300"
              style={{
                width: `${Math.min((hostScore / TIME_ATTACK_TARGET) * 50, 50)}%`,
                background: G.multiTimer,
              }}
            />
            <div
              className="h-full rounded-r-full transition-all duration-300 ml-auto"
              style={{
                width: `${Math.min((guestScore / TIME_ATTACK_TARGET) * 50, 50)}%`,
                background: G.timerUrgent,
              }}
            />
          </div>
        ) : (
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${(timeLeft / 120) * 100}%`,
              background: isUrgent ? G.timerUrgent : G.multiTimer,
            }}
          />
        )}
      </div>

      {/* 나가기 버튼 */}
      <div className="w-full flex justify-end mb-2">
        <button
          onClick={forfeit}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 transition-colors"
          style={{ background: C.surfaceRaised, border: `1px solid ${C.borderGhost}` }}
        >
          나가기
        </button>
      </div>

      {/* 보드 */}
      <MultiGameBoard />
    </div>
  )
}
