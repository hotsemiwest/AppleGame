"""Train a MaskablePPO agent on the Fruit Box environment.

Usage:
    python -m ai_solver.train --timesteps 2_000_000 --n-envs 8 --tag baseline
"""
from __future__ import annotations

import argparse
import json
import os
import statistics
import time
from datetime import datetime
from pathlib import Path

# 프로젝트 루트의 .env 파일 자동 로드
def _load_dotenv():
    env_file = Path(__file__).resolve().parent.parent / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        if key and key not in os.environ:
            os.environ[key] = value

_load_dotenv()

import numpy as np
import torch
from sb3_contrib import MaskablePPO
from sb3_contrib.common.maskable.callbacks import MaskableEvalCallback
from sb3_contrib.common.wrappers import ActionMasker
from stable_baselines3.common.callbacks import BaseCallback, CheckpointCallback
from stable_baselines3.common.logger import configure as sb3_configure
from stable_baselines3.common.vec_env import SubprocVecEnv

from .fruit_box_env import FruitBoxEnv, RewardConfig


def _auto_device() -> str:
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"

class GameScoreCallback(BaseCallback):
    """Records actual game score (cells cleared) and remaining cells to TensorBoard per rollout."""

    def __init__(self):
        super().__init__()
        self._scores: list[int] = []
        self._remaining: list[int] = []

    def _on_step(self) -> bool:
        for done, info in zip(self.locals["dones"], self.locals["infos"]):
            if done:
                self._scores.append(info.get("score", 0))
                self._remaining.append(info.get("remaining", 0))
        return True

    def _on_rollout_end(self) -> None:
        if not self._scores:
            return
        self.logger.record("game/score_mean", float(np.mean(self._scores)))
        self.logger.record("game/score_max", float(np.max(self._scores)))
        self.logger.record("game/remaining_mean", float(np.mean(self._remaining)))
        self._scores.clear()
        self._remaining.clear()


ROOT = Path(__file__).resolve().parent
RUNS_DIR = ROOT / "runs"
MODELS_DIR = ROOT / "models"


def _mask_fn(env: FruitBoxEnv) -> np.ndarray:
    return env.action_masks()


