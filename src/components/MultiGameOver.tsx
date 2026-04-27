import { useMultiStore } from '../store/multiStore'
import { C } from '../theme/tokens'

export function MultiGameOver() {
  const {
    winner, isHost,
    myName, opponentName,
    myScore, opponentScore,
    opponentLeft,
    rematch, leaveRoom,
  } = useMultiStore()

  const hostName = isHost ? myName : opponentName
  const guestName = isHost ? opponentName : myName
  const hostScore = isHost ? myScore : opponentScore
  const guestScore = isHost ? opponentScore : myScore

  const emoji = winner === 'me' ? '🏆' : winner === 'draw' ? '🤝' : '😔'
  const title = winner === 'me' ? '승리!' : winner === 'draw' ? '무승부!' : '패배!'
  const titleColor = winner === 'draw' ? 'text-blue-400' : winner !== 'me' ? 'text-gray-400' : ''

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: C.scrim85, backdropFilter: 'blur(6px)' }}
    >
      <div
        className="rounded-3xl p-6 w-full mx-4 shadow-2xl text-center"
        style={{ maxWidth: 360, background: C.surface, border: `1px solid ${C.borderStrong}` }}
      >
        <div className="text-5xl mb-3">{emoji}</div>
        <h2 className={`text-3xl font-black mb-6 ${titleColor}`} style={winner === 'me' ? { color: C.accentYellow } : {}}>{title}</h2>

        <div className="space-y-3 mb-6">
          {/* 호스트 */}
          <div
            className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{
              background: isHost ? C.myRowBg : C.surfaceGhost,
              border: isHost ? `1px solid ${C.myRowBorder}` : `1px solid ${C.borderFaint}`,
            }}
          >
            <span className="text-sm font-semibold truncate max-w-[140px]" style={{ color: C.textSub }}>
              {isHost ? `👑 ${hostName ?? '호스트'}` : `👤 ${hostName ?? '호스트'}`}
            </span>
            <span className="text-2xl font-black" style={{ color: C.textPrimary }}>{hostScore}</span>
          </div>

          {/* 게스트 */}
          <div
            className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{
              background: !isHost ? C.myRowBg : C.surfaceGhost,
              border: !isHost ? `1px solid ${C.myRowBorder}` : `1px solid ${C.borderFaint}`,
            }}
          >
            <span className="text-sm font-semibold truncate max-w-[140px]" style={{ color: C.textSub }}>
              {!isHost ? `👑 ${guestName ?? '게스트'}` : `👤 ${guestName ?? '게스트'}`}
            </span>
            <span className="text-2xl font-black" style={{ color: C.textPrimary }}>{guestScore}</span>
          </div>
        </div>

        {opponentLeft && (
          <p className="text-sm text-gray-400 mb-3">상대방이 게임을 나갔습니다.</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={leaveRoom}
            className="flex-1 py-3.5 rounded-2xl text-base font-black transition-all active:scale-95 panel-hover"
            style={{ background: C.surfaceRaised, color: C.textSub }}
          >
            🏠 홈으로
          </button>
          <button
            onClick={rematch}
            disabled={opponentLeft}
            className={`flex-1 py-3.5 rounded-2xl text-base font-black transition-all active:scale-95 shadow-lg ${opponentLeft ? 'cursor-not-allowed opacity-50' : 'text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500'}`}
            style={opponentLeft ? { background: C.surfaceRaised, color: C.textFaint } : {}}
          >
            🔄 다시하기
          </button>
        </div>
      </div>
    </div>
  )
}
