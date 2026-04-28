import { useEffect, useState } from 'react'
import { C } from '../theme/tokens'

interface Props {
  onFinish: () => void
}

export function Countdown({ onFinish }: Props) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    const id = setTimeout(() => {
      if (count > 0) {
        setCount(c => c - 1)
      } else {
        onFinish()
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [count, onFinish])

  const isGo = count <= 0
  const display = isGo ? 'GO!' : String(count)

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center"
      style={{ background: C.scrim72, backdropFilter: 'blur(6px)' }}
    >
      <div
        key={display}
        className="countdown-number"
        style={{
          fontSize: 160,
          fontWeight: 900,
          lineHeight: 1,
          color: isGo ? C.green : C.textPrimary,
          textShadow: isGo
            ? `0 0 80px ${C.goGlow}`
            : `0 0 60px ${C.numGlow}`,
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
