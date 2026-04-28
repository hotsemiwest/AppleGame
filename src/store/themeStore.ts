import { create } from 'zustand'
import {
  Theme, TileShape, TileColorId,
  DEFAULT_THEME, DEFAULT_SHAPE, DEFAULT_COLOR, TILE_COLORS,
} from '../theme/tokens'

interface ThemeState {
  theme: Theme
  tileShape: TileShape
  tileColorId: TileColorId
  showHintCount: boolean
  setTheme: (t: Theme) => void
  setTileShape: (s: TileShape) => void
  setTileColor: (id: TileColorId) => void
  setShowHintCount: (v: boolean) => void
}

const KEY = 'applebox_theme'

type Saved = Pick<ThemeState, 'theme' | 'tileShape' | 'tileColorId' | 'showHintCount'>

const THEMES: Theme[] = ['light', 'dark']
const TILE_SHAPES: TileShape[] = ['apple', 'circle', 'square']

function load(): Partial<Saved> {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Saved>

    return {
      theme: THEMES.includes(saved.theme as Theme) ? saved.theme : DEFAULT_THEME,
      tileShape: TILE_SHAPES.includes(saved.tileShape as TileShape) ? saved.tileShape : DEFAULT_SHAPE,
      tileColorId: TILE_COLORS.some(color => color.id === saved.tileColorId) ? saved.tileColorId : DEFAULT_COLOR,
      showHintCount: typeof saved.showHintCount === 'boolean' ? saved.showHintCount : true,
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
  ...load(),

  setTheme:         (theme)         => { set({ theme });         save({ theme }) },
  setTileShape:     (tileShape)     => { set({ tileShape });     save({ tileShape }) },
  setTileColor:     (tileColorId)   => { set({ tileColorId });   save({ tileColorId }) },
  setShowHintCount: (showHintCount) => { set({ showHintCount }); save({ showHintCount }) },
}))
