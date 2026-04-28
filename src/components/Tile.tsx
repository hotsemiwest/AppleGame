import { memo } from 'react'
import { useThemeStore } from '../store/themeStore'
import { TILE_COLORS } from '../theme/tokens'

const TEXT_STYLE: React.CSSProperties = {
  userSelect: 'none',
  pointerEvents: 'none',
  fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

const SVG_STYLE: React.CSSProperties = {
  display: 'block',
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.32))',
}

function AppleSVG({ value, fill }: { value: number; fill: string }) {
  return (
    <svg viewBox="0 0 52 52" width="52" height="52" style={SVG_STYLE}>
      <g transform="translate(0, -3)">
        <path d="M26 15 C26 12 28.5 9.5 31 10.5" stroke="#4a2c0a" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path
          d="M26 16 C21 12, 12.5 13, 8.5 20 C4.8 27, 7.9 39, 15.5 45.2 C20.3 49, 31.7 49, 36.5 45.2 C44.1 39, 47.2 27, 43.5 20 C39.5 13, 31 12, 26 16 Z"
          fill={fill}
        />
        <ellipse cx="16" cy="24" rx="4.5" ry="2.8" fill="rgba(255,255,255,0.28)" transform="rotate(-25 16 24)" />
        <text x="26" y="33" textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.95)" fontSize="24" fontWeight="800" style={TEXT_STYLE}>
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
      <text x="26" y="28" textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.95)" fontSize="24" fontWeight="800" style={TEXT_STYLE}>
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
      <text x="26" y="28" textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.95)" fontSize="24" fontWeight="800" style={TEXT_STYLE}>
        {value}
      </text>
    </svg>
  )
}

function EightBitSVG({ value, fill }: { value: number; fill: string }) {
  return (
    <svg viewBox="0 0 52 52" width="52" height="52" style={SVG_STYLE} shapeRendering="crispEdges">
      <g transform="translate(0, 0)">
        <rect x="14" y="6" width="24" height="8" fill={fill} />
        <rect x="10" y="10" width="32" height="4" fill={fill} />
        <rect x="6" y="14" width="40" height="24" fill={fill} />
        <rect x="10" y="38" width="32" height="4" fill={fill} />
        <rect x="14" y="42" width="24" height="4" fill={fill} />
        <rect x="14" y="14" width="8" height="4" fill="rgba(255,255,255,0.24)" />
        <rect x="10" y="18" width="8" height="4" fill="rgba(255,255,255,0.16)" />
        <rect x="18" y="18" width="4" height="4" fill="rgba(255,255,255,0.12)" />

        <text x="26" y="28" textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.95)" fontSize="24" fontWeight="800" style={TEXT_STYLE}>
          {value}
        </text>
      </g>
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
  if (tileShape === '8bit') return <EightBitSVG value={value} fill={fill} />
  return <AppleSVG value={value} fill={fill} />
})
