"""FastAPI server — serves AI move sequences to the React frontend.

Start:
    AI_MODEL_PATH=ai_solver/models/<run>/final.zip \\
        uvicorn ai_solver.server:app --reload --port 8000

Or pass model_path per-request (see /solve).
"""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sb3_contrib import MaskablePPO

from .fruit_box_env import FruitBoxEnv

MODELS_DIR = Path(__file__).resolve().parent / "models"

app = FastAPI(title="Fruit Box AI Solver")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_model_cache: dict[str, MaskablePPO] = {}


def _load_model(path: str) -> MaskablePPO:
    if path not in _model_cache:
        _model_cache[path] = MaskablePPO.load(path, device="cpu")
    return _model_cache[path]


class SolveRequest(BaseModel):
    board: list[list[int]]
    model_path: Optional[str] = None
    move_limit: int = 500


class Move(BaseModel):
    startRow: int
    startCol: int
    endRow: int
    endCol: int


class SolveResponse(BaseModel):
    moves: list[Move]
    score: int
    remaining: int
    total_moves: int


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/models")
def list_models():
    if not MODELS_DIR.exists():
        return {"runs": []}

    runs = []
    for run_dir in sorted(MODELS_DIR.iterdir(), reverse=True):
        if not run_dir.is_dir():
            continue

        models = []

        best = run_dir / "best" / "best_model.zip"
        if best.exists():
            models.append({"label": "best (eval)", "path": str(best.relative_to(MODELS_DIR.parent.parent))})

        final = run_dir / "final.zip"
        if final.exists():
            models.append({"label": "final", "path": str(final.relative_to(MODELS_DIR.parent.parent))})

        for ckpt in sorted(run_dir.glob("maskable_ppo_*_steps.zip"), reverse=True):
            m = re.match(r"maskable_ppo_(\d+)_steps\.zip", ckpt.name)
            if m:
                steps = int(m.group(1))
                models.append({
                    "label": f"{steps // 1000}k steps",
                    "path": str(ckpt.relative_to(MODELS_DIR.parent.parent)),
                })

        if models:
            runs.append({"name": run_dir.name, "models": models})

    return {"runs": runs}


@app.post("/solve", response_model=SolveResponse)
def solve(req: SolveRequest):
    model_path = req.model_path or os.getenv("AI_MODEL_PATH")
    if not model_path:
        raise HTTPException(
            status_code=400,
            detail="model_path 를 요청에 포함하거나 AI_MODEL_PATH 환경변수를 설정하세요.",
        )
    if not Path(model_path).exists():
        raise HTTPException(status_code=404, detail=f"모델 파일을 찾을 수 없음: {model_path}")

    try:
        model = _load_model(model_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"모델 로드 실패: {e}")

    board_np = np.asarray(req.board, dtype=np.int8)
    rows, cols = board_np.shape
    env = FruitBoxEnv(rows=rows, cols=cols)
    obs, _ = env.reset(options={"board": board_np})

    moves: list[Move] = []
    for _ in range(req.move_limit):
        mask = env.action_masks()
        if not mask.any():
            break
        action, _ = model.predict(obs, action_masks=mask, deterministic=True)
        action = int(action)
        if not mask[action]:
            valid = np.flatnonzero(mask)
            if len(valid) == 0:
                break
            action = int(valid[0])

        r1, r2, c1, c2 = env.decode_action(action)
        moves.append(Move(startRow=int(r1), startCol=int(c1), endRow=int(r2), endCol=int(c2)))
        obs, _, terminated, _, _ = env.step(action)
        if terminated:
            break

    return SolveResponse(
        moves=moves,
        score=env.score,
        remaining=int((env.board != 0).sum()),
        total_moves=len(moves),
    )
