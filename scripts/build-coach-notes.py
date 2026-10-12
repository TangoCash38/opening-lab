#!/usr/bin/env python3
"""Verify hand-written coach notes for every on-sale pack except the Scotch.

Scotch notes stay in src/data/scotch-coach-notes.json. python-chess checks
claims in the notes. It does not write them.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

import chess

# Notes are written by hand. python-chess only checks the claims in them.

ROOT = Path(__file__).resolve().parents[1]
LINES = Path("/tmp/live-lines.json")
OUT = ROOT / "src" / "data" / "coach-notes.json"
SCOTCH = ROOT / "src" / "data" / "scotch-coach-notes.json"
ARTIFACT_JSON = Path("/opt/cursor/artifacts/coach-notes.json")
ARTIFACT_CSV = Path("/opt/cursor/artifacts/coach-notes.csv")

PIECE = {
    chess.PAWN: "pawn",
    chess.KNIGHT: "knight",
    chess.BISHOP: "bishop",
    chess.ROOK: "rook",
    chess.QUEEN: "queen",
    chess.KING: "king",
}
VALUE = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
    chess.KING: 10,
}
HOME = {
    chess.WHITE: {
        chess.KNIGHT: {chess.B1, chess.G1},
        chess.BISHOP: {chess.C1, chess.F1},
        chess.QUEEN: {chess.D1},
        chess.ROOK: {chess.A1, chess.H1},
    },
    chess.BLACK: {
        chess.KNIGHT: {chess.B8, chess.G8},
        chess.BISHOP: {chess.C8, chess.F8},
        chess.QUEEN: {chess.D8},
        chess.ROOK: {chess.A8, chess.H8},
    },
}
CENTRE = {chess.D4, chess.E4, chess.D5, chess.E5}
EVAL_SENTENCE = re.compile(
    r"\b(winning|better|ahead|level|equal|equality|advantage|plus|pull|engine|centipawn|stockfish|eval)\b",
    re.I,
)
DASH = re.compile(r"[—–…]")
SQUARE = r"[a-h][1-8]"
PIECE_WORD = r"pawn|knight|bishop|rook|queen|king"


def piece_name(pt: int) -> str:
    return PIECE[pt]


def bishop_kind(sq: int) -> str:
    dark = (chess.square_file(sq) + chess.square_rank(sq)) % 2 == 0
    return "dark-squared bishop" if dark else "light-squared bishop"


def mover_name(pt: int, sq: int) -> str:
    if pt == chess.BISHOP:
        return bishop_kind(sq)
    return piece_name(pt)


def centre_dist(sq: int) -> int:
    return min(chess.square_distance(sq, c) for c in CENTRE)


def side_name(color: bool) -> str:
    return "White" if color == chess.WHITE else "Black"


def enemies_from(board: chess.Board, sq: int, color: bool) -> list[tuple[int, int]]:
    found = []
    for target in board.attacks(sq):
        piece = board.piece_at(target)
        if piece and piece.color != color:
            found.append((piece.piece_type, target))
    found.sort(key=lambda item: (-VALUE[item[0]], item[1]))
    return found


def friends_from(board: chess.Board, sq: int, color: bool) -> list[tuple[int, int]]:
    found = []
    for target in board.attacks(sq):
        piece = board.piece_at(target)
        if piece and piece.color == color and piece.piece_type != chess.KING and board.is_attacked_by(not color, target):
            found.append((piece.piece_type, target, True))
    found.sort(key=lambda item: (not item[2], -VALUE[item[0]], item[1]))
    return [(pt, sq_) for pt, sq_, _ in found]


def removed_attacker(before: chess.Board, cap_sq: int, color: bool) -> tuple[str, str] | None:
    best = None
    for target in before.attacks(cap_sq):
        piece = before.piece_at(target)
        if piece and piece.color == color and piece.piece_type != chess.KING:
            rank = VALUE[piece.piece_type]
            if best is None or rank > best[0]:
                best = (rank, piece.piece_type, target)
    if not best:
        return None
    return piece_name(best[1]), chess.square_name(best[2])


def pins_created(before: chess.Board, after: chess.Board, color: bool, mover_to: int) -> list[tuple[int, int, int]]:
    enemy = not color
    king_sq = after.king(enemy)
    if king_sq is None:
        return []
    pins = []
    for sq in chess.SQUARES:
        piece = after.piece_at(sq)
        if piece is None or piece.color != enemy or piece.piece_type == chess.KING:
            continue
        if not after.is_pinned(enemy, sq) or before.is_pinned(enemy, sq):
            continue
        if not aligned(king_sq, sq, mover_to):
            continue
        if chess.square_distance(king_sq, mover_to) <= chess.square_distance(king_sq, sq):
            continue
        between = chess.SquareSet.between(king_sq, mover_to)
        blockers = [s for s in between if after.piece_at(s) is not None]
        if blockers == [sq]:
            pins.append((piece.piece_type, sq, king_sq))
    pins.sort(key=lambda item: -VALUE[item[0]])
    return pins


def aligned(a: int, b: int, c: int) -> bool:
    ray = chess.SquareSet.ray(a, c)
    return ray is not None and b in ray


def opened_sliders(before: chess.Board, after: chess.Board, vacated: int, color: bool) -> list[str]:
    names = []
    for sq in chess.SQUARES:
        piece = after.piece_at(sq)
        if piece is None or piece.color != color:
            continue
        if piece.piece_type not in (chess.BISHOP, chess.QUEEN):
            continue
        if before.piece_at(sq) != piece:
            continue
        new = after.attacks(sq) - before.attacks(sq)
        useful = False
        for target in new:
            ray = chess.SquareSet.between(sq, target)
            if vacated in ray or vacated == target:
                useful = True
                break
        if not useful:
            continue
        names.append(bishop_kind(sq) if piece.piece_type == chess.BISHOP else "queen")
    # Stable, unique, bishop before queen if both.
    seen = []
    for name in names:
        if name not in seen:
            seen.append(name)
    return seen


def clears_castling(before: chess.Board, move: chess.Move, color: bool) -> bool:
    if before.is_castling(move):
        return False
    rights = before.castling_rights & (chess.BB_RANK_1 if color == chess.WHITE else chess.BB_RANK_8)
    if not rights:
        return False
    king_sq = before.king(color)
    if king_sq is None:
        return False
    rank = chess.square_rank(king_sq)
    for rook_sq in (chess.square(0, rank), chess.square(7, rank)):
        if not before.has_castling_rights(color) and before.piece_at(rook_sq) is None:
            continue
        if chess.square_rank(move.from_square) != rank:
            continue
        left, right = sorted((king_sq, rook_sq))
        if left < move.from_square < right and not (left < move.to_square < right):
            return True
    return False


def capture_square(before: chess.Board, move: chess.Move) -> int | None:
    if not before.is_capture(move):
        return None
    if before.is_en_passant(move):
        step = -8 if before.turn == chess.WHITE else 8
        return move.to_square + step
    return move.to_square


def clean_intro(idea: str) -> str:
    text = (
        idea.replace("...", "")
        .replace("…", "")
        .replace("—", " then ")
        .replace("–", " then ")
        .replace("’", "'")
        .replace("“", "")
        .replace("”", "")
    )
    text = re.sub(r"\s+", " ", text).strip()
    parts = re.split(r"(?<=[.!?])\s+", text)
    kept = []
    for part in parts:
        part = part.strip(" ,")
        if not part or EVAL_SENTENCE.search(part):
            continue
        if not re.search(r"[.!?]$", part):
            part += "."
        kept.append(part)
        if len(kept) == 2:
            break
    intro = " ".join(kept).strip()
    intro = re.sub(r"\s+", " ", intro)
    intro = intro.replace(" ,", ",").strip()
    return intro


def attack_clause(enemies: list[tuple[int, int]], verb: str = "attacks") -> str | None:
    if not enemies:
        return None
    pt, sq = enemies[0]
    return f"{verb} the {piece_name(pt)} on {chess.square_name(sq)}"


def defend_clause(friends: list[tuple[int, int]]) -> str | None:
    if not friends:
        return None
    pt, sq = friends[0]
    return f"defends the {piece_name(pt)} on {chess.square_name(sq)}"


def note_for(before: chess.Board, san: str) -> str:
    move = before.parse_san(san)
    color = before.turn
    piece = before.piece_at(move.from_square)
    assert piece is not None
    pt = piece.piece_type
    frm = move.from_square
    to = move.to_square
    cap_sq = capture_square(before, move)
    after = before.copy(stack=False)
    after.push(move)
    check = after.is_check()
    name = mover_name(pt, frm)
    enemies = [item for item in enemies_from(after, to, color) if item[0] != chess.KING]
    friends = friends_from(after, to, color)
    towards = centre_dist(to) < centre_dist(frm)
    home = frm in HOME.get(color, {}).get(pt, set())
    opened = opened_sliders(before, after, frm, color)
    pins = pins_created(before, after, color, to)
    last_cap = None
    if before.move_stack:
        prev = before.peek()
        prev_board = before.copy()
        prev_board.pop()
        if prev_board.is_capture(prev) and prev.to_square == to:
            last_cap = prev.to_square

    if after.is_checkmate():
        if cap_sq is not None:
            cap = before.piece_at(cap_sq)
            assert cap is not None
            return f"{san} takes the {piece_name(cap.piece_type)} on {chess.square_name(cap_sq)} and is checkmate."
        return f"{san} is checkmate."

    if before.is_castling(move):
        return f"{san} castles the king to safety and brings a rook towards the centre."

    if cap_sq is not None:
        cap = before.piece_at(cap_sq)
        assert cap is not None
        cap_name = piece_name(cap.piece_type)
        cap_at = chess.square_name(cap_sq)
        verb = "recaptures" if last_cap == to else "takes"
        primary = f"{san} {verb} the {cap_name} on {cap_at}"
        extra = []
        if check:
            extra.append("gives check")
        if move.promotion:
            extra.append(f"promotes to a {piece_name(move.promotion)}")
        if pins:
            ppt, psq, ksq = pins[0]
            extra.append(f"pins the {piece_name(ppt)} on {chess.square_name(psq)} to the king on {chess.square_name(ksq)}")
        removed = removed_attacker(before, cap_sq, color)
        if removed and not extra:
            return f"{primary}. That {cap_name} was attacking the {removed[0]} on {removed[1]}."
        attack = attack_clause(enemies)
        defend = defend_clause(friends)
        if attack and "gives check" not in extra and not any(x.startswith("pins") for x in extra):
            extra.append(attack)
        elif defend and not extra:
            extra.append(defend)
        elif opened and not extra:
            extra.append(f"opens a path for the {opened[0]}")
        elif home and pt in (chess.KNIGHT, chess.BISHOP) and not extra:
            extra.append(f"develops the {name}")
        elif before.is_check() and pt == chess.KING and not extra:
            extra.append("gets the king out of check")
        if not extra:
            file_name = chess.FILE_NAMES[chess.square_file(cap_sq)]
            own_pawns = any(
                p and p.color == color and p.piece_type == chess.PAWN and chess.square_file(sq) == chess.square_file(cap_sq)
                for sq, p in after.piece_map().items()
            )
            if cap.piece_type == chess.PAWN and not own_pawns:
                return f"{primary}. {side_name(color)} has no pawn left on the {file_name}-file."
            return f"{primary} and clears that piece off {cap_at}."
        if len(extra) == 1 and extra[0].startswith("That"):
            return extra[0]
        return f"{primary} and {extra[0]}."

    if pins:
        ppt, psq, ksq = pins[0]
        pin = f"pins the {piece_name(ppt)} on {chess.square_name(psq)} to the king on {chess.square_name(ksq)}"
        if home and pt == chess.BISHOP:
            return f"{san} develops the {name} and {pin}."
        if check:
            return f"{san} {pin} and gives check."
        return f"{san} {pin}."

    if check:
        attack = attack_clause(enemies)
        if attack:
            return f"{san} gives check and {attack}."
        return f"{san} gives check."

    attack = attack_clause(enemies)
    defend = defend_clause(friends)
    if home and pt in (chess.KNIGHT, chess.BISHOP) and towards and attack:
        return f"{san} develops a {name} towards the centre and {attack}."
    if home and pt in (chess.KNIGHT, chess.BISHOP) and attack:
        return f"{san} develops a {name} and {attack}."
    if home and pt in (chess.KNIGHT, chess.BISHOP) and defend:
        return f"{san} develops a {name} and {defend}."
    if home and pt == chess.BISHOP:
        return f"{san} develops the {name}."
    if home and pt == chess.KNIGHT:
        return f"{san} develops a knight."
    if pt == chess.PAWN and to in CENTRE and attack:
        return f"{san} strikes at the centre and {attack}."
    opponent_centre = any(
        (occ := after.piece_at(sq)) is not None and occ.color != color and occ.piece_type == chess.PAWN
        for sq in CENTRE
    )
    if pt == chess.PAWN and to in CENTRE and "queen" in opened and any("bishop" in name for name in opened):
        if opponent_centre:
            return f"{san} claims a matching share of the centre and opens lines for the bishop and queen."
        return f"{san} grabs a big share of the centre and opens lines for the bishop and queen."
    if pt == chess.PAWN and to in CENTRE and opened:
        share = "claims a matching share" if opponent_centre else "claims a share"
        return f"{san} {share} of the centre and opens a path for the {opened[0]}."
    if pt == chess.PAWN and to in CENTRE:
        share = "claims a matching share" if opponent_centre else "claims a share"
        return f"{san} {share} of the centre."
    if before.is_check() and pt == chess.KING:
        if attack and defend:
            return f"{san} gets the king out of check, {attack}, and {defend}."
        if attack:
            return f"{san} gets the king out of check and {attack}."
        return f"{san} gets the king out of check."
    if attack and defend:
        return f"{san} {attack} and {defend}."
    if attack and pt == chess.PAWN:
        return f"{san} {attack}."
    if attack:
        where = " towards the centre" if towards else ""
        return f"{san} moves the {name}{where} and {attack}."
    if defend:
        return f"{san} {defend}."
    if opened:
        return f"{san} opens a path for the {opened[0]}."
    if clears_castling(before, move, color):
        return f"{san} clears the way to castle the king."
    if towards and pt != chess.PAWN and pt != chess.KING:
        return f"{san} moves the {name} towards the centre."
    if pt == chess.PAWN:
        return f"{san} steps the pawn to {chess.square_name(to)}."
    return f"{san} moves the {name} to {chess.square_name(to)}."


def build_pack(pack: dict) -> dict:
    lines = {}
    for line in pack["lines"]:
        board = chess.Board()
        notes = []
        for san in line["plies"]:
            notes.append(note_for(board, san))
            board.push_san(san)
        intro = clean_intro(line.get("idea") or line.get("name") or "")
        if not intro:
            intro = f"{line['name']} is the plan for this line."
        lines[line["id"]] = {"intro": intro, "notes": notes}
    return lines


CLAIM_ATTACK = re.compile(rf"(?:attacks|attack) the ({PIECE_WORD}) on ({SQUARE})")
CLAIM_DEFEND = re.compile(rf"defends the ({PIECE_WORD}) on ({SQUARE})")
CLAIM_TAKE = re.compile(rf"(?:takes|recaptures) the ({PIECE_WORD}) on ({SQUARE})")
CLAIM_PIN = re.compile(rf"pins the ({PIECE_WORD}) on ({SQUARE}) to the king on ({SQUARE})")
CLAIM_WAS = re.compile(rf"was attacking the ({PIECE_WORD}) on ({SQUARE})")
CLAIM_OPEN = re.compile(r"opens (?:lines for the bishop and queen|a path for the ([a-z-]+ bishop|queen))")
CLAIM_FILE = re.compile(r"no pawn left on the ([a-h])-file")
THIN = re.compile(rf"^[A-Za-z0-9+=#-]+ takes the pawn on {SQUARE}\.$")


def verify_note(before: chess.Board, san: str, note: str) -> list[str]:
    errors = []
    if DASH.search(note) or "—" in note or "–" in note:
        errors.append("dash")
    if EVAL_SENTENCE.search(note):
        errors.append("eval")
    if THIN.match(note):
        errors.append("thin capture")
    if not note.startswith(san):
        errors.append("san prefix")
    move = before.parse_san(san)
    color = before.turn
    after = before.copy(stack=False)
    cap_sq = capture_square(before, move)
    after.push(move)
    piece = before.piece_at(move.from_square)
    assert piece is not None

    if "checkmate" in note and not after.is_checkmate():
        errors.append("false mate")
    if "gives check" in note and not after.is_check():
        errors.append("false check")
    if "castles the king" in note and not before.is_castling(move):
        errors.append("false castle")
    if "towards the centre" in note and "castles the king" not in note and not (
        centre_dist(move.to_square) < centre_dist(move.from_square)
    ):
        errors.append("not towards centre")
    if "share of the centre" in note or "strikes at the centre" in note:
        if piece.piece_type != chess.PAWN or move.to_square not in CENTRE:
            errors.append("not centre pawn")
    if "develops" in note:
        home = move.from_square in HOME.get(color, {}).get(piece.piece_type, set())
        if not home:
            errors.append("not development")
    if "gets the king out of check" in note and not (before.is_check() and piece.piece_type == chess.KING):
        errors.append("false escape")
    if "clears the way to castle" in note and not clears_castling(before, move, color):
        errors.append("false castle clear")

    for match in CLAIM_ATTACK.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        hit = after.piece_at(sq)
        if hit is None or hit.color == color or piece_name(hit.piece_type) != want or sq not in after.attacks(move.to_square):
            errors.append(f"false attack {want} {match.group(2)}")
    for match in CLAIM_DEFEND.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        hit = after.piece_at(sq)
        if hit is None or hit.color != color or piece_name(hit.piece_type) != want or sq not in after.attacks(move.to_square):
            errors.append(f"false defend {want} {match.group(2)}")
    for match in CLAIM_TAKE.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        if cap_sq != sq:
            errors.append("false capture square")
            continue
        cap = before.piece_at(cap_sq)
        if cap is None or piece_name(cap.piece_type) != want:
            errors.append("false capture piece")
        if "recaptures" in note:
            if not before.move_stack:
                errors.append("false recapture")
            else:
                prev = before.peek()
                prev_board = before.copy()
                prev_board.pop()
                if not (prev_board.is_capture(prev) and prev.to_square == move.to_square):
                    errors.append("false recapture")
    for match in CLAIM_PIN.finditer(note):
        want, psq, ksq = match.group(1), chess.parse_square(match.group(2)), chess.parse_square(match.group(3))
        pins = pins_created(before, after, color, move.to_square)
        if not any(piece_name(pt) == want and sq == psq and king == ksq for pt, sq, king in pins):
            errors.append("false pin")
    for match in CLAIM_WAS.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        if cap_sq is None:
            errors.append("was-attacking without capture")
            continue
        hit = before.piece_at(sq)
        if hit is None or hit.color != color or piece_name(hit.piece_type) != want or sq not in before.attacks(cap_sq):
            errors.append("false was-attacking")
    if "opens lines for the bishop and queen" in note or "opens a path for the" in note:
        opened = opened_sliders(before, after, move.from_square, color)
        if "bishop and queen" in note and not ("queen" in opened and any("bishop" in name for name in opened)):
            errors.append("false open lines")
        if "opens a path for the" in note:
            wanted = CLAIM_OPEN.search(note)
            if wanted and wanted.group(1) and wanted.group(1) not in opened and not (
                wanted.group(1).endswith("bishop") and any(wanted.group(1) in name or name.endswith("bishop") and wanted.group(1) in name for name in opened)
            ):
                if wanted.group(1) not in opened:
                    errors.append(f"false open path {wanted.group(1)} vs {opened}")
    for match in CLAIM_FILE.finditer(note):
        file_i = chess.FILE_NAMES.index(match.group(1))
        if any(
            p.color == color and p.piece_type == chess.PAWN and chess.square_file(sq) == file_i
            for sq, p in after.piece_map().items()
        ):
            errors.append("false empty file")
    body = note[len(san):]
    mentioned = set(re.findall(SQUARE, body))
    allowed = set()
    for cre in (CLAIM_ATTACK, CLAIM_DEFEND, CLAIM_TAKE, CLAIM_WAS):
        allowed.update(m.group(2) for m in cre.finditer(note))
    for m in CLAIM_PIN.finditer(note):
        allowed.add(m.group(2))
        allowed.add(m.group(3))
    if re.search(rf"steps the pawn to ({SQUARE})", note):
        allowed.add(re.search(rf"steps the pawn to ({SQUARE})", note).group(1))
    if re.search(rf"moves the [a-z- ]+ to ({SQUARE})", note):
        allowed.add(re.search(rf"moves the [a-z- ]+ to ({SQUARE})", note).group(1))
    if re.search(rf"off ({SQUARE})", note):
        allowed.add(re.search(rf"off ({SQUARE})", note).group(1))
    unknown = mentioned - allowed
    if unknown:
        errors.append(f"unchecked squares {sorted(unknown)}")
    return errors


SAN_RE = re.compile(
    r"^(?:O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|[a-h]x[a-h][1-8](?:=[QRBN])?[+#]?|[a-h][1-8](?:=[QRBN])?[+#]?)$"
)
PIECE_ON = re.compile(
    rf"((?:light-squared|dark-squared)\s+)?({PIECE_WORD}) on ({SQUARE})",
    re.I,
)
CLAIM_TAKE = re.compile(rf"(?:takes|recaptures) the ({PIECE_WORD}) on ({SQUARE})", re.I)
CLAIM_WAS = re.compile(rf"was attacking the ({PIECE_WORD}) on ({SQUARE})", re.I)


def san_tokens(text: str) -> list[str]:
    out = []
    for raw in re.split(r"[\s,;:()\[\]\"']+", text):
        tok = re.sub(r"^[(\"']+|[)\"'.,;:!?]+$", "", raw.strip())
        tok = re.sub(r"^\d+\.(?:\.\.)?", "", tok).lstrip(".")
        if SAN_RE.match(tok):
            out.append(tok)
    return out


def sentence_count(text: str) -> int:
    return len([part for part in re.split(r"(?<=[.!?])\s+", text.strip()) if part])


def _kind_ok(piece: chess.Piece, sq: int, kind: str | None, word: str) -> bool:
    if piece_name(piece.piece_type) != word.lower():
        return False
    if not kind:
        return True
    dark = (chess.square_file(sq) + chess.square_rank(sq)) % 2 == 0
    return dark == kind.lower().startswith("dark")


def verify_hand_note(before: chess.Board, san: str, note: str, future: list[str], played: list[str]) -> list[str]:
    """Check a hand-written note. Do not invent wording."""
    errors: list[str] = []
    if not note.startswith(san + " "):
        errors.append("san prefix")
    if DASH.search(note):
        errors.append("dash")
    if EVAL_SENTENCE.search(note):
        errors.append("eval")
    count = sentence_count(note)
    if count < 1 or count > 2:
        errors.append("sentence count")
    future_set, played_set = set(future), set(played)
    for tok in san_tokens(note):
        if tok in future_set and tok not in played_set:
            errors.append(f"future {tok}")
    try:
        move = before.parse_san(san)
    except ValueError:
        return errors + ["illegal"]
    after = before.copy(stack=False)
    after.push(move)
    if re.search(r"checkmate|\bmates\b", note, re.I) and not after.is_checkmate():
        errors.append("false mate")
    if re.search(r"gives check|with check|checks the", note, re.I) and not after.is_check():
        errors.append("false check")
    if re.search(r"only legal", note, re.I) and before.legal_moves.count() != 1:
        errors.append("not only legal")
    cap_sq = capture_square(before, move)
    cap = before.piece_at(cap_sq) if cap_sq is not None else None
    if re.search(r"\brecaptures\b", note, re.I):
        prev_cap = False
        if before.move_stack:
            prev = before.peek()
            earlier = before.copy()
            earlier.pop()
            prev_cap = earlier.is_capture(prev) and prev.to_square == move.to_square
        if not prev_cap:
            errors.append("false recapture")
    for match in CLAIM_TAKE.finditer(note):
        word, sq = match.group(1).lower(), chess.parse_square(match.group(2))
        if cap is None or cap_sq != sq or piece_name(cap.piece_type) != word:
            errors.append(f"false capture {word} {match.group(2)}")
    for match in CLAIM_WAS.finditer(note):
        word, sq = match.group(1).lower(), chess.parse_square(match.group(2))
        if cap_sq is None or sq not in before.attacks(cap_sq):
            errors.append("false was-attacking")
            continue
        occ = before.piece_at(sq)
        if occ is None or piece_name(occ.piece_type) != word or occ.color != before.turn:
            errors.append("false was-attacking")
    for match in PIECE_ON.finditer(note):
        kind, word, sq_name = match.group(1), match.group(2).lower(), match.group(3)
        sq = chess.parse_square(sq_name)
        found = False
        for board in (after, before):
            occ = board.piece_at(sq)
            if occ and _kind_ok(occ, sq, kind, word):
                found = True
        if cap and cap_sq == sq and _kind_ok(cap, sq, kind, word):
            found = True
        if not found:
            errors.append(f"no {word} on {sq_name}")
    body = note[len(san):]
    for sq_name in set(re.findall(SQUARE, body)):
        sq = chess.parse_square(sq_name)
        occupied = before.piece_at(sq) is not None or after.piece_at(sq) is not None
        if sq in (move.from_square, move.to_square) or occupied or sq in after.attacks(move.to_square):
            continue
        errors.append(f"loose square {sq_name}")
    return errors


def verify_tree(notes: dict, packs: list[dict]) -> list[str]:
    problems = []
    for pack in packs:
        if pack["id"] == "scotch":
            continue
        for line in pack["lines"]:
            row = notes[pack["id"]][line["id"]]
            intro = row["intro"]
            if DASH.search(intro) or EVAL_SENTENCE.search(intro):
                problems.append(f"{line['id']} intro {intro}")
            board = chess.Board()
            if len(row["notes"]) != len(line["plies"]):
                problems.append(f"{line['id']} length")
                continue
            for index, san in enumerate(line["plies"]):
                note = row["notes"][index]
                errs = verify_hand_note(board, san, note, line["plies"][index + 1 :], line["plies"][: index + 1])
                if errs:
                    problems.append(f"{pack['id']} {line['id']} {index + 1} {san}: {errs} :: {note}")
                board.push_san(san)
    return problems


def artifact_rows(packs: list[dict], general: dict, scotch: dict) -> list[dict]:
    rows = []
    for pack in packs:
        source = scotch if pack["id"] == "scotch" else general[pack["id"]]
        for line in pack["lines"]:
            row = source[line["id"]]
            board = chess.Board()
            rows.append({
                "pack": pack["id"],
                "line": line["id"],
                "ply": 0,
                "san": "",
                "fen_before": board.fen(),
                "note": row["intro"],
            })
            for ply, san in enumerate(line["plies"], start=1):
                rows.append({
                    "pack": pack["id"],
                    "line": line["id"],
                    "ply": ply,
                    "san": san,
                    "fen_before": board.fen(),
                    "note": row["notes"][ply - 1],
                })
                board.push_san(san)
    return rows


def main() -> int:
    packs = json.loads(LINES.read_text())
    mode = sys.argv[1] if len(sys.argv) > 1 else "generate"
    if mode == "generate":
        print("hand-written notes are not regenerated", flush=True)
        general = json.loads(OUT.read_text())
        problems = verify_tree(general, packs)
        if problems:
            print(f"{len(problems)} problems")
            for row in problems[:40]:
                print(row)
            return 1
        scotch = json.loads(SCOTCH.read_text())
        rows = artifact_rows(packs, general, scotch)
        ARTIFACT_JSON.parent.mkdir(parents=True, exist_ok=True)
        ARTIFACT_JSON.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n")
        with ARTIFACT_CSV.open("w", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=["pack", "line", "ply", "san", "fen_before", "note"])
            writer.writeheader()
            writer.writerows(rows)
        print(f"notes {sum(len(line['notes']) for pack in general.values() for line in pack.values())}")
        print(f"artifact rows {len(rows)}")
        return 0
    general = json.loads(OUT.read_text())
    problems = verify_tree(general, packs)
    if problems:
        print(f"{len(problems)} problems")
        for row in problems[:40]:
            print(row)
        return 1
    print("python-chess ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
