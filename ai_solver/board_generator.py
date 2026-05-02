"""Board generation that mirrors src/utils/boardGenerator.ts.

The web app fills a 10x17 grid with random ints in [1, 9] and regenerates
until the total board sum is a multiple of 10. This module reproduces that
exactly so policies trained here transfer to the live game.
"""
from __future__ import annotations

import numpy as np

ROWS = 10
COLS = 17
TOTAL_CELLS = ROWS * COLS
TARGET_SUM = 10


def generate_board(rng: np.random.Generator | None = None) -> np.ndarray:
    """Return a (ROWS, COLS) int8 array. Sum is divisible by 10."""
    if rng is None:
        rng = np.random.default_rng()
    while True:
        board = rng.integers(1, 10, size=(ROWS, COLS), dtype=np.int8)
        if int(board.sum()) % 10 == 0:
            return board


def generate_board_with_size(rows: int, cols: int, rng: np.random.Generator | None = None) -> np.ndarray:
    if rng is None:
        rng = np.random.default_rng()
    while True:
        board = rng.integers(1, 10, size=(rows, cols), dtype=np.int8)
        if int(board.sum()) % 10 == 0:
            return board
