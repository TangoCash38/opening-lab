import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  SCOTCH_LESSON_AUDIO_SEC,
  SCOTCH_LESSON_INTRO_MP3,
  SCOTCH_LESSON_RETURN,
  SCOTCH_LESSON_SLUG,
  scotchLessonCaptions,
  scotchLessonCues,
} from "@/data/lessons/scotch-course";
import { PRICE_LESSON_SCOTCH } from "@/data/pricing";
import { useLessonCheckout } from "@/hooks/use-lesson-checkout";
import { captionIndexAt } from "@/lib/lesson-sync";
import { SCOTCH_COACH_NAME } from "@/lib/scotch-coach";
import {
  scotchCoachNarration,
  setScotchCoachNarrationMuted,
  startCoachPackNarration,
  stopScotchCoachNarration,
} from "@/lib/scotch-coach-audio";
import { useI18n, useT } from "@/lib/i18n";
import { LessonBoard } from "./lesson-board";
import { ScotchCoachFigure } from "./scotch-coach-intro";

const LESSON_AUDIO_KIND = "lesson-sgl1";

type Props = {
  title: string;
  note: string;
};

function startLessonAudio() {
  return startCoachPackNarration(SCOTCH_LESSON_INTRO_MP3, null, LESSON_AUDIO_KIND);
}

/**
 * Potato Pie seated on the cream plate. Captions and the board follow
 * intro.mp3 currentTime. Skip and Done stop the clip and the animation.
 */
export function LessonPlayer({ title, note }: Props) {
  const t = useT();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const checkout = useLessonCheckout(SCOTCH_LESSON_RETURN);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const caption = scotchLessonCaptions[captionIndex] ?? scotchLessonCaptions[0] ?? "";

  useEffect(() => {
    startLessonAudio();
    const tick = () => {
      const audio = scotchCoachNarration();
      const time = audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const duration =
        audio && Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : SCOTCH_LESSON_AUDIO_SEC;
      const next = captionIndexAt(time, duration, scotchLessonCaptions.length);
      setCaptionIndex((prev) => (prev === next ? prev : next));
      const playing = Boolean(audio && !audio.paused && !audio.ended);
      setListening((prev) => (prev === playing ? prev : playing));
      if (audio?.ended) setAtEnd(true);
    };
    tick();
    const id = window.setInterval(tick, 70);
    return () => {
      window.clearInterval(id);
      stopScotchCoachNarration();
    };
  }, []);

  const leave = () => {
    stopScotchCoachNarration();
    void navigate({ to: "/lessons/$courseId", params: { courseId: SCOTCH_LESSON_SLUG } });
  };

  const finish = () => {
    stopScotchCoachNarration();
    if (checkout.owned) {
      leave();
      return;
    }
    setAtEnd(true);
  };

  const showOffer = atEnd && !checkout.owned;

  const listen = () => {
    const audio = startLessonAudio();
    if (!audio) return;
    const pending = audio.play();
    if (pending) pending.catch(() => {});
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setScotchCoachNarrationMuted(next);
  };

  return (
    <div
      className="home-coach-practice lesson-player"
      data-lesson-player="sgl1"
      data-scotch-coach-dock
      data-lesson-offer-open={showOffer ? "true" : "false"}
    >
      <div className="scotch-coach-plate" data-scotch-coach-plate>
        <ScotchCoachFigure />
        <div
          className="scotch-coach-card"
          data-scotch-coach
          data-lesson-caption
          data-lesson-caption-index={captionIndex}
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
          <p className="scotch-coach-kicker">{t(title)}</p>
          <p className="scotch-coach-beat" data-lesson-caption-line aria-live="polite">
            {caption}
          </p>
          <div className="scotch-coach-actions">
            <button
              type="button"
              className="scotch-coach-mute"
              data-lesson-mute
              aria-pressed={muted}
              onClick={toggleMute}
            >
              {muted ? t("Unmute") : t("Mute")}
            </button>
            {listening || showOffer ? null : (
              <button
                type="button"
                className="scotch-coach-next"
                data-lesson-listen
                onClick={listen}
              >
                {t("Listen")}
              </button>
            )}
            <button type="button" className="scotch-coach-skip" data-lesson-skip onClick={leave}>
              {t("Skip")}
            </button>
            {showOffer ? null : (
              <button type="button" className="scotch-coach-next" data-lesson-done onClick={finish}>
                {t("Done")}
              </button>
            )}
          </div>
        </div>
      </div>
      {showOffer ? (
        <aside className="lesson-offer" data-lesson-offer>
          <p className="lesson-offer-kicker">{t("Lesson 1 is free")}</p>
          <h2 className="lesson-offer-title">{t("Scotch Gambit Lessons")}</h2>
          <p className="lesson-offer-copy">
            {t(
              "Lessons 2 and 3 are {price}. A separate lesson purchase — not part of a drill pack, and not included in Buy all.",
              { price: PRICE_LESSON_SCOTCH },
            )}
          </p>
          <div className="lesson-offer-actions">
            <button
              type="button"
              className="lessons-unlock"
              data-lesson-offer-buy
              disabled={checkout.busy}
              onClick={() => {
                void checkout.pay();
              }}
            >
              {t("Unlock the remaining lessons")} · {PRICE_LESSON_SCOTCH}
            </button>
            <button type="button" className="lesson-offer-later" data-lesson-offer-later onClick={leave}>
              {t("Back to lessons")}
            </button>
          </div>
          {checkout.error ? (
            <p className="lessons-error" role="alert">
              {checkout.error}
            </p>
          ) : null}
        </aside>
      ) : null}
      <div className="home-board">
        <LessonBoard cues={scotchLessonCues} />
      </div>
      <p className="lesson-teaching-note" data-lesson-note>
        {t(note)}
      </p>
    </div>
  );
}
