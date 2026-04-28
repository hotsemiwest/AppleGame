# UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 랭킹/프로필 모달에 SegmentedControl 적용, 사과 타일 텍스트 크기 축소, 싱글 게임 3→2→1→GO! 카운트다운 추가.

**Architecture:** 세 가지 독립적인 UI 변경. SegmentedControl은 기존 컴포넌트 재사용, 타일 폰트는 SVG 속성 수정, 카운트다운은 새 GamePhase 값(`'countdown'`) 추가 + 새 컴포넌트(`SingleCountdown`) 생성으로 구현.

**Tech Stack:** React, TypeScript, Zustand, Tailwind CSS

---

## File Map

| File | Action | Change |
|------|--------|--------|
| `src/types/game.ts` | Modify | `GamePhase`에 `'countdown'` 추가 |
| `src/store/gameStore.ts` | Modify | `startScoreAttack`/`startTimeAttack` 수정, `beginPlaying` 추가 |
| `src/components/SingleCountdown.tsx` | Create | 싱글게임 카운트다운 오버레이 |
| `src/components/Tile.tsx` | Modify | `AppleSVG` fontSize 26→22 |
| `src/components/Header.tsx` | Modify | 랭킹 모달 탭 → SegmentedControl |
| `src/components/ProfileModal.tsx` | Modify | 프로필 탭 → SegmentedControl |
| `src/App.tsx` | Modify | SingleCountdown 렌더 조건 추가 |

---

## Task 1: 사과 타일 텍스트 크기 수정

**Files:**
- Modify: `src/components/Tile.tsx`

- [ ] **Step 1: `AppleSVG` 내 `<text>` fontSize 변경**

`src/components/Tile.tsx` 27번째 줄:

```tsx
// 변경 전
<text x="26" y="33" textAnchor="middle" dominantBaseline="middle"
  fill="rgba(255,255,255,0.95)" fontSize="26" fontWeight="900" style={TEXT_STYLE}>
  {value}
</text>

// 변경 후
<text x="26" y="33" textAnchor="middle" dominantBaseline="middle"
  fill="rgba(255,255,255,0.95)" fontSize="22" fontWeight="900" style={TEXT_STYLE}>
  {value}
</text>
```

- [ ] **Step 2: 브라우저에서 확인**

`npm run dev` 후 스코어 어택 실행 → 사과 타일 숫자가 이전보다 작게 표시되는지 확인. Circle/Square 타일은 기존 22px 그대로인지 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/components/Tile.tsx
git commit -m "fix: apple tile font size 26→22"
```

---

## Task 2: 랭킹 모달 SegmentedControl 적용

**Files:**
- Modify: `src/components/Header.tsx`

현재 Header.tsx 215–226번째 줄에 커스텀 인라인 버튼 탭이 있음. 이를 `SegmentedControl`로 교체.

- [ ] **Step 1: `SegmentedControl` import 추가**

`src/components/Header.tsx` 상단 import 블록에 추가:

```tsx
import { SegmentedControl } from './SegmentedControl'
```

- [ ] **Step 2: 랭킹 모달 내 탭 버튼 블록 교체**

기존 코드 (lines ~215–226):
```tsx
<div className="flex gap-1 mb-3 p-1 rounded-xl" style={{ background: C.surfaceRaised }}>
  <button
    onClick={() => setLeaderboardTab('score')}
    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
    style={leaderboardTab === 'score' ? { background: C.surface, color: C.textPrimary } : { color: C.textMuted }}
  >⏱️ 스코어 어택</button>
  <button
    onClick={() => setLeaderboardTab('time')}
    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
    style={leaderboardTab === 'time' ? { background: C.surface, color: C.textPrimary } : { color: C.textMuted }}
  >🎯 타임 어택</button>
</div>
```

교체 후:
```tsx
<div className="mb-3">
  <SegmentedControl
    options={[
      { value: 'score', label: '⏱️ 스코어 어택' },
      { value: 'time',  label: '🎯 타임 어택' },
    ]}
    value={leaderboardTab}
    onChange={setLeaderboardTab}
  />
</div>
```

- [ ] **Step 3: 브라우저에서 확인**

랭킹 버튼 클릭 → 모달 열림 → 탭 전환 시 슬라이딩 pill 애니메이션 동작 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/components/Header.tsx
git commit -m "feat: apply SegmentedControl to leaderboard modal tab"
```

