"""Sanity tests for FruitBoxEnv. Run: pytest ai_solver/tests"""
from __future__ import annotations

import numpy as np
import pytest

from ai_solver.board_generator import COLS, ROWS, generate_board
from ai_solver.fruit_box_env import FruitBoxEnv, RewardConfig


def naive_rect_sum(board: np.ndarray, r1: int, r2: int, c1: int, c2: int) -> int:
    return int(board[r1 : r2 + 1, c1 : c2 + 1].sum())


def test_board_generator_sum_divisible_by_10():
    rng = np.random.default_rng(0)
    for _ in range(20):
        board = generate_board(rng)
        assert board.shape == (ROWS, COLS)
        assert board.min() >= 1 and board.max() <= 9
        assert int(board.sum()) % 10 == 0


def test_prefix_sum_matches_naive():
    env = FruitBoxEnv()
    rng = np.random.default_rng(123)
    for _ in range(5):
        env.reset(seed=int(rng.integers(0, 2**31)))
        mask = env.action_masks()
        for idx in np.flatnonzero(mask):
            r1, r2, c1, c2 = env.decode_action(int(idx))
            assert naive_rect_sum(env.board, r1, r2, c1, c2) == 10
        # Also spot-check some masked-off rectangles really aren't 10.
        zero_indices = np.flatnonzero(~mask)
        for idx in zero_indices[: min(50, len(zero_indices))]:
            r1, r2, c1, c2 = env.decode_action(int(idx))
            assert naive_rect_sum(env.board, r1, r2, c1, c2) != 10


def test_clear_zeros_cells():
    env = FruitBoxEnv()
    env.reset(seed=7)
    mask = env.action_masks()
    idx = int(np.flatnonzero(mask)[0])
    r1, r2, c1, c2 = env.decode_action(idx)
    rect_before = env.board[r1 : r2 + 1, c1 : c2 + 1].copy()
    cells_before = int((rect_before != 0).sum())

    obs, reward, _term, _trunc, info = env.step(idx)

    rect_after = env.board[r1 : r2 + 1, c1 : c2 + 1]
    assert (rect_after == 0).all()
    assert reward == cells_before
    assert info["score"] == cells_before


def test_reward_equals_cells_cleared_default_config():
    env = FruitBoxEnv(reward_config=RewardConfig(all_clear_bonus=0.0, leftover_penalty=0.0))
    env.reset(seed=11)
    total_reward = 0.0
    cells_cleared = 0
    for _ in range(200):
        mask = env.action_masks()
        if not mask.any():
            break
        idx = int(np.flatnonzero(mask)[0])
        before = int((env.board != 0).sum())
        _, reward, term, _, _ = env.step(idx)
        after = int((env.board != 0).sum())
        cells_cleared += (before - after)
        total_reward += reward
        if term:
            break
    assert total_reward == cells_cleared


def test_terminates_when_no_valid_action():
    env = FruitBoxEnv()
    env.reset(seed=3)
    terminated = False
    for _ in range(500):
        mask = env.action_masks()
        if not mask.any():
            assert env._has_any_valid_action() is False
            return
        idx = int(np.flatnonzero(mask)[0])
        _, _, terminated, _, _ = env.step(idx)
        if terminated:
            assert env.action_masks().any() is np.False_ or not env.action_masks().any()
            return
    pytest.fail("Episode did not terminate within 500 steps")


def test_reset_with_specific_board():
    board = np.full((ROWS, COLS), 1, dtype=np.int8)  # all 1s; sum=170 (divisible by 10)
    env = FruitBoxEnv()
    obs, _ = env.reset(options={"board": board})
    assert (obs == 1).all()
    mask = env.action_masks()
    # 10 ones in a row/col/rect -> many valid options
    assert mask.any()


def test_invalid_action_does_not_clear_and_penalizes():
    env = FruitBoxEnv()
    env.reset(seed=5)
    mask = env.action_masks()
    invalid_indices = np.flatnonzero(~mask)
    if len(invalid_indices) == 0:
        pytest.skip("No invalid actions available on this seed")
    board_before = env.board.copy()
    _, reward, _, _, _ = env.step(int(invalid_indices[0]))
    assert (env.board == board_before).all()
    assert reward < 0
