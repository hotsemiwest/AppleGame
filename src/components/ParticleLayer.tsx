import { useGameStore } from '../store/gameStore'
import { C } from '../theme/tokens'

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

        const glowSize = p.tier === 'big' ? p.size * 2 : p.size * 1.2
        const glow = p.tier !== 'normal' ? `0 0 ${glowSize}px ${p.color}` : 'none'

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
                boxShadow: glow,
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
                '--dur': `${p.duration}ms`,
                animationDelay: `${p.delay ?? 0}ms`,
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
            className={isBig ? 'score-popup-big' : 'score-popup'}
            style={{
              position: 'absolute',
              left: cx,
              top: cy,
              fontSize: isBig ? 34 : 24,
              fontWeight: 900,
              color: isBig ? C.popupBig : C.popupCombo,
              textShadow: isBig
                ? `0 0 12px ${C.popupBig}, 0 0 24px ${C.amber}, 0 2px 6px rgba(0,0,0,0.9)`
                : `0 0 8px ${C.popupCombo}, 0 2px 4px rgba(0,0,0,0.8)`,
              fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
