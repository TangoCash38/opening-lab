import { useEffect, useMemo, useRef, useState } from "react";
import {
  COACH_PACKS,
  COACH_TEXT_BEAT_SEC,
  type CoachPackConfig,
  coachAudioBeatIndex,
  coachIntroAlreadySeen,
  coachLineAlreadySeen,
  lineBeatAtSec,
} from "@/lib/coach-packs";
import {
  SCOTCH_CANAL_BEATS,
  SCOTCH_CANAL_TITLE,
  SCOTCH_COACH_BEATS,
  SCOTCH_COACH_NAME,
  SCOTCH_COACH_NARRATION_FALLBACK_SEC,
  SCOTCH_COACH_TITLE,
  SCOTCH_PACK_ID,
  scotchCanalBeatIndex,
  scotchCanalCoachAlreadySeen,
  scotchCoachAlreadySeen,
  scotchCoachBeatIndex,
} from "@/lib/scotch-coach";
import {
  setScotchCoachNarrationMuted,
  startCoachPackNarration,
  startScotchCanalNarration,
  startScotchCoachNarration,
  stopScotchCoachNarration,
} from "@/lib/scotch-coach-audio";
import { useI18n, useT } from "@/lib/i18n";

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

export type CoachDoneReason = "skip" | "done";
type CoachDone = (reason?: CoachDoneReason) => void;

/**
 * One completion per card. The clip ending and the Practice button can both
 * fire; the second one must not run, or it stops the line talk that the
 * first completion just opened.
 */
function useOnceCoachLeave(onDone: CoachDone): CoachDone {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const leaveRef = useRef<CoachDone | null>(null);
  if (!leaveRef.current) {
    let left = false;
    leaveRef.current = (reason: CoachDoneReason = "done") => {
      if (left) return;
      left = true;
      stopScotchCoachNarration();
      onDoneRef.current(reason);
    };
  }
  return leaveRef.current;
}

type CardProps = {
  onDone: CoachDone;
  /** Cuppa intro, the Line 1 (sg1) pack-recipe talk, or another pack's first line. */
  talk?: "intro" | "canal" | "line";
  /** Set for a per-pack talk. Scotch keeps the cuppa and Canal cards. */
  packId?: string;
  /** Text-only and future audio talks report the beat so the board can play it. */
  onBeat?: (beat: number) => void;
};

