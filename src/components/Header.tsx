import { useGameStore } from '../store/gameStore'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Header() {
  const { score, personalBest, timeLeft, gamePhase, startGame, goHome } = useGameStore()
  const isUrgent = timeLeft <= 30 && gamePhase === 'playing'

  return (
    <div className="flex items-center justify-between w-full px-4 py-3 mb-4">
      <div className="flex gap-6 flex-1">
        <div className="text-center">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">점수</div>
          <div className="text-3xl font-black text-white score-display">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">최고기록</div>
          <div className="text-3xl font-black text-yellow-400">{personalBest}</div>
        </div>
      </div>

      <div className="text-center">
        <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">남은 시간</div>
        <div
          className={`text-4xl font-black tabular-nums transition-colors ${
            isUrgent ? 'text-red-400 timer-shake' : 'text-white'
          }`}
        >
          {formatTime(timeLeft)}
        </div>
        <div className="mt-2 w-40 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
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
      </div>

      <div className="flex flex-col items-end gap-2 flex-1">
        <div className="flex gap-2">
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
            🔄 재시작
          </button>
        </div>
      </div>
    </div>
  )
}
