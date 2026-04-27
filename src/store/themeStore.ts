import { create } from 'zustand'
import {
  Theme, TileShape, TileColorId,
  DEFAULT_THEME, DEFAULT_SHAPE, DEFAULT_COLOR,
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

function load(): Partial<Saved> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
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
