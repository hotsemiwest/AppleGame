"""Gymnasium environment for the Fruit Box (Apple Game).

Mirrors the web app's rules:
- 10 rows x 17 cols, values in {1..9}, cleared cells become 0.
- A valid action is any axis-aligned rectangle whose contained cell-values sum to 10.
- Reward = number of cells cleared (equals game score: +1 per apple).
- Episode terminates when no rectangle sums to 10.

Action space: Discrete(N), where N = R*(R+1)/2 * C*(C+1)/2 = 8415 for a 10x17 board.
Each index encodes (r1, r2, c1, c2) with r1<=r2 and c1<=c2 via a precomputed lookup.

Action masking is implemented via the `action_masks()` method (used by sb3-contrib's
MaskablePPO) so the policy never picks an invalid rectangle.
"""
from __future__ import annotations

from dataclasses import dataclass

import gymnasium as gym
import numpy as np
from gymnasium import spaces

from .board_generator import COLS, ROWS, TARGET_SUM, generate_board


def _build_action_table(rows: int, cols: int) -> np.ndarray:
    """All (r1, r2, c1, c2) tuples with r1<=r2<rows, c1<=c2<cols. Shape (N, 4)."""
    actions = []
    for r1 in range(rows):
        for r2 in range(r1, rows):
            for c1 in range(cols):
                for c2 in range(c1, cols):
                    actions.append((r1, r2, c1, c2))
    return np.array(actions, dtype=np.int16)


@dataclass
class RewardConfig:
    cell_clear: float = 1.0          # +1 per apple cleared (matches game score)
    nine_bonus: float = 0.5          # bonus per 9 cleared — encourages clearing 9s early
    eight_bonus: float = 0.3         # bonus per 8 cleared — encourages clearing 8s early
    pair_bonus: float = 0.5          # bonus when exactly 2 cells cleared (pair move)
    all_clear_bonus: float = 50.0    # terminal bonus on full board clear
    leftover_penalty: float = 3.0    # terminal penalty per leftover apple — key fix


class FruitBoxEnv(gym.Env):
    metadata = {"render_modes": ["human"]}

    def __init__(
        self,
        rows: int = ROWS,
        cols: int = COLS,
        reward_config: RewardConfig | None = None,
        render_mode: str | None = None,
    ):
        super().__init__()
        self.rows = rows
        self.cols = cols
        self.reward_config = reward_config or RewardConfig()
        self.render_mode = render_mode

        self._action_table = _build_action_table(rows, cols)
        self.n_actions = len(self._action_table)

        self.observation_space = spaces.Box(
            low=0, high=9, shape=(rows, cols), dtype=np.int8
        )
        self.action_space = spaces.Discrete(self.n_actions)

        self.board: np.ndarray = np.zeros((rows, cols), dtype=np.int8)
        self.score: int = 0
        self._steps: int = 0

    # ---- Gym API --------------------------------------------------------

    def reset(self, *, seed: int | None = None, options: dict | None = None):
        super().reset(seed=seed)
        rng = np.random.default_rng(seed) if seed is not None else None

        if options and "board" in options:
            board = np.asarray(options["board"], dtype=np.int8)
            if board.shape != (self.rows, self.cols):
                raise ValueError(
                    f"options['board'] shape {board.shape} != ({self.rows}, {self.cols})"
                )
            self.board = board.copy()
        else:
            self.board = generate_board(rng) if rng is not None else generate_board()

        self.score = 0
        self._steps = 0
        return self._obs(), self._info()

    def step(self, action: int):
        action = int(action)
        if not 0 <= action < self.n_actions:
            raise ValueError(f"action {action} out of range [0, {self.n_actions})")

        r1, r2, c1, c2 = self._action_table[action]
        rect = self.board[r1 : r2 + 1, c1 : c2 + 1]
        rect_sum = int(rect.sum())

        if rect_sum != TARGET_SUM:
            # Invalid action selected (mask should prevent this with MaskablePPO).
            # We treat it as a no-op with a small penalty so the agent learns the mask.
            reward = -1.0
            terminated = not self._has_any_valid_action()
            return self._obs(), reward, terminated, False, self._info()

        cells_cleared = int((rect != 0).sum())
        nines_cleared = int((rect == 9).sum())
        eights_cleared = int((rect == 8).sum())

        # Clear the rectangle.
        self.board[r1 : r2 + 1, c1 : c2 + 1] = 0
        self.score += cells_cleared
        self._steps += 1

        cfg = self.reward_config
        reward = (
            cfg.cell_clear * cells_cleared
            + cfg.nine_bonus * nines_cleared
            + cfg.eight_bonus * eights_cleared
            + (cfg.pair_bonus if cells_cleared == 2 else 0.0)
        )

        terminated = not self._has_any_valid_action()
        if terminated:
            remaining = int((self.board != 0).sum())
            if remaining == 0:
                reward += cfg.all_clear_bonus
            else:
                reward -= cfg.leftover_penalty * remaining

        return self._obs(), float(reward), terminated, False, self._info()

    def render(self):
        if self.render_mode != "human":
            return
        for row in self.board:
            print(" ".join(f"{v}" if v else "." for v in row))
        print(f"score={self.score} steps={self._steps}")
        print()

    # ---- Action masking -------------------------------------------------

    def action_masks(self) -> np.ndarray:
        """Boolean array of shape (n_actions,). True iff rectangle sums to TARGET_SUM."""
        return self._compute_mask(self.board)

    def _compute_mask(self, board: np.ndarray) -> np.ndarray:
        """Vectorized: compute prefix sums then sum-of-rect for every action."""
        # Padded prefix sum so prefix[r+1, c+1] = sum(board[:r+1, :c+1]).
        prefix = np.zeros((self.rows + 1, self.cols + 1), dtype=np.int32)
        prefix[1:, 1:] = board.cumsum(axis=0).cumsum(axis=1)

        r1 = self._action_table[:, 0]
        r2 = self._action_table[:, 1]
        c1 = self._action_table[:, 2]
        c2 = self._action_table[:, 3]

        sums = (
            prefix[r2 + 1, c2 + 1]
            - prefix[r1, c2 + 1]
            - prefix[r2 + 1, c1]
            + prefix[r1, c1]
        )
        return sums == TARGET_SUM

    def _has_any_valid_action(self) -> bool:
        return bool(self.action_masks().any())

    # ---- Helpers --------------------------------------------------------

    def _obs(self) -> np.ndarray:
        return self.board.copy()

    def _info(self) -> dict:
        mask = self.action_masks()
        return {
            "score": self.score,
            "remaining": int((self.board != 0).sum()),
            "valid_actions": int(mask.sum()),
            "steps": self._steps,
        }

    def decode_action(self, action: int) -> tuple[int, int, int, int]:
        """Return (r1, r2, c1, c2) for the given action index."""
        r1, r2, c1, c2 = self._action_table[int(action)]
        return int(r1), int(r2), int(c1), int(c2)
