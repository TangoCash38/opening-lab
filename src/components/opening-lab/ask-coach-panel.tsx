import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { coachLineIntro } from "@/data/coach-notes";
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

const noteCache = new Map<string, string>();

function limitCopy(): string {
  return "That's today's limit. Visitors get 5 questions a day. A Scotch buyer has a safety cap of 50.";
}

async function readAnswer(res: Response): Promise<string> {
  if (res.status === 429) throw new Error(limitCopy());
  if (!res.ok) throw new Error("The coach could not answer just now.");
  return (await res.text()).trim();
}

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
  const [loadingPly, setLoadingPly] = useState<number | null>(null);
  const [askText, setAskText] = useState("");
  const [askDraft, setAskDraft] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const inflight = useRef<string | null>(null);
  const [slide, setSlide] = useState(0);
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  useEffect(() => {
    setNotes({});
    setAskText("");
    setAskDraft("");
    setAskError(null);
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
    const key = `${lineId}|${ply}|${mode}`;
    const hit = noteCache.get(key);
    if (hit) {
      setNotes((prev) => (prev[ply] === hit ? prev : { ...prev, [ply]: hit }));
      return;
    }
    if (inflight.current === key) return;
    inflight.current = key;
    const ac = new AbortController();
    setLoadingPly(ply);
    void fetch("/api/ask-coach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: ac.signal,
      body: JSON.stringify({
        packId,
        lineId,
        ply,
        mode,
        surface: "line",
        question: "move",
        text: "",
        showBook: false,
      }),
    })
      .then(async (res) => {
        const text = await readAnswer(res);
        noteCache.set(key, text);
        setNotes((prev) => ({ ...prev, [ply]: text }));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "The coach could not answer just now.";
        setNotes((prev) => ({ ...prev, [ply]: message }));
      })
      .finally(() => {
        if (inflight.current === key) inflight.current = null;
        setLoadingPly((current) => (current === ply ? null : current));
      });
    return () => ac.abort();
  }, [phase, ply, lineId, packId, mode]);

  const slides = coachSlides(ply, phase === "done");
  const latest = Math.max(0, slides.length - 1);

  useEffect(() => {
    const next = coachSlides(ply, phase === "done");
    setSlide(Math.max(0, next.length - 1));
  }, [lineId, ply, phase]);

  useEffect(() => {
    const panel = panelRef.current;
    const input = panel?.querySelector<HTMLInputElement>("[data-ask-coach-input]");
    const vv = window.visualViewport;
    if (!panel || !input || !vv) return;
    const root = document.documentElement;
    let focused = false;

    const overlap = () => Math.max(0, Math.round(window.innerHeight - vv.offsetTop - vv.height));

    const lift = () => {
      const panelRect = panel.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      const hidden = inputRect.bottom - panelRect.bottom + 12;
      if (hidden > 0) panel.scrollTop += hidden;
    };

    const place = () => {
      lift();
      const px = focused ? overlap() : 0;
      const rect = input.getBoundingClientRect();
      const limit = window.innerHeight - px - 12;
      if (rect.bottom > limit) window.scrollBy(0, rect.bottom - limit);
    };

    const apply = () => {
      const px = focused ? overlap() : 0;
      if (px > 0) {
        root.style.setProperty("--coach-keyboard", `${px}px`);
        root.dataset.coachKeyboard = "open";
      } else {
        root.style.removeProperty("--coach-keyboard");
        delete root.dataset.coachKeyboard;
      }
      if (focused) requestAnimationFrame(place);
    };

    const onFocus = () => {
      focused = true;
      requestAnimationFrame(apply);
    };
    const onBlur = () => {
      focused = false;
      root.style.removeProperty("--coach-keyboard");
      delete root.dataset.coachKeyboard;
    };

    input.addEventListener("focus", onFocus);
    input.addEventListener("blur", onBlur);
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      input.removeEventListener("focus", onFocus);
      input.removeEventListener("blur", onBlur);
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      root.style.removeProperty("--coach-keyboard");
      delete root.dataset.coachKeyboard;
    };
  }, [phase]);

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

  async function ask(event: FormEvent) {
    event.preventDefault();
    const text = askDraft.trim();
    if (!text || asking) return;
    setAsking(true);
    setAskError(null);
    setAskDraft("");
    try {
      const res = await fetch("/api/ask-coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          packId,
          lineId,
          ply,
          mode: "practice",
          surface: "finish",
          question: "free",
          text,
          showBook: false,
        }),
      });
      const left = res.headers.get("x-ask-coach-remaining");
      if (left != null && left !== "") setRemaining(Number(left));
      setAskText(await readAnswer(res));
    } catch (err: unknown) {
      setAskError(err instanceof Error ? err.message : "The coach could not answer just now.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <section
      ref={panelRef}
      className="ask-coach-panel"
      data-ask-coach-panel
      data-ask-coach-phase={phase}
      aria-label={t("Ask the coach")}
    >
      <p className="slav-notice-kicker">{t("Ask the coach")}</p>
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
                        <h3 className="slav-notice-title" data-ask-coach-any>
                          {t("Any questions?")}
                        </h3>
                        {askError ? <p className="ask-coach-error">{askError}</p> : null}
                        {askText ? (
                          <p className="slav-notice-paragraph" data-ask-coach-answer>
                            {askText}
                          </p>
                        ) : null}
                        <form className="ask-coach-form" onSubmit={(event) => void ask(event)}>
                          <input
                            className="ask-coach-input"
                            data-ask-coach-input
                            value={askDraft}
                            maxLength={240}
                            placeholder={t("Ask about this position")}
                            aria-label={t("Ask about this position")}
                            onChange={(event) => setAskDraft(event.target.value)}
                          />
                          <button type="submit" className="ask-coach-send" data-ask-coach-send disabled={asking || !askDraft.trim()}>
                            {t("Send")}
                          </button>
                        </form>
                        {remaining != null ? (
                          <p className="ask-coach-remaining" data-ask-coach-remaining>
                            {t("{n} left today", { n: remaining })}
                          </p>
                        ) : null}
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
                    <NoteLine
                      san={plies[item.whitePly - 1] ?? ""}
                      ply={item.whitePly}
                      text={notes[item.whitePly]}
                      latest={item.whitePly === ply}
                      waiting={loadingPly === item.whitePly && !notes[item.whitePly]}
                      waitingCopy={t("Looking at this move.")}
                    />
                    {item.blackPly != null ? (
                      <NoteLine
                        san={plies[item.blackPly - 1] ?? ""}
                        ply={item.blackPly}
                        text={notes[item.blackPly]}
                        latest={item.blackPly === ply}
                        waiting={loadingPly === item.blackPly && !notes[item.blackPly]}
                        waitingCopy={t("Looking at this move.")}
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

function NoteLine({
  san,
  ply,
  text,
  latest,
  waiting,
  waitingCopy,
}: {
  san: string;
  ply: number;
  text: string | undefined;
  latest: boolean;
  waiting: boolean;
  waitingCopy: string;
}) {
  if (!text && waiting) {
    return <p className="slav-notice-paragraph">{waitingCopy}</p>;
  }
  if (!text) return null;
  return (
    <p className="ask-coach-note-line" data-ask-coach-note={ply} data-ask-coach-latest={latest ? "true" : undefined}>
      <span className="ask-coach-ply">{san}</span> {text}
    </p>
  );
}
