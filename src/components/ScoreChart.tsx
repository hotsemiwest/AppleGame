import { useState } from 'react'

export interface HistoryEntry {
  score: number
  played_at: string
}

export function ScoreChart({ history }: { history: HistoryEntry[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (history.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-6">
        플레이 기록이 없습니다
      </div>
    )
  }

  const W = 300, H = 110
  const PL = 30, PR = 10, PT = 8, PB = 20
  const chartW = W - PL - PR
  const chartH = H - PT - PB

  const scores = history.map(d => d.score)
  const n = scores.length
  const maxS = Math.max(...scores, 1)
  const minS = Math.min(...scores, 0)
  const range = maxS - minS || 1

  const cx = (i: number) => PL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW)
  const cy = (s: number) => PT + chartH - ((s - minS) / range) * chartH

  const pathD = scores
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${cx(i).toFixed(1)} ${cy(s).toFixed(1)}`)
    .join(' ')

  const bestScore = Math.max(...scores)
  const bestIdx = scores.lastIndexOf(bestScore)

  const yTicks = Array.from(new Set([minS, Math.round((minS + maxS) / 2), maxS]))

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * W
    let nearest = 0
    let minDist = Infinity
    scores.forEach((_, i) => {
      const dist = Math.abs(cx(i) - svgX)
      if (dist < minDist) { minDist = dist; nearest = i }
    })
    setHoveredIdx(nearest)
  }

  // 팝오버 위치 계산
  const tipW = 36, tipH = 18
  const hoveredTooltip = hoveredIdx !== null ? (() => {
    const x = cx(hoveredIdx)
    const y = cy(scores[hoveredIdx])
    const tipX = Math.min(Math.max(x - tipW / 2, PL), W - PR - tipW)
    const tipY = y - tipH - 8 < PT ? y + 8 : y - tipH - 8
    return { x, y, tipX, tipY }
  })() : null

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', cursor: 'crosshair' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      {/* 가로 그리드 */}
      {yTicks.map(s => (
        <line key={s} x1={PL} x2={W - PR} y1={cy(s)} y2={cy(s)}
          stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      ))}

      {/* Y축 레이블 */}
      {yTicks.map(s => (
        <text key={s} x={PL - 4} y={cy(s)} textAnchor="end" dominantBaseline="middle"
          fill="rgba(255,255,255,0.3)" fontSize={9}>
          {s}
        </text>
      ))}

      {/* X축 레이블 */}
      <text x={cx(0)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9}>1</text>
      {n > 1 && (
        <text x={cx(n - 1)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9}>{n}</text>
      )}

      {/* 라인 */}
      {n > 1 && (
        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth={2}
          strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* 점 */}
      {scores.map((s, i) => (
        <circle key={i} cx={cx(i)} cy={cy(s)}
          r={i === bestIdx ? 5 : 3}
          fill={i === bestIdx ? '#FFD700' : '#22c55e'}
          stroke={i === bestIdx ? 'rgba(255,255,255,0.8)' : 'none'}
          strokeWidth={i === bestIdx ? 1.5 : 0}
        />
      ))}

      {/* 호버 오버레이 */}
      {hoveredIdx !== null && hoveredTooltip && (
        <>
          {/* 수직 가이드라인 */}
          <line
            x1={hoveredTooltip.x} x2={hoveredTooltip.x}
            y1={PT} y2={H - PB}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
            strokeDasharray="3,2"
          />
          {/* 하이라이트 원 */}
          <circle
            cx={hoveredTooltip.x} cy={hoveredTooltip.y}
            r={5}
            fill="white"
            opacity={0.9}
          />
          {/* 팝오버 배경 */}
          <rect
            x={hoveredTooltip.tipX} y={hoveredTooltip.tipY}
            width={tipW} height={tipH}
            rx={4}
            fill="rgba(20,20,20,0.92)"
          />
          {/* 팝오버 텍스트 */}
          <text
            x={hoveredTooltip.tipX + tipW / 2}
            y={hoveredTooltip.tipY + tipH / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={10}
            fontWeight="bold"
          >
            {scores[hoveredIdx]}
          </text>
        </>
      )}
    </svg>
  )
}
