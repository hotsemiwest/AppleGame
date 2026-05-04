"""FastAPI server — serves AI move sequences to the React frontend.

Local:
    uvicorn ai_solver.server:app --reload --port 8000

Production (Railway):
    HF_REPO_ID=<username>/<repo> 환경변수 설정 시
    /models 에서 HF Hub의 모든 모델을 동적으로 조회하고,
    /solve 요청 시 해당 모델을 처음 사용할 때 자동 다운로드.
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
HF_CACHE_DIR = MODELS_DIR / "_hf_cache"

_model_cache: dict[str, MaskablePPO] = {}
_hf_download_cache: dict[str, str] = {}  # hf_path -> local_path


def _list_hf_runs(repo_id: str) -> list[dict]:
    """HF Hub 레포의 모든 .zip 파일을 런별로 그룹핑해서 반환."""
    try:
        from huggingface_hub import list_repo_files
        zip_files = sorted(
            [f for f in list_repo_files(repo_id) if f.endswith(".zip")],
            reverse=True,
        )
    except Exception as e:
        print(f"[server] HF Hub 목록 조회 실패: {e}")
        return []

    runs: dict[str, list] = {}
    for f in zip_files:
        parts = f.split("/")
        if len(parts) != 2:
            continue
        run_name, model_file = parts
        label = "best (eval)" if model_file == "best_model.zip" else model_file.replace(".zip", "")
        runs.setdefault(run_name, []).append({
            "label": label,
            "path": f"hf://{repo_id}/{f}",
        })

    return [{"name": name, "models": models} for name, models in sorted(runs.items(), reverse=True)]


def _download_hf_model(hf_path: str) -> str:
    """HF Hub 모델을 로컬에 다운로드 (이미 받았으면 캐시 반환)."""
    if hf_path in _hf_download_cache:
        return _hf_download_cache[hf_path]

    # hf://owner/repo/path/in/repo 파싱
    without_scheme = hf_path[5:]
    parts = without_scheme.split("/", 2)
    repo_id = f"{parts[0]}/{parts[1]}"
    filename = parts[2]

    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        raise RuntimeError("huggingface_hub 미설치")

    HF_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[server] 다운로드 중: {repo_id}/{filename}")
    local_path = hf_hub_download(repo_id=repo_id, filename=filename, local_dir=str(HF_CACHE_DIR))
    _hf_download_cache[hf_path] = local_path
    print(f"[server] 다운로드 완료: {local_path}")
    return local_path


def _resolve_path(path: str) -> str:
    """hf:// 경로면 다운로드 후 로컬 경로 반환, 아니면 그대로 반환."""
    if path.startswith("hf://"):
        return _download_hf_model(path)
    return path


def _load_model(path: str) -> MaskablePPO:
    if path not in _model_cache:
        _model_cache[path] = MaskablePPO.load(path, device="cpu")
    return _model_cache[path]


@asynccontextmanager
async def lifespan(app: FastAPI):
    repo_id = os.getenv("HF_REPO_ID")
    if repo_id:
        runs = _list_hf_runs(repo_id)
        total = sum(len(r["models"]) for r in runs)
        print(f"[server] HF Hub ({repo_id}): {len(runs)}개 런, {total}개 모델")
    yield


app = FastAPI(title="Fruit Box AI Solver", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


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

    # HF Hub 모델 (프로덕션 — 동적 조회)
    repo_id = os.getenv("HF_REPO_ID")
    if repo_id:
        runs.extend(_list_hf_runs(repo_id))

    # 로컬 모델 (개발 환경)
    if MODELS_DIR.exists():
        for run_dir in sorted(MODELS_DIR.iterdir(), reverse=True):
            if not run_dir.is_dir() or run_dir.name.startswith("_"):
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
    raw_path = req.model_path or os.getenv("AI_MODEL_PATH")
    if not raw_path:
        raise HTTPException(
            status_code=400,
            detail="model_path 를 요청에 포함하거나 HF_REPO_ID / AI_MODEL_PATH 환경변수를 설정하세요.",
        )

    try:
        model_path = _resolve_path(raw_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"모델 다운로드 실패: {e}")

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
