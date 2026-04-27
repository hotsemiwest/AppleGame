export type Cell = number | null

export type Board = Cell[][]

export interface SelectionRect {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

export interface NormalizedRect {
  minRow: number
  maxRow: number
  minCol: number
  maxCol: number
}

export type GamePhase = 'start' | 'playing' | 'ended'

export type ParticleTier = 'normal' | 'combo' | 'big'

export type ParticleShape = 'circle' | 'diamond'

export interface Particle {
  id: string
  row: number
  col: number
  color: string
  angle: number
  size: number
  distance: number
  duration: number
  tier: ParticleTier
  isOpponent?: boolean
  shape?: ParticleShape
  delay?: number    // animation-delay in ms
  rotation?: number // initial rotation in degrees (used for spinning diamonds)
}

export interface ScorePopup {
  id: string
  count: number
  centerRow: number
  centerCol: number
  tier: 'combo' | 'big'
}

export interface CellRef {
  row: number
  col: number
  value: number
}

export const ROWS = 10
export const COLS = 17
export const GAME_DURATION = 120
export const TARGET_SUM = 10
