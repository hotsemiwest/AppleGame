"""FastAPI server — serves AI move sequences to the React frontend.

Local:
    uvicorn ai_solver.server:app --reload --port 8000

Production (Railway):
    환경변수 HF_REPO_ID=<username>/<repo> 설정 시 서버 시작 시 자동으로 모델 다운로드
    환경변수 HF_MODEL_FILE 미설정 시 기본값: best_model.zip
"""
from __future__ import annotations

import os
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sb3_contrib import MaskablePPO

from .fruit_box_env import FruitBoxEnv

MODELS_DIR = Path(__file__).resolve().parent / "models"

_model_cache: dict[str, MaskablePPO] = {}
_hf_model_path: str | None = None


def _maybe_download_hf_model() -> None:
    global _hf_model_path

    env_path = os.getenv("AI_MODEL_PATH")
    if env_path and Path(env_path).exists():
        _hf_model_path = env_path
        print(f"[server] Using model from AI_MODEL_PATH: {env_path}")
        return

    repo_id = os.getenv("HF_REPO_ID")
    if not repo_id:
        return

    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        print("[server] huggingface_hub not installed — skipping HF model download")
        return

    model_file = os.getenv("HF_MODEL_FILE", "best_model.zip")
    local_dir = MODELS_DIR / "_hf"
    local_dir.mkdir(parents=True, exist_ok=True)

    print(f"[server] Downloading {repo_id}/{model_file} from Hugging Face Hub...")
    local_path = hf_hub_download(
        repo_id=repo_id,
        filename=model_file,
        local_dir=str(local_dir),
    )
    _hf_model_path = local_path
    print(f"[server] Model ready: {local_path}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _maybe_download_hf_model()
    yield


app = FastAPI(title="Fruit Box AI Solver", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


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
    runs = []

    # HF Hub에서 다운로드된 모델 (프로덕션)
    if _hf_model_path and Path(_hf_model_path).exists():
        repo_id = os.getenv("HF_REPO_ID", "HF Hub")
        model_file = os.getenv("HF_MODEL_FILE", "best_model.zip")
        runs.append({
            "name": "production",
            "models": [{"label": f"{repo_id} / {model_file}", "path": _hf_model_path}],
        })

    # 로컬 runs 디렉토리 탐색 (개발 환경)
    if MODELS_DIR.exists():
        for run_dir in sorted(MODELS_DIR.iterdir(), reverse=True):
            if not run_dir.is_dir() or run_dir.name == "_hf":
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
    model_path = req.model_path or _hf_model_path or os.getenv("AI_MODEL_PATH")
    if not model_path:
        raise HTTPException(
            status_code=400,
            detail="model_path 를 요청에 포함하거나 HF_REPO_ID / AI_MODEL_PATH 환경변수를 설정하세요.",
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
