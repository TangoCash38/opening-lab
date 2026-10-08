import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Chess } from "chess.js";
import { ChessBoard } from "./chess-board";

/** Final position of the book line. The finish card holds this still. */
function positionAfter(plies: readonly string[]): Chess {
  const game = new Chess();
  for (const san of plies) game.move(san);
  return game;
}

type Props = {
  name: string;
  plies: readonly string[];
  /** White at the bottom unless the line trains Black. */
  flip: boolean;
  text: string;
  onDone: () => void;
};

export function LineFinishNote({ name, plies, flip, text, onDone }: Props) {
  const [mounted, setMounted] = useState(false);
  const game = useMemo(() => positionAfter(plies), [plies]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !text.trim()) return null;

  const notice = (
    <div
      className="slav-notice"
      role="dialog"
      aria-modal="true"
      aria-labelledby="line-finish-title"
      data-line-finish-note
    >
      <div className="slav-intro-board" data-line-finish-board>
        <ChessBoard
          game={game}
          flip={flip}
          selected={null}
          wrongUntil={null}
          expected={null}
          showHints={false}
          lastMove={null}
          slide={null}
          onSlideComplete={() => {}}
          onSquare={() => {}}
          interactive={false}
        />
        <p className="slav-intro-caption" data-line-finish-caption>
          Where the line ends
        </p>
      </div>
      <div className="slav-notice-card">
        <div className="slav-notice-card-body">
          <p className="slav-notice-kicker">Line finished</p>
          <h2 id="line-finish-title" className="slav-notice-title">
            {name}
          </h2>
          <p className="slav-notice-paragraph" data-line-finish-text>
            {text}
          </p>
        </div>
        <button type="button" className="slav-notice-primary" data-line-finish-got-it onClick={onDone}>
          Got it
        </button>
      </div>
    </div>
  );

  return createPortal(notice, document.body);
}