---

## Task 3: 프로필 모달 SegmentedControl 적용

**Files:**
- Modify: `src/components/ProfileModal.tsx`

현재 ProfileModal.tsx 148–159번째 줄에 커스텀 인라인 버튼 탭이 있음.

- [ ] **Step 1: `SegmentedControl` import 추가**

`src/components/ProfileModal.tsx` 상단 import 블록에 추가:

```tsx
import { SegmentedControl } from './SegmentedControl'
```

- [ ] **Step 2: 프로필 탭 버튼 블록 교체**

기존 코드 (lines ~148–159):
```tsx
<div className="flex gap-1 p-1 rounded-xl" style={{ background: C.surfaceRaised }}>
  <button
    onClick={() => setTab('score')}
    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
    style={tab === 'score' ? { background: C.surface, color: C.textPrimary } : { color: C.textMuted }}
  >⏱️ 스코어 어택</button>
  <button
    onClick={() => setTab('time')}
    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
    style={tab === 'time' ? { background: C.surface, color: C.textPrimary } : { color: C.textMuted }}
  >🎯 타임 어택</button>
</div>
```

교체 후:
```tsx
<SegmentedControl
  options={[
    { value: 'score', label: '⏱️ 스코어 어택' },
    { value: 'time',  label: '🎯 타임 어택' },
  ]}
  value={tab}
  onChange={setTab}
/>
```

- [ ] **Step 3: 브라우저에서 확인**

프로필 버튼 클릭 → 모달 열림 → 탭 전환 시 슬라이딩 pill 애니메이션 동작 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/components/ProfileModal.tsx
git commit -m "feat: apply SegmentedControl to profile modal tab"
```

---

## Task 4: GamePhase에 'countdown' 추가

**Files:**
- Modify: `src/types/game.ts`

- [ ] **Step 1: `GamePhase` 타입 수정**

`src/types/game.ts` 19번째 줄:

```ts
// 변경 전
export type GamePhase = 'start' | 'playing' | 'ended'

