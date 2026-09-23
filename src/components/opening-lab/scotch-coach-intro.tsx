import { useEffect, useRef, useState } from "react";
import {
  SCOTCH_COACH_BEATS,
  SCOTCH_COACH_TITLE,
  scotchCoachBeatIndex,
} from "@/lib/scotch-coach";
import {
  setScotchCoachNarrationMuted,
  startScotchCoachNarration,
  stopScotchCoachNarration,
  subscribeScotchCoachMouth,
} from "@/lib/scotch-coach-audio";
import { useT } from "@/lib/i18n";

/** Rises out of the board, then sits with the Opening Lab mug. Decorative. */
export function ScotchCoachFigure() {
  const mouthRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    return subscribeScotchCoachMouth((open) => {
      const mouth = mouthRef.current;
      if (!mouth) return;
      const jaw = open < 0.04 ? 0.07 : 0.07 + open * 0.93;
      mouth.style.setProperty("--mouth", jaw.toFixed(3));
      mouth.dataset.open = open > 0.12 ? "true" : "false";
    });
  }, []);

  return (
    <div className="scotch-coach-stage" aria-hidden="true">
      <div className="scotch-coach-figure">
        <img
          src="/scotch-coach/coach-seated-v2.png"
          alt=""
          width={640}
          height={1071}
          draggable={false}
        />
        {/* Shape over the drawn mouth. Volume opens it; silence keeps it shut. */}
        <span
          ref={mouthRef}
          className="scotch-coach-mouth"
          data-scotch-coach-mouth
          data-open="false"
          style={{ ["--mouth" as string]: "0.07" }}
        />
      </div>
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
  const [muted, setMuted] = useState(false);
  const text = SCOTCH_COACH_BEATS[beat] ?? SCOTCH_COACH_BEATS[0];
  const last = beat >= SCOTCH_COACH_BEATS.length - 1;

  useEffect(() => {
    const audio = startScotchCoachNarration();
    if (!audio) return;
    const sync = () => {
      const index = scotchCoachBeatIndex(audio.currentTime, audio.duration);
      setBeat((current) => (index > current ? index : current));
    };
    const onNarrationEnded = () => {
      setBeat(SCOTCH_COACH_BEATS.length - 1);
    };
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("ended", onNarrationEnded);
    return () => {
      audio.removeEventListener("timeupdate", sync);
      audio.removeEventListener("ended", onNarrationEnded);
    };
  }, []);

  useEffect(() => {
    setScotchCoachNarrationMuted(muted);
  }, [muted]);

  const leave = () => {
    stopScotchCoachNarration();
    onDone();
  };

  return (
    <div
      className="scotch-coach-card"
      data-scotch-coach
      data-scotch-coach-beat={beat}
      role="region"
      aria-label={t("Scotch coach")}
    >
      <p className="scotch-coach-kicker">{t(SCOTCH_COACH_TITLE)}</p>
      <p key={beat} className="scotch-coach-beat" data-scotch-coach-line aria-live="polite">
        {t(text)}
      </p>
      <div className="scotch-coach-actions">
        <button
          type="button"
          className="scotch-coach-mute"
          data-scotch-coach-mute
          aria-pressed={muted}
          onClick={() => setMuted((value) => !value)}
        >
          {muted ? t("Unmute") : t("Mute")}
        </button>
        <button type="button" className="scotch-coach-skip" data-scotch-coach-skip onClick={leave}>
          {t("Skip")}
        </button>
        <button
          type="button"
          className="scotch-coach-next"
          data-scotch-coach-next
          onClick={() => {
            if (last) leave();
            else setBeat((n) => Math.min(SCOTCH_COACH_BEATS.length - 1, n + 1));
          }}
        >
          {last ? t("Practice") : t("Next")}
        </button>
      </div>
    </div>
  );
}
