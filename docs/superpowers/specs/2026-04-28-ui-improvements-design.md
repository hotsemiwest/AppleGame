# UI Improvements Design — 2026-04-28

## Scope

Three independent UI improvements to the AppleGame codebase.

---

## 1. SegmentedControl 적용 (랭킹 모달 + 프로필 모달)

### Problem
`Header.tsx` 랭킹 모달과 `ProfileModal.tsx` 프로필 탭 모두 커스텀 인라인 버튼으로 탭 전환을 구현하고 있어 기존 `SegmentedControl` 컴포넌트와 시각적으로 일치하지 않음.

### Change
두 위치에서 커스텀 버튼 블록을 `<SegmentedControl>` 컴포넌트 호출로 교체.

**Files changed:**
- `src/components/Header.tsx` lines 215–226: `leaderboardTab` state 제어
- `src/components/ProfileModal.tsx` lines 148–159: `tab` state 제어

**Options passed:**
```ts
[
  { value: 'score', label: '⏱️ 스코어 어택' },
  { value: 'time',  label: '🎯 타임 어택' },
]
```

No new state, no new files. Pure component substitution.

---

## 2. 사과 타일 텍스트 크기 축소

### Problem
`AppleSVG`의 숫자 텍스트 `fontSize="26"`이 다른 타일 셰이프(22px)보다 크고, 사과 모양 안에서 비율상 커 보임.

### Change
`src/components/Tile.tsx` `AppleSVG` 컴포넌트 내 `<text>` 요소:
- `fontSize="26"` → `fontSize="22"`

Circle(`fontSize="22"`)와 Square(`fontSize="22"`)는 변경 없음.

---

## 3. 싱글 게임 카운트다운 (3→2→1→GO!)

### Problem
싱글 게임은 버튼 클릭 즉시 `gamePhase: 'playing'`으로 전환되어 카운트다운 없이 바로 시작됨. 멀티게임은 `MultiCountdown` 컴포넌트로 3→2→1→GO! 오버레이를 제공함.

### Design (Option A)

#### Types (`src/types/game.ts`)
`GamePhase`에 `'countdown'` 추가:
```ts
export type GamePhase = 'start' | 'countdown' | 'playing' | 'ended'
```

#### Store (`src/store/gameStore.ts`)
- `startScoreAttack`: `gameMode: 'score'` 설정 후 `gamePhase: 'countdown'` 설정 (보드는 세팅하지 않음)
- `startTimeAttack`: `gameMode: 'time'` 설정 후 `gamePhase: 'countdown'` 설정
- `beginPlaying()` 액션 추가: 보드 생성 및 초기화 (기존 `startGame` 내부 로직 이관), `gamePhase: 'playing'` 설정
- `startGame()`은 `beginPlaying()`을 호출하도록 변경 (rematch 버튼 등 기존 호출부 호환 유지)

타이머 tick은 `gamePhase === 'playing'`일 때만 실행 — 기존 App.tsx 로직 그대로.

#### New Component (`src/components/SingleCountdown.tsx`)
- `MultiCountdown`과 동일한 시각 스타일 (블러 오버레이, 팝 애니메이션, GO! 초록색)
- 내부 `useState(3)` + `useEffect`로 1초마다 감소
- `countdownValue <= 0` 이 되면 `useGameStore.getState().beginPlaying()` 호출
- 텍스트: GO! 이후 자동 unmount (App.tsx에서 phase 변경으로 처리됨)

#### App.tsx
```tsx
{gamePhase === 'countdown' && multiPhase === 'off' && <SingleCountdown />}
```
기존 `{gamePhase === 'ended' && ...}` 조건은 그대로 유지.

### Behavior
1. 유저가 스코어 어택 / 타임 어택 클릭
2. phase → `'countdown'`, 화면은 빈 GameBoard 없이 StartBoard가 뒤에 유지
3. SingleCountdown 오버레이 표시: 3 → 2 → 1 → GO!
4. GO! 표시 1초 후 `beginPlaying()` 호출 → phase → `'playing'`, 보드 생성, 타이머 시작
5. 이후 기존 게임 흐름과 동일

---

## Files Summary

| File | Change |
|------|--------|
| `src/types/game.ts` | `GamePhase`에 `'countdown'` 추가 |
| `src/store/gameStore.ts` | `startScoreAttack`/`startTimeAttack` 수정, `beginPlaying` 추가 |
| `src/components/SingleCountdown.tsx` | 신규 생성 |
| `src/components/Tile.tsx` | `AppleSVG` fontSize 26→22 |
| `src/components/Header.tsx` | 랭킹 모달 탭 → SegmentedControl |
| `src/components/ProfileModal.tsx` | 프로필 탭 → SegmentedControl |
| `src/App.tsx` | SingleCountdown 렌더 조건 추가 |
