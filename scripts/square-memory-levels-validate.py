#!/usr/bin/env python3
"""Validate Square Memory level diagrams with python-chess.

Reads a JSON list of {id, level, name, fen} on stdin. Exits 0 when every
diagram is legal, unique, and has the piece count for its level.
"""

from __future__ import annotations

import json
import sys

try:
    import chess
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "chess"])
    import chess

EXPECTED = {1: 3, 2: 4, 3: 5, 4: 6, 5: 10}


def main() -> int:
    rows = json.load(sys.stdin)
    if not isinstance(rows, list):
        print("expected a JSON list", file=sys.stderr)
        return 1

    seen: dict[str, str] = {}
    counts = {level: 0 for level in EXPECTED}
    errors: list[str] = []

    for row in rows:
        pid = str(row.get("id", ""))
        name = str(row.get("name", ""))
        level = row.get("level")
        fen = str(row.get("fen", ""))
        if level not in EXPECTED:
            errors.append(f"{pid}: bad level {level}")
            continue
        counts[level] += 1
        if not name.strip():
            errors.append(f"{pid}: missing name")
        try:
            board = chess.Board(fen)
        except ValueError as exc:
            errors.append(f"{pid}: {exc}")
            continue

        piece_map = board.piece_map()
        total = len(piece_map)
        if total != EXPECTED[level]:
            errors.append(f"{pid}: {total} pieces, wanted {EXPECTED[level]}")

        white_kings = sum(1 for p in piece_map.values() if p.piece_type == chess.KING and p.color == chess.WHITE)
        black_kings = sum(1 for p in piece_map.values() if p.piece_type == chess.KING and p.color == chess.BLACK)
        if white_kings != 1 or black_kings != 1:
            errors.append(f"{pid}: kings white={white_kings} black={black_kings}")

        for square, piece in piece_map.items():
            if piece.piece_type == chess.PAWN and chess.square_rank(square) in (0, 7):
                errors.append(f"{pid}: pawn on {chess.square_name(square)}")

        if not board.is_valid():
            errors.append(f"{pid}: illegal ({int(board.status())}) {fen}")
        if board.status() & chess.STATUS_OPPOSITE_CHECK:
            errors.append(f"{pid}: side not to move is in check")
        if board.is_check():
            errors.append(f"{pid}: side to move is in check")

        key = board.board_fen()
        if key in seen:
            errors.append(f"{pid}: duplicate of {seen[key]}")
        else:
            seen[key] = pid

    for level, count in counts.items():
        if count != 10:
            errors.append(f"level {level} has {count} positions, wanted 10")

    if len(rows) != 50:
        errors.append(f"{len(rows)} positions, wanted 50")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    print(f"ok {len(rows)} positions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
