// ─── Tile / board theming ──────────────────────────────────────────────────────

export type TileColorId = 'red' | 'crimson' | 'green' | 'forest' | 'salmon' | 'olive'
export type TileShape = 'apple' | 'circle' | 'square'
export type Theme = 'light' | 'dark'

export interface TileColorDef {
  id: TileColorId
  fill: string
  label: string
}

export const TILE_COLORS: TileColorDef[] = [
  { id: 'red',     fill: '#D92B2B', label: '빨강' },
  { id: 'crimson', fill: '#8B0000', label: '진빨강' },
  { id: 'green',   fill: '#3d8b37', label: '초록' },
  { id: 'forest',  fill: '#1B5E20', label: '진초록' },
  { id: 'salmon',  fill: '#E07878', label: '살몬' },
  { id: 'olive',   fill: '#7A7A00', label: '올리브' },
]

export const BOARD_BG: Record<Theme, { background: string; border: string }> = {
  light: { background: '#e8f5e9', border: '1px solid #a5d6a7' },
  dark:  { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' },
}

export const DEFAULT_THEME: Theme       = 'dark'
export const DEFAULT_SHAPE: TileShape   = 'apple'
export const DEFAULT_COLOR: TileColorId = 'red'

// ─── UI color palette ──────────────────────────────────────────────────────────
// Single source of truth for every raw color value used in inline styles.

export const C = {
  // Surfaces — adaptive via CSS custom properties
  bg:           '#111827',                    // body background (dark mode)
  bgLight:      '#f0f4f0',                    // body background (light mode)
  surface:      'var(--c-modal-bg)',          // modals / cards
  surfaceRaised:'var(--c-panel-bg)',          // buttons / raised panels
  surfaceHover: 'var(--c-panel-hover)',       // hover state on surfaceRaised
  surfaceFaint: 'rgba(255,255,255,0.02)',     // board dark background (static)
  surfaceDim:   'var(--c-surface-dim)',       // history panels
  surfaceGhost: 'var(--c-surface-ghost)',     // unselected score row in game-over
  inputBg:      'var(--c-input-bg)',          // input field backgrounds

  // Borders — adaptive via CSS custom properties
  borderStrong: 'var(--c-border)',            // modal outline
  borderMid:    'var(--c-border-mid)',        // input default border
  borderFaint:  'var(--c-border-faint)',      // subtle card borders
  borderGhost:  'var(--c-border-ghost)',      // ghost button borders
  borderLit:    'rgba(255,255,255,0.15)',     // toast / notice borders (stays light-on-dark)

  // Text — adaptive via CSS custom properties
  textPrimary: 'var(--c-text)',
  textSub:     'var(--c-text-sub)',           // secondary text
  textMuted:   'var(--c-text-muted)',         // muted / label text
  textFaint:   'var(--c-text-faint)',         // faint / hint text

  // Brand palette
  green:       '#22c55e',
  greenDark:   '#059669',
  greenDeep:   '#166534',
  greenDeeper: '#065f46',
  greenLight:  '#86efac',                     // green-300 (notice text / copied feedback)
  blue:        '#3b82f6',
  blueViolet:  '#8b5cf6',
  indigo:      '#6366f1',
  indigoDark:  '#4f46e5',
  indigoGlow:  'rgba(99,102,241,0.25)',        // indigo box-shadow
  purple:      '#7c3aed',
  red:         '#ef4444',
  orange:      '#f97316',
  amber:       '#FF8C00',                     // darker orange (particle / text-shadow)
  yellow:      '#FFA500',                     // score popup combo
  gold:        '#FFD700',                     // score popup big / rank-1 / personal best

  // Overlays
  scrim72: 'rgba(0,0,0,0.72)',
  scrim75: 'rgba(0,0,0,0.75)',
  scrim80: 'rgba(0,0,0,0.80)',
  scrim85: 'rgba(0,0,0,0.85)',

  // Selection box state backgrounds
  exactBg:   'rgba(34,197,94,0.12)',
  overBg:    'rgba(239,68,68,0.10)',
  neutralBg: 'rgba(59,130,246,0.10)',

  // Notice / status banners
  noticeBg:     'rgba(34,197,94,0.10)',
  noticeBorder: 'rgba(34,197,94,0.20)',

  // Lobby room-code panel
  roomBg:       'rgba(59,130,246,0.10)',
  roomBorder:   'rgba(59,130,246,0.30)',
  joinedBg:     'rgba(34,197,94,0.10)',
  joinedBorder: 'rgba(34,197,94,0.30)',

  // Multiplayer score-row highlight (the current player's row)
  myRowBg:     'rgba(59,130,246,0.15)',
  myRowBorder: 'rgba(59,130,246,0.40)',

  // Opponent drag selection box
  opponentBorder: '#f97316',
  opponentBg:     'rgba(249,115,22,0.10)',

  // Score popup labels
  popupCombo: '#FFA500',
  popupBig:   '#FFD700',

  // Countdown overlay glows
  goGlow:  'rgba(34,197,94,0.90)',
  numGlow: 'rgba(99,102,241,0.80)',

  // Accent — adaptive via CSS vars
  accentYellow: 'var(--c-accent-yellow)',   // replaces text-yellow-400 / text-yellow-300

  // Rank medal colors — adaptive via CSS vars
  rankGold:    'var(--c-rank-gold)',
  rankSilver:  'var(--c-rank-silver)',
  rankBronze:  'var(--c-rank-bronze)',
  rankGreen:   'var(--c-rank-green)',
  rankDefault: 'var(--c-rank-default)',

  // Score chart — adaptive via CSS vars
  chartGrid:   'var(--c-chart-grid)',
  chartLabel:  'var(--c-chart-label)',
  chartGuide:  'var(--c-chart-guide)',
  chartDot:    'var(--c-chart-dot)',
  chartCursor: 'var(--c-chart-cursor)',
} as const

// ─── Gradient shorthands ───────────────────────────────────────────────────────

export const G = {
  primary:     `linear-gradient(135deg, ${C.green}, ${C.greenDark})`,
  blueIndigo:  `linear-gradient(135deg, ${C.blue}, ${C.indigo})`,
  purple:      `linear-gradient(135deg, ${C.purple}, ${C.indigoDark})`,
  notice:      `linear-gradient(135deg, ${C.greenDeep}, ${C.greenDeeper})`,
  timerNormal: `linear-gradient(90deg, ${C.green}, ${C.blue})`,
  timerUrgent: `linear-gradient(90deg, ${C.red}, ${C.orange})`,
  multiTimer:  `linear-gradient(90deg, ${C.blue}, ${C.blueViolet})`,
} as const

// ─── Particle burst colors ─────────────────────────────────────────────────────

export const PARTICLE_COLORS = {
  normal: ['#D92B2B', '#E84040', '#C42020'],
  combo:  ['#FF4500', '#FF8C00', '#FFD700', '#FF6347', '#FFA500'],
  big:    ['#FFD700', '#FF4500', '#00FF88', '#00BFFF', '#FF69B4', '#FFFFFF', '#FF4500', '#FFD700'],
} as const
