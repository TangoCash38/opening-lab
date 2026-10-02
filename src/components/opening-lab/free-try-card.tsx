import { useEffect, useMemo, useRef, useState } from "react";
import { PRICE_BUY_ALL, PRICE_PACK } from "@/data/pricing";
import {
  coachAudioBeatIndex,
  coachPack,
  lineBeatAtSec,
} from "@/lib/coach-packs";
import { SCOTCH_COACH_NAME } from "@/lib/scotch-coach";
import {
  scotchCoachNarration,
  setScotchCoachNarrationMuted,
  startCoachPackNarration,
  stopScotchCoachNarration,
} from "@/lib/scotch-coach-audio";

const FREE_TRY_AUDIO_KIND = "opening-traps:free-try";

type CardProps = {
  onBuyAll: () => void;
  onPickPack: () => void;
  onMoreFree: () => void;
  onTryAgain: () => void;
  onFeedback: () => void;
};

/** End-of-line card. Stays on this board. Prices come from pricing.ts. */
export function FreeTryCard({ onBuyAll, onPickPack, onMoreFree, onTryAgain, onFeedback }: CardProps) {
  return (
    <div
      className="absolute inset-x-0 top-0 z-30 px-1"
      data-free-try-card
      role="dialog"
      aria-modal="true"
      aria-labelledby="free-try-title"
    >
      <div className="w-full rounded-2xl border-[1.5px] border-accent/30 bg-bg-elevated p-3 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-2.5">
          <img
            src="/scotch-coach/coach-seated-v2.png"
            alt={SCOTCH_COACH_NAME}
            width={640}
            height={1071}
            className="h-16 w-auto shrink-0 object-contain object-bottom"
            draggable={false}
          />
          <div className="min-w-0 pt-0.5">
            <h2 id="free-try-title" className="font-display text-[1.05rem] font-bold leading-snug">
              That was Legal’s Mate.
            </h2>
            <p className="mt-0.5 text-[0.82rem] leading-snug text-fg-muted">
              Wrong moves get rejected. That’s the gym.
            </p>
          </div>
        </div>
        <button
          type="button"
          data-free-try-buy-all
          onClick={onBuyAll}
          className="mt-3 min-h-11 w-full rounded-2xl bg-accent px-3 py-2.5 text-[0.92rem] font-bold text-accent-fg active:scale-[0.99]"
        >
          {`Buy all packs · ${PRICE_BUY_ALL}`}
        </button>
        <p className="mt-1 text-center text-[0.72rem] leading-snug text-fg-muted">
          Every pack now, plus any we add later.
        </p>
        <button
          type="button"
          data-free-try-pick-pack
          onClick={onPickPack}
          className="mt-2 min-h-11 w-full rounded-2xl bg-accent px-3 py-2.5 text-[0.92rem] font-bold text-accent-fg active:scale-[0.99]"
        >
          {`Pick a pack from ${PRICE_PACK}`}
        </button>
        <button
          type="button"
          data-free-try-more-free
          onClick={onMoreFree}
          className="mt-2 min-h-11 w-full rounded-2xl bg-accent px-3 py-2.5 text-[0.92rem] font-bold text-accent-fg active:scale-[0.99]"
        >
          More free drills
        </button>
        <button
          type="button"
          data-free-try-again
          onClick={onTryAgain}
          className="mt-2 min-h-11 w-full rounded-2xl border-[1.5px] border-fg/15 bg-bg px-3 py-2.5 text-[0.92rem] font-bold text-fg active:scale-[0.99]"
        >
          Try again
        </button>
        <button
          type="button"
          data-free-try-feedback
          onClick={onFeedback}
          className="mt-1.5 block w-full bg-transparent py-1 text-center text-[0.75rem] font-semibold text-fg-muted underline decoration-fg-subtle underline-offset-2"
        >
          Leave feedback
        </button>
      </div>
    </div>
  );
}

/**
 * Professor Potato Pie talks while Legal’s Mate is played.
 * Uses the existing line recording. Skip voice stays on screen.
 * The practice board follows the spoken moves until Skip or the clip ends.
 */
export function FreeTryVoice({ onDemoEnd }: { onDemoEnd?: () => void }) {
  const coach = coachPack("opening-traps");
  const beats = coach?.firstLineBeats ?? [];
  const captions = useMemo(() => beats.map((beat) => beat.caption), [beats]);
  const atSec = useMemo(() => lineBeatAtSec(beats), [beats]);
  const [beat, setBeat] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const text = captions[beat] ?? "";
  const onDemoEndRef = useRef(onDemoEnd);
  onDemoEndRef.current = onDemoEnd;

  useEffect(() => {
    if (skipped) return;
    const mp3 = coach?.firstLineAudio;
    if (!mp3) return;
    const audio =
      scotchCoachNarration() ??
      startCoachPackNarration(mp3, null, FREE_TRY_AUDIO_KIND);
    if (!audio) return;
    setScotchCoachNarrationMuted(false);
    const sync = () => {
      const index = coachAudioBeatIndex(
        atSec,
        audio.currentTime,
        audio.duration,
        captions.length,
        coach?.firstLineAudioFallbackSec ?? 1,
      );
      setBeat(index);
    };
    const finish = () => {
      sync();
      onDemoEndRef.current?.();
    };
    sync();
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("ended", finish);
    return () => {
      audio.removeEventListener("timeupdate", sync);
      audio.removeEventListener("ended", finish);
    };
  }, [atSec, captions.length, coach, skipped]);

  const skipVoice = () => {
    stopScotchCoachNarration();
    setSkipped(true);
    onDemoEndRef.current?.();
  };

  return (
    <div className="free-try-voice" data-free-try-voice>
      <span className="free-try-voice-figure-wrap">
        <img
          className="free-try-voice-figure"
          src={coach?.portrait ?? "/scotch-coach/coach-seated-v2.png"}
          alt={coach?.coachName ?? SCOTCH_COACH_NAME}
          width={640}
          height={1071}
          draggable={false}
        />
      </span>
      <p className="free-try-voice-line" data-free-try-caption aria-live="polite">
        {text}
      </p>
      <button
        type="button"
        className="free-try-voice-skip"
        data-skip-voice
        onClick={skipVoice}
        disabled={skipped}
      >
        Skip voice
      </button>
    </div>
  );
}
