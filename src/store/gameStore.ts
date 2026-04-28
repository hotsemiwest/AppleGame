import { create } from 'zustand'
import {
  Board, GamePhase, GameMode, Particle, ParticleTier, ScorePopup,
  SelectionRect, CellRef, GAME_DURATION, TIME_ATTACK_TARGET,
} from '../types/game'
import { PARTICLE_COLORS } from '../theme/tokens'
import { generateBoard } from '../utils/boardGenerator'
import { isValidSelection, clearRect } from '../utils/gameLogic'

const PERSONAL_BEST_KEY = 'personalBestScore'
const TIME_ATTACK_BEST_KEY = 'timeAttackBest'

let _persistBest = false
export function setPersonalBestPersistence(persist: boolean) {
  _persistBest = persist
}

function loadPersonalBest(): number {
  return parseInt(localStorage.getItem(PERSONAL_BEST_KEY) ?? '0', 10)
}

function loadPersonalBestTime(): number {
  return parseInt(localStorage.getItem(TIME_ATTACK_BEST_KEY) ?? '0', 10)
}

function getTier(count: number): ParticleTier {
  if (count >= 4) return 'big'
  if (count >= 3) return 'combo'
  return 'normal'
}

const TIER_CONFIG: Record<ParticleTier, { perTile: number; size: number; baseDist: number; duration: number }> = {
  normal: { perTile: 10, size: 10,  baseDist: 65,  duration: 650  },
  combo:  { perTile: 15, size: 15,  baseDist: 95,  duration: 820  },
  big:    { perTile: 22, size: 19,  baseDist: 130, duration: 1050 },
}

// Small bright sparks that shoot farther and faster (combo/big only)
const SPARKLE_COLORS = ['#FFFFFF', '#FFD700', '#FF8C00'] as const

const TIER_COLORS: Record<ParticleTier, readonly string[]> = PARTICLE_COLORS

// Shared builder — used by both player and opponent so effects are identical
function buildParticles(cells: CellRef[], isOpponent: boolean): [Particle[], number] {
  const count = cells.length
  const tier = getTier(count)
  const { perTile, size, baseDist, duration } = TIER_CONFIG[tier]
  const colors = TIER_COLORS[tier]
  const ts = Date.now()
  const prefix = isOpponent ? 'op' : 'p'

  const particles: Particle[] = []
  for (const cell of cells) {
    const angleOffset = Math.random() * (360 / perTile)

    // Main burst
    for (let i = 0; i < perTile; i++) {
      const angle = (i / perTile) * 360 + angleOffset
      const dist = baseDist * (0.65 + Math.random() * 0.7)
      particles.push({
        id: `${prefix}-${cell.row}-${cell.col}-${i}-${ts}`,
        row: cell.row,
        col: cell.col,
        color: colors[i % colors.length],
        angle,
        size: size * (0.7 + Math.random() * 0.6),
        distance: dist,
        duration,
        tier,
        shape: 'circle',
        delay: Math.random() * 60,
        ...(isOpponent && { isOpponent: true }),
      })
    }

    // Sparkle secondary burst (combo / big only)
    if (tier !== 'normal') {
      const sparkCount = tier === 'big' ? 7 : 4
      const sparkDist = baseDist * 1.55
      const sparkDur  = Math.round(duration * 0.48)
      for (let i = 0; i < sparkCount; i++) {
        particles.push({
          id: `${prefix}-sp-${cell.row}-${cell.col}-${i}-${ts}`,
          row: cell.row,
          col: cell.col,
          color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
          angle: Math.random() * 360,
          size: 5,
          distance: sparkDist * (0.8 + Math.random() * 0.4),
          duration: sparkDur,
          tier,
          shape: 'circle',
          delay: 30 + Math.random() * 90,
          rotation: 0,
          ...(isOpponent && { isOpponent: true }),
        })
      }
    }
  }

  return [particles, duration]
}

interface GameState {
  board: Board
  score: number
  personalBest: number
  personalBestTime: number  // seconds, 0 = no record
  gamePhase: GamePhase
  gameMode: GameMode
  timeLeft: number
  elapsedTime: number  // seconds, counts up in time attack
  particles: Particle[]
  scorePopups: ScorePopup[]
  isNewRecord: boolean

  startGame: () => void
  startScoreAttack: () => void
  startTimeAttack: () => void
  beginPlaying: () => void
  endGame: () => void
  goHome: () => void
  resetPersonalBest: () => void
  setPersonalBest: (score: number) => void
  setPersonalBestTime: (t: number) => void
  confirmSelection: (rect: SelectionRect) => void
  spawnParticles: (cells: CellRef[]) => void
  spawnOpponentParticles: (cells: CellRef[]) => void
  tick: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  board: [],
  score: 0,
  personalBest: loadPersonalBest(),
  personalBestTime: loadPersonalBestTime(),
  gamePhase: 'start',
  gameMode: 'score',
  timeLeft: GAME_DURATION,
  elapsedTime: 0,
  particles: [],
  scorePopups: [],
  isNewRecord: false,

