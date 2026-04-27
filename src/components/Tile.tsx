import { memo } from 'react'
import { useThemeStore } from '../store/themeStore'
import { TILE_COLORS } from '../theme/tokens'

const TEXT_STYLE: React.CSSProperties = {
  userSelect: 'none',
  pointerEvents: 'none',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const SVG_STYLE: React.CSSProperties = {
  display: 'block',
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.32))',
}

function AppleSVG({ value, fill }: { value: number; fill: string }) {
  return (
    <svg viewBox="0 0 52 52" width="52" height="52" style={SVG_STYLE}>
      <g transform="translate(0, -3)">
        <path d="M26 10 C26 7 29 4 32 5" stroke="#4a2c0a" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M26 10 C27 6 34 6 32 11 C29 13 26 10 26 10Z" fill="#2e7d32" />
        <path
          d="M 20 14 C 12 13 7 20 7 28 C 7 40 16 50 26 50 C 36 50 45 40 45 28 C 45 20 40 13 32 14 C 30 13 28 15 26 16 C 24 15 22 13 20 14 Z"
          fill={fill}
        />
        <ellipse cx="16" cy="24" rx="4.5" ry="2.8" fill="rgba(255,255,255,0.28)" transform="rotate(-25 16 24)" />
        <text x="26" y="33" textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.95)" fontSize="26" fontWeight="900" style={TEXT_STYLE}>
          {value}
        </text>
      </g>
    </svg>
  )
}

function CircleSVG({ value, fill }: { value: number; fill: string }) {
  return (
    <svg viewBox="0 0 52 52" width="52" height="52" style={SVG_STYLE}>
      <circle cx="26" cy="26" r="19" fill={fill} />
      <ellipse cx="19" cy="19" rx="4" ry="2.5" fill="rgba(255,255,255,0.28)" transform="rotate(-25 19 19)" />
      <text x="26" y="27" textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.95)" fontSize="22" fontWeight="900" style={TEXT_STYLE}>
        {value}
      </text>
    </svg>
  )
}

function SquareSVG({ value, fill }: { value: number; fill: string }) {
  return (
    <svg viewBox="0 0 52 52" width="52" height="52" style={SVG_STYLE}>
      <rect x="7" y="7" width="38" height="38" rx="9" fill={fill} />
      <ellipse cx="15" cy="14" rx="5" ry="3" fill="rgba(255,255,255,0.25)" transform="rotate(-20 15 14)" />
      <text x="26" y="27" textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.95)" fontSize="22" fontWeight="900" style={TEXT_STYLE}>
        {value}
      </text>
    </svg>
  )
}

export const Tile = memo(function Tile({ value }: { value: number | null }) {
  const tileShape   = useThemeStore(s => s.tileShape)
  const tileColorId = useThemeStore(s => s.tileColorId)

  if (value === null) return <div style={{ width: 52, height: 52 }} />

  const fill = TILE_COLORS.find(c => c.id === tileColorId)?.fill ?? '#D92B2B'

  if (tileShape === 'circle') return <CircleSVG value={value} fill={fill} />
  if (tileShape === 'square') return <SquareSVG value={value} fill={fill} />
  return <AppleSVG value={value} fill={fill} />
})