type FrameProps = {
  talk: "intro" | "canal" | "line";
  title: string;
  beat: number;
  text: string;
  last: boolean;
  muted: boolean;
  /** Text-only talks have no recording, so they hide Mute. */
  textOnly?: boolean;
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
  textOnly = false,
  onMute,
  onSkip,
  onNext,
}: FrameProps) {
  const { t, lang } = useI18n();
  return (
    <div
      className="scotch-coach-card"
      data-scotch-coach
      data-scotch-coach-talk={talk}
      data-scotch-coach-beat={beat}
      data-coach-text-only={textOnly ? "true" : undefined}
      role="region"
      aria-label={t(SCOTCH_COACH_NAME)}
    >
      <p className="scotch-coach-name" id="scotch-coach-name" data-scotch-coach-name>
        {t(SCOTCH_COACH_NAME)}
      </p>
      {textOnly || lang === "en" ? null : (
        <p className="scotch-coach-voice" data-coach-voice-note>
          {t("Voice in English")}
        </p>
      )}
      <p className="scotch-coach-kicker">{t(title)}</p>
      <p key={beat} className="scotch-coach-beat" data-scotch-coach-line aria-live="polite">
        {t(text)}
      </p>
      <div className="scotch-coach-actions">
        {textOnly ? null : (
          <button
            type="button"
            className="scotch-coach-mute"
            data-scotch-coach-mute
            aria-pressed={muted}
            onClick={onMute}
          >
            {muted ? t("Unmute") : t("Mute")}
          </button>
        )}
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

type PackTalk = "intro" | "line";

/**
 * Captions with no recording. Next moves on, and each beat also dwells for
 * COACH_TEXT_BEAT_SEC. There is no Mute control. The last beat starts Practice.
 */
function TextOnlyCoachCard({
  talk,
  title,
  captions,
  onDone,
  onBeat,
}: {
  talk: PackTalk;
  title: string;
  captions: readonly string[];
  onDone: CoachDone;
  onBeat?: (beat: number) => void;
}) {
  const [beat, setBeat] = useState(0);
  const leave = useOnceCoachLeave(onDone);
  const leaveRef = useRef(leave);
  leaveRef.current = leave;
  const onBeatRef = useRef(onBeat);
  onBeatRef.current = onBeat;
  const text = captions[beat] ?? captions[0] ?? "";
  const last = beat >= captions.length - 1;

  useEffect(() => {
    onBeatRef.current?.(beat);
  }, [beat]);

  useEffect(() => {
    const delay = COACH_TEXT_BEAT_SEC * 1000;
    const id = window.setTimeout(() => {
      if (last) leaveRef.current();
      else setBeat((n) => Math.min(captions.length - 1, n + 1));
    }, delay);
    return () => window.clearTimeout(id);
  }, [beat, last, captions.length]);

  return (
    <CoachCardFrame
      talk={talk}
      title={title}
      beat={beat}
      text={text}
      last={last}
      muted={false}
      textOnly
      onMute={() => {}}
      onSkip={() => leave("skip")}
      onNext={() => {
        if (last) leave();
        else setBeat((n) => Math.min(captions.length - 1, n + 1));
      }}
    />
  );
}

/**
 * Recording for a pack that is not the Scotch cuppa / Canal clips.
 * Beat timings (`atSec`) advance the captions. Without timings, equal slices.
 * The board follows `onBeat`, so a new mp3 only needs the path and timings.
 */
function AudioPackCoachCard({
  kind,
  mp3,
  ogg,
  title,
  captions,
  atSec,
  fallbackSec,
  talk,
  onDone,
  onBeat,
}: {
  kind: string;
  mp3: string;
  ogg?: string;
  title: string;
  captions: readonly string[];
  atSec: readonly number[] | undefined;
  fallbackSec: number;
  talk: PackTalk;
  onDone: CoachDone;
  onBeat?: (beat: number) => void;
}) {
  const [beat, setBeat] = useState(0);
  const [muted, setMuted] = useState(false);
  const leave = useOnceCoachLeave(onDone);
  const leaveRef = useRef(leave);
  leaveRef.current = leave;
  const onBeatRef = useRef(onBeat);
  onBeatRef.current = onBeat;
  const text = captions[beat] ?? captions[0] ?? "";
  const last = beat >= captions.length - 1;

  useEffect(() => {
    onBeatRef.current?.(beat);
  }, [beat]);

  useEffect(() => {
    let finished = false;
    const finishTalk = () => {
      if (finished) return;
      finished = true;
      setBeat(Math.max(0, captions.length - 1));
      leaveRef.current();
    };
    const audio = startCoachPackNarration(mp3, ogg ?? null, kind);
    const backup = window.setTimeout(finishTalk, (fallbackSec + 1.2) * 1000);
    if (!audio) return () => window.clearTimeout(backup);
    const sync = () => {
      const index = coachAudioBeatIndex(
        atSec,
        audio.currentTime,
        audio.duration,
        captions.length,
        fallbackSec,
      );
      setBeat((current) => (index > current ? index : current));
    };
    const onClipEnded = () => finishTalk();
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener(
      "ended",
      onClipEnded,
    );
    return () => {
      window.clearTimeout(backup);
      audio.removeEventListener("timeupdate", sync);
      audio.removeEventListener("ended", onClipEnded);
    };
  }, [atSec, captions.length, fallbackSec, kind, mp3, ogg]);

  useEffect(() => {
    setScotchCoachNarrationMuted(muted);
  }, [muted]);

  return (
    <CoachCardFrame
      talk={talk}
      title={title}
      beat={beat}
      text={text}
      last={last}
      muted={muted}
      onMute={() => setMuted((value) => !value)}
      onSkip={() => leave("skip")}
      onNext={() => {
        if (last) leave();
        else setBeat((n) => Math.min(captions.length - 1, n + 1));
      }}
    />
  );
}

function PackCoachCard({
  packId,
  config,
  talk,
  onDone,
  onBeat,
}: {
  packId: string;
  config: CoachPackConfig;
  talk: PackTalk;
  onDone: CoachDone;
  onBeat?: (beat: number) => void;
}) {
  const audio = talk === "intro" ? config.introAudio : config.firstLineAudio;
  const title = talk === "intro" ? config.introTitle : config.firstLineTitle;
  const captions =
    talk === "intro" ? config.introBeats : config.firstLineBeats.map((beat) => beat.caption);
  const atSec = useMemo(
    () => (talk === "intro" ? config.introBeatAtSec : lineBeatAtSec(config.firstLineBeats)),
    [config, talk],
  );
  const fallback =
    (talk === "intro" ? config.introAudioFallbackSec : config.firstLineAudioFallbackSec) ??
    Math.max(1, captions.length) * COACH_TEXT_BEAT_SEC;
  if (!audio) {
    return (
      <TextOnlyCoachCard
        talk={talk}
        title={title}
        captions={captions}
        onDone={onDone}
        onBeat={onBeat}
      />
    );
  }
  return (
    <AudioPackCoachCard
      kind={`${packId}:${talk}`}
      mp3={audio}
      ogg={talk === "intro" ? config.introAudioOgg : undefined}
      title={title}
      captions={captions}
      atSec={atSec}
      fallbackSec={fallback}
      talk={talk}
      onDone={onDone}
      onBeat={onBeat}
    />
  );
}

/** Cream history beats. Skip or the last beat hands off to the Line 1 talk. */
function ScotchCoachIntroCard({ onDone }: { onDone: CoachDone }) {
  const [beat, setBeat] = useState(0);
  const [muted, setMuted] = useState(false);
  const leave = useOnceCoachLeave(onDone);
  const leaveRef = useRef(leave);
  leaveRef.current = leave;
  const text = SCOTCH_COACH_BEATS[beat] ?? SCOTCH_COACH_BEATS[0];
  const last = beat >= SCOTCH_COACH_BEATS.length - 1;

  useEffect(() => {
    let finished = false;
    const finishIntro = () => {
      if (finished) return;
      finished = true;
      setBeat(SCOTCH_COACH_BEATS.length - 1);
      leaveRef.current();
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
      leaveRef.current();
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

  return (
    <CoachCardFrame
      talk="intro"
      title={SCOTCH_COACH_TITLE}
      beat={beat}
      text={text}
      last={last}
      muted={muted}
      onMute={() => setMuted((value) => !value)}
      onSkip={() => leave("skip")}
      onNext={() => {
        if (last) leave();
        else setBeat((n) => Math.min(SCOTCH_COACH_BEATS.length - 1, n + 1));
      }}
    />
  );
}

/**
 * Canal pack-recipe beats. professor-potato-pie-canal.mp3 advances them.
 * Mute, Skip, and Next still work. The last beat starts Practice.
 */
function ScotchCoachCanalCard({ onDone }: { onDone: CoachDone }) {
  const [beat, setBeat] = useState(0);
  const [muted, setMuted] = useState(false);
  const leave = useOnceCoachLeave(onDone);
  const leaveRef = useRef(leave);
  leaveRef.current = leave;
  const text = SCOTCH_CANAL_BEATS[beat] ?? SCOTCH_CANAL_BEATS[0];
  const last = beat >= SCOTCH_CANAL_BEATS.length - 1;

  useEffect(() => {
    let finished = false;
    const finishTalk = () => {
      if (finished) return;
      finished = true;
      setBeat(SCOTCH_CANAL_BEATS.length - 1);
      leaveRef.current();
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
      const index = scotchCanalBeatIndex(audio.currentTime, audio.duration);
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

  return (
    <CoachCardFrame
      talk="canal"
      title={SCOTCH_CANAL_TITLE}
      beat={beat}
      text={text}
      last={last}
      muted={muted}
      onMute={() => setMuted((value) => !value)}
      onSkip={() => leave("skip")}
      onNext={() => {
        if (last) leave();
        else setBeat((n) => Math.min(SCOTCH_CANAL_BEATS.length - 1, n + 1));
      }}
    />
  );
}

/** Cream plate / dock card. Talk picks the cuppa intro, the Canal pack recipe, or a per-pack talk. */
export function ScotchCoachCard({ onDone, talk = "intro", packId, onBeat }: CardProps) {
  const config = packId && packId !== SCOTCH_PACK_ID ? COACH_PACKS[packId] : undefined;
  if (packId && config && (talk === "intro" || talk === "line")) {
    return (
      <PackCoachCard
        packId={packId}
        config={config}
        talk={talk}
        onDone={onDone}
        onBeat={onBeat}
      />
    );
  }
  if (talk === "canal") return <ScotchCoachCanalCard onDone={onDone} />;
  return <ScotchCoachIntroCard onDone={onDone} />;
}

/**
 * Optional transcript after a Scotch talk has run this visit.
 * Shows whichever of the cuppa intro and the Canal talk already played.
 * In the page flow — not a modal over the board.
 */
export function ScotchCoachReading() {
  const { t, lang } = useI18n();
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
          {lang === "en" ? null : (
            <p className="scotch-coach-voice" data-coach-voice-note>
              {t("Voice in English")}
            </p>
          )}
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

/** Optional transcript for Opening Traps and Caro-Kann after those talks this visit. */
export function CoachPackReading({ packId }: { packId: string }) {
  const { t, lang } = useI18n();
  const config = COACH_PACKS[packId];
  const [open, setOpen] = useState(false);
  const [introSeen, setIntroSeen] = useState(false);
  const [lineSeen, setLineSeen] = useState(false);

  useEffect(() => {
    if (!config || packId === SCOTCH_PACK_ID) return;
    setIntroSeen(coachIntroAlreadySeen(packId));
    setLineSeen(coachLineAlreadySeen(packId, config.firstLineId));
  }, [config, packId]);

  if (!config || packId === SCOTCH_PACK_ID) return null;
  if (!introSeen && !lineSeen) return null;

  return (
    <div className="scotch-coach-reading" data-scotch-coach-reading data-coach-pack-reading={packId}>
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
          {lang === "en" ? null : (
            <p className="scotch-coach-voice" data-coach-voice-note>
              {t("Voice in English")}
            </p>
          )}
          {introSeen ? (
            <>
              <p className="scotch-coach-reading-title">{t(config.introTitle)}</p>
              {config.introBeats.map((beat) => (
                <p key={beat} className="scotch-coach-reading-beat">
                  {t(beat)}
                </p>
              ))}
            </>
          ) : null}
          {lineSeen ? (
            <>
              <p className="scotch-coach-reading-title">{t(config.firstLineTitle)}</p>
              {config.firstLineBeats.map((beat) => (
                <p key={beat.caption} className="scotch-coach-reading-beat">
                  {t(beat.caption)}
                </p>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
