import { useRef, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { C } from '../theme/tokens'
import { Particle } from '../types/game'

const TILE_SIZE = 52
const GAP = 2
const CELL = TILE_SIZE + GAP
const COLS = 17
const ROWS = 10
const BOARD_W = COLS * CELL - GAP
const BOARD_H = ROWS * CELL - GAP

const DEG_TO_RAD = Math.PI / 180
const TWO_PI     = Math.PI * 2
const easeOut    = (t: number) => t * (2 - t)

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], now: number) {
  ctx.clearRect(0, 0, BOARD_W, BOARD_H)
  let currentColor = ''
  for (const p of particles) {
    const elapsed = now - (p.startTime ?? now) - (p.delay ?? 0)
    if (elapsed <= 0) continue
    const progress = elapsed / p.duration
    if (progress >= 1) continue

    const eased    = easeOut(progress)
    // Use precomputed vx/vy/px/py; fall back to on-the-fly calc for old particles
    const vx = p.vx ?? Math.cos(p.angle * DEG_TO_RAD)
    const vy = p.vy ?? Math.sin(p.angle * DEG_TO_RAD)
    const originX = p.px ?? (p.col * CELL + TILE_SIZE / 2)
    const originY = p.py ?? (p.row * CELL + TILE_SIZE / 2)
    const x      = originX + vx * p.distance * eased
    const y      = originY + vy * p.distance * eased
    const radius = (p.size / 2) * (1 - progress)
    if (radius < 0.5) continue

    ctx.globalAlpha = 1 - progress
    if (p.color !== currentColor) {
      ctx.fillStyle = p.color
      currentColor = p.color
    }
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, TWO_PI)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

export function ParticleLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const scorePopups = useGameStore(state => state.scorePopups)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = BOARD_W * dpr
    canvas.height = BOARD_H * dpr
    canvas.style.width = `${BOARD_W}px`
    canvas.style.height = `${BOARD_H}px`
    ctx.scale(dpr, dpr)

    let prevLen = 0
    const loop = () => {
      const particles = useGameStore.getState().particles
      const len = particles.length
      if (len > 0) {
        drawParticles(ctx, particles, Date.now())
      } else if (prevLen > 0) {
        ctx.clearRect(0, 0, BOARD_W, BOARD_H)
      }
      prevLen = len
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      className="absolute pointer-events-none"
      style={{ inset: 0, zIndex: 20 }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          pointerEvents: 'none',
          transform: 'translateZ(0)',
        }}
      />

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
