import { create } from 'zustand'
import {
  Theme, TileShape, TileColorId,
  DEFAULT_THEME, DEFAULT_SHAPE, DEFAULT_COLOR, TILE_COLORS,
} from '../theme/tokens'
import { DIFFICULTY_CONFIG, isValidDifficulty } from '../config/difficultyConfig'

interface ThemeState {
  theme: Theme
  tileShape: TileShape
  tileColorId: TileColorId
  showHintCount: boolean
  showDifficulty: boolean
  soloBoardDifficulty: number
  showDragSelectionSum: boolean
  showDragSelectionRangeColor: boolean
  devMode: boolean
  setTheme: (t: Theme) => void
  setTileShape: (s: TileShape) => void
  setTileColor: (id: TileColorId) => void
  setShowHintCount: (v: boolean) => void
  setShowDifficulty: (v: boolean) => void
  setSoloBoardDifficulty: (v: number) => void
  setShowDragSelectionSum: (v: boolean) => void
  setShowDragSelectionRangeColor: (v: boolean) => void
  setDevMode: (v: boolean) => void
}

const KEY = 'applebox_theme'

type Saved = Pick<ThemeState, 'theme' | 'tileShape' | 'tileColorId' | 'showHintCount' | 'showDifficulty' | 'soloBoardDifficulty' | 'showDragSelectionSum' | 'showDragSelectionRangeColor' | 'devMode'>

const THEMES: Theme[] = ['light', 'dark']
const TILE_SHAPES: TileShape[] = ['apple', 'circle', 'square', '8bit']

function load(): Partial<Saved> {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Saved>

    return {
      theme: THEMES.includes(saved.theme as Theme) ? saved.theme : DEFAULT_THEME,
      tileShape: TILE_SHAPES.includes(saved.tileShape as TileShape) ? saved.tileShape : DEFAULT_SHAPE,
      tileColorId: TILE_COLORS.some(color => color.id === saved.tileColorId) ? saved.tileColorId : DEFAULT_COLOR,
      showHintCount: typeof saved.showHintCount === 'boolean' ? saved.showHintCount : true,
      showDifficulty: typeof saved.showDifficulty === 'boolean' ? saved.showDifficulty : true,
      soloBoardDifficulty: isValidDifficulty(saved.soloBoardDifficulty) ? saved.soloBoardDifficulty : DIFFICULTY_CONFIG.DEFAULT,
      showDragSelectionSum: typeof saved.showDragSelectionSum === 'boolean' ? saved.showDragSelectionSum : true,
      showDragSelectionRangeColor: typeof saved.showDragSelectionRangeColor === 'boolean' ? saved.showDragSelectionRangeColor : true,
      devMode: typeof saved.devMode === 'boolean' ? saved.devMode : false,
    }
  } catch {
    return {}
  }
}

function save(patch: Partial<Saved>) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...load(), ...patch })) } catch {}
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: DEFAULT_THEME,
  tileShape: DEFAULT_SHAPE,
  tileColorId: DEFAULT_COLOR,
  showHintCount: true,
  showDifficulty: true,
  soloBoardDifficulty: DIFFICULTY_CONFIG.DEFAULT,
  showDragSelectionSum: true,
  showDragSelectionRangeColor: true,
  devMode: false,
  ...load(),

  setTheme:                       (theme)                        => { set({ theme });                        save({ theme }) },
  setTileShape:                   (tileShape)                    => { set({ tileShape });                    save({ tileShape }) },
  setTileColor:                   (tileColorId)                  => { set({ tileColorId });                  save({ tileColorId }) },
  setShowHintCount:               (showHintCount)                => { set({ showHintCount });                save({ showHintCount }) },
  setShowDifficulty:              (showDifficulty)               => { set({ showDifficulty });               save({ showDifficulty }) },
  setSoloBoardDifficulty:         (soloBoardDifficulty)          => { set({ soloBoardDifficulty });          save({ soloBoardDifficulty }) },
  setShowDragSelectionSum:        (showDragSelectionSum)         => { set({ showDragSelectionSum });         save({ showDragSelectionSum }) },
  setShowDragSelectionRangeColor: (showDragSelectionRangeColor)  => { set({ showDragSelectionRangeColor });  save({ showDragSelectionRangeColor }) },
  setDevMode:                     (devMode)                      => { set({ devMode });                      save({ devMode }) },
}))
