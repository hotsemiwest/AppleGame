import { useEffect } from 'react'
import { useMultiStore } from '../store/multiStore'

export function MultiCountdown() {
  const { countdownValue, decrementCountdown } = useMultiStore()

  useEffect(() => {
    const id = setTimeout(decrementCountdown, 1000)
    return () => clearTimeout(id)
  }, [countdownValue, decrementCountdown])

  const isGo = countdownValue <= 0
  const display = isGo ? 'GO!' : String(countdownValue)

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
    >
      <div
        key={display}
        className="countdown-number"
        style={{
          fontSize: 160,
          fontWeight: 900,
          lineHeight: 1,
          color: isGo ? '#22c55e' : 'white',
          textShadow: isGo
            ? '0 0 80px rgba(34,197,94,0.9)'
            : '0 0 60px rgba(99,102,241,0.8)',
          userSelect: 'none',
        }}
      >
        {display}
      </div>
      {!isGo && (
        <p className="text-gray-400 text-lg font-semibold mt-4 tracking-widest uppercase">
          준비하세요
        </p>
      )}
      <style>{`
        @keyframes countdown-pop {
          0%   { transform: scale(1.4); opacity: 0; }
          30%  { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .countdown-number {
          animation: countdown-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>
    </div>
  )
}
