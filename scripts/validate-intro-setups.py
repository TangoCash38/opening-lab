"""Check each intro setup is a legal prefix of its pack line."""

import json
import sys

import chess


def main() -> None:
    path = sys.argv[1]
    with open(path, encoding="utf-8") as handle:
        rows = json.load(handle)
    if not rows:
        raise SystemExit("no intro setups")
    seen = set()
    for row in rows:
        pack_id = row["packId"]
        if pack_id in seen:
            raise SystemExit(f"duplicate setup {pack_id}")
        seen.add(pack_id)
        plies = row["plies"]
        line = row["linePlies"]
        if line[: len(plies)] != plies:
            raise SystemExit(f"{pack_id} is not a prefix of {row['lineId']}")
        board = chess.Board()
        for san in plies:
            board.push_san(san)
        full_moves = (len(plies) + 1) // 2
        if not 6 <= len(plies) <= 20:
            raise SystemExit(f"{pack_id} has {len(plies)} plies")
        if not 4 <= full_moves <= 10:
            raise SystemExit(f"{pack_id} covers {full_moves} moves")
        if board.is_checkmate():
            raise SystemExit(f"{pack_id} ends in checkmate")
    print(f"python-chess ok {len(rows)}")


if __name__ == "__main__":
    main()
