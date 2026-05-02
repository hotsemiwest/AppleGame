"""Train a MaskablePPO agent on the Fruit Box environment.

Usage:
    python -m ai_solver.train --timesteps 2_000_000 --n-envs 8 --tag baseline
"""
from __future__ import annotations

import argparse
import os
import time
from pathlib import Path

import numpy as np
from sb3_contrib import MaskablePPO
from sb3_contrib.common.maskable.callbacks import MaskableEvalCallback
from sb3_contrib.common.wrappers import ActionMasker
from stable_baselines3.common.callbacks import CheckpointCallback
from stable_baselines3.common.vec_env import SubprocVecEnv

from .fruit_box_env import FruitBoxEnv, RewardConfig

ROOT = Path(__file__).resolve().parent
RUNS_DIR = ROOT / "runs"
MODELS_DIR = ROOT / "models"


def _mask_fn(env: FruitBoxEnv) -> np.ndarray:
    return env.action_masks()


def make_env(seed: int = 0):
    def _thunk():
        env = FruitBoxEnv(reward_config=RewardConfig())
        env.reset(seed=seed)
        env = ActionMasker(env, _mask_fn)
        return env
    return _thunk


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--timesteps", type=int, default=2_000_000)
    parser.add_argument("--n-envs", type=int, default=8)
    parser.add_argument("--tag", type=str, default="baseline")
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--learning-rate", type=float, default=3e-4)
    parser.add_argument("--n-steps", type=int, default=1024)
    parser.add_argument("--batch-size", type=int, default=512)
    parser.add_argument("--gamma", type=float, default=0.995)
    parser.add_argument("--gae-lambda", type=float, default=0.95)
    parser.add_argument("--ent-coef", type=float, default=0.01)
    parser.add_argument("--clip-range", type=float, default=0.2)
    parser.add_argument("--checkpoint-every", type=int, default=100_000)
    parser.add_argument("--resume", type=str, default=None, help="Path to .zip to continue training")
    args = parser.parse_args()

    run_name = f"{args.tag}_{int(time.time())}"
    log_dir = RUNS_DIR / run_name
    model_dir = MODELS_DIR / run_name
    log_dir.mkdir(parents=True, exist_ok=True)
    model_dir.mkdir(parents=True, exist_ok=True)

    env_fns = [make_env(args.seed + i) for i in range(args.n_envs)]
    vec_env = SubprocVecEnv(env_fns)

    eval_env = SubprocVecEnv([make_env(seed=10_000)])

    if args.resume:
        model = MaskablePPO.load(args.resume, env=vec_env, device="cpu")
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
            policy_kwargs=dict(net_arch=[256, 256]),
            tensorboard_log=str(RUNS_DIR),
            verbose=1,
            seed=args.seed,
            device="cpu",
        )

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

    model.learn(
        total_timesteps=args.timesteps,
        callback=[checkpoint_cb, eval_cb],
        tb_log_name=run_name,
        progress_bar=True,
    )

    final_path = model_dir / "final.zip"
    model.save(str(final_path))
    print(f"Saved final model -> {final_path}")
    print(f"TensorBoard logs    -> {log_dir}")
    print(f"Best model          -> {model_dir / 'best'}")


if __name__ == "__main__":
    main()
