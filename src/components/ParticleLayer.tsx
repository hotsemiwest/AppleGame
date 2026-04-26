import { useGameStore } from '../store/gameStore'

const TILE_SIZE = 52
const GAP = 2
const CELL = TILE_SIZE + GAP

export function ParticleLayer() {
  const particles = useGameStore(state => state.particles)
  const scorePopups = useGameStore(state => state.scorePopups)
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 20, overflow: 'visible' }}
    >
      {particles.map(p => {
        const cx = p.col * CELL + TILE_SIZE / 2
        const cy = p.row * CELL + TILE_SIZE / 2
        const angleRad = (p.angle * Math.PI) / 180
        const dx = Math.cos(angleRad) * p.distance
        const dy = Math.sin(angleRad) * p.distance
        const half = p.size / 2

        return (
          <div
            key={p.id}
            className="particle"
            style={
              {
                position: 'absolute',
                left: cx - half,
                top: cy - half,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: p.color,
                boxShadow: p.tier === 'big' && !p.isOpponent ? `0 0 ${p.size}px ${p.color}` : 'none',
                opacity: p.isOpponent ? 0.4 : 1,
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
                '--dur': `${p.duration}ms`,
              } as React.CSSProperties
            }
          />
        )
      })}

      {scorePopups.map(popup => {
        const cx = popup.centerCol * CELL + TILE_SIZE / 2
        const cy = popup.centerRow * CELL + TILE_SIZE / 2
        const isBig = popup.tier === 'big'

        return (
          <div
            key={popup.id}
            className="score-popup"
            style={{
              position: 'absolute',
              left: cx,
              top: cy,
              fontSize: isBig ? 34 : 24,
              fontWeight: 900,
              color: isBig ? '#FFD700' : '#FFA500',
              textShadow: isBig
                ? '0 0 12px #FFD700, 0 0 24px #FF8C00, 0 2px 6px rgba(0,0,0,0.9)'
                : '0 0 8px #FFA500, 0 2px 4px rgba(0,0,0,0.8)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {isBig ? `🔥 +${popup.count}` : `+${popup.count}`}
          </div>
        )
      })}
    </div>
  )
}
