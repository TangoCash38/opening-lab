#!/usr/bin/env python3
"""Line-gate checks for the hand-written Scotch coach notes.

Replays every ply with python-chess and checks that each note's claims
match the board: captures, checks, castling, attacks, pins, and development.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import chess

ROOT = Path(__file__).resolve().parents[1]
NOTES_PATH = ROOT / "src/data/scotch-coach-notes.json"
PACKS_PATH = ROOT / "src/data/packs.ts"

SQUARE = r"[a-h][1-8]"
PIECE = r"pawn|knight|bishop|rook|queen|king"
SAN_FIND = re.compile(
    r"\b(?:O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|"
    r"[a-h]x[a-h][1-8](?:=[QRBN])?[+#]?|[a-h][1-8](?:=[QRBN])?[+#]?)\b"
)
ATTACK_ON = re.compile(rf"\b(?:attacks|aims at|hits) the ({PIECE}) on ({SQUARE})\b", re.I)
ATTACK_AND = re.compile(rf"\band the ({PIECE}) on ({SQUARE})\b", re.I)
DEFEND_ON = re.compile(rf"\bdefends the ({PIECE}) on ({SQUARE})\b", re.I)
PIN_ON = re.compile(rf"\bpins the ({PIECE}) on ({SQUARE})\b", re.I)
CAPTURE = re.compile(rf"\b(recaptures|captures|takes) the ({PIECE})(?: on ({SQUARE}))?\b", re.I)
BANNED = re.compile(
    r"\b(engine|stockfish|lichess|centipawns?|evaluation|ahead by|main line is|"
    r"about level|chances are(?: about)? level|about equal|center|toward)\b",
    re.I,
)
DECIMAL = re.compile(r"\b\d+\.\d+\b")
CENTRE = {chess.D4, chess.D5, chess.E4, chess.E5}
NAMES = {
    "pawn": chess.PAWN,
    "knight": chess.KNIGHT,
    "bishop": chess.BISHOP,
    "rook": chess.ROOK,
    "queen": chess.QUEEN,
    "king": chess.KING,
}


def scotch_plies() -> dict[str, list[str]]:
    text = PACKS_PATH.read_text()
    start = text.find('id: "scotch"')
    end = text.find('id: "italian"')
    if start < 0 or end < 0:
        raise SystemExit("Could not find the Scotch pack in packs.ts")
    block = text[start:end]
    out: dict[str, list[str]] = {}
    for match in re.finditer(r'id: "(sg\d+)"[\s\S]*?plies: \[([^\]]*)\]', block):
        sans = re.findall(r'"([^"]+)"', match.group(2))
        out[match.group(1)] = sans
    if len(out) != 10:
        raise SystemExit(f"Expected 10 Scotch lines, found {sorted(out)}")
    return out


def sentences(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", text.strip()) if part.strip()]


def dark(square: int) -> bool:
    return (chess.square_file(square) + chess.square_rank(square)) % 2 == 0


def centre_distance(square: int) -> int:
    return min(chess.square_distance(square, centre) for centre in CENTRE)


def diagonal_clear(board: chess.Board, origin: int, target: int) -> bool:
    df = chess.square_file(target) - chess.square_file(origin)
    dr = chess.square_rank(target) - chess.square_rank(origin)
    if df == 0 or abs(df) != abs(dr):
        return False
    step_f = (df > 0) - (df < 0)
    step_r = (dr > 0) - (dr < 0)
    file_i = chess.square_file(origin) + step_f
    rank_i = chess.square_rank(origin) + step_r
    while chess.square(file_i, rank_i) != target:
        if board.piece_at(chess.square(file_i, rank_i)):
            return False
        file_i += step_f
        rank_i += step_r
    return True


def piece_on_diagonal(board: chess.Board, vacated: int, piece_type: int, colour: bool, dark_only: bool | None) -> bool:
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if not piece or piece.piece_type != piece_type or piece.color != colour:
            continue
        if dark_only is True and not dark(square):
            continue
        if dark_only is False and dark(square):
            continue
        if diagonal_clear(board, square, vacated):
            return True
    return False


def file_has_pawn(board: chess.Board, file_index: int) -> bool:
    for rank in range(8):
        piece = board.piece_at(chess.square(file_index, rank))
        if piece and piece.piece_type == chess.PAWN:
            return True
    return False


def rook_shift(move: chess.Move) -> tuple[int, int] | None:
    table = {
        chess.G1: (chess.H1, chess.F1),
        chess.C1: (chess.A1, chess.D1),
        chess.G8: (chess.H8, chess.F8),
        chess.C8: (chess.A8, chess.D8),
    }
    return table.get(move.to_square)


def withheld(played: list[str], future: list[str], last: str) -> set[str]:
    out: set[str] = set()
    played_set = set(played)
    for index, san in enumerate(future):
        if san == last:
            continue
        if index > 0 and san in played_set:
            continue
        out.add(san)
    return out


def check_note(
    board_before: chess.Board,
    move: chess.Move,
    san: str,
    note: str,
    previous_capture: bool,
) -> list[str]:
    errors: list[str] = []
    board = board_before.copy(stack=False)
    board.push(move)
    moved = board.piece_at(move.to_square)
    if moved is None:
        return ["moved piece missing"]
    captured = board_before.piece_at(move.to_square)
    if board_before.is_en_passant(move):
        cap_sq = move.to_square + (-8 if board_before.turn == chess.WHITE else 8)
        captured = board_before.piece_at(cap_sq)

    parts = sentences(note)
    if not 1 <= len(parts) <= 2:
        errors.append(f"expected 1 or 2 sentences, got {len(parts)}")
    if "—" in note or "–" in note:
        errors.append("em dash or en dash")
    if BANNED.search(note) or DECIMAL.search(note):
        errors.append("banned engine, eval, or US spelling")
    if san not in note:
        errors.append(f"note does not name {san}")

    attacks = board.attacks(move.to_square)

    attack_claims = list(ATTACK_ON.finditer(note))
    if re.search(r"\b(?:attacks|aims at|hits)\b", note, re.I):
        attack_claims.extend(ATTACK_AND.finditer(note))
    for match in attack_claims:
        kind = NAMES[match.group(1).lower()]
        square = chess.parse_square(match.group(2))
        victim = board.piece_at(square)
        if square not in attacks:
            errors.append(f"does not attack {match.group(2)}")
        elif victim is None or victim.color == moved.color or victim.piece_type != kind:
            errors.append(f"no enemy {match.group(1)} on {match.group(2)}")

    for match in DEFEND_ON.finditer(note):
        kind = NAMES[match.group(1).lower()]
        square = chess.parse_square(match.group(2))
        friend = board.piece_at(square)
        if square not in attacks:
            errors.append(f"does not defend {match.group(2)}")
        elif friend is None or friend.color != moved.color or friend.piece_type != kind:
            errors.append(f"no friendly {match.group(1)} on {match.group(2)}")

    if re.search(r"\bpinned\b", note, re.I) and not PIN_ON.search(note):
        pinned_ok = False
        for match in attack_claims:
            kind = NAMES[match.group(1).lower()]
            square = chess.parse_square(match.group(2))
            victim = board.piece_at(square)
            if (
                victim
                and victim.color != moved.color
                and victim.piece_type == kind
                and board.is_pinned(victim.color, square)
            ):
                pinned_ok = True
        if not pinned_ok:
            errors.append("says pinned, but the attacked piece is not pinned")

    for match in PIN_ON.finditer(note):
        kind = NAMES[match.group(1).lower()]
        square = chess.parse_square(match.group(2))
        victim = board.piece_at(square)
        if victim is None or victim.color == moved.color or victim.piece_type != kind:
            errors.append(f"no enemy {match.group(1)} on {match.group(2)} to pin")
        elif square not in attacks or not board.is_pinned(victim.color, square):
            errors.append(f"{match.group(1)} on {match.group(2)} is not pinned")

    for match in CAPTURE.finditer(note):
        verb = match.group(1).lower()
        kind = NAMES[match.group(2).lower()]
        square_name = match.group(3)
        if captured is None or captured.piece_type != kind:
            errors.append(f"{verb} claims a {match.group(2)}, but the move does not capture one")
        if square_name and chess.parse_square(square_name) != move.to_square:
            errors.append(f"capture square is not {square_name}")
        if verb == "recaptures" and not previous_capture:
            errors.append("recaptures, but the previous move was not a capture")

    gives_check = bool(re.search(r"\bgives check\b", note, re.I))
    blocks = bool(re.search(r"\bblocks the check\b", note, re.I))
    escapes = bool(re.search(r"\bout of check\b", note, re.I))
    if gives_check and not board.is_check():
        errors.append("says check, but the king is not in check")
    if (blocks or escapes) and (not board_before.is_check() or board.is_check()):
        errors.append("check was not blocked or escaped")
    if gives_check and (blocks or escapes):
        errors.append("cannot both give check and escape it")
    if re.search(r"\bcheckmate\b", note, re.I) and not board.is_checkmate():
        errors.append("says checkmate, but it is not mate")

    if re.search(r"\bcastles\b", note, re.I) and not board_before.is_castling(move):
        errors.append("says castles, but the move is not castling")

    if re.search(r"\bbrings a rook towards the centre\b", note, re.I):
        shift = rook_shift(move) if board_before.is_castling(move) else None

        def file_centre(square: int) -> int:
            file_i = chess.square_file(square)
            return min(abs(file_i - chess.square_file(chess.D1)), abs(file_i - chess.square_file(chess.E1)))

        if shift is None or file_centre(shift[1]) >= file_centre(shift[0]):
            errors.append("the rook does not come towards the centre")

    if re.search(r"\bopen e-file\b", note, re.I):
        e_file = chess.square_file(chess.E1)
        if moved.piece_type != chess.ROOK or chess.square_file(move.to_square) != e_file or file_has_pawn(board, e_file):
            errors.append("the e-file is not open for this rook")

    develop = re.search(r"\bdevelops (?:a|the) (knight|queen)\b", note, re.I)
    if develop:
        expected = NAMES[develop.group(1).lower()]
        home = 0 if moved.color == chess.WHITE else 7
        if moved.piece_type != expected or chess.square_rank(move.from_square) != home:
            errors.append(f"does not develop a {develop.group(1)} from the back rank")

    bishop = re.search(r"\bdevelops the (dark|light)-squared bishop\b", note, re.I)
    if bishop:
        want_dark = bishop.group(1).lower() == "dark"
        home = 0 if moved.color == chess.WHITE else 7
        if (
            moved.piece_type != chess.BISHOP
            or dark(move.to_square) != want_dark
            or chess.square_rank(move.from_square) != home
        ):
            errors.append(f"does not develop the {bishop.group(1)}-squared bishop")

    if re.search(r"\btowards the centre\b", note, re.I) and not re.search(r"\bbrings a rook towards the centre\b", note, re.I):
        if centre_distance(move.to_square) >= centre_distance(move.from_square):
            errors.append("the piece does not move towards the centre")

    if re.search(r"\binto the centre\b", note, re.I) and move.to_square not in CENTRE:
        errors.append("the piece does not land in the centre")

    if re.search(r"\b(?:share of the centre|strikes at the centre)\b", note, re.I):
        if moved.piece_type != chess.PAWN or move.to_square not in CENTRE:
            errors.append("this is not a pawn strike in the centre")

    if re.search(r"\bopens lines for the bishop and queen\b", note, re.I):
        vacated = move.from_square
        colour = moved.color
        if not (
            piece_on_diagonal(board, vacated, chess.BISHOP, colour, None)
            and piece_on_diagonal(board, vacated, chess.QUEEN, colour, None)
        ):
            errors.append("e-pawn move does not open a diagonal for the bishop and the queen")

    if re.search(r"\bopens a path for the dark-squared bishop\b", note, re.I):
        if not piece_on_diagonal(board, move.from_square, chess.BISHOP, moved.color, True):
            errors.append("no path opened for the dark-squared bishop")

    if re.search(r"\bgets ready to castle\b", note, re.I):
        colour = moved.color
        rights = board.has_kingside_castling_rights(colour) or board.has_queenside_castling_rights(colour)
        king_sq = board.king(colour)
        between = False
        if king_sq is not None and chess.square_rank(move.from_square) == chess.square_rank(king_sq):
            for rook_file in (0, 7):
                left, right = sorted((chess.square_file(king_sq), rook_file))
                if left < chess.square_file(move.from_square) < right:
                    between = True
        if board_before.is_castling(move) or not rights or not between:
            errors.append("this move does not get ready to castle")

    if blocks:
        king_sq = board_before.king(board_before.turn)
        checkers = board_before.checkers()
        if king_sq is None or not any(
            move.to_square in chess.SquareSet.between(checker, king_sq) for checker in checkers
        ):
            errors.append("the piece does not block the check")

    # A claim word with no parsed hit is a missed check, not a free pass.
    if re.search(r"\b(?:attacks|aims at|hits)\b", note, re.I) and not ATTACK_ON.search(note) and not re.search(rf"\b(?:attacks|aims at|hits) {SQUARE}\b", note, re.I):
        errors.append("attack wording was not checked")
    bare_squares = re.findall(rf"\b(?:attacks|aims at|hits) ({SQUARE})\b", note, re.I)
    for name in bare_squares:
        square = chess.parse_square(name)
        if square not in attacks:
            errors.append(f"does not attack {name}")
    return errors


def check_intro(line_id: str, intro: str) -> list[str]:
    errors: list[str] = []
    if "—" in intro or "–" in intro:
        errors.append("intro has a dash")
    if BANNED.search(intro) or DECIMAL.search(intro):
        errors.append("intro has engine talk or a decimal")
    count = len(sentences(intro))
    if not 1 <= count <= 2:
        errors.append(f"intro has {count} sentences")
    if not intro.endswith("."):
        errors.append("intro should end with a full stop")
    if line_id and not intro:
        errors.append("missing intro")
    return errors


def main() -> int:
    notes = json.loads(NOTES_PATH.read_text())
    plies = scotch_plies()
    failures: list[str] = []
    if set(notes) != set(plies):
        failures.append(f"note lines {sorted(notes)} != pack lines {sorted(plies)}")
    for line_id, moves in plies.items():
        row = notes.get(line_id)
        if not row:
            continue
        intro_errors = check_intro(line_id, row.get("intro", ""))
        for err in intro_errors:
            failures.append(f"{line_id} intro: {err}")
        stored = row.get("notes", [])
        if len(stored) != len(moves):
            failures.append(f"{line_id}: {len(stored)} notes for {len(moves)} plies")
            continue
        board = chess.Board()
        previous_capture = False
        for index, san in enumerate(moves):
            note = stored[index]
            try:
                move = board.parse_san(san)
            except ValueError:
                failures.append(f"{line_id} ply {index + 1}: illegal {san}")
                break
            played = moves[: index + 1]
            future = moves[index + 1 :]
            banned_future = SAN_FIND.findall(note) 
            blocked = withheld(moves[:index], future, san)
            leaked = [tok for tok in banned_future if tok in blocked]
            if leaked:
                failures.append(f"{line_id} ply {index + 1}: names a later book move {leaked}")
            for err in check_note(board, move, san, note, previous_capture):
                failures.append(f"{line_id} ply {index + 1} {san}: {err}")
            previous_capture = board.is_capture(move)
            board.push(move)
    if failures:
        print("\n".join(failures))
        print(f"\n{len(failures)} failure(s)")
        return 1
    total = sum(len(v) for v in plies.values())
    print(f"Scotch coach notes OK: {len(plies)} lines, {total} plies")
    return 0


if __name__ == "__main__":
    sys.exit(main())
