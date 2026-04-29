/**
 * 난이도 설정 중앙 관리
 * 
 * 난이도 범위: -1 (랜덤) ~ 5 (최어려움)
 * UI 표시: -1일 때 "🎲 랜덤", 1~5일 때 ⭐️ 개수로 표시
 */

export const DIFFICULTY_CONFIG = {
  // 난이도 범위
  RANDOM: -1,           // 랜덤
  MIN: 1,               // 슬라이더 최소값
  MAX: 5,               // 슬라이더 최대값
  DEFAULT: 3,           // 기본값
  
  // 난이도별 보드 합계 범위
  RANGES: {
    1: { min: 0,   max: 799,  label: '0~799' },
    2: { min: 800, max: 819,  label: '800~819' },
    3: { min: 820, max: 839,  label: '820~839' },
    4: { min: 840, max: 859,  label: '840~859' },
    5: { min: 860, max: 99999, label: '860~' },
  } as const,
} as const

/**
 * 주어진 난이도의 보드 합계 범위를 반환합니다.
 */
export function getDifficultyRange(difficulty: number): { min: number; max: number; label: string } {
  if (difficulty >= 1 && difficulty <= 5) {
    return DIFFICULTY_CONFIG.RANGES[difficulty as 1 | 2 | 3 | 4 | 5]
  }
  return { min: 0, max: 99999, label: 'Unknown' }
}

/**
 * 보드 합계로부터 난이도를 계산합니다.
 */
export function calculateBoardDifficulty(sum: number): number {
  for (const [level, range] of Object.entries(DIFFICULTY_CONFIG.RANGES)) {
    if (sum <= range.max) {
      return parseInt(level)
    }
  }
  return 5 // Fallback to max difficulty
}

/**
 * UI에 표시할 별 개수를 반환합니다.
 * -1 (랜덤) → 0
 * 1~5 → 1~5
 */
export function getDifficultyStarCount(difficulty: number): number {
  if (difficulty === -1) return 0 // 랜덤
  return Math.max(0, Math.min(5, difficulty))
}

/**
 * UI에 표시할 레이블을 반환합니다.
 */
export function getDifficultyLabel(difficulty: number): string {
  if (difficulty === -1) return '🎲 랜덤'
  const starCount = getDifficultyStarCount(difficulty)
  return '⭐️'.repeat(starCount)
}

/**
 * 난이도가 유효한 값인지 검증합니다.
 */
export function isValidDifficulty(difficulty: unknown): difficulty is number {
  if (typeof difficulty !== 'number') return false
  return difficulty === DIFFICULTY_CONFIG.RANDOM || 
         (difficulty >= DIFFICULTY_CONFIG.MIN && difficulty <= DIFFICULTY_CONFIG.MAX)
}