def make_env(seed: int = 0, reward_cfg: RewardConfig | None = None):
    def _thunk():
        env = FruitBoxEnv(reward_config=reward_cfg or RewardConfig())
        env.reset(seed=seed)
        env = ActionMasker(env, _mask_fn)
        return env
    return _thunk


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--timesteps", type=int, default=5_000_000)
    parser.add_argument("--n-envs", type=int, default=8)
    parser.add_argument("--tag", type=str, default="baseline")
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--learning-rate", type=float, default=3e-4)
    parser.add_argument("--n-steps", type=int, default=2048)
    parser.add_argument("--batch-size", type=int, default=512)
    parser.add_argument("--gamma", type=float, default=0.995)
    parser.add_argument("--gae-lambda", type=float, default=0.95)
    parser.add_argument("--ent-coef", type=float, default=0.02)
    parser.add_argument("--clip-range", type=float, default=0.2)
    parser.add_argument("--checkpoint-every", type=int, default=100_000)
    parser.add_argument("--resume", type=str, default=None, help="Path to .zip to continue training")
    parser.add_argument("--device", type=str, default="auto",
                        help="Device: auto | cpu | cuda | cuda:0 | mps")
    # reward shaping
    parser.add_argument("--leftover-penalty",    type=float, default=0.5)
    parser.add_argument("--nine-bonus",          type=float, default=0.5)
    parser.add_argument("--eight-bonus",         type=float, default=0.3)
    parser.add_argument("--small-clear-bonus",   type=float, default=0.5)
    parser.add_argument("--large-clear-penalty", type=float, default=0.4)
    parser.add_argument("--all-clear-bonus",     type=float, default=50.0)
    args = parser.parse_args()

    device = _auto_device() if args.device == "auto" else args.device
    print(f"Using device: {device}")

    reward_cfg = RewardConfig(
        nine_bonus=args.nine_bonus,
        eight_bonus=args.eight_bonus,
        small_clear_bonus=args.small_clear_bonus,
        large_clear_penalty=args.large_clear_penalty,
        leftover_penalty=args.leftover_penalty,
        all_clear_bonus=args.all_clear_bonus,
    )

    run_name = f"{args.tag}_{int(time.time())}"
    log_dir = RUNS_DIR / run_name
    model_dir = MODELS_DIR / run_name
    log_dir.mkdir(parents=True, exist_ok=True)
    model_dir.mkdir(parents=True, exist_ok=True)

    env_fns = [make_env(args.seed + i, reward_cfg) for i in range(args.n_envs)]
    vec_env = SubprocVecEnv(env_fns)

    eval_env = SubprocVecEnv([make_env(seed=10_000, reward_cfg=reward_cfg)])

    if args.resume:
        model = MaskablePPO.load(args.resume, env=vec_env, device=device)
    else:
        model = MaskablePPO(
            "MlpPolicy",
            vec_env,
            learning_rate=args.learning_rate,
            n_steps=args.n_steps,
            batch_size=args.batch_size,
            gamma=args.gamma,
            gae_lambda=args.gae_lambda,
            ent_coef=args.ent_coef,
            clip_range=args.clip_range,
            policy_kwargs=dict(net_arch=[512, 512]),
            tensorboard_log=str(RUNS_DIR),
            verbose=1,
            seed=args.seed,
            device=device,
        )

    model.set_logger(sb3_configure(str(log_dir), ["stdout", "csv", "tensorboard"]))

    checkpoint_cb = CheckpointCallback(
        save_freq=max(args.checkpoint_every // args.n_envs, 1),
        save_path=str(model_dir),
        name_prefix="maskable_ppo",
    )

    eval_cb = MaskableEvalCallback(
        eval_env,
        best_model_save_path=str(model_dir / "best"),
        log_path=str(log_dir),
        eval_freq=max(50_000 // args.n_envs, 1),
        deterministic=True,
        render=False,
        n_eval_episodes=20,
    )

    score_cb = GameScoreCallback()

    model.learn(
        total_timesteps=args.timesteps,
        callback=[checkpoint_cb, eval_cb, score_cb],
        tb_log_name=run_name,
        progress_bar=True,
    )

    final_path = model_dir / "final.zip"
    model.save(str(final_path))
    print(f"Saved final model -> {final_path}")
    print(f"TensorBoard logs    -> {log_dir}")
    print(f"Best model          -> {model_dir / 'best'}")

    _save_training_record(args, run_name, model, reward_cfg, final_path, model_dir)
    _upload_to_hf(run_name, model_dir)


def _upload_to_hf(run_name: str, model_dir: Path) -> None:
    """학습 완료 후 HF Hub에 모델 자동 업로드. HF_REPO_ID 환경변수가 없으면 스킵."""
    repo_id = os.getenv("HF_REPO_ID")
    if not repo_id:
        return

    try:
        from huggingface_hub import HfApi
    except ImportError:
        print("huggingface_hub 미설치 — HF 업로드 스킵")
        return

    api = HfApi(token=os.getenv("HF_TOKEN"))
    targets = [
        (model_dir / "best" / "best_model.zip", f"{run_name}/best_model.zip"),
        (model_dir / "final.zip",               f"{run_name}/final.zip"),
    ]
    for src, dest in targets:
        if not src.exists():
            continue
        print(f"HF Hub 업로드 중: {dest} ...")
        api.upload_file(path_or_fileobj=str(src), path_in_repo=dest, repo_id=repo_id)
        print(f"  완료: https://huggingface.co/{repo_id}/blob/main/{dest}")

    print(f"Railway /models 엔드포인트에서 바로 확인 가능합니다.")


def _save_training_record(args, run_name, model, reward_cfg, final_path, model_dir):
    """Run a quick post-training evaluation and append results to training_log.jsonl."""
    from sb3_contrib.common.wrappers import ActionMasker

    print("\nRunning post-training evaluation (50 episodes)...")
    eval_env = FruitBoxEnv(reward_config=reward_cfg)
    rng = np.random.default_rng(seed=9999)
    scores, moves_list, remaining_list, clears = [], [], [], 0

    for _ in range(50):
        obs, _ = eval_env.reset(seed=int(rng.integers(0, 2**31 - 1)))
        done = False
        moves = 0
        while not done:
            mask = eval_env.action_masks()
            if not mask.any():
                break
            action, _ = model.predict(obs, action_masks=mask, deterministic=True)
            obs, _, terminated, truncated, info = eval_env.step(int(action))
            moves += 1
            done = terminated or truncated
        scores.append(eval_env.score)
        moves_list.append(moves)
        remaining_list.append(int((eval_env.board != 0).sum()))
        if eval_env.score > 0 and int((eval_env.board != 0).sum()) == 0:
            clears += 1

    best_model_path = str(model_dir / "best" / "best_model.zip")
    record = {
        "run_name": run_name,
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "hyperparams": {
            "timesteps": args.timesteps,
            "n_envs": args.n_envs,
            "learning_rate": args.learning_rate,
            "n_steps": args.n_steps,
            "batch_size": args.batch_size,
            "gamma": args.gamma,
            "gae_lambda": args.gae_lambda,
            "ent_coef": args.ent_coef,
            "clip_range": args.clip_range,
            "seed": args.seed,
        },
        "reward_config": {
            "nine_bonus": reward_cfg.nine_bonus,
            "eight_bonus": reward_cfg.eight_bonus,
            "small_clear_bonus": reward_cfg.small_clear_bonus,
            "large_clear_penalty": reward_cfg.large_clear_penalty,
            "leftover_penalty": reward_cfg.leftover_penalty,
            "all_clear_bonus": reward_cfg.all_clear_bonus,
        },
        "eval_episodes": 50,
        "results": {
            "mean_score": round(statistics.mean(scores), 2),
            "std_score": round(statistics.pstdev(scores), 2),
            "min_score": min(scores),
            "max_score": max(scores),
            "mean_moves": round(statistics.mean(moves_list), 2),
            "mean_remaining": round(statistics.mean(remaining_list), 2),
            "all_clear_rate": round(clears / 50, 4),
        },
        "paths": {
            "final_model": str(final_path),
            "best_model": best_model_path if Path(best_model_path).exists() else None,
        },
    }

    log_path = ROOT / "training_log.jsonl"
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

    print(f"\n=== Post-training Eval (50 eps) ===")
    print(f"Mean score:     {record['results']['mean_score']} ± {record['results']['std_score']}")
    print(f"Min / Max:      {record['results']['min_score']} / {record['results']['max_score']}")
    print(f"Mean remaining: {record['results']['mean_remaining']}")
    print(f"All-clear rate: {clears}/50 ({record['results']['all_clear_rate']*100:.1f}%)")
    print(f"Log appended -> {log_path}")


if __name__ == "__main__":
    main()
