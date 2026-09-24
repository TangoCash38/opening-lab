import { useEffect, useRef, useState } from "react";
import {
  SCOTCH_CANAL_BEATS,
  SCOTCH_CANAL_TITLE,
  SCOTCH_COACH_BEATS,
  SCOTCH_COACH_NAME,
  SCOTCH_COACH_NARRATION_FALLBACK_SEC,
  SCOTCH_COACH_TITLE,
  scotchCanalCoachAlreadySeen,
  scotchCoachAlreadySeen,
  scotchCoachBeatIndex,
} from "@/lib/scotch-coach";
import {
  setScotchCoachNarrationMuted,
  startScotchCanalNarration,
  startScotchCoachNarration,
  stopScotchCoachNarration,
} from "@/lib/scotch-coach-audio";
import { useT } from "@/lib/i18n";

/** Seated in the practice dock, left of the wood, with the Opening Lab mug. */
export function ScotchCoachFigure() {
  const t = useT();
  return (
    <div className="scotch-coach-stage">
      <img
        className="scotch-coach-figure"
        src="/scotch-coach/coach-seated-v2.png"
        alt={t(SCOTCH_COACH_NAME)}
        width={640}
        height={1071}
        draggable={false}
      />
    </div>
  );
}

type CardProps = {
  onDone: () => void;
  /** Cuppa intro, or the Canal Variation pack-recipe talk. */
  talk?: "intro" | "canal";
};

type FrameProps = {
  talk: "intro" | "canal";
  title: string;
  beat: number;
  text: string;
  last: boolean;
  muted: boolean;
  onMute: () => void;
  onSkip: () => void;
  onNext: () => void;
};

function CoachCardFrame({
  talk,
  title,
  beat,
  text,
  last,
  muted,
  onMute,
  onSkip,
  onNext,
}: FrameProps) {
  const t = useT();
  return (
    <div
      className="scotch-coach-card"
      data-scotch-coach
      data-scotch-coach-talk={talk}
      data-scotch-coach-beat={beat}
      role="region"
      aria-label={t(SCOTCH_COACH_NAME)}
    >
      <p className="scotch-coach-name" id="scotch-coach-name" data-scotch-coach-name>
        {t(SCOTCH_COACH_NAME)}
      </p>
      <p className="scotch-coach-kicker">{t(title)}</p>
      <p key={beat} className="scotch-coach-beat" data-scotch-coach-line aria-live="polite">
        {t(text)}
      </p>
      <div className="scotch-coach-actions">
        <button
          type="button"
          className="scotch-coach-mute"
          data-scotch-coach-mute
          aria-pressed={muted}
          onClick={onMute}
        >
          {muted ? t("Unmute") : t("Mute")}
        </button>
        <button type="button" className="scotch-coach-skip" data-scotch-coach-skip onClick={onSkip}>
          {t("Skip")}
        </button>
        <button type="button" className="scotch-coach-next" data-scotch-coach-next onClick={onNext}>
          {last ? t("Practice") : t("Next")}
        </button>
      </div>
    </div>
  );
}