// 변경 후
export type GamePhase = 'start' | 'countdown' | 'playing' | 'ended'
```

- [ ] **Step 2: 타입 오류 없는지 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음 (새 값은 추가이므로 기존 코드와 충돌 없음).

- [ ] **Step 3: 커밋**

```bash
git add src/types/game.ts
git commit -m "feat: add countdown to GamePhase"
```

---

## Task 5: gameStore에 beginPlaying 추가 및 startScoreAttack/startTimeAttack 수정

**Files:**
- Modify: `src/store/gameStore.ts`

- [ ] **Step 1: interface에 `beginPlaying` 추가**

`src/store/gameStore.ts` `GameState` interface (line ~117 근처):

```ts
interface GameState {
  // ... 기존 필드들 ...
  startGame: () => void
  startScoreAttack: () => void
  startTimeAttack: () => void
  beginPlaying: () => void   // ← 추가
  endGame: () => void
  // ... 나머지 ...
}
```

- [ ] **Step 2: `startScoreAttack`, `startTimeAttack` 수정 + `beginPlaying` 구현**

기존 `startGame` 내부 로직을 `beginPlaying`으로 이관하고, `startScoreAttack`/`startTimeAttack`은 카운트다운으로 진입하도록 수정.

```ts
startGame: () => {
  // rematch 버튼 등 기존 호출부를 위해 유지 — beginPlaying 직접 호출
  get().beginPlaying()
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
```

> **주의:** 기존 `startGame` 호출부(`GameOverModal`의 "다시 시작" 버튼)는 카운트다운 없이 바로 재시작해야 하므로 `beginPlaying`을 직접 호출하도록 유지.

- [ ] **Step 3: 타입 오류 없는지 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/store/gameStore.ts
git commit -m "feat: add beginPlaying to gameStore, countdown phase for startScoreAttack/startTimeAttack"
```

---

## Task 6: SingleCountdown 컴포넌트 생성

**Files:**
- Create: `src/components/SingleCountdown.tsx`

`MultiCountdown.tsx`와 동일한 시각 스타일. `useMultiStore` 대신 내부 state 사용.

- [ ] **Step 1: 파일 생성**

`src/components/SingleCountdown.tsx` 전체 내용:

```tsx
import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { C } from '../theme/tokens'

export function SingleCountdown() {
  const beginPlaying = useGameStore(s => s.beginPlaying)
  const [count, setCount] = useState(3)

  useEffect(() => {
    const id = setTimeout(() => {
      if (count > 0) {
        setCount(c => c - 1)
      } else {
        beginPlaying()
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [count, beginPlaying])

  const isGo = count <= 0
  const display = isGo ? 'GO!' : String(count)

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center"
      style={{ background: C.scrim72, backdropFilter: 'blur(6px)' }}
    >
      <div
        key={display}
        className="countdown-number"
        style={{
          fontSize: 160,
          fontWeight: 900,
          lineHeight: 1,
          color: isGo ? C.green : C.textPrimary,
          textShadow: isGo
            ? `0 0 80px ${C.goGlow}`
            : `0 0 60px ${C.numGlow}`,
          userSelect: 'none',
        }}
      >
        {display}
      </div>
      {!isGo && (
        <p className="text-gray-400 text-lg font-semibold mt-4 tracking-widest uppercase">
          준비하세요
        </p>
      )}
      <style>{`
        @keyframes countdown-pop {
          0%   { transform: scale(1.4); opacity: 0; }
          30%  { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .countdown-number {
          animation: countdown-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>
    </div>
  )
}
```

> **동작 흐름:** count=3 → 1초 후 count=2 → 1초 후 count=1 → 1초 후 count=0 (GO! 표시) → 1초 후 `beginPlaying()` 호출 → `gamePhase`가 `'playing'`으로 변경되어 컴포넌트 unmount.

- [ ] **Step 2: `C.green`, `C.goGlow`, `C.numGlow`, `C.scrim72` 토큰 확인**

`src/theme/tokens.ts`에 해당 토큰이 있는지 확인:

```bash
grep -n "goGlow\|numGlow\|scrim72\|green" /Users/foden/Develop/AppleGame/src/theme/tokens.ts
```

없으면 `MultiCountdown.tsx`에서 사용하는 실제 토큰 이름을 확인해 `SingleCountdown.tsx`에 맞게 수정.

- [ ] **Step 3: 타입 오류 없는지 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/components/SingleCountdown.tsx
git commit -m "feat: add SingleCountdown component for single-game 3-2-1-GO"
```

---

## Task 7: App.tsx에 SingleCountdown 렌더 조건 추가

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: `SingleCountdown` import 추가**

`src/App.tsx` 상단 import 블록:

```tsx
import { SingleCountdown } from './components/SingleCountdown'
```

- [ ] **Step 2: 렌더 조건 추가**

기존 `{multiPhase === 'countdown' && <MultiCountdown />}` 라인 아래에 추가:

```tsx
{gamePhase === 'countdown' && multiPhase === 'off' && <SingleCountdown />}
```

전체 컨텍스트:
```tsx
{gamePhase === 'ended' && multiPhase === 'off' && <GameOverModal />}

{multiPhase === 'waiting' && <MultiLobby />}
{multiPhase === 'countdown' && <MultiCountdown />}
{multiPhase === 'ended' && <MultiGameOver />}
{gamePhase === 'countdown' && multiPhase === 'off' && <SingleCountdown />}
```

- [ ] **Step 3: `gamePhase` destructure 확인**

App.tsx 상단에서 `gamePhase`를 이미 destructure하고 있는지 확인 (line ~27):
```tsx
const { gamePhase, tick } = useGameStore()
```
이미 있으므로 추가 작업 없음.

- [ ] **Step 4: 타입 오류 없는지 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음.

- [ ] **Step 5: 전체 동작 확인**

1. `npm run dev`
2. 스코어 어택 버튼 클릭 → 3→2→1→GO! 오버레이 표시 후 게임 시작
3. 타임 어택 버튼 클릭 → 동일하게 카운트다운 표시 후 게임 시작
4. 게임 오버 후 "다시 시작" → 카운트다운 없이 바로 재시작
5. 멀티게임 카운트다운은 기존과 동일하게 동작

- [ ] **Step 6: 커밋**

```bash
git add src/App.tsx
git commit -m "feat: render SingleCountdown on single-game countdown phase"
```
