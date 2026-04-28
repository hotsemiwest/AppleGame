import { useEffect, useState } from 'react'
import { C } from '../theme/tokens'

interface Props {
  onFinish: () => void
}

export function Countdown({ onFinish }: Props) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    const id = setTimeout(() => {
      if (count > 1) {
        setCount(c => c - 1)
      } else {
        onFinish()
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [count, onFinish])

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center"
      style={{ background: C.scrim72, backdropFilter: 'blur(6px)' }}
    >
      <div
        key={count}
        className="countdown-number"
        style={{
          fontSize: 160,
          fontWeight: 900,
          lineHeight: 1,
          color: 'rgba(255,255,255,0.95)',
          textShadow: `0 0 60px ${C.numGlow}`,
          userSelect: 'none',
        }}
      >
        {count}
      </div>
      <p className="text-gray-400 text-lg font-semibold mt-4 tracking-widest uppercase">
        준비하세요
      </p>
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
