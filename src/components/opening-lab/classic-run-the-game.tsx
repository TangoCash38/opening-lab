import { useEffect, useMemo, useState } from "react";
import { coachAudioBeatIndex } from "@/lib/coach-packs";
import {
  CLASSIC_RUN_AUDIO,
  CLASSIC_RUN_BEATS,
  CLASSIC_RUN_FALLBACK_SEC,
  CLASSIC_RUN_KIND,
  classicRunMoves,
} from "@/lib/classic-run";
import { SCOTCH_COACH_NAME } from "@/lib/scotch-coach";
import {
  scotchCoachNarration,
  setScotchCoachNarrationMuted,
  startCoachPackNarration,
  stopScotchCoachNarration,
} from "@/lib/scotch-coach-audio";
import { useI18n } from "@/lib/i18n";
import { ScotchCoachBoard } from "./scotch-coach-board";
import { ScotchCoachFigure } from "./scotch-coach-intro";

/** Start Sean's clip in the click that opens Run the game, before paint. */
export function beginClassicRunNarration() {
  return startCoachPackNarration(CLASSIC_RUN_AUDIO, null, CLASSIC_RUN_KIND);
}

/**
 * Watch-only full-game replay. Captions follow the clip. The board plays each
 * SAN when the narration names it, from the start position.
 */
export function ClassicRunTheGame({
  frameCoords = false,
  onLeave,
}: {
  frameCoords?: boolean;
  onLeave: () => void;
}) {
  const { t, lang } = useI18n();
  const moves = useMemo(() => classicRunMoves(), []);
  const captions = useMemo(() => CLASSIC_RUN_BEATS.map((beat) => beat.caption), []);
  const atSec = useMemo(() => CLASSIC_RUN_BEATS.map((beat) => beat.atSec), []);
  const beatPlies = useMemo(() => moves.map((move) => move.ply), [moves]);
  const plyAtSec = useMemo(() => moves.map((move) => move.plyAtSec), [moves]);
  const [beat, setBeat] = useState(0);
  const [muted, setMuted] = useState(false);
  const text = captions[beat] ?? captions[0] ?? "";
  const last = beat >= captions.length - 1;

  useEffect(() => {
    const started = performance.now();
    beginClassicRunNarration();
    const sync = () => {
      const audio = scotchCoachNarration();
      let time = (performance.now() - started) / 1000;
      let duration = CLASSIC_RUN_FALLBACK_SEC;
      if (audio && !audio.paused && !audio.ended && audio.currentTime > 0.05) {
        time = audio.currentTime;
        if (Number.isFinite(audio.duration) && audio.duration > 0) duration = audio.duration;
      } else if (audio?.ended) {
        time =
          Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration
            : CLASSIC_RUN_FALLBACK_SEC;
        duration = time;
      }
      const index = coachAudioBeatIndex(
        atSec,
        time,
        duration,
        captions.length,
        CLASSIC_RUN_FALLBACK_SEC,
      );
      setBeat((current) => (index > current ? index : current));
    };
    sync();
    const id = window.setInterval(sync, 200);
    return () => {
      window.clearInterval(id);
      stopScotchCoachNarration();
    };
  }, [atSec, captions.length]);

  useEffect(() => {
    setScotchCoachNarrationMuted(muted);
  }, [muted]);

  const seekTo = (index: number) => {
    const audio = scotchCoachNarration();
    const at = atSec[index] ?? 0;
    if (audio) {
      try {
        audio.currentTime = at;
      } catch {
        /* metadata may not be ready */
      }
    }
    setBeat(index);
  };

  return (
    <div className="classic-run-dock" data-classic-run="live">
      <div className="scotch-coach-plate" data-scotch-coach-plate>
        <ScotchCoachFigure />
        <div
          className="scotch-coach-card"
          data-scotch-coach
          data-scotch-coach-talk="line"
          data-scotch-coach-beat={beat}
          role="region"
          aria-label={t(SCOTCH_COACH_NAME)}
        >
          <p className="scotch-coach-name" data-scotch-coach-name>
            {t(SCOTCH_COACH_NAME)}
          </p>
          {lang === "en" ? null : (
            <p className="scotch-coach-voice" data-coach-voice-note>
              {t("Voice in English")}
            </p>
          )}
          <p className="scotch-coach-kicker">{t("King's Indian Attack vs Sicilian")}</p>
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
            <button type="button" className="scotch-coach-skip" data-scotch-coach-skip onClick={onLeave}>
              {t("Skip")}
            </button>
            <button
              type="button"
              className="scotch-coach-next"
              data-scotch-coach-next
              onClick={() => {
                if (last) onLeave();
                else seekTo(Math.min(captions.length - 1, beat + 1));
              }}
            >
              {last ? t("Practice") : t("Next")}
            </button>
          </div>
        </div>
      </div>
      <div className="home-board pointer-events-none">
        <ScotchCoachBoard
          talk="line"
          beatPlies={beatPlies}
          plyAtSec={plyAtSec}
          plyFallbackSec={CLASSIC_RUN_FALLBACK_SEC}
          flip={false}
          frameCoords={frameCoords}
        />
      </div>
    </div>
  );
}
