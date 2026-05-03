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

## AI 데모 서버

React 프론트엔드의 **AI 데모** 기능에 이동 시퀀스를 제공하는 FastAPI 서버입니다.

```bash
# 프로젝트 루트에서 실행

# 방법 1: 환경변수로 모델 지정
AI_MODEL_PATH=ai_solver/models/<run>/best/best_model.zip \
  .venv/bin/uvicorn ai_solver.server:app --reload --port 8000

# 방법 2: 모델 미지정 (요청마다 model_path 포함)
.venv/bin/uvicorn ai_solver.server:app --reload --port 8000
```

서버 실행 후 `http://localhost:8000/docs` 에서 Swagger UI로 API 확인 가능.

| 엔드포인트 | 설명 |
| --- | --- |
| `GET /health` | 서버 상태 확인 |
| `GET /models` | 저장된 모델 목록 조회 |
| `POST /solve` | 보드 → AI 이동 시퀀스 반환 |

## Train

```bash
# 빠른 확인 (~1 min on CPU)
.venv/bin/python -m ai_solver.train --timesteps 50_000 --tag smoke

# 정식 훈련 (기본값: 5M steps)
.venv/bin/python -m ai_solver.train --tag reward_v2
```

## TensorBoard 모니터링

```bash
# 학습과 별도 터미널에서 실행
.venv/bin/tensorboard --logdir ai_solver/runs --port 6006
# → http://localhost:6006
```

| 지표 | 설명 | 목표 |
| --- | --- | --- |
| `game/score_mean` | 실제 게임 점수 평균 (셀 제거 수) | 점진적 상승 |
| `game/score_max` | 롤아웃 내 최고 점수 | 점진적 상승 |
| `game/remaining_mean` | 종료 시 평균 남은 셀 수 | 30 이하 |
| `train/value_loss` | 가치 함수 손실 | 40 이하 |
| `train/explained_variance` | 가치 함수 설명력 | 0.70 이상 |
| `eval/mean_reward` | 평가 평균 보상 | 양수 유지 |

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
| `nine_bonus`       | `0.0`   | 비활성화 (CLI `--nine-bonus`로 재활성화 가능)                |
| `eight_bonus`      | `0.0`   | 비활성화 (CLI `--eight-bonus`로 재활성화 가능)               |
| `pair_bonus`       | `0.0`   | 비활성화 — 2-셀 이동에 per-cell 프리미엄을 주면 소형 이동만 선택하는 역인센티브 발생 |
| `all_clear_bonus`  | `20.0`  | terminal bonus on full clear (170/170)                       |
| `leftover_penalty` | `1.0`   | terminal penalty per remaining apple — `cell_clear`와 동일 단위로 정규화 |

CLI 인자로 각 값 조정 가능:
```bash
.venv/bin/python -m ai_solver.train \
  --leftover-penalty 1.0 \
  --all-clear-bonus 20.0 \
  --nine-bonus 0.0 \
  --eight-bonus 0.0 \
  --pair-bonus 0.0
```

## Action space

Discrete index ↔ rectangle `(r1, r2, c1, c2)` with `r1≤r2` and `c1≤c2`. For 10×17 the space size is `55 × 153 = 8415`. Mask is computed from a 2D prefix sum (vectorized NumPy) every step.
