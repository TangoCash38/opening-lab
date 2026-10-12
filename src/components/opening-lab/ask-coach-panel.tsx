import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { coachLineIntro, coachLineNote } from "@/data/coach-notes";
import { askTheCoachClientEnabled } from "@/lib/ask-coach-flag";
import { coachIntroText } from "@/lib/ask-coach-mock";
import { coachPairHeading, coachSlides } from "@/lib/coach-slides";
import { useT } from "@/lib/i18n";

type UiMode = "learn" | "practice";

type Props = {
  packId: string;
  lineId: string;
  lineName: string;
  idea: string | null;
  plies: readonly string[];
  ply: number;
  /** Train view mode. learn is Practice, practice is Test. */
  uiMode: UiMode;
  started: boolean;
  finished: boolean;
  /** Book prompt such as "Play: Nf3". Empty while the intro is on screen. */
  prompt?: string;
  onPractice: () => void;
  onTest: () => void;
};

export function AskCoachPanel({
  packId,
  lineId,
  lineName,
  idea,
  plies,
  ply,
  uiMode,
  started,
  finished,
  prompt = "",
  onPractice,
  onTest,
}: Props) {
  const t = useT();
  const mode = uiMode === "learn" ? "practice" : "test";
  const phase = !started && uiMode === "learn" ? "intro" : finished ? "done" : mode === "test" ? "test" : "practice";
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const [slide, setSlide] = useState(0);
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  useEffect(() => {
    setNotes({});
    setRevealed(false);
    setSlide(0);
  }, [lineId]);

  useEffect(() => {
    const layout = panelRef.current?.closest<HTMLElement>(".train-embedded.train-layout--coach");
    if (!layout) return;
    let cancelled = false;
    const place = () => {
      if (cancelled) return;
      const header = document.querySelector(".app-header")?.getBoundingClientRect().height ?? 76;
      const top = layout.getBoundingClientRect().top + window.scrollY - header - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    };
    place();
    const frame = requestAnimationFrame(place);
    const later = window.setTimeout(place, 300);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(later);
    };
  }, [lineId]);

  useEffect(() => {
    setRevealed(false);
  }, [ply, mode]);

  useEffect(() => {
    if (phase === "intro" || ply < 1) return;
    setNotes((prev) => {
      let changed = false;
      const next = { ...prev };
      for (let i = 1; i <= ply; i += 1) {
        if (next[i]) continue;
        const text = coachLineNote(packId, lineId, i);
        if (!text) continue;
        next[i] = text;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [phase, ply, lineId, packId]);

  const slides = coachSlides(ply, phase === "done");
  const latest = Math.max(0, slides.length - 1);

  useEffect(() => {
    const next = coachSlides(ply, phase === "done");
    setSlide(Math.max(0, next.length - 1));
  }, [lineId, ply, phase]);

  if (!askTheCoachClientEnabled(packId)) return null;

  const intro = coachIntroText(lineName, coachLineIntro(packId, lineId) ?? idea);
  const nextBook = ply >= 0 && ply < plies.length ? plies[ply] : null;
  const index = Math.min(slide, latest);

  function go(delta: number) {
    setSlide((current) => Math.max(0, Math.min(latest, current + delta)));
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    swipe.current = { x: event.clientX, y: event.clientY, moved: false };
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy)) return;
    start.moved = true;
    go(dx < 0 ? 1 : -1);
  }

  return (
    <section
      ref={panelRef}
      className="ask-coach-panel"
      data-ask-coach-panel
      data-ask-coach-phase={phase}
      aria-label={lineName}
    >
      {prompt ? (
        <p className="ask-coach-prompt" data-ask-coach-prompt>
          {prompt}
        </p>
      ) : null}
      <div className="ask-coach-slider" data-ask-coach-feed>
        <div className="ask-coach-slider-row">
          <button
            type="button"
            className="ask-coach-arrow"
            data-coach-prev
            aria-label={t("Earlier")}
            disabled={index === 0}
            onClick={() => go(-1)}
          >
            <ArrowGlyph dir="prev" />
          </button>
          <div
            className="ask-coach-viewport"
            data-coach-viewport
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              swipe.current = null;
            }}
          >
            <div className="ask-coach-track" style={{ transform: `translateX(-${index * 100}%)` }} data-coach-slide={index}>
              {slides.map((item) => {
                if (item.kind === "intro") {
                  return (
                    <div key="intro" className="ask-coach-slide" data-coach-slide-kind="intro">
                      <p className="slav-notice-paragraph" data-ask-coach-intro>
                        {intro}
                      </p>
                      {phase === "intro" ? (
                        <button type="button" className="ask-coach-primary" data-ask-coach-practice onClick={onPractice}>
                          {t("Practice")}
                        </button>
                      ) : ply < 1 ? (
                        <p className="slav-notice-paragraph" data-ask-coach-wait>
                          {mode === "test"
                            ? t("Your move. The next book move stays hidden until you tap Show me.")
                            : t("Your move. I will explain each one here.")}
                        </p>
                      ) : null}
                    </div>
                  );
                }
                if (item.kind === "end") {
                  return (
                    <div key="end" className="ask-coach-slide" data-coach-slide-kind="end">
                      <div className="ask-coach-done" data-ask-coach-done>
                        <button type="button" className="ask-coach-primary" data-ask-coach-test onClick={onTest}>
                          {t("Test yourself")}
                        </button>
                      </div>
                    </div>
                  );
                }
                const heading = coachPairHeading(plies, item.index, item.blackPly);
                return (
                  <div key={item.whitePly} className="ask-coach-slide" data-coach-slide-kind="pair" data-coach-pair={item.index}>
                    <p className="ask-coach-pair-label">{heading}</p>
                    <NoteLine san={plies[item.whitePly - 1] ?? ""} ply={item.whitePly} text={notes[item.whitePly]} latest={item.whitePly === ply} />
                    {item.blackPly != null ? (
                      <NoteLine
                        san={plies[item.blackPly - 1] ?? ""}
                        ply={item.blackPly}
                        text={notes[item.blackPly]}
                        latest={item.blackPly === ply}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className="ask-coach-arrow"
            data-coach-next
            aria-label={t("Later")}
            disabled={index === latest}
            onClick={() => go(1)}
          >
            <ArrowGlyph dir="next" />
          </button>
        </div>
        <p className="ask-coach-count" data-coach-slide-count>
          {t("{n} of {m}", { n: index + 1, m: slides.length })}
        </p>
      </div>
      {phase === "test" && nextBook ? (
        revealed ? (
          <p className="ask-coach-book" data-ask-coach-book>
            {t("The book move from here is {san}.", { san: nextBook })}
          </p>
        ) : (
          <button type="button" className="ask-coach-show" data-ask-coach-show onClick={() => setRevealed(true)}>
            {t("Show me")}
          </button>
        )
      ) : null}
    </section>
  );
}

function ArrowGlyph({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={dir === "prev" ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NoteLine({ san, ply, text, latest }: { san: string; ply: number; text: string | undefined; latest: boolean }) {
  if (!text) return null;
  return (
    <p className="ask-coach-note-line" data-ask-coach-note={ply} data-ask-coach-latest={latest ? "true" : undefined}>
      <span className="ask-coach-ply">{san}</span> {text}
    </p>
  );
}
