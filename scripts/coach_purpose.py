"""Purpose-first coach notes for every on-sale pack except the Scotch.

Each note is one sentence built from python-chess facts: what this move does
in this position. The line slogan is not pasted onto every move. A short
'facing …' clause is added only when the same purpose would otherwise be
copied onto a different position.
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field

import chess

from coach_plans import LABELS, OPENERS, PLANS

PIECE = {
    chess.PAWN: "pawn",
    chess.KNIGHT: "knight",
    chess.BISHOP: "bishop",
    chess.ROOK: "rook",
    chess.QUEEN: "queen",
    chess.KING: "king",
}
VALUE = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5, chess.QUEEN: 9, chess.KING: 10}
CENTRE = {chess.D4, chess.E4, chess.D5, chess.E5}
LONG_DARK = {chess.A1, chess.B2, chess.C3, chess.D4, chess.E5, chess.F6, chess.G7, chess.H8}
LONG_LIGHT = {chess.A8, chess.B7, chess.C6, chess.D5, chess.E4, chess.F3, chess.G2, chess.H1}
HOME_KNIGHT = {
    chess.WHITE: {chess.B1: "queen's knight", chess.G1: "king's knight"},
    chess.BLACK: {chess.B8: "queen's knight", chess.G8: "king's knight"},
}
HOME_BISHOP = {
    chess.WHITE: {chess.C1, chess.F1},
    chess.BLACK: {chess.C8, chess.F8},
}
CASTLED = {chess.G1, chess.C1, chess.G8, chess.C8}

EVAL_SENTENCE = re.compile(
    r"\b(winning|better|ahead|level|equal|equality|advantage|plus|pull|engine|centipawn|stockfish|eval)\b",
    re.I,
)
DASH = re.compile(r"[—–…]")
SAN_RE = re.compile(
    r"^(?:O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|[a-h]x[a-h][1-8](?:=[QRBN])?[+#]?|[a-h][1-8](?:=[QRBN])?[+#]?)$"
)
SQUARE = r"[a-h][1-8]"
PIECE_WORD = r"pawn|knight|bishop|rook|queen|king"
BANNED = (
    "steps the pawn",
    "develops a knight",
    "opens a path for the queen",
    "brings a rook towards the centre",
    "castles the king to safety",
    "develops the dark-squared bishop.",
    "develops the light-squared bishop.",
)

RULES: list[str] = []


def audit_copy() -> None:
    if set(PLANS) != set(LABELS):
        raise SystemExit(f"plan/label mismatch {set(PLANS) ^ set(LABELS)}")
    square = re.compile(r"(?<![A-Za-z])[a-h][1-8](?![0-9])")
    for key, pair in PLANS.items():
        if len(pair) != 2:
            raise SystemExit(f"{key} needs two sentences")
        for text in pair:
            if square.search(text) or EVAL_SENTENCE.search(text) or DASH.search(text):
                raise SystemExit(f"bad plan {key}: {text}")
            if text.count(".") != 1:
                raise SystemExit(f"plan must be one sentence {key}: {text}")
    for text in OPENERS.values():
        if EVAL_SENTENCE.search(text) or DASH.search(text):
            raise SystemExit(f"bad opener: {text}")


audit_copy()


def san_tokens(text: str) -> list[str]:
    out = []
    for raw in re.split(r"[\s,;:()\[\]\"'“”]+", text):
        tok = re.sub(r"^[(\"“]+|[)\"”.,;:!?]+$", "", raw.strip())
        tok = re.sub(r"^\d+\.(?:\.\.)?", "", tok).lstrip(".")
        if SAN_RE.match(tok):
            out.append(tok)
    return out


def sentence_count(text: str) -> int:
    return len([part for part in re.split(r"(?<=[.!?])\s+", text.strip()) if part])


def sentence(san: str, body: str) -> str:
    body = re.sub(r"\s+", " ", body).strip(" ,.")
    return f"{san} {body}."


def piece_name(pt: int) -> str:
    return PIECE[pt]


def _kind_matches(occ: chess.Piece, sq: int, want: str) -> bool:
    if occ.piece_type == chess.BISHOP:
        return want == "bishop" or (want.endswith("bishop") and bishop_kind(sq).startswith(want.split("-")[0]))
    return piece_name(occ.piece_type) == want


def bishop_kind(sq: int) -> str:
    dark = (chess.square_file(sq) + chess.square_rank(sq)) % 2 == 0
    return "dark-squared bishop" if dark else "light-squared bishop"


def sqn(sq: int) -> str:
    return chess.square_name(sq)


def capture_square(before: chess.Board, move: chess.Move) -> int | None:
    if not before.is_capture(move):
        return None
    if before.is_en_passant(move):
        step = -8 if before.turn == chess.WHITE else 8
        return move.to_square + step
    return move.to_square


def slider_geometry(pt: int, a: int, b: int) -> bool:
    df = abs(chess.square_file(a) - chess.square_file(b))
    dr = abs(chess.square_rank(a) - chess.square_rank(b))
    if df == 0 and dr == 0:
        return False
    if pt == chess.BISHOP:
        return df == dr
    if pt == chess.ROOK:
        return df == 0 or dr == 0
    if pt == chess.QUEEN:
        return df == dr or df == 0 or dr == 0
    return False


def diagonal(a: int, b: int) -> bool:
    df = abs(chess.square_file(a) - chess.square_file(b))
    dr = abs(chess.square_rank(a) - chess.square_rank(b))
    return df == dr and df > 0


def bishop_would_attack(board: chess.Board, landing: int, target: int) -> bool:
    if not diagonal(landing, target):
        return False
    return all(board.piece_at(sq) is None for sq in chess.SquareSet.between(landing, target))


def opened_names(before: chess.Board, after: chess.Board, vacated: int, color: bool) -> list[str]:
    names = []
    for sq in chess.SQUARES:
        piece = after.piece_at(sq)
        if piece is None or piece.color != color or piece.piece_type not in (chess.BISHOP, chess.QUEEN):
            continue
        if before.piece_at(sq) != piece:
            continue
        useful = False
        for target in after.attacks(sq) - before.attacks(sq):
            ray = chess.SquareSet.between(sq, target)
            if vacated in ray or vacated == target:
                useful = True
                break
        if not useful:
            continue
        names.append(bishop_kind(sq) if piece.piece_type == chess.BISHOP else "queen")
    seen: list[str] = []
    for name in names:
        if name not in seen:
            seen.append(name)
    return seen


def pin_targets(board: chess.Board, slider_sq: int, color: bool) -> list[tuple[int, int, str, int]]:
    piece = board.piece_at(slider_sq)
    if piece is None or piece.piece_type not in (chess.BISHOP, chess.ROOK, chess.QUEEN):
        return []
    enemy = not color
    anchors: list[tuple[str, int]] = []
    king = board.king(enemy)
    if king is not None:
        anchors.append(("king", king))
    for sq, occ in board.piece_map().items():
        if occ.color == enemy and occ.piece_type == chess.QUEEN:
            anchors.append(("queen", sq))
    found = []
    for kind, anchor in anchors:
        if not slider_geometry(piece.piece_type, slider_sq, anchor):
            continue
        blockers = [sq for sq in chess.SquareSet.between(slider_sq, anchor) if board.piece_at(sq)]
        if len(blockers) != 1:
            continue
        occ = board.piece_at(blockers[0])
        if occ is None or occ.color != enemy or occ.piece_type == chess.KING:
            continue
        found.append((occ.piece_type, blockers[0], kind, anchor))
    found.sort(key=lambda item: (item[2] != "king", -VALUE[item[0]]))
    return found


def ghost_bishop_pins(board: chess.Board, landing: int, color: bool) -> list[tuple[int, int, str, int]]:
    anchors: list[tuple[str, int]] = []
    king = board.king(color)
    if king is not None:
        anchors.append(("king", king))
    for sq, occ in board.piece_map().items():
        if occ.color == color and occ.piece_type == chess.QUEEN:
            anchors.append(("queen", sq))
    found = []
    for kind, anchor in anchors:
        if not diagonal(landing, anchor):
            continue
        blockers = [sq for sq in chess.SquareSet.between(landing, anchor) if board.piece_at(sq)]
        if len(blockers) != 1:
            continue
        occ = board.piece_at(blockers[0])
        if occ is None or occ.color != color or occ.piece_type == chess.KING:
            continue
        found.append((occ.piece_type, blockers[0], kind, anchor))
    found.sort(key=lambda item: (item[2] != "king", -VALUE[item[0]]))
    return found


def ghost_bishop_hits(board: chess.Board, landing: int, color: bool) -> list[tuple[int, int]]:
    hits = []
    for sq, occ in board.piece_map().items():
        if occ.color != color or occ.piece_type in (chess.PAWN, chess.KING):
            continue
        if bishop_would_attack(board, landing, sq):
            hits.append((occ.piece_type, sq))
    hits.sort(key=lambda item: -VALUE[item[0]])
    return hits


def file_pawns(board: chess.Board, file_index: int, color: bool) -> tuple[int, int]:
    friendly = enemy = 0
    for rank in range(8):
        occ = board.piece_at(chess.square(file_index, rank))
        if occ and occ.piece_type == chess.PAWN:
            if occ.color == color:
                friendly += 1
            else:
                enemy += 1
    return friendly, enemy


def rooks_connected(board: chess.Board, color: bool) -> bool:
    rooks = [sq for sq, occ in board.piece_map().items() if occ.color == color and occ.piece_type == chess.ROOK]
    if len(rooks) != 2:
        return False
    left, right = sorted(rooks)
    if chess.square_rank(left) != chess.square_rank(right):
        return False
    return all(board.piece_at(sq) is None for sq in chess.SquareSet.between(left, right))


def pawn_ahead(board: chess.Board, sq: int, color: bool) -> int | None:
    file_index = chess.square_file(sq)
    step = 1 if color == chess.WHITE else -1
    rank = chess.square_rank(sq) + step
    while 0 <= rank <= 7:
        target = chess.square(file_index, rank)
        occ = board.piece_at(target)
        if occ and occ.color == color and occ.piece_type == chess.PAWN:
            return target
        if occ:
            return None
        rank += step
    return None


def file_pawn_ahead(board: chess.Board, rook_sq: int, color: bool) -> int | None:
    file_index = chess.square_file(rook_sq)
    rank = chess.square_rank(rook_sq)
    step = 1 if color == chess.WHITE else -1
    rank += step
    while 0 <= rank <= 7:
        target = chess.square(file_index, rank)
        occ = board.piece_at(target)
        if occ and occ.piece_type == chess.PAWN and occ.color == color:
            return target
        if occ and occ.piece_type == chess.PAWN:
            return None
        rank += step
    return None


def home_bishop_attacks(board: chess.Board, color: bool, light: bool) -> int | None:
    for sq in HOME_BISHOP[color]:
        kind = bishop_kind(sq)
        want_light = kind.startswith("light")
        if want_light != light:
            continue
        occ = board.piece_at(sq)
        if occ and occ.color == color and occ.piece_type == chess.BISHOP:
            return len(board.attacks(sq))
    return None


def left_castle_path(before: chess.Board, move: chess.Move, color: bool) -> bool:
    if before.is_castling(move):
        return False
    king = before.king(color)
    if king is None or chess.square_rank(move.from_square) != chess.square_rank(king):
        return False
    rank = chess.square_rank(king)
    for kingside, rook_file in ((True, 7), (False, 0)):
        if kingside and not before.has_kingside_castling_rights(color):
            continue
        if not kingside and not before.has_queenside_castling_rights(color):
            continue
        rook = chess.square(rook_file, rank)
        left, right = sorted((king, rook))
        if left < move.from_square < right and not (left < move.to_square < right):
            return True
    return False


def castle_is_legal(board: chess.Board, color: bool) -> bool:
    king = board.king(color)
    if king is None or board.is_attacked_by(not color, king):
        return False
    rank = chess.square_rank(king)
    for kingside, rook_file, steps in ((True, 7, (1, 2)), (False, 0, (-1, -2))):
        if kingside and not board.has_kingside_castling_rights(color):
            continue
        if not kingside and not board.has_queenside_castling_rights(color):
            continue
        rook = chess.square(rook_file, rank)
        if any(board.piece_at(sq) for sq in chess.SquareSet.between(king, rook)):
            continue
        safe = True
        for step in steps:
            sq = king + step
            if board.is_attacked_by(not color, sq) or board.piece_at(sq):
                safe = False
                break
        if safe:
            return True
    return False


def makes_luft(before: chess.Board, after: chess.Board, move: chess.Move, color: bool) -> bool:
    mover = before.piece_at(move.from_square)
    if mover is None or mover.piece_type != chess.PAWN:
        return False
    king = after.king(color)
    if king not in CASTLED:
        return False
    vacated = move.from_square
    if vacated not in after.attacks(king):
        return False
    if after.is_attacked_by(not color, vacated):
        return False
    return True


@dataclass
class Facts:
    san: str
    move: chess.Move
    color: bool
    pt: int
    frm: int
    to: int
    before: chess.Board
    after: chess.Board
    cap_sq: int | None
    cap: chess.Piece | None
    check: bool
    mate: bool
    enemies: list[tuple[int, int]]
    friends: list[tuple[int, int]]
    backed: list[tuple[int, int]]
    opened: list[str]
    recapture: bool
    home_knight: str | None
    home_bishop: bool
    prev_to: int | None
    prev_was_pawn: bool
    light_before: int | None
    dark_before: int | None
    light_after: int | None
    dark_after: int | None


def gather(before: chess.Board, san: str) -> Facts:
    move = before.parse_san(san)
    color = before.turn
    mover = before.piece_at(move.from_square)
    assert mover is not None
    after = before.copy(stack=False)
    after.push(move)
    cap_sq = capture_square(before, move)
    cap = before.piece_at(cap_sq) if cap_sq is not None else None
    enemies = []
    friends = []
    backed = []
    for target in after.attacks(move.to_square):
        occ = after.piece_at(target)
        if occ is None or occ.piece_type == chess.KING:
            continue
        if occ.color != color:
            enemies.append((occ.piece_type, target))
        else:
            backed.append((occ.piece_type, target))
            if after.is_attacked_by(not color, target):
                friends.append((occ.piece_type, target))
    enemies.sort(key=lambda item: (-VALUE[item[0]], item[1]))
    friends.sort(key=lambda item: (-VALUE[item[0]], item[1]))
    backed.sort(key=lambda item: (item[0] != chess.PAWN, -VALUE[item[0]], item[1]))
    recapture = False
    prev_to = None
    prev_was_pawn = False
    if before.move_stack:
        prev = before.peek()
        prev_to = prev.to_square
        prev_board = before.copy()
        prev_board.pop()
        prev_piece = prev_board.piece_at(prev.from_square)
        prev_was_pawn = prev_piece is not None and prev_piece.piece_type == chess.PAWN
        if prev_board.is_capture(prev) and prev.to_square == move.to_square:
            recapture = True
    return Facts(
        san=san,
        move=move,
        color=color,
        pt=mover.piece_type,
        frm=move.from_square,
        to=move.to_square,
        before=before,
        after=after,
        cap_sq=cap_sq,
        cap=cap,
        check=after.is_check(),
        mate=after.is_checkmate(),
        enemies=enemies,
        friends=friends,
        backed=backed,
        opened=opened_names(before, after, move.from_square, color),
        recapture=recapture,
        home_knight=HOME_KNIGHT[color].get(move.from_square) if mover.piece_type == chess.KNIGHT else None,
        home_bishop=mover.piece_type == chess.BISHOP and move.from_square in HOME_BISHOP[color],
        prev_to=prev_to,
        prev_was_pawn=prev_was_pawn,
        light_before=home_bishop_attacks(before, color, True),
        dark_before=home_bishop_attacks(before, color, False),
        light_after=home_bishop_attacks(after, color, True),
        dark_after=home_bishop_attacks(after, color, False),
    )


def acceptable(text: str, san: str, future: set[str], played: set[str]) -> bool:
    if not text.startswith(san + " "):
        return False
    if sentence_count(text) != 1:
        return False
    if DASH.search(text) or EVAL_SENTENCE.search(text):
        return False
    if any(bit in text for bit in BANNED):
        return False
    for tok in san_tokens(text):
        if tok in future and tok not in played:
            return False
    return True


def enemy_centre_pawn(board: chess.Board, color: bool) -> bool:
    for sq in CENTRE:
        occ = board.piece_at(sq)
        if occ and occ.color != color and occ.piece_type == chess.PAWN:
            return True
    return False


def supported_centre(facts: Facts) -> int | None:
    for pt, sq in facts.backed:
        if pt == chess.PAWN and sq in CENTRE:
            return sq
    return None


def empty_centre_attacked(facts: Facts) -> list[int]:
    found = []
    for sq in sorted(CENTRE):
        if sq in facts.after.attacks(facts.to) and facts.after.piece_at(sq) is None:
            found.append(sq)
    return found


def newly_controlled_bishop_lands(facts: Facts) -> list[tuple[int, list, list]]:
    color = facts.color
    out = []
    if facts.pt != chess.PAWN:
        return out
    for sq in facts.after.attacks(facts.to):
        if facts.after.piece_at(sq) is not None:
            continue
        if facts.before.is_attacked_by(color, sq):
            continue
        pins = ghost_bishop_pins(facts.after, sq, color)
        hits = ghost_bishop_hits(facts.after, sq, color)
        if pins or hits:
            out.append((sq, pins, hits))
    out.sort(key=lambda item: (not item[1], item[0]))
    return out


def knight_title(facts: Facts) -> str:
    return facts.home_knight or "knight"


def pawn_in_centre(board: chess.Board) -> bool:
    for sq in CENTRE:
        occ = board.piece_at(sq)
        if occ and occ.piece_type == chess.PAWN:
            return True
    return False


def developed_bishop(board: chess.Board, color: bool, skip: int | None) -> int | None:
    for sq, occ in board.piece_map().items():
        if occ.color != color or occ.piece_type != chess.BISHOP or sq == skip:
            continue
        if sq not in HOME_BISHOP[color]:
            return sq
    return None


def defended_centre_pawn(facts: Facts, piece_sq: int) -> int | None:
    """A piece we attack is defending its own pawn in the centre."""
    for sq in facts.after.attacks(piece_sq):
        occ = facts.after.piece_at(sq)
        if occ and occ.color != facts.color and occ.piece_type == chess.PAWN and sq in CENTRE:
            return sq
    return None


def token_ok(text: str, future: set[str], played: set[str]) -> bool:
    for tok in san_tokens(text):
        if tok in future and tok not in played:
            return False
    return True


def context_phrases(facts: Facts, future: set[str], played: set[str]) -> list[str]:
    """Enemy and friendly pieces that can tell two positions apart."""
    enemy = not facts.color
    minors: list[str] = []
    majors: list[str] = []
    for sq, occ in facts.after.piece_map().items():
        if occ.piece_type in (chess.PAWN, chess.KING) or sq == facts.to:
            continue
        home = False
        if occ.piece_type == chess.KNIGHT and sq in HOME_KNIGHT[occ.color]:
            home = True
        if occ.piece_type == chess.BISHOP and sq in HOME_BISHOP[occ.color]:
            home = True
        if occ.piece_type == chess.ROOK and chess.square_rank(sq) in (0, 7) and chess.square_file(sq) in (0, 7):
            home = True
        if occ.piece_type == chess.QUEEN and sq in (chess.D1, chess.D8):
            home = True
        if home:
            continue
        name = bishop_kind(sq) if occ.piece_type == chess.BISHOP else piece_name(occ.piece_type)
        phrase = f"the {name} on {sqn(sq)}"
        if not token_ok(phrase, future, played):
            continue
        lead = "facing" if occ.color == enemy else "with"
        full = f"{lead} {phrase}"
        bucket = minors if occ.piece_type in (chess.KNIGHT, chess.BISHOP) else majors
        if occ.color == enemy:
            bucket.insert(0, full)
        else:
            bucket.append(full)
    return minors + majors


def choose(facts: Facts, pack: str, line: str, future: set[str], played: set[str]) -> tuple[str, str]:
    san = facts.san
    options: list[tuple[str, str]] = []

    def add(rule: str, text: str | None) -> None:
        if text and acceptable(text, san, future, played):
            options.append((rule, text))

    if facts.mate:
        if facts.cap is not None and facts.cap_sq is not None:
            add("mate-cap", sentence(san, f"takes the {piece_name(facts.cap.piece_type)} on {sqn(facts.cap_sq)} and is checkmate"))
        add("mate", sentence(san, "is checkmate"))

    if facts.move.promotion and facts.move.promotion != chess.QUEEN and facts.cap is not None and facts.cap_sq is not None:
        queen_checks = False
        alt = chess.Move(facts.frm, facts.to, promotion=chess.QUEEN)
        if alt in facts.before.legal_moves:
            trial = facts.before.copy(stack=False)
            trial.push(alt)
            queen_checks = trial.is_check()
        extra = ""
        if facts.check and not queen_checks:
            extra = ", which a queen promotion would not"
        add(
            "underpromo",
            sentence(
                san,
                f"takes the {piece_name(facts.cap.piece_type)} on {sqn(facts.cap_sq)}, promotes to a {piece_name(facts.move.promotion)}, and gives check{extra}"
                if facts.check
                else f"takes the {piece_name(facts.cap.piece_type)} on {sqn(facts.cap_sq)} and promotes to a {piece_name(facts.move.promotion)}",
            ),
        )

    if facts.before.is_castling(facts.move):
        kingside = facts.before.is_kingside_castling(facts.move)
        rook_to = (chess.F1 if facts.color == chess.WHITE else chess.F8) if kingside else (chess.D1 if facts.color == chess.WHITE else chess.D8)
        file_index = chess.square_file(facts.frm)
        friendly, enemy = file_pawns(facts.after, file_index, facts.color)
        file_name = chess.FILE_NAMES[file_index]
        body = f"brings the king to {sqn(facts.to)} and the rook to {sqn(rook_to)}"
        if friendly == 0 and enemy == 0:
            body += f", and leaves the open {file_name}-file"
        elif friendly == 0 and enemy > 0:
            body += f", and leaves the half-open {file_name}-file"
        elif rooks_connected(facts.after, facts.color):
            body += ", and connects the rooks"
        fianchetto = chess.G2 if facts.color == chess.WHITE else chess.G7
        occ = facts.after.piece_at(fianchetto)
        if occ and occ.color == facts.color and occ.piece_type == chess.BISHOP:
            body += f", behind the fianchetto bishop on {sqn(fianchetto)}"
        elif pawn_in_centre(facts.after):
            body += ", while a pawn still stands in the centre"
        else:
            bishop_sq = developed_bishop(facts.after, facts.color, skip=None)
            if bishop_sq is not None:
                body += f", with the {bishop_kind(bishop_sq)} on {sqn(bishop_sq)}"
        enemy_king = facts.after.king(not facts.color)
        if enemy_king in CASTLED:
            same_wing = (chess.square_file(facts.to) > 3) == (chess.square_file(enemy_king) > 3)
            which = "same wing as" if same_wing else "opposite wing from"
            body += f", on the {which} the king on {sqn(enemy_king)}"
        add("castle", sentence(san, body))

    broken = break_pin_capture(facts)
    if broken and facts.cap is not None and facts.cap_sq is not None:
        pt, psq = broken
        add(
            "break-pin",
            sentence(
                san,
                f"takes the {piece_name(facts.cap.piece_type)} on {sqn(facts.cap_sq)} and breaks the pin on the {piece_name(pt)} on {sqn(psq)}",
            ),
        )

    if facts.cap is not None and facts.cap_sq is not None:
        verb = "recaptures" if facts.recapture else "takes"
        base = f"{verb} the {piece_name(facts.cap.piece_type)} on {sqn(facts.cap_sq)}"
        removed = removed_attacker(facts)
        pins = pin_targets(facts.after, facts.to, facts.color)
        new_pins = [pin for pin in pins if pin[0] != chess.PAWN and not pin_existed(facts.before, facts.color, pin)]
        extras = []
        if facts.check:
            extras.append("gives check")
        if new_pins:
            pt, psq, kind, anchor = new_pins[0]
            extras.append(f"pins the {piece_name(pt)} on {sqn(psq)} to the {kind} on {sqn(anchor)}")
        if removed and removed[0] >= 3:
            extras.append(f"which was attacking the {piece_name(removed[1])} on {sqn(removed[2])}")
        if facts.pt == chess.PAWN and facts.to in CENTRE and facts.recapture:
            extras.append("keeps a pawn in the centre")
        if facts.pt == chess.KNIGHT and facts.to in CENTRE and facts.recapture:
            extras.append("plants a knight in the centre")
        left_file = chess.square_file(facts.frm)
        if facts.pt == chess.PAWN and file_pawns(facts.after, left_file, facts.color)[0] == 0:
            extras.append(f"opens the {chess.FILE_NAMES[left_file]}-file")
        if extras:
            add("capture-why", sentence(san, f"{base} and {extras[0]}" if not extras[0].startswith("which") else f"{base}, {extras[0]}"))
        add("capture", sentence(san, base))

    if not facts.cap and pin_targets(facts.after, facts.to, facts.color):
        fresh = [pin for pin in pin_targets(facts.after, facts.to, facts.color) if pin[0] != chess.PAWN and not pin_existed(facts.before, facts.color, pin)]
        if fresh:
            pt, psq, kind, anchor = fresh[0]
            pin = f"pins the {piece_name(pt)} on {sqn(psq)} to the {kind} on {sqn(anchor)}"
            if facts.home_bishop:
                add("develop-pin", sentence(san, f"develops the {bishop_kind(facts.frm)} and {pin}"))
            else:
                add("pin", sentence(san, pin))

    if facts.check and not facts.cap:
        if facts.enemies:
            pt, sq = facts.enemies[0]
            add("check-attack", sentence(san, f"gives check and attacks the {piece_name(pt)} on {sqn(sq)}"))
        add("check", sentence(san, "gives check"))

    if blocks_check(facts):
        add("block-check", sentence(san, "blocks the check"))

    if facts.before.is_check() and facts.pt == chess.KING and not facts.mate:
        add("escape", sentence(san, "gets the king out of check"))

    if stepped_out(facts):
        add("step-out", sentence(san, f"steps the {piece_name(facts.pt)} out of the pin"))

    if facts.prev_to is not None and not facts.cap:
        if san == "c4" and any(pt == chess.PAWN and sq == chess.D5 for pt, sq in facts.enemies):
            add("offer", sentence(san, "attacks the pawn on d5 and offers the queen's pawn"))
        for pt, sq in facts.enemies:
            if sq != facts.prev_to:
                continue
            if pt == chess.BISHOP and facts.pt == chess.PAWN:
                kind = bishop_kind(sq)
                ask = " and asks it to choose a diagonal"
                add("answer-arrival", sentence(san, f"attacks the {kind} that just arrived on {sqn(sq)}{ask}"))
                add("answer-arrival-soft", sentence(san, f"attacks the {kind} that just arrived{ask}"))
            else:
                kind = bishop_kind(sq) if pt == chess.BISHOP else piece_name(pt)
                extra = ""
                defended = defended_centre_pawn(facts, sq)
                if defended is not None and pt == chess.KNIGHT and sq in (chess.C3, chess.C6, chess.F3, chess.F6):
                    extra = f", which defends the pawn on {sqn(defended)}"
                if pack == "ruy-lopez-white" and facts.pt == chess.BISHOP and pt == chess.KNIGHT and sq == chess.C6:
                    extra += ", the point of the Spanish bishop"
                flavor = knight_flavor(pack, san, facts) if facts.pt == chess.KNIGHT else ""
                if flavor:
                    extra += f", {flavor}"
                add("answer-arrival", sentence(san, f"attacks the {kind} that just arrived on {sqn(sq)}{extra}"))
                add("answer-arrival-soft", sentence(san, f"attacks the {kind} that just arrived{extra}"))
            break

    lands = newly_controlled_bishop_lands(facts)
    luft = makes_luft(facts.before, facts.after, facts.move, facts.color)
    chosen_land = None
    for sq, pins, hits in lands:
        pins = [pin for pin in pins if pin[0] != chess.PAWN]
        hits = [hit for hit in hits if hit[0] != chess.PAWN]
        if pins or hits:
            chosen_land = (sq, pins, hits)
            break
    if chosen_land:
        sq, pins, hits = chosen_land
        if pins:
            pt, psq, kind, anchor = pins[0]
            body = f"stops a bishop landing on {sqn(sq)}, where it would pin the {piece_name(pt)} on {sqn(psq)} to the {kind} on {sqn(anchor)}"
        elif hits:
            pt, psq = hits[0]
            body = f"stops a bishop landing on {sqn(sq)}, where it would hit the {piece_name(pt)} on {sqn(psq)}"
        else:
            body = ""
        if body:
            if luft:
                body += ", and gives the king a flight square"
            add("prophylaxis", sentence(san, body))
        if luft:
            add("prophylaxis-soft", sentence(san, "takes away a bishop pin and gives the king a flight square"))
    if luft:
        add("luft", sentence(san, "gives the king a flight square"))

    knight_lands = knight_only_landings(facts)
    if knight_lands:
        sq, pt, psq = knight_lands[0]
        add("stop-knight", sentence(san, f"stops a knight landing on {sqn(sq)}, where it would hit the {piece_name(pt)} on {sqn(psq)}"))

    relieved = relieved_pin(facts)
    if relieved and not facts.cap:
        pt, psq = relieved
        if facts.home_bishop:
            kind = bishop_kind(facts.frm)
            ahead = pawn_ahead(facts.after, facts.to, facts.color)
            lead = f"develops the {kind} behind the pawn on {sqn(ahead)}" if ahead is not None else f"develops the {kind}"
            add("block-pin", sentence(san, f"{lead} and blocks the pin on the {piece_name(pt)} on {sqn(psq)}"))
        else:
            add("block-pin", sentence(san, f"blocks the pin on the {piece_name(pt)} on {sqn(psq)}"))
    add("pawn-role", pawn_role(facts, pack))
    add("bishop-role", bishop_role(facts, pack, line))
    add("develop", develop_role(facts, pack, line))
    add("rook-file", rook_role(facts))
    add("watch", watch_role(facts))
    add("centre-soft", centre_soft(facts))
    add("backup", backup_role(facts))
    add("space", space_role(facts))

    if options:
        return options[0]
    return "fallback", sentence(san, f"keeps the {piece_name(facts.pt)} working for the plan")


def break_pin_capture(facts: Facts) -> tuple[int, int] | None:
    if facts.cap_sq is None:
        return None
    king = facts.before.king(facts.color)
    if king is None:
        return None
    for sq in chess.SQUARES:
        occ = facts.before.piece_at(sq)
        if occ is None or occ.color != facts.color or occ.piece_type == chess.KING:
            continue
        if not facts.before.is_pinned(facts.color, sq):
            continue
        if facts.after.piece_at(sq) is None or facts.after.is_pinned(facts.color, sq):
            continue
        if not slider_geometry(chess.BISHOP, king, facts.cap_sq) and not slider_geometry(chess.ROOK, king, facts.cap_sq):
            if not slider_geometry(chess.QUEEN, king, facts.cap_sq):
                continue
        blockers = [s for s in chess.SquareSet.between(king, facts.cap_sq) if facts.before.piece_at(s)]
        if blockers == [sq]:
            return occ.piece_type, sq
    return None


def pin_existed(before: chess.Board, color: bool, pin: tuple[int, int, str, int]) -> bool:
    _pt, psq, kind, anchor = pin
    enemy = not color
    for sq, occ in before.piece_map().items():
        if occ.color != color or occ.piece_type not in (chess.BISHOP, chess.ROOK, chess.QUEEN):
            continue
        for found in pin_targets(before, sq, color):
            if found[1] == psq and found[2] == kind and found[3] == anchor:
                return True
    if kind == "king" and before.is_pinned(enemy, psq):
        return True
    return False


def removed_attacker(facts: Facts) -> tuple[int, int, int] | None:
    if facts.cap_sq is None:
        return None
    best = None
    for target in facts.before.attacks(facts.cap_sq):
        occ = facts.before.piece_at(target)
        if occ and occ.color == facts.color and occ.piece_type != chess.KING:
            rank = VALUE[occ.piece_type]
            if best is None or rank > best[0]:
                best = (rank, occ.piece_type, target)
    return best


def blocks_check(facts: Facts) -> bool:
    if not facts.before.is_check() or facts.pt == chess.KING or facts.cap:
        return False
    checkers = list(facts.before.checkers())
    if len(checkers) != 1:
        return False
    king = facts.before.king(facts.color)
    if king is None:
        return False
    return facts.to in chess.SquareSet.between(king, checkers[0])


def stepped_out(facts: Facts) -> bool:
    if facts.cap or not facts.before.is_pinned(facts.color, facts.frm):
        return False
    occ = facts.after.piece_at(facts.to)
    return occ is not None and occ.color == facts.color and not facts.after.is_pinned(facts.color, facts.to)


def relieved_pin(facts: Facts) -> tuple[int, int] | None:
    """A friendly piece was pinned to our king or queen, and this move stands in the way."""
    if facts.cap:
        return None
    before_pins = enemy_pins(facts.before, facts.color)
    after_keys = {(pin[1], pin[2], pin[3]) for _slider, pin in enemy_pins(facts.after, facts.color)}
    for slider, pin in before_pins:
        pt, psq, kind, anchor = pin
        if (psq, kind, anchor) in after_keys:
            continue
        if facts.to in chess.SquareSet.between(slider, anchor):
            return pt, psq
    return None


def enemy_pins(board: chess.Board, color: bool) -> list[tuple[int, tuple[int, int, str, int]]]:
    enemy = not color
    found = []
    for sq, occ in board.piece_map().items():
        if occ.color == enemy and occ.piece_type in (chess.BISHOP, chess.ROOK, chess.QUEEN):
            for pin in pin_targets(board, sq, enemy):
                found.append((sq, pin))
    return found


def knight_only_landings(facts: Facts) -> list[tuple[int, int, int]]:
    if facts.pt != chess.PAWN:
        return []
    found = []
    for sq in facts.after.attacks(facts.to):
        if facts.after.piece_at(sq) is not None or facts.before.is_attacked_by(facts.color, sq):
            continue
        hits = []
        for dest in chess.SquareSet(chess.BB_KNIGHT_ATTACKS[sq]):
            occ = facts.after.piece_at(dest)
            if occ and occ.color == facts.color and occ.piece_type in (chess.QUEEN, chess.ROOK, chess.BISHOP, chess.KNIGHT):
                hits.append((occ.piece_type, dest))
        if not hits:
            continue
        hits.sort(key=lambda item: -VALUE[item[0]])
        found.append((sq, hits[0][0], hits[0][1]))
    return found


def pawn_role(facts: Facts, pack: str) -> str | None:
    if facts.pt != chess.PAWN or facts.cap:
        return None
    san = facts.san
    centre = supported_centre(facts)
    frees = [name for name in facts.opened if "bishop" in name]
    shuts_light = facts.light_before is not None and facts.light_after is not None and facts.light_after < facts.light_before
    shuts_dark = facts.dark_before is not None and facts.dark_after is not None and facts.dark_after < facts.dark_before
    free_light = "light-squared bishop" in frees
    free_dark = "dark-squared bishop" in frees
    empties = empty_centre_attacked(facts)
    # Support a centre pawn and say which bishop is freed or shut in.
    if centre is not None and (frees or shuts_light or shuts_dark):
        bits = [f"backs up the pawn on {sqn(centre)}"]
        if free_light or free_dark:
            bits.append(f"frees the {frees[0]}")
        if shuts_light and not free_light:
            bits.append("leaves the light-squared bishop inside the pawn chain")
        if shuts_dark and not free_dark:
            bits.append("leaves the dark-squared bishop inside the pawn chain")
        if facts.color == chess.WHITE and san == "e3" and dark_bishop_out(facts) and len(bits) < 3:
            bits.append("now that the dark-squared bishop is outside the pawn chain")
        if len(bits) == 1:
            return sentence(san, bits[0])
        if len(bits) == 2:
            return sentence(san, f"{bits[0]} and {bits[1]}")
        if bits[2].startswith("now "):
            return sentence(san, f"{bits[0]} and {bits[1]}, {bits[2]}")
        return sentence(san, f"{bits[0]}, {bits[1]}, and {bits[2]}")
    if centre is not None:
        if pack == "london" and san == "c3":
            return sentence(san, f"backs up the pawn on {sqn(centre)} and builds the pawn pyramid")
        flavor = ""
        if pack in ("qgd-black", "qg-white", "slav-defence") and san in ("e3", "e6"):
            flavor = ", the point of this pawn move in the queen's pawn openings"
        return sentence(san, f"backs up the pawn on {sqn(centre)}{flavor}")
    if san in ("e6", "e3") and (free_dark or free_light) and (shuts_light or shuts_dark):
        freed = "dark-squared bishop" if free_dark else "light-squared bishop"
        shut = "light-squared bishop" if shuts_light else "dark-squared bishop"
        lead = "starts the French pawn chain" if pack == "french-black" and san == "e6" else f"frees the {freed}"
        if pack == "french-black" and san == "e6":
            return sentence(san, f"starts the French pawn chain, frees the {freed}, and leaves the {shut} inside the pawn chain")
        return sentence(san, f"{lead} and leaves the {shut} inside the pawn chain")
    if san in ("c6", "c3") and empties and facts.light_before is not None and not shuts_light:
        flavor = ""
        if pack == "caro-kann-black" and san == "c6":
            flavor = ", which is why the Caro keeps the light-squared bishop free"
        elif pack == "slav-defence" and san == "c6":
            flavor = ", the Slav way to a pawn centre with the light-squared bishop free"
        return sentence(san, f"prepares a pawn centre without shutting in the light-squared bishop{flavor}")
    if san in ("c5", "c4") and not facts.enemies:
        if pack == "sicilian-black" and san == "c5":
            return sentence(san, "strikes at the white centre from the flank, the Sicilian idea")
        if pack == "kings-indian-black" and san == "c4":
            return sentence(san, "gains space beside the centre before Black fianchettos")
        if pack in ("qg-white", "qgd-black", "slav-defence", "nimzo-indian-black") and san == "c4":
            return sentence(san, "gains space and offers the queen's pawn")
        if empties:
            return sentence(san, f"gains space from the flank and watches the {sqn(empties[0])} square")
        return sentence(san, "gains space from the flank")
    if san in ("g6", "g3", "b6", "b3") and facts.home_bishop is False:
        if san in ("g6", "g3"):
            return sentence(san, "prepares the fianchetto on the long diagonal")
        return sentence(san, "prepares a queenside fianchetto")
    if facts.enemies:
        pt, sq = facts.enemies[0]
        if pack == "ruy-lopez-white" and san == "a6" and pt == chess.BISHOP:
            return sentence(san, f"attacks the {bishop_kind(sq)} on {sqn(sq)} and asks it to choose a diagonal")
        if pt == chess.PAWN and sq in CENTRE:
            offer = ""
            if san == "c4" and pack in ("qg-white", "qgd-black", "slav-defence", "nimzo-indian-black"):
                offer = " and offers the queen's pawn"
            if san == "c5":
                offer = ", chipping at the white centre"
            return sentence(san, f"attacks the pawn on {sqn(sq)}{offer}")
        return sentence(san, f"attacks the {piece_name(pt)} on {sqn(sq)}")
    if facts.to in CENTRE:
        share = "claims a matching share" if enemy_centre_pawn(facts.after, facts.color) else "claims a share"
        if frees:
            extra = flavour_centre(pack, san)
            return sentence(san, f"{share} of the centre and frees the {frees[0]}{extra}")
        return sentence(san, f"{share} of the centre")
    if frees:
        name = frees[0]
        if shuts_light and "light" not in name:
            return sentence(san, f"frees the {name} and leaves the light-squared bishop inside the pawn chain")
        if shuts_dark and "dark" not in name:
            return sentence(san, f"frees the {name} and leaves the dark-squared bishop inside the pawn chain")
        return sentence(san, f"frees the {name}")
    return None


def flavour_centre(pack: str, san: str) -> str:
    if san == "e5" and pack == "ruy-lopez-white":
        return ", ready to meet the Spanish pin"
    if san == "e5" and pack == "italian-white":
        return ", ready to meet the Italian bishop"
    if san == "e5" and pack == "opening-traps":
        return ", the open-game start this trap needs"
    if san == "d5" and pack in ("qgd-black", "slav-defence", "caro-kann-black"):
        return ", planting a pawn centre"
    if san == "d5" and pack == "french-black":
        return ", the French challenge to White's centre pawn"
    return ""


def dark_bishop_out(facts: Facts) -> bool:
    for sq, occ in facts.after.piece_map().items():
        if occ.color == facts.color and occ.piece_type == chess.BISHOP and bishop_kind(sq).startswith("dark"):
            if sq not in HOME_BISHOP[facts.color]:
                return True
    return False


def bishop_role(facts: Facts, pack: str, line: str) -> str | None:
    if facts.pt != chess.BISHOP or facts.cap:
        return None
    san = facts.san
    kind = bishop_kind(facts.frm if facts.home_bishop else facts.to)
    if facts.home_bishop and pack == "london" and san == "Bf4":
        return sentence(san, "develops the dark-squared bishop outside the pawn chain, which is the London idea")
    if facts.to in LONG_DARK or facts.to in LONG_LIGHT:
        watched = empty_centre_attacked(facts)
        if facts.home_bishop or is_retreat(facts):
            if watched:
                return sentence(san, f"places the {bishop_kind(facts.to)} on the long diagonal and watches the {sqn(watched[0])} square")
            if pack.startswith("kings-indian") or "kid" in line or san in ("Bg7", "Bg2"):
                return sentence(san, f"places the {bishop_kind(facts.to)} on the long diagonal, the fianchetto piece")
            return sentence(san, f"places the {bishop_kind(facts.to)} on the long diagonal")
    if facts.home_bishop:
        ahead = pawn_ahead(facts.after, facts.to, facts.color)
        newly = castle_is_legal(facts.after, facts.color) and not castle_is_legal(facts.before, facts.color)
        unblocks = left_castle_path(facts.before, facts.move, facts.color)
        bits = [f"develops the {kind}"]
        if ahead is not None:
            bits = [f"develops the {kind} behind the pawn on {sqn(ahead)}"]
        if newly:
            bits.append("the king can now castle")
        elif unblocks:
            bits.append("unblocks the king")
        elif facts.enemies:
            pt, sq = facts.enemies[0]
            bits.append(f"attacks the {piece_name(pt)} on {sqn(sq)}")
        elif empty_centre_attacked(facts):
            bits.append(f"watches the {sqn(empty_centre_attacked(facts)[0])} square")
        if len(bits) == 1:
            enemy_king = facts.after.king(not facts.color)
            our_king = facts.after.king(facts.color)
            if enemy_king is not None and diagonal(facts.to, enemy_king):
                return sentence(san, f"develops the {kind} on the diagonal of the king on {sqn(enemy_king)}")
            if enemy_king is not None:
                near = [
                    sq for sq in facts.after.attacks(facts.to)
                    if facts.after.piece_at(sq) is None
                    and max(abs(chess.square_file(sq) - chess.square_file(enemy_king)), abs(chess.square_rank(sq) - chess.square_rank(enemy_king))) <= 1
                ]
                if near:
                    return sentence(san, f"develops the {kind} towards the king on {sqn(enemy_king)}")
            if our_king is not None and abs(chess.square_file(our_king) - chess.square_file(facts.to)) <= 1 and abs(chess.square_rank(our_king) - chess.square_rank(facts.to)) <= 1:
                return sentence(san, f"develops the {kind} beside the king on {sqn(our_king)}")
            return None
        joiner = " and " if not bits[0].endswith(kind) or True else " and "
        if bits[1] == "the king can now castle":
            return sentence(san, f"{bits[0]}, and {bits[1]}")
        return sentence(san, " and ".join(bits[:2]))
    if is_retreat(facts):
        if facts.prev_was_pawn and facts.prev_to is not None and facts.frm in facts.after.attacks(facts.prev_to):
            return sentence(san, f"drops the {bishop_kind(facts.to)} back from the pawn that just advanced")
        if empty_centre_attacked(facts):
            return sentence(san, f"drops the {bishop_kind(facts.to)} back and watches the {sqn(empty_centre_attacked(facts)[0])} square")
        return sentence(san, f"drops the {bishop_kind(facts.to)} back, keeping it on the board")
    if facts.enemies:
        pt, sq = facts.enemies[0]
        return sentence(san, f"keeps the {kind} active and attacks the {piece_name(pt)} on {sqn(sq)}")
    if facts.backed:
        pt, sq = facts.backed[0]
        return sentence(san, f"keeps the {kind} active and backs up the {piece_name(pt)} on {sqn(sq)}")
    watched = empty_centre_attacked(facts)
    if watched:
        return sentence(san, f"keeps the {kind} active and watches the {sqn(watched[0])} square")
    return None


def is_retreat(facts: Facts) -> bool:
    if facts.color == chess.WHITE:
        return chess.square_rank(facts.to) < chess.square_rank(facts.frm)
    return chess.square_rank(facts.to) > chess.square_rank(facts.frm)


def develop_role(facts: Facts, pack: str, line: str = "") -> str | None:
    san = facts.san
    if facts.home_knight:
        who = facts.home_knight
        flavor = knight_flavor(pack, san, facts)
        if facts.enemies and facts.friends:
            pt, sq = facts.enemies[0]
            ft, fs = facts.friends[0]
            body = f"develops the {who}, attacks the {piece_name(pt)} on {sqn(sq)}, and defends the {piece_name(ft)} on {sqn(fs)}"
            return sentence(san, body)
        if facts.enemies:
            pt, sq = facts.enemies[0]
            body = f"develops the {who} and attacks the {piece_name(pt)} on {sqn(sq)}"
            if flavor:
                body += f", {flavor}"
            return sentence(san, body)
        if facts.friends:
            pt, sq = facts.friends[0]
            body = f"develops the {who} and defends the {piece_name(pt)} on {sqn(sq)}"
            if flavor:
                body += f", {flavor}"
            return sentence(san, body)
        centre_pawn = next((sq for pt, sq in facts.backed if pt == chess.PAWN and sq in CENTRE), None)
        if centre_pawn is not None:
            body = f"develops the {who} and backs up the pawn on {sqn(centre_pawn)}"
            if flavor:
                body += f", {flavor}"
            return sentence(san, body)
        watched = empty_centre_attacked(facts)
        if watched:
            body = f"develops the {who} and watches the {sqn(watched[0])} square"
            if flavor:
                body += f", {flavor}"
            return sentence(san, body)
        if left_castle_path(facts.before, facts.move, facts.color):
            return sentence(san, f"develops the {who} and unblocks the king")
    if facts.pt == chess.KNIGHT and not facts.home_knight and not facts.cap:
        watched = empty_centre_attacked(facts)
        verb = "re-routes the knight" if is_retreat(facts) else "brings the knight forward"
        if is_retreat(facts) and line == "rlw1":
            return sentence(san, "re-routes the knight via the home rank, the Breyer idea")
        if facts.enemies:
            pt, sq = facts.enemies[0]
            return sentence(san, f"{verb} and attacks the {piece_name(pt)} on {sqn(sq)}")
        if facts.friends:
            pt, sq = facts.friends[0]
            return sentence(san, f"{verb} and defends the {piece_name(pt)} on {sqn(sq)}")
        if watched:
            return sentence(san, f"{verb} and watches the {sqn(watched[0])} square")
        if is_retreat(facts):
            return sentence(san, "re-routes the knight so another pawn or piece can move")
    home_queen = chess.D1 if facts.color == chess.WHITE else chess.D8
    if facts.pt == chess.QUEEN and facts.frm == home_queen and not facts.cap:
        file_index = chess.square_file(facts.to)
        rook_sq = next(
            (
                sq
                for sq, occ in facts.after.piece_map().items()
                if occ.color == facts.color and occ.piece_type == chess.ROOK and chess.square_file(sq) == file_index
            ),
            None,
        )
        watched = empty_centre_attacked(facts)
        if rook_sq is not None and abs(chess.square_rank(rook_sq) - chess.square_rank(facts.to)) == 1:
            extra = f" and watches the {sqn(watched[0])} square" if watched else ""
            return sentence(san, f"develops the queen on the {chess.FILE_NAMES[file_index]}-file beside the rook on {sqn(rook_sq)}{extra}")
        if watched:
            return sentence(san, f"develops the queen and watches the {sqn(watched[0])} square")
        centre_pawn = next((sq for pt, sq in facts.backed if pt == chess.PAWN and sq in CENTRE), None)
        if centre_pawn is not None:
            return sentence(san, f"develops the queen and backs up the pawn on {sqn(centre_pawn)}")
        if facts.enemies:
            pt, sq = facts.enemies[0]
            second = ""
            pawns = [(p, s) for p, s in facts.enemies if p == chess.PAWN]
            if len(pawns) >= 2:
                second = f" and the pawn on {sqn(pawns[1][1])}"
            return sentence(san, f"develops the queen and attacks the {piece_name(pt)} on {sqn(sq)}{second}")
        if empty_centre_attacked(facts):
            return sentence(san, f"develops the queen and watches the {sqn(empty_centre_attacked(facts)[0])} square")
    return None


def knight_flavor(pack: str, san: str, facts: Facts) -> str:
    if san == "Nf3" and any(sq == chess.E5 and pt == chess.PAWN for pt, sq in facts.enemies):
        if pack == "ruy-lopez-white":
            return "so the Spanish pin has a target"
        if pack == "italian-white":
            return "so the Italian bishop is sound"
        if pack == "opening-traps":
            return "before the trap's tactics begin"
    if san == "Nf6" and any(sq == chess.E4 and pt == chess.PAWN for pt, sq in facts.enemies):
        if pack == "kings-indian-black":
            return "before the fianchetto and the later centre strike"
        if pack == "nimzo-indian-black":
            return "before the pin on the queen's knight"
        if pack == "french-black":
            return "hitting the centre pawn in the French"
    if san == "Nc6" and any(sq == chess.E5 and pt == chess.PAWN for pt, sq in facts.friends):
        if pack == "ruy-lopez-white":
            return "the knight the Spanish bishop wants to pin"
        if pack == "italian-white":
            return "holding the centre pawn the Italian bishop will eye"
    return ""


def rook_role(facts: Facts) -> str | None:
    if facts.pt != chess.ROOK or facts.cap:
        return None
    file_index = chess.square_file(facts.to)
    friendly, enemy = file_pawns(facts.after, file_index, facts.color)
    file_name = chess.FILE_NAMES[file_index]
    if friendly == 0 and enemy == 0:
        return sentence(facts.san, f"puts the rook on the open {file_name}-file")
    if friendly == 0:
        return sentence(facts.san, f"puts the rook on the half-open {file_name}-file")
    ahead = file_pawn_ahead(facts.after, facts.to, facts.color)
    if ahead is not None:
        return sentence(facts.san, f"puts the rook on the {file_name}-file, behind the pawn on {sqn(ahead)}")
    if facts.enemies:
        pt, sq = facts.enemies[0]
        return sentence(facts.san, f"moves the rook and attacks the {piece_name(pt)} on {sqn(sq)}")
    return None


def centre_soft(facts: Facts) -> str | None:
    """When the centre squares cannot be named, still say the piece is working there."""
    if facts.cap or facts.pt not in (chess.KNIGHT, chess.BISHOP, chess.QUEEN):
        return None
    if not any(sq in facts.after.attacks(facts.to) for sq in CENTRE):
        return None
    if facts.home_knight:
        return sentence(facts.san, f"develops the {facts.home_knight} and watches the centre")
    if facts.home_bishop:
        return sentence(facts.san, f"develops the {bishop_kind(facts.frm)} and watches the centre")
    return sentence(facts.san, f"keeps the {piece_name(facts.pt)} watching the centre")


def watch_role(facts: Facts) -> str | None:
    watched = empty_centre_attacked(facts)
    if not watched or facts.cap:
        return None
    return sentence(facts.san, f"watches the {sqn(watched[0])} square")


def backup_role(facts: Facts) -> str | None:
    if not facts.backed or facts.cap:
        return None
    pt, sq = facts.backed[0]
    if pt == chess.PAWN:
        return sentence(facts.san, f"backs up the pawn on {sqn(sq)}")
    return sentence(facts.san, f"backs up the {piece_name(pt)} on {sqn(sq)}")


def space_role(facts: Facts) -> str | None:
    if facts.pt != chess.PAWN or facts.cap:
        return None
    advanced = chess.square_rank(facts.to) > chess.square_rank(facts.frm) if facts.color == chess.WHITE else chess.square_rank(facts.to) < chess.square_rank(facts.frm)
    if not advanced:
        return None
    return sentence(facts.san, f"gains space on the {chess.FILE_NAMES[chess.square_file(facts.to)]}-file")


_P = f"(?:{PIECE_WORD})"
THIN_RES = [
    re.compile(rf"^.+ develops the (king's|queen's) knight and (attacks|defends) the {_P} on {SQUARE}\.$"),
    re.compile(rf"^.+ develops the (king's|queen's) knight and (?:backs up the pawn on {SQUARE}|watches the {SQUARE} square)\.$"),
    re.compile(rf"^.+ brings the king to {SQUARE} and the rook to {SQUARE}(?:, and (?:leaves the (?:open|half-open) [a-h]-file|connects the rooks))?\.$"),
    re.compile(rf"^.+ (?:takes|recaptures) the {_P} on {SQUARE}(?:, which was attacking the {_P} on {SQUARE})?\.$"),
    re.compile(r"^.+ is checkmate\.$"),
    re.compile(r"^.+ gives check\.$"),
    re.compile(r"^.+ claims a (matching )?share of the centre and frees the (light|dark)-squared bishop\.?$"),
    re.compile(r"^.+ gains space on the [a-h]-file\.$"),
    re.compile(r"^.+ prepares a pawn centre without shutting in the light-squared bishop\.$"),
    re.compile(rf"^.+ watches the {SQUARE} square\.$"),
    re.compile(r"^.+ gives the king a flight square\.$"),
    re.compile(rf"^.+ attacks the {_P} on {SQUARE}\.$"),
    re.compile(rf"^.+ attacks the (?:{_P}|(?:light|dark)-squared bishop) that just arrived(?: on {SQUARE})?\.$"),
    re.compile(rf"^.+ defends the {_P} on {SQUARE}\.$"),
    re.compile(rf"^.+ backs up the pawn on {SQUARE}\.$"),
    re.compile(rf"^.+ frees the (?:light|dark)-squared bishop\.$"),
    re.compile(r"^.+ keeps the (?:pawn|knight|bishop|rook|queen|king) working for the plan\.$"),
    re.compile(r"^.+ (?:blocks the check|gets the king out of check|unblocks the king)\.$"),
]


def is_thin(text: str) -> bool:
    if sentence_count(text) != 1:
        return False
    return any(pattern.match(text) for pattern in THIN_RES)


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
    intro = re.sub(r"\s+", " ", " ".join(kept)).replace(" ,", ",").strip()
    return intro


def attach(primary: str, line: str, ply: int, salt: int) -> str:
    plan = PLANS[line][(ply + salt) % 2]
    return f"{primary} {plan}"


def with_facing(primary: str, clause: str) -> str:
    if not primary.endswith("."):
        primary += "."
    return primary[:-1] + ", " + clause + "."


def assign_notes(drafts: list[dict]) -> None:
    groups: dict[str, list[dict]] = defaultdict(list)
    for item in drafts:
        if item["ply"] == 1:
            continue
        groups[item["primary"]].append(item)
    chosen: dict[tuple[str, str], str] = {}
    for primary, items in groups.items():
        by_fen: dict[str, list[dict]] = defaultdict(list)
        for item in items:
            by_fen[item["fen"]].append(item)
        if len(by_fen) == 1:
            for fen in by_fen:
                chosen[(primary, fen)] = primary
            continue
        clause_fens: dict[str, set[str]] = defaultdict(set)
        safe: dict[str, list[str]] = {}
        for fen, group in by_fen.items():
            common = set(group[0]["clauses"])
            for item in group[1:]:
                common &= set(item["clauses"])
            ordered = [clause for clause in group[0]["clauses"] if clause in common]
            safe[fen] = ordered
            for clause in ordered:
                clause_fens[clause].add(fen)
        used_text: dict[str, str] = {}
        for fen, ordered in safe.items():
            ranked = sorted(ordered, key=lambda clause: (len(clause_fens[clause]), clause))
            ranked = [clause for clause in ranked if len(clause_fens[clause]) < len(safe)]
            options = ranked[:]
            if len(ranked) >= 2:
                options.append(f"{ranked[0]}, {ranked[1]}")
            options = [with_facing(primary, clause) for clause in options]
            text = next((opt for opt in options if opt not in used_text or used_text[opt] == fen), None)
            if text is None:
                text = primary
            used_text[text] = fen
            chosen[(primary, fen)] = text
    used: set[str] = set()
    ply1: dict[tuple[str, str], str] = {}
    for item in drafts:
        if item["ply"] == 1:
            key = (item["pack"], item["san"])
            if key in ply1:
                item["note"] = ply1[key]
                continue
            text = item["primary"]
            if text in used:
                text = attach(item["primary"], item["line"], 1, 0)
            ply1[key] = text
            used.add(text)
            item["note"] = text
            continue
        item["note"] = chosen[(item["primary"], item["fen"])]


def notes_for_packs(packs: list[dict]) -> dict:
    RULES.clear()
    drafts = []
    for pack in packs:
        if pack["id"] == "scotch":
            continue
        for line in pack["lines"]:
            board = chess.Board()
            for index, san in enumerate(line["plies"]):
                future = set(line["plies"][index + 1 :])
                played = set(line["plies"][: index + 1])
                clauses: list[str] = []
                if index == 0 and (pack["id"], san) in OPENERS:
                    primary, rule = OPENERS[(pack["id"], san)], "opener"
                else:
                    facts = gather(board, san)
                    rule, primary = choose(facts, pack["id"], line["id"], future, played)
                    clauses = context_phrases(facts, future, played)
                drafts.append({
                    "pack": pack["id"],
                    "line": line["id"],
                    "ply": index + 1,
                    "san": san,
                    "fen": board.fen(),
                    "primary": primary,
                    "clauses": clauses,
                    "rule": rule,
                })
                RULES.append(rule)
                board.push_san(san)
    assign_notes(drafts)
    general: dict[str, dict] = {}
    cursor = 0
    for pack in packs:
        if pack["id"] == "scotch":
            continue
        lines = {}
        for line in pack["lines"]:
            notes = []
            for _san in line["plies"]:
                notes.append(drafts[cursor]["note"])
                cursor += 1
            intro = clean_intro(line.get("idea") or line.get("name") or "")
            if not intro:
                intro = f"{line['name']} is the plan for this line."
            lines[line["id"]] = {"intro": intro, "notes": notes}
        general[pack["id"]] = lines
    return general


# --- verification of concrete claims ---------------------------------------

CLAIM_ATTACK = re.compile(rf"(?:attacks|attack) the ({PIECE_WORD}) on ({SQUARE})")
CLAIM_BISHOP_ATTACK = re.compile(rf"attacks the (light-squared|dark-squared) bishop on ({SQUARE})")
CLAIM_DEFEND = re.compile(rf"(?<!which )defends the ({PIECE_WORD}) on ({SQUARE})")
CLAIM_BACK = re.compile(rf"backs up the ({PIECE_WORD}) on ({SQUARE})")
CLAIM_TAKE = re.compile(rf"(?:takes|recaptures) the ({PIECE_WORD}) on ({SQUARE})")
CLAIM_PIN = re.compile(rf"pins the ({PIECE_WORD}) on ({SQUARE}) to the (king|queen) on ({SQUARE})")
CLAIM_BREAK = re.compile(rf"breaks the pin on the ({PIECE_WORD}) on ({SQUARE})")
CLAIM_BLOCK_PIN = re.compile(rf"blocks the pin on the ({PIECE_WORD}) on ({SQUARE})")
CLAIM_WAS = re.compile(rf"was attacking the ({PIECE_WORD}) on ({SQUARE})")
CLAIM_WATCH = re.compile(rf"watches the ({SQUARE}) square")
CLAIM_LAND = re.compile(rf"landing on ({SQUARE})")
CLAIM_HIT = re.compile(rf"would hit the ({PIECE_WORD}) on ({SQUARE})")
CLAIM_WOULD_PIN = re.compile(rf"would pin the ({PIECE_WORD}) on ({SQUARE}) to the (king|queen) on ({SQUARE})")
CLAIM_KING_ROOK = re.compile(rf"brings the king to ({SQUARE}) and the rook to ({SQUARE})")
CLAIM_BEHIND = re.compile(rf"behind the pawn on ({SQUARE})")
CLAIM_ARRIVED = re.compile(
    rf"the ((?:light-squared|dark-squared) bishop|{PIECE_WORD}) that just arrived on ({SQUARE})"
)
CLAIM_OPEN_FILE = re.compile(r"opens the ([a-h])-file")
CLAIM_LEAVE_FILE = re.compile(r"leaves the (open|half-open) ([a-h])-file")
CLAIM_ROOK_FILE = re.compile(r"puts the rook on the (open|half-open) ([a-h])-file")
CLAIM_SPACE = re.compile(r"gains space on the ([a-h])-file")
CLAIM_AND = re.compile(rf"and the pawn on ({SQUARE})")


def verify_move_note(before: chess.Board, san: str, note: str, future: list[str] | tuple[str, ...] = (), played: list[str] | tuple[str, ...] = ()) -> list[str]:
    errors: list[str] = []
    if not note.startswith(san + " "):
        errors.append("san prefix")
    if DASH.search(note):
        errors.append("dash")
    if EVAL_SENTENCE.search(note):
        errors.append("eval")
    if sentence_count(note) < 1 or sentence_count(note) > 2:
        errors.append("sentence count")
    first = [part for part in re.split(r"(?<=[.!?])\s+", note.strip()) if part][0]
    for bit in BANNED:
        if bit in note:
            errors.append(f"banned:{bit}")
    future_set = set(future)
    played_set = set(played)
    for tok in san_tokens(note):
        if tok in future_set and tok not in played_set:
            errors.append(f"future {tok}")
    try:
        move = before.parse_san(san)
    except ValueError:
        return errors + ["illegal"]
    facts = gather(before, san)
    color = facts.color
    allowed: set[str] = set()

    def allow(*squares: int) -> None:
        for sq in squares:
            allowed.add(sqn(sq))

    if "is checkmate" in first and not facts.mate:
        errors.append("false mate")
    if "gives check" in first and not facts.check:
        errors.append("false check")
    if "recaptures" in first and not facts.recapture:
        errors.append("false recapture")
    if "brings the king to" in first and not before.is_castling(move):
        errors.append("false castle")
    if ("share of the centre" in first) and (facts.pt != chess.PAWN or facts.to not in CENTRE):
        errors.append("not centre pawn")
    if "matching share" in first and not enemy_centre_pawn(facts.after, color):
        errors.append("false matching share")
    if "develops the king's knight" in first and facts.home_knight != "king's knight":
        errors.append("not king's knight")
    if "develops the queen's knight" in first and facts.home_knight != "queen's knight":
        errors.append("not queen's knight")
    if "develops the dark-squared bishop" in first or "develops the light-squared bishop" in first:
        if not facts.home_bishop:
            errors.append("not a developing bishop")
    for match in CLAIM_BISHOP_ATTACK.finditer(note):
        kind, sq = match.group(1), chess.parse_square(match.group(2))
        occ = facts.after.piece_at(sq)
        if occ is None or occ.color == color or occ.piece_type != chess.BISHOP or not bishop_kind(sq).startswith(kind.split("-")[0]):
            errors.append(f"false bishop attack {match.group(2)}")
        elif sq not in facts.after.attacks(facts.to):
            errors.append(f"false bishop attack {match.group(2)}")
        allow(sq)
    for match in CLAIM_ATTACK.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        occ = facts.after.piece_at(sq)
        if occ is None or occ.color == color or piece_name(occ.piece_type) != want or sq not in facts.after.attacks(facts.to):
            errors.append(f"false attack {want} {match.group(2)}")
        allow(sq)
    for match in CLAIM_DEFEND.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        occ = facts.after.piece_at(sq)
        if occ is None or occ.color != color or piece_name(occ.piece_type) != want or sq not in facts.after.attacks(facts.to):
            errors.append(f"false defend {want} {match.group(2)}")
        elif not facts.after.is_attacked_by(not color, sq):
            errors.append(f"defend but not attacked {match.group(2)}")
        allow(sq)
    for match in CLAIM_BACK.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        occ = facts.after.piece_at(sq)
        if occ is None or occ.color != color or piece_name(occ.piece_type) != want or sq not in facts.after.attacks(facts.to):
            errors.append(f"false backup {want} {match.group(2)}")
        allow(sq)
    for match in CLAIM_TAKE.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        if facts.cap_sq != sq or facts.cap is None or piece_name(facts.cap.piece_type) != want:
            errors.append(f"false capture {want} {match.group(2)}")
        allow(sq)
    for match in CLAIM_PIN.finditer(note):
        want, psq, kind, anchor = match.group(1), chess.parse_square(match.group(2)), match.group(3), chess.parse_square(match.group(4))
        pins = pin_targets(facts.after, facts.to, color)
        if not any(piece_name(pt) == want and sq == psq and k == kind and a == anchor and not pin_existed(before, color, (pt, sq, k, a)) for pt, sq, k, a in pins):
            errors.append("false pin")
        allow(psq, anchor)
    for match in CLAIM_BREAK.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        broken = break_pin_capture(facts)
        if broken is None or piece_name(broken[0]) != want or broken[1] != sq:
            errors.append("false pin break")
        allow(sq)
    for match in CLAIM_BLOCK_PIN.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        relieved = relieved_pin(facts)
        if relieved is None or piece_name(relieved[0]) != want or relieved[1] != sq:
            errors.append("false block pin")
        allow(sq)
    for match in CLAIM_WAS.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        removed = removed_attacker(facts)
        if removed is None or piece_name(removed[1]) != want or removed[2] != sq:
            errors.append("false was-attacking")
        allow(sq)
    for match in CLAIM_WATCH.finditer(note):
        sq = chess.parse_square(match.group(1))
        if facts.after.piece_at(sq) is not None or sq not in facts.after.attacks(facts.to):
            errors.append(f"false watch {match.group(1)}")
        allow(sq)
    for match in CLAIM_ARRIVED.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        occ = facts.after.piece_at(sq)
        kind_ok = piece_name(occ.piece_type) == want if occ is not None and occ.piece_type != chess.BISHOP else occ is not None and (
            want == "bishop" or (want.endswith("bishop") and bishop_kind(sq).startswith(want.split("-")[0]))
        )
        if facts.prev_to != sq or occ is None or occ.color == color or not kind_ok or sq not in facts.after.attacks(facts.to):
            errors.append("false arrival")
        allow(sq)
    soft_arrival = re.search(
        r"attacks the ((?:light-squared|dark-squared) bishop|pawn|knight|bishop|rook|queen) that just arrived(?! on)",
        first,
    )
    if soft_arrival:
        want = soft_arrival.group(1)
        if facts.prev_to is None or facts.prev_to not in facts.after.attacks(facts.to):
            errors.append("false soft arrival")
        else:
            occ = facts.after.piece_at(facts.prev_to)
            if occ is None or occ.color == color:
                errors.append("false soft arrival piece")
            elif want.endswith("bishop"):
                if occ.piece_type != chess.BISHOP or (want != "bishop" and not bishop_kind(facts.prev_to).startswith(want.split("-")[0])):
                    errors.append("false soft arrival bishop")
            elif piece_name(occ.piece_type) != want:
                errors.append("false soft arrival piece")
    landings = [chess.parse_square(match.group(1)) for match in CLAIM_LAND.finditer(note)]
    for sq in landings:
        if facts.after.piece_at(sq) is not None or sq not in facts.after.attacks(facts.to):
            errors.append(f"false landing {sqn(sq)}")
        allow(sq)
    for match in CLAIM_HIT.finditer(note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        occ = facts.after.piece_at(sq)
        if occ is None or occ.color != color or piece_name(occ.piece_type) != want:
            errors.append("false hit target")
            continue
        source = landings[0] if landings else None
        if source is None or not (bishop_would_attack(facts.after, source, sq) or sq in chess.SquareSet(chess.BB_KNIGHT_ATTACKS[source])):
            errors.append("false hit geometry")
        allow(sq)
    for match in CLAIM_WOULD_PIN.finditer(note):
        want, psq, kind, anchor = match.group(1), chess.parse_square(match.group(2)), match.group(3), chess.parse_square(match.group(4))
        source = landings[0] if landings else None
        pins = ghost_bishop_pins(facts.after, source, color) if source is not None else []
        if not any(piece_name(pt) == want and sq == psq and k == kind and a == anchor for pt, sq, k, a in pins):
            errors.append("false would-pin")
        allow(psq, anchor)
    castle = CLAIM_KING_ROOK.search(note)
    if castle:
        king_sq, rook_sq = chess.parse_square(castle.group(1)), chess.parse_square(castle.group(2))
        if king_sq != facts.to or not before.is_castling(move):
            errors.append("false king dest")
        else:
            kingside = before.is_kingside_castling(move)
            expect = (chess.F1 if color == chess.WHITE else chess.F8) if kingside else (chess.D1 if color == chess.WHITE else chess.D8)
            if rook_sq != expect:
                errors.append("false rook dest")
        allow(king_sq, rook_sq)
    behind = CLAIM_BEHIND.search(note)
    if behind:
        sq = chess.parse_square(behind.group(1))
        ahead = pawn_ahead(facts.after, facts.to, color) if facts.pt == chess.BISHOP else file_pawn_ahead(facts.after, facts.to, color)
        if facts.pt not in (chess.BISHOP, chess.ROOK) or ahead != sq:
            errors.append("false behind")
        allow(sq)
    for match in CLAIM_AND.finditer(note):
        sq = chess.parse_square(match.group(1))
        occ = facts.after.piece_at(sq)
        if occ is None or occ.piece_type != chess.PAWN or occ.color == color or sq not in facts.after.attacks(facts.to):
            errors.append("false second pawn")
        allow(sq)
    for match in CLAIM_OPEN_FILE.finditer(note):
        file_index = chess.FILE_NAMES.index(match.group(1))
        if facts.pt != chess.PAWN or chess.square_file(facts.frm) != file_index or file_pawns(facts.after, file_index, color)[0] != 0:
            errors.append("false open file")
    for match in CLAIM_LEAVE_FILE.finditer(note):
        kind, file_name = match.group(1), match.group(2)
        file_index = chess.FILE_NAMES.index(file_name)
        if not before.is_castling(move) or chess.square_file(facts.frm) != file_index:
            errors.append("false leave file")
        friendly, enemy = file_pawns(facts.after, file_index, color)
        if kind == "open" and not (friendly == 0 and enemy == 0):
            errors.append("not an open file")
        if kind == "half-open" and not (friendly == 0 and enemy > 0):
            errors.append("not a half-open file")
    for match in CLAIM_ROOK_FILE.finditer(note):
        kind, file_name = match.group(1), match.group(2)
        file_index = chess.FILE_NAMES.index(file_name)
        if facts.pt != chess.ROOK or chess.square_file(facts.to) != file_index:
            errors.append("false rook file")
        friendly, enemy = file_pawns(facts.after, file_index, color)
        if kind == "open" and not (friendly == 0 and enemy == 0):
            errors.append("rook file not open")
        if kind == "half-open" and not (friendly == 0 and enemy > 0):
            errors.append("rook file not half-open")
    for match in CLAIM_SPACE.finditer(note):
        file_index = chess.FILE_NAMES.index(match.group(1))
        advanced = chess.square_rank(facts.to) > chess.square_rank(facts.frm) if color == chess.WHITE else chess.square_rank(facts.to) < chess.square_rank(facts.frm)
        if facts.pt != chess.PAWN or chess.square_file(facts.to) != file_index or not advanced:
            errors.append("false space")
    if "frees the light-squared bishop" in first and "light-squared bishop" not in facts.opened:
        errors.append("false free light bishop")
    if "frees the dark-squared bishop" in first and "dark-squared bishop" not in facts.opened:
        errors.append("false free dark bishop")
    if "leaves the light-squared bishop inside the pawn chain" in first:
        if not (facts.light_before is not None and facts.light_after is not None and facts.light_after < facts.light_before):
            errors.append("false shut light bishop")
    if "leaves the dark-squared bishop inside the pawn chain" in first:
        if not (facts.dark_before is not None and facts.dark_after is not None and facts.dark_after < facts.dark_before):
            errors.append("false shut dark bishop")
    if "without shutting in the light-squared bishop" in first:
        if facts.light_before is None or (facts.light_after is not None and facts.light_after < facts.light_before):
            errors.append("did shut the light bishop")
    if "prepares a pawn centre" in first and not empty_centre_attacked(facts):
        errors.append("does not prepare a pawn centre")
    if "supports the centre pawn" in first and supported_centre(facts) is None:
        errors.append("does not support the centre")
    if "outside the pawn chain" in first and "already outside" not in first and "now that the dark-squared bishop is outside" not in first:
        if not (facts.home_bishop and facts.pt == chess.BISHOP and chess.square_rank(facts.to) not in (0, 7)):
            errors.append("not outside the chain")
    if ("already outside the pawn chain" in first or "now that the dark-squared bishop is outside" in first) and not dark_bishop_out(facts):
        errors.append("bishop not already out")
    if "places the" in first and "on the long diagonal" in first and facts.to not in LONG_DARK and facts.to not in LONG_LIGHT:
        errors.append("not on the long diagonal")
    if "gives the king a flight square" in first and not makes_luft(before, facts.after, move, color):
        errors.append("false luft")
    if "takes away a bishop pin" in first and not newly_controlled_bishop_lands(facts):
        errors.append("false soft pin")
    if "connects the rooks" in first and not rooks_connected(facts.after, color):
        errors.append("false connect")
    if "the king can now castle" in first and not (castle_is_legal(facts.after, color) and not castle_is_legal(before, color)):
        errors.append("cannot castle yet")
    if "unblocks the king" in first and not left_castle_path(before, move, color):
        errors.append("does not unblock")
    if "steps the " in first and "out of the pin" in first and not stepped_out(facts):
        errors.append("false step out")
    if "blocks the check" in first and not blocks_check(facts):
        errors.append("false block")
    if "gets the king out of check" in first and not (before.is_check() and facts.pt == chess.KING):
        errors.append("false escape")
    if "plants a knight in the centre" in first and not (facts.pt == chess.KNIGHT and facts.to in CENTRE):
        errors.append("false plant")
    if "keeps a pawn in the centre" in first and not (facts.pt == chess.PAWN and facts.to in CENTRE):
        errors.append("false keep pawn")
    if "promotes to a " in first and facts.move.promotion:
        if f"promotes to a {piece_name(facts.move.promotion)}" not in first:
            errors.append("false promotion")
    elif "promotes to a " in first:
        errors.append("false promotion")
    if "which a queen promotion would not" in first:
        alt = chess.Move(facts.frm, facts.to, promotion=chess.QUEEN)
        if alt not in before.legal_moves:
            errors.append("queen promo illegal")
        else:
            trial = before.copy(stack=False)
            trial.push(alt)
            if trial.is_check() or not facts.check:
                errors.append("queen would also check")
    if "gains space" in first and "gains space on the" not in first:
        advanced = chess.square_rank(facts.to) > chess.square_rank(facts.frm) if color == chess.WHITE else chess.square_rank(facts.to) < chess.square_rank(facts.frm)
        if facts.pt != chess.PAWN or not advanced:
            errors.append("false gains space")
    if "prepares the fianchetto" in first or "prepares a queenside fianchetto" in first:
        if facts.pt != chess.PAWN or san not in ("g6", "g3", "b6", "b3"):
            errors.append("not a fianchetto pawn")
    if "drops the " in first and "back" in first and not (facts.pt == chess.BISHOP and is_retreat(facts)):
        errors.append("false retreat")
    if "from the pawn that just advanced" in first:
        if not (facts.prev_was_pawn and facts.prev_to is not None and facts.frm in facts.after.attacks(facts.prev_to)):
            errors.append("false pawn chase")
    if "re-routes the knight" in first and facts.pt != chess.KNIGHT:
        errors.append("false reroute")
    if "puts the rook on" in first and facts.pt != chess.ROOK:
        errors.append("not a rook")
    if "watches the centre" in first or "watching the centre" in first:
        if not any(sq in facts.after.attacks(facts.to) for sq in CENTRE):
            errors.append("false centre watch")
    if "while a pawn still stands in the centre" in first and not pawn_in_centre(facts.after):
        errors.append("no centre pawn")
    if "builds the pawn pyramid" in first:
        if facts.san != "c3" or supported_centre(facts) is None:
            errors.append("false pyramid")
    if "the point of the Spanish bishop" in first:
        if facts.pt != chess.BISHOP or not any(pt == chess.KNIGHT and sq == chess.C6 for pt, sq in facts.enemies):
            errors.append("false spanish bishop")
    fian = re.search(rf"behind the fianchetto bishop on ({SQUARE})", note)
    if fian:
        sq = chess.parse_square(fian.group(1))
        occ = facts.after.piece_at(sq)
        if occ is None or occ.color != color or occ.piece_type != chess.BISHOP or sq not in (chess.G2, chess.G7):
            errors.append("false fianchetto bishop")
        allow(sq)
    for match in re.finditer(rf"with the ((?:light-squared|dark-squared) bishop|{PIECE_WORD}) on ({SQUARE})", note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        occ = facts.after.piece_at(sq)
        if occ is None or occ.color != color or not _kind_matches(occ, sq, want):
            errors.append(f"false with-piece {match.group(2)}")
        allow(sq)
    wing = re.search(rf"on the (same|opposite) wing (?:as|from) the king on ({SQUARE})", note)
    if wing:
        sq = chess.parse_square(wing.group(2))
        enemy_king = facts.after.king(not color)
        same = (chess.square_file(facts.to) > 3) == (chess.square_file(sq) > 3)
        if enemy_king != sq or facts.before.is_castling(move) is False:
            errors.append("false wing king")
        elif wing.group(1) == "same" and not same:
            errors.append("not the same wing")
        elif wing.group(1) == "opposite" and same:
            errors.append("not the opposite wing")
        allow(sq)
    for match in re.finditer(rf"facing the ((?:light-squared|dark-squared) bishop|{PIECE_WORD}) on ({SQUARE})", note):
        want, sq = match.group(1), chess.parse_square(match.group(2))
        occ = facts.after.piece_at(sq)
        if occ is None or occ.color == color or not _kind_matches(occ, sq, want):
            errors.append(f"false facing {match.group(2)}")
        allow(sq)
    for match in re.finditer(rf"and the ((?:light-squared|dark-squared) bishop|{PIECE_WORD}) on ({SQUARE})", note):
        if "facing the" not in note:
            continue
        want, sq = match.group(1), chess.parse_square(match.group(2))
        if want == "pawn":
            continue
        occ = facts.after.piece_at(sq)
        if occ is None or not _kind_matches(occ, sq, want):
            errors.append(f"false and-piece {match.group(2)}")
        allow(sq)
    beside_rook = re.search(rf"beside the rook on ({SQUARE})", note)
    if beside_rook:
        sq = chess.parse_square(beside_rook.group(1))
        occ = facts.after.piece_at(sq)
        if facts.pt != chess.QUEEN or occ is None or occ.color != color or occ.piece_type != chess.ROOK or chess.square_file(sq) != chess.square_file(facts.to) or abs(chess.square_rank(sq) - chess.square_rank(facts.to)) != 1:
            errors.append("false beside rook")
        allow(sq)
    beside_king = re.search(rf"beside the king on ({SQUARE})", note)
    if beside_king:
        sq = chess.parse_square(beside_king.group(1))
        king = facts.after.king(color)
        near = king is not None and abs(chess.square_file(king) - chess.square_file(facts.to)) <= 1 and abs(chess.square_rank(king) - chess.square_rank(facts.to)) <= 1
        if facts.pt != chess.BISHOP or king != sq or not near:
            errors.append("false beside king")
        allow(sq)
    diag_king = re.search(rf"diagonal of the king on ({SQUARE})", note)
    if diag_king:
        sq = chess.parse_square(diag_king.group(1))
        enemy_king = facts.after.king(not color)
        if facts.pt != chess.BISHOP or enemy_king != sq or not diagonal(facts.to, sq):
            errors.append("false king diagonal")
        allow(sq)
    towards = re.search(rf"towards the king on ({SQUARE})", note)
    if towards:
        sq = chess.parse_square(towards.group(1))
        enemy_king = facts.after.king(not color)
        near = enemy_king is not None and any(
            facts.after.piece_at(target) is None
            and max(abs(chess.square_file(target) - chess.square_file(sq)), abs(chess.square_rank(target) - chess.square_rank(sq))) <= 1
            for target in facts.after.attacks(facts.to)
        )
        if facts.pt != chess.BISHOP or enemy_king != sq or not near:
            errors.append("false towards king")
        allow(sq)
    defended = re.search(rf"which defends the pawn on ({SQUARE})", note)
    if defended:
        sq = chess.parse_square(defended.group(1))
        occ = facts.after.piece_at(sq)
        holder = next((piece_sq for pt, piece_sq in facts.enemies if defended_centre_pawn(facts, piece_sq) == sq), None)
        if occ is None or occ.piece_type != chess.PAWN or occ.color == color or holder is None:
            errors.append("false defended pawn")
        allow(sq)
    body = note[len(san):]
    mentioned = set(re.findall(SQUARE, body))
    unknown = mentioned - allowed
    if unknown:
        errors.append(f"unchecked squares {sorted(unknown)}")
    return errors
