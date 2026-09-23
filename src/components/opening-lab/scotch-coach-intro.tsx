import { useState } from "react";
import { SCOTCH_COACH_BEATS } from "@/lib/scotch-coach";
import { useT } from "@/lib/i18n";

/** Rises out of the board, then sits with the Opening Lab mug. Decorative. */
export function ScotchCoachFigure() {
  return (
    <div className="scotch-coach-stage" aria-hidden="true">
      <img
        className="scotch-coach-figure"
        src="/scotch-coach/coach-seated-v2.png"
        alt=""
        width={640}
        height={1071}
        draggable={false}
      />
    </div>
  );
}

type CardProps = {
  onDone: () => void;
};

/** Cream history beats. Skip or the last beat starts book Practice. */
export function ScotchCoachCard({ onDone }: CardProps) {
  const t = useT();
  const [beat, setBeat] = useState(0);
  const text = SCOTCH_COACH_BEATS[beat] ?? SCOTCH_COACH_BEATS[0];
  const last = beat >= SCOTCH_COACH_BEATS.length - 1;

  return (
    <div
      className="scotch-coach-card"
      data-scotch-coach
      data-scotch-coach-beat={beat}
      role="region"
      aria-label={t("Scotch coach")}
    >
      <p className="scotch-coach-kicker">{t("Scotch Gambit")}</p>
      <p key={beat} className="scotch-coach-beat" data-scotch-coach-line>
        {t(text)}
      </p>
      <div className="scotch-coach-actions">
        <button
          type="button"
          className="scotch-coach-skip"
          data-scotch-coach-skip
          onClick={onDone}
        >
          {t("Skip")}
        </button>
        <button
          type="button"
          className="scotch-coach-next"
          data-scotch-coach-next
          onClick={() => {
            if (last) onDone();
            else setBeat((n) => n + 1);
          }}
        >
          {last ? t("Practice") : t("Next")}
        </button>
      </div>
    </div>
  );
}
