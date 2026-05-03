"""Evaluate a trained MaskablePPO model (or a random baseline) on Fruit Box.

Usage:
    python -m ai_solver.evaluate --model ai_solver/models/<run>/final.zip --episodes 200
    python -m ai_solver.evaluate --random --episodes 200
"""
from __future__ import annotations

import argparse
import statistics
from pathlib import Path

import numpy as np
import torch
from sb3_contrib import MaskablePPO

from .board_generator import TOTAL_CELLS
from .fruit_box_env import FruitBoxEnv


def _auto_device() -> str:
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def _pick_random_action(mask: np.ndarray, rng: np.random.Generator) -> int:
    valid_indices = np.flatnonzero(mask)
    return int(rng.choice(valid_indices))


def run_episode(env: FruitBoxEnv, model: MaskablePPO | None, rng: np.random.Generator) -> dict:
    obs, info = env.reset(seed=int(rng.integers(0, 2**31 - 1)))
    done = False
    moves = 0
    while not done:
        mask = env.action_masks()
        if not mask.any():
            break
        if model is None:
            action = _pick_random_action(mask, rng)
        else:
            action, _ = model.predict(obs, action_masks=mask, deterministic=True)
            action = int(action)
        obs, _reward, terminated, truncated, info = env.step(action)
        moves += 1
        done = terminated or truncated
    return {"score": env.score, "moves": moves, "remaining": info["remaining"]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default=None, help="Path to .zip model. Omit for random baseline.")
    parser.add_argument("--random", action="store_true", help="Run random-policy baseline.")
    parser.add_argument("--episodes", type=int, default=200)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--render", action="store_true")
    parser.add_argument("--device", type=str, default="auto",
                        help="Device: auto | cpu | cuda | cuda:0 | mps")
    args = parser.parse_args()

    if not args.random and args.model is None:
        parser.error("Provide --model PATH or use --random.")

    device = _auto_device() if args.device == "auto" else args.device
    model = None if args.random else MaskablePPO.load(args.model, device=device)
    env = FruitBoxEnv(render_mode="human" if args.render else None)
    rng = np.random.default_rng(args.seed)

    scores, moves_list, remaining_list = [], [], []
    clears = 0
    for ep in range(args.episodes):
        result = run_episode(env, model, rng)
        scores.append(result["score"])
        moves_list.append(result["moves"])
        remaining_list.append(result["remaining"])
        if result["remaining"] == 0:
            clears += 1
        if (ep + 1) % max(args.episodes // 10, 1) == 0:
            print(f"[{ep+1}/{args.episodes}] mean_score={statistics.mean(scores):.2f}")

    print()
    print(f"Episodes:        {args.episodes}")
    print(f"Mean score:      {statistics.mean(scores):.2f}")
    print(f"Std score:       {statistics.pstdev(scores):.2f}")
    print(f"Min / Max score: {min(scores)} / {max(scores)}")
    print(f"Mean moves:      {statistics.mean(moves_list):.2f}")
    print(f"Mean remaining:  {statistics.mean(remaining_list):.2f} / {TOTAL_CELLS}")
    print(f"All-clear rate:  {clears}/{args.episodes} ({100*clears/args.episodes:.1f}%)")


if __name__ == "__main__":
    main()
