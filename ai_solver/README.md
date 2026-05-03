# Fruit Box RL Solver

A reinforcement-learning agent that learns to play the **Fruit Box** game from this repo. The agent is a `MaskablePPO` policy (from `sb3-contrib`) trained against a `Gymnasium` environment that mirrors the web app's rules exactly.

## Game rules (mirrored from the web app)

| Spec               | Value                                        | Source                          |
| ------------------ | -------------------------------------------- | ------------------------------- |
| Board              | 10 rows × 17 cols, integers 1–9              | `src/types/game.ts`             |
| Cleared cell       | becomes 0                                    | `src/utils/gameLogic.ts`        |
| Valid action       | rectangle whose contained values sum to 10   | `src/utils/gameLogic.ts`        |
| Board generation   | random 1–9, regenerate until sum % 10 === 0  | `src/utils/boardGenerator.ts`   |
| Max possible score | 170                                          | total cells                     |

> The original spec said `(17, 10)`. The web app stores boards as `board[row][col]` with `ROWS=10`, `COLS=17`, so the env's observation is `(10, 17)` to match exactly. Same total, just transposed from the spec.

## Layout

```
ai_solver/
├── board_generator.py    # mirrors src/utils/boardGenerator.ts
├── fruit_box_env.py      # Gymnasium env + action masking
├── train.py              # MaskablePPO training
├── evaluate.py           # batch rollouts
├── solve.py              # solve a single user-provided board
├── requirements.txt
└── tests/test_env.py
```

## Setup

```bash
cd "<repo root>"
python3 -m venv ai_solver/.venv
ai_solver/.venv/bin/pip install -r ai_solver/requirements.txt
```

## Tests

```bash
pytest ai_solver/tests
```

## Train

```bash
# 프로젝트 루트에서 실행
cd "/Users/shinjoonseo/Mr.Everything/self-project/apple game"

# Smoke test (~1 min on CPU): 학습 곡선 상승 확인용
ai_solver/.venv/bin/python -m ai_solver.train --timesteps 50_000 --tag smoke

# 정식 훈련 (기본값: 5M steps, strategic 보상 체계)
ai_solver/.venv/bin/python -m ai_solver.train --tag strategic_v1

# TensorBoard 모니터링 (별도 터미널에서 실행)
ai_solver/.venv/bin/tensorboard --logdir ai_solver/runs
# → 브라우저에서 http://localhost:6006 접속
```

Defaults:

| Hyperparameter     | Value          |
| ------------------ | -------------- |
| Algorithm          | MaskablePPO    |
| Policy             | MLP `[512, 512]` |
| `timesteps`        | 5,000,000      |
| `n_steps`          | 2048           |
| `batch_size`       | 512            |
| `gamma`            | 0.995          |
| `gae_lambda`       | 0.95           |
| `ent_coef`         | 0.02           |
| `learning_rate`    | 3e-4           |
| `clip_range`       | 0.2            |

Checkpoints land in `ai_solver/models/<run>/` every 100k env steps; best-by-eval lives at `ai_solver/models/<run>/best/`.

## Evaluate

```bash
# Random-policy baseline (sanity floor; expect ~50–70 mean score)
python -m ai_solver.evaluate --random --episodes 200

# Trained model
python -m ai_solver.evaluate \
  --model ai_solver/models/baseline_<timestamp>/final.zip \
  --episodes 200
```

Reports mean / std / min / max score, all-clear rate, and mean leftover apples.

## Solve a real board (web → solver)

The web app exposes a **Developer Mode** toggle (Settings → 기능 → 개발자 모드) that adds a **📋 보드 내보내기 (JSON)** button to the gameplay screen. Click it to copy the current board to the clipboard, then:

```bash
pbpaste > board.json   # macOS; on Linux: xclip -o > board.json
python -m ai_solver.solve \
  --model ai_solver/models/baseline_<timestamp>/final.zip \
  --board-file board.json
```

Output is a JSON document with the move sequence (`startRow`, `startCol`, `endRow`, `endCol` per move), final score, and leftover apple count.

## Reward shaping

`RewardConfig` in `fruit_box_env.py`:

| Field              | Default | Notes                                                        |
| ------------------ | ------- | ------------------------------------------------------------ |
| `cell_clear`       | `1.0`   | +1 per apple cleared (matches in-game score)                 |
| `nine_bonus`       | `0.5`   | bonus per cleared 9 — 9를 먼저 페어로 소거하도록 유도        |
| `eight_bonus`      | `0.3`   | bonus per cleared 8 — 8을 먼저 페어로 소거하도록 유도        |
| `pair_bonus`       | `0.5`   | bonus when exactly 2 cells cleared (1+9, 2+8 등 페어 무브)   |
| `all_clear_bonus`  | `50.0`  | terminal bonus on full clear (170/170)                       |
| `leftover_penalty` | `3.0`   | terminal penalty per remaining apple — 고립 방지 핵심 신호   |

## Action space

Discrete index ↔ rectangle `(r1, r2, c1, c2)` with `r1≤r2` and `c1≤c2`. For 10×17 the space size is `55 × 153 = 8415`. Mask is computed from a 2D prefix sum (vectorized NumPy) every step.
