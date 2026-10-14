"""Unit tests for the purpose-square exemptions in verify_hand_note."""

import importlib.util
import unittest
from pathlib import Path

import chess

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("bcn", ROOT / "scripts" / "build-coach-notes.py")
bcn = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bcn)


def board_after(moves: list[str]) -> chess.Board:
    board = chess.Board()
    for san in moves:
        board.push_san(san)
    return board


class VerifyHandNoteExemptions(unittest.TestCase):
    def test_future_square_passes_when_the_mover_attacks_it(self):
        board = board_after(["d4", "Nf6"])
        errors = bcn.verify_hand_note(
            board,
            "c4",
            "c4 fights for d5, so Black cannot easily put a pawn there.",
            ["g6", "Nc3", "d5"],
            ["d4", "Nf6", "c4"],
        )
        self.assertFalse(any(error.startswith("future") for error in errors), errors)

    def test_future_square_fails_when_the_mover_does_not_attack_it(self):
        board = board_after(["d4", "Nf6"])
        errors = bcn.verify_hand_note(
            board,
            "c4",
            "c4 fights for h5.",
            ["h5"],
            ["d4", "Nf6", "c4"],
        )
        self.assertIn("future h5", errors)

    def test_future_piece_move_still_fails(self):
        board = board_after(["d4", "Nf6"])
        errors = bcn.verify_hand_note(
            board,
            "c4",
            "c4 prepares Nf3.",
            ["Nf3"],
            ["d4", "Nf6", "c4"],
        )
        self.assertIn("future Nf3", errors)

    def test_keeps_free_allows_an_empty_square_the_mover_does_not_attack(self):
        board = board_after(["e4", "e5"])
        errors = bcn.verify_hand_note(
            board,
            "Be2",
            "Be2 develops the light-squared bishop and keeps g5 free.",
            [],
            ["e4", "e5", "Be2"],
        )
        self.assertEqual(errors, [])

    def test_keeps_open_allows_an_empty_square_the_mover_does_not_attack(self):
        board = board_after(["e4", "e5"])
        errors = bcn.verify_hand_note(
            board,
            "Be2",
            "Be2 develops the light-squared bishop and keeps g5 open.",
            [],
            ["e4", "e5", "Be2"],
        )
        self.assertEqual(errors, [])

    def test_keeps_free_does_not_excuse_a_different_empty_square(self):
        board = board_after(["e4", "e5"])
        errors = bcn.verify_hand_note(
            board,
            "Be2",
            "Be2 develops the light-squared bishop and keeps g5 free, with h4 in mind.",
            [],
            ["e4", "e5", "Be2"],
        )
        self.assertIn("loose square h4", errors)
        self.assertNotIn("loose square g5", errors)

    def test_keeps_free_does_not_hide_a_future_book_move(self):
        board = board_after(["e4", "e5"])
        errors = bcn.verify_hand_note(
            board,
            "Be2",
            "Be2 develops the light-squared bishop and keeps g5 free.",
            ["g5"],
            ["e4", "e5", "Be2"],
        )
        self.assertIn("future g5", errors)
        self.assertNotIn("loose square g5", errors)

    def test_drop_back_allows_an_empty_square_the_mover_does_not_attack(self):
        board = chess.Board()
        errors = bcn.verify_hand_note(
            board,
            "e4",
            "e4 takes space and the bishop can drop back to a3.",
            [],
            ["e4"],
        )
        self.assertEqual(errors, [])

    def test_empty_square_without_an_exemption_is_still_loose(self):
        board = chess.Board()
        errors = bcn.verify_hand_note(
            board,
            "e4",
            "e4 takes space and looks towards a3.",
            [],
            ["e4"],
        )
        self.assertIn("loose square a3", errors)


if __name__ == "__main__":
    unittest.main()