  startGame: () => {
    set({ gamePhase: 'countdown' })
  },

  startScoreAttack: () => {
    set({ gameMode: 'score', gamePhase: 'countdown' })
  },

  startTimeAttack: () => {
    set({ gameMode: 'time', gamePhase: 'countdown' })
  },

  beginPlaying: () => {
    set({
      board: generateBoard(),
      score: 0,
      timeLeft: GAME_DURATION,
      elapsedTime: 0,
      particles: [],
      scorePopups: [],
      gamePhase: 'playing',
      isNewRecord: false,
    })
  },

  goHome: () => {
    set({ gamePhase: 'start', particles: [], scorePopups: [] })
  },

  endGame: () => {
    const { score, personalBest, personalBestTime, elapsedTime, gameMode } = get()
    if (gameMode === 'score') {
      const isNewRecord = score > personalBest
      if (isNewRecord && _persistBest) {
        localStorage.setItem(PERSONAL_BEST_KEY, String(score))
      }
      set({
        gamePhase: 'ended',
        personalBest: isNewRecord ? score : personalBest,
        isNewRecord,
      })
    } else {
      const isNewRecord = personalBestTime === 0 || elapsedTime < personalBestTime
      if (isNewRecord && _persistBest) {
        localStorage.setItem(TIME_ATTACK_BEST_KEY, String(elapsedTime))
      }
      set({
        gamePhase: 'ended',
        personalBestTime: isNewRecord ? elapsedTime : personalBestTime,
        isNewRecord,
      })
    }
  },

  resetPersonalBest: () => {
    localStorage.removeItem(PERSONAL_BEST_KEY)
    localStorage.removeItem(TIME_ATTACK_BEST_KEY)
    set({ personalBest: 0, personalBestTime: 0 })
  },

  setPersonalBest: (score: number) => {
    localStorage.setItem(PERSONAL_BEST_KEY, String(score))
    set({ personalBest: score })
  },

  setPersonalBestTime: (t: number) => {
    localStorage.setItem(TIME_ATTACK_BEST_KEY, String(t))
    set({ personalBestTime: t })
  },

  confirmSelection: (rect: SelectionRect) => {
    const { board, score, gameMode } = get()
    if (!isValidSelection(board, rect)) return
    const { newBoard, cleared } = clearRect(board, rect)
    get().spawnParticles(cleared)
    const newScore = score + cleared.length
    set({ board: newBoard, score: newScore })
    if (gameMode === 'time' && newScore >= TIME_ATTACK_TARGET) {
      get().endGame()
    }
  },

  spawnParticles: (cells: CellRef[]) => {
    const [newParticles, duration] = buildParticles(cells, false)
    const count = cells.length
    const tier = getTier(count)
    const ts = Date.now()

    const newPopups: ScorePopup[] = []
    if (tier !== 'normal') {
      const rows = cells.map(c => c.row)
      const cols = cells.map(c => c.col)
      newPopups.push({
        id: `popup-${ts}`,
        count,
        centerRow: (Math.min(...rows) + Math.max(...rows)) / 2,
        centerCol: (Math.min(...cols) + Math.max(...cols)) / 2,
        tier: tier === 'big' ? 'big' : 'combo',
      })
    }

    set(state => ({
      particles: [...state.particles, ...newParticles],
      scorePopups: [...state.scorePopups, ...newPopups],
    }))
    setTimeout(() => {
      set(state => ({
        particles: state.particles.filter(p => !newParticles.some(np => np.id === p.id)),
        scorePopups: state.scorePopups.filter(p => !newPopups.some(np => np.id === p.id)),
      }))
    }, duration + 400)
  },

  spawnOpponentParticles: (cells: CellRef[]) => {
    const [newParticles, duration] = buildParticles(cells, true)
    set(state => ({ particles: [...state.particles, ...newParticles] }))
    setTimeout(() => {
      set(state => ({ particles: state.particles.filter(p => !newParticles.some(np => np.id === p.id)) }))
    }, duration + 200)
  },

  tick: () => {
    const { timeLeft, elapsedTime, gameMode } = get()
    if (gameMode === 'score') {
      if (timeLeft <= 1) {
        get().endGame()
      } else {
        set({ timeLeft: timeLeft - 1 })
      }
    } else {
      set({ elapsedTime: elapsedTime + 1 })
    }
  },

}))