/** Cream history beats. Skip or the last beat starts book Practice. */
function ScotchCoachIntroCard({ onDone }: { onDone: () => void }) {
  const [beat, setBeat] = useState(0);
  const [muted, setMuted] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const text = SCOTCH_COACH_BEATS[beat] ?? SCOTCH_COACH_BEATS[0];
  const last = beat >= SCOTCH_COACH_BEATS.length - 1;

  useEffect(() => {
    let finished = false;
    const finishIntro = () => {
      if (finished) return;
      finished = true;
      setBeat(SCOTCH_COACH_BEATS.length - 1);
      onDoneRef.current();
    };
    const audio = startScotchCoachNarration();
    const backup = window.setTimeout(
      finishIntro,
      (SCOTCH_COACH_NARRATION_FALLBACK_SEC + 1.2) * 1000,
    );
    if (!audio) return () => window.clearTimeout(backup);
    const sync = () => {
      const index = scotchCoachBeatIndex(audio.currentTime, audio.duration);
      setBeat((current) => (index > current ? index : current));
    };
    const onNarrationEnded = () => {
      setBeat(SCOTCH_COACH_BEATS.length - 1);
      onDoneRef.current();
    };
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("ended", onNarrationEnded);
    return () => {
      window.clearTimeout(backup);
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
    <CoachCardFrame
      talk="intro"
      title={SCOTCH_COACH_TITLE}
      beat={beat}
      text={text}
      last={last}
      muted={muted}
      onMute={() => setMuted((value) => !value)}
      onSkip={leave}
      onNext={() => {
        if (last) leave();
        else setBeat((n) => Math.min(SCOTCH_COACH_BEATS.length - 1, n + 1));
      }}
    />
  );
}

/**
 * Canal pack-recipe beats. Next and Skip work with or without Sean's file.
 * When the recording is ready, playback advances the beats and then starts Practice.
 */
function ScotchCoachCanalCard({ onDone }: { onDone: () => void }) {
  const [beat, setBeat] = useState(0);
  const [muted, setMuted] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const text = SCOTCH_CANAL_BEATS[beat] ?? SCOTCH_CANAL_BEATS[0];
  const last = beat >= SCOTCH_CANAL_BEATS.length - 1;

  useEffect(() => {
    let finished = false;
    const finishTalk = () => {
      if (finished) return;
      finished = true;
      setBeat(SCOTCH_CANAL_BEATS.length - 1);
      onDoneRef.current();
    };
    const audio = startScotchCanalNarration();
    if (!audio) return;
    let backup = 0;
    const armBackup = () => {
      if (backup) return;
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      backup = window.setTimeout(finishTalk, (audio.duration + 1.2) * 1000);
    };
    const sync = () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const index = scotchCoachBeatIndex(
        audio.currentTime,
        audio.duration,
        SCOTCH_CANAL_BEATS.length,
      );
      setBeat((current) => (index > current ? index : current));
    };
    const onCanalEnded = () => finishTalk();
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("ended", onCanalEnded);
    audio.addEventListener("loadedmetadata", armBackup);
    armBackup();
    return () => {
      if (backup) window.clearTimeout(backup);
      audio.removeEventListener("timeupdate", sync);
      audio.removeEventListener("ended", onCanalEnded);
      audio.removeEventListener("loadedmetadata", armBackup);
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
    <CoachCardFrame
      talk="canal"
      title={SCOTCH_CANAL_TITLE}
      beat={beat}
      text={text}
      last={last}
      muted={muted}
      onMute={() => setMuted((value) => !value)}
      onSkip={leave}
      onNext={() => {
        if (last) leave();
        else setBeat((n) => Math.min(SCOTCH_CANAL_BEATS.length - 1, n + 1));
      }}
    />
  );
}

/** Cream plate / dock card. Talk picks the cuppa intro or the Canal pack recipe. */
export function ScotchCoachCard({ onDone, talk = "intro" }: CardProps) {
  if (talk === "canal") return <ScotchCoachCanalCard onDone={onDone} />;
  return <ScotchCoachIntroCard onDone={onDone} />;
}

/**
 * Optional transcript after a Scotch talk has run this visit.
 * Shows whichever of the cuppa intro and the Canal talk already played.
 * In the page flow — not a modal over the board.
 */
export function ScotchCoachReading() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [introSeen, setIntroSeen] = useState(false);
  const [canalSeen, setCanalSeen] = useState(false);

  useEffect(() => {
    setIntroSeen(scotchCoachAlreadySeen());
    setCanalSeen(scotchCanalCoachAlreadySeen());
  }, []);

  if (!introSeen && !canalSeen) return null;

  return (
    <div className="scotch-coach-reading" data-scotch-coach-reading>
      <button
        type="button"
        className="scotch-coach-reading-toggle"
        data-scotch-coach-read
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? t("Hide the intro") : t("Read the intro")}
      </button>
      {open ? (
        <div className="scotch-coach-reading-body" data-scotch-coach-transcript>
          <p className="scotch-coach-reading-name">{t(SCOTCH_COACH_NAME)}</p>
          {introSeen ? (
            <>
              <p className="scotch-coach-reading-title">{t(SCOTCH_COACH_TITLE)}</p>
              {SCOTCH_COACH_BEATS.map((beat) => (
                <p key={beat} className="scotch-coach-reading-beat">
                  {t(beat)}
                </p>
              ))}
            </>
          ) : null}
          {canalSeen ? (
            <>
              <p className="scotch-coach-reading-title">{t(SCOTCH_CANAL_TITLE)}</p>
              {SCOTCH_CANAL_BEATS.map((beat) => (
                <p key={beat} className="scotch-coach-reading-beat">
                  {t(beat)}
                </p>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
