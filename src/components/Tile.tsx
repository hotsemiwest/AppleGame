import { memo } from 'react'

const APPLE_COLOR = '#D92B2B'

interface TileProps {
  value: number | null
}

function AppleSVG({ value }: { value: number }) {
  return (
    <svg
      viewBox="0 0 52 52"
      width="52"
      height="52"
      style={{ display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.32))' }}
    >
      <g transform="translate(0, -3)">
        <path
          d="M26 10 C26 7 29 4 32 5"
          stroke="#4a2c0a"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M26 10 C27 6 34 6 32 11 C29 13 26 10 26 10Z"
          fill="#2e7d32"
        />
        <path
          d="M 20 14
             C 12 13 7 20 7 28
             C 7 40 16 50 26 50
             C 36 50 45 40 45 28
             C 45 20 40 13 32 14
             C 30 13 28 15 26 16
             C 24 15 22 13 20 14 Z"
          fill={APPLE_COLOR}
        />
        <ellipse
          cx="16"
          cy="24"
          rx="4.5"
          ry="2.8"
          fill="rgba(255,255,255,0.28)"
          transform="rotate(-25 16 24)"
        />
        <text
          x="26"
          y="33"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.95)"
          fontSize="26"
          fontWeight="900"
          style={{
            userSelect: 'none',
            pointerEvents: 'none',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          {value}
        </text>
      </g>
    </svg>
  )
}

export const Tile = memo(function Tile({ value }: TileProps) {
  if (value === null) {
    return <div style={{ width: 52, height: 52 }} />
  }
  return <AppleSVG value={value} />
})
