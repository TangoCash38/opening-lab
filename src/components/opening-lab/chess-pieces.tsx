/**
 * Chess pieces via official CBurnett SVGs (public domain / Lichess set).
 * Served as static assets so paths stay complete — no hand-broken silhouettes.
 */

const SRC: Record<string, string> = {
  P: "/pieces/wP.svg",
  R: "/pieces/wR.svg",
  N: "/pieces/wN.svg",
  B: "/pieces/wB.svg",
  Q: "/pieces/wQ.svg",
  K: "/pieces/wK.svg",
  p: "/pieces/bP.svg",
  r: "/pieces/bR.svg",
  n: "/pieces/bN.svg",
  b: "/pieces/bB.svg",
  q: "/pieces/bQ.svg",
  k: "/pieces/bK.svg",
};

const NAMES: Record<string, string> = {
  P: "white pawn",
  R: "white rook",
  N: "white knight",
  B: "white bishop",
  Q: "white queen",
  K: "white king",
  p: "black pawn",
  r: "black rook",
  n: "black knight",
  b: "black bishop",
  q: "black queen",
  k: "black king",
};

export function ChessPiece({
  code,
  className = "",
}: {
  code: string;
  className?: string;
}) {
  const src = SRC[code];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className={`chess-piece-img pointer-events-none select-none ${className}`}
    />
  );
}

export function pieceName(code: string) {
  return NAMES[code] ?? "piece";
}
