import { create } from 'zustand'
import {
  Board, GamePhase, Particle, ParticleTier, ScorePopup,
  SelectionRect, CellRef, GAME_DURATION,
} from '../types/game'
import { generateBoard } from '../utils/boardGenerator'
import { isValidSelection, clearRect } from '../utils/gameLogic'

const PERSONAL_BEST_KEY = 'personalBestScore'

function loadPersonalBest(): number {
  return parseInt(localStorage.getItem(PERSONAL_BEST_KEY) ?? '0', 10)
}

function getTier(count: number): ParticleTier {
  if (count >= 4) return 'big'
  if (count >= 3) return 'combo'
  return 'normal'
}

const TIER_CONFIG: Record<ParticleTier, { perTile: number; size: number; baseDist: number; duration: number }> = {
  normal: { perTile: 6,  size: 10, baseDist: 44,  duration: 600 },
  combo:  { perTile: 10, size: 14, baseDist: 72,  duration: 750 },
  big:    { perTile: 16, size: 18, baseDist: 100, duration: 950 },
}

const TIER_COLORS: Record<ParticleTier, string[]> = {
  normal: ['#D92B2B', '#E84040', '#C42020'],
  combo:  ['#FF4500', '#FF8C00', '#FFD700', '#FF6347', '#FFA500'],
  big:    ['#FFD700', '#FF4500', '#00FF88', '#00BFFF', '#FF69B4', '#FFFFFF', '#FF4500', '#FFD700'],
}

interface GameState {
  board: Board
  score: number
  personalBest: number
  gamePhase: GamePhase
  timeLeft: number
  particles: Particle[]
  scorePopups: ScorePopup[]
  isNewRecord: boolean

  startGame: () => void
  endGame: () => void
  goHome: () => void
  confirmSelection: (rect: SelectionRect) => void
  spawnParticles: (cells: CellRef[]) => void
  tick: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  board: [],
  score: 0,
  personalBest: loadPersonalBest(),
  gamePhase: 'start',
  timeLeft: GAME_DURATION,
  particles: [],
  scorePopups: [],
  isNewRecord: false,

  startGame: () => {
    set({
      board: generateBoard(),
      score: 0,
      timeLeft: GAME_DURATION,
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
    const { score, personalBest } = get()
    const isNewRecord = score > personalBest
    if (isNewRecord) {
      localStorage.setItem(PERSONAL_BEST_KEY, String(score))
    }
    set({
      gamePhase: 'ended',
      personalBest: isNewRecord ? score : personalBest,
      isNewRecord,
    })
  },

  confirmSelection: (rect: SelectionRect) => {
    const { board, score } = get()
    if (!isValidSelection(board, rect)) return
    const { newBoard, cleared } = clearRect(board, rect)
    get().spawnParticles(cleared)
    set({ board: newBoard, score: score + cleared.length })
  },

  spawnParticles: (cells: CellRef[]) => {
    const count = cells.length
    const tier = getTier(count)
    const { perTile, size, baseDist, duration } = TIER_CONFIG[tier]
    const colors = TIER_COLORS[tier]
    const ts = Date.now()

    const newParticles: Particle[] = []
    for (const cell of cells) {
      const angleOffset = Math.random() * (360 / perTile)
      for (let i = 0; i < perTile; i++) {
        const angle = (i / perTile) * 360 + angleOffset
        // Vary distance for organic burst feel
        const distance = baseDist * (0.65 + Math.random() * 0.7)
        newParticles.push({
          id: `${cell.row}-${cell.col}-${i}-${ts}`,
          row: cell.row,
          col: cell.col,
          color: colors[i % colors.length],
          angle,
          size,
          distance,
          duration,
          tier,
        })
      }
    }

    // Score popup for combo and big
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

    const popupDuration = duration + 300
    set(state => ({
      particles: [...state.particles, ...newParticles],
      scorePopups: [...state.scorePopups, ...newPopups],
    }))
    setTimeout(() => {
      set(state => ({
        particles: state.particles.filter(p => !newParticles.some(np => np.id === p.id)),
        scorePopups: state.scorePopups.filter(p => !newPopups.some(np => np.id === p.id)),
      }))
    }, popupDuration)
  },

  tick: () => {
    const { timeLeft } = get()
    if (timeLeft <= 1) {
      get().endGame()
    } else {
      set({ timeLeft: timeLeft - 1 })
    }
  },

}))
