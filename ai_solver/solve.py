"""Solve a single user-provided board.

Reads a 10x17 (or generic R x C) grid of ints (0 = empty, 1-9 = apple) from a JSON
file or stdin, runs the trained policy greedily, and prints the move sequence and
final score.

Usage:
    python -m ai_solver.solve --model ai_solver/models/<run>/final.zip --board-file board.json
    cat board.json | python -m ai_solver.solve --model ai_solver/models/<run>/final.zip
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import torch
from sb3_contrib import MaskablePPO

from .fruit_box_env import FruitBoxEnv


def _auto_device() -> str:
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def load_board(path: str | None) -> np.ndarray:
    text = Path(path).read_text() if path else sys.stdin.read()
    data = json.loads(text)
    arr = np.asarray(data, dtype=np.int8)
    if arr.ndim != 2:
        raise ValueError(f"Expected 2D board, got shape {arr.shape}")
    return arr


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, type=str, help="Path to trained .zip")
    parser.add_argument("--board-file", type=str, default=None, help="Board JSON path. Omit to read stdin.")
    parser.add_argument("--device", type=str, default="auto",
                        help="Device: auto | cpu | cuda | cuda:0 | mps")
    parser.add_argument("--greedy-fallback", action="store_true",
                        help="If model picks an invalid action (mask bug), fall back to first valid.")
    args = parser.parse_args()

    device = _auto_device() if args.device == "auto" else args.device
    board = load_board(args.board_file)
    rows, cols = board.shape
    env = FruitBoxEnv(rows=rows, cols=cols)
    obs, _ = env.reset(options={"board": board})

    model = MaskablePPO.load(args.model, device=device)

    moves: list[tuple[int, int, int, int]] = []
    while True:
        mask = env.action_masks()
        if not mask.any():
            break
        action, _ = model.predict(obs, action_masks=mask, deterministic=True)
        action = int(action)
        if not mask[action]:
            if args.greedy_fallback:
                action = int(np.flatnonzero(mask)[0])
            else:
                raise RuntimeError(f"Model picked masked action {action}; pass --greedy-fallback to recover")
        r1, r2, c1, c2 = env.decode_action(action)
        moves.append((r1, c1, r2, c2))
        obs, _r, terminated, _trunc, _info = env.step(action)
        if terminated:
            break

    print(json.dumps({
        "moves": [{"startRow": r1, "startCol": c1, "endRow": r2, "endCol": c2} for (r1, c1, r2, c2) in moves],
        "score": env.score,
        "remaining": int((env.board != 0).sum()),
        "total_moves": len(moves),
    }, indent=2))


if __name__ == "__main__":
    main()
