import { useEffect, useRef, useState, type FormEvent } from "react";
import { askTheCoachClientEnabled } from "@/lib/ask-coach-flag";
import { coachIntroText } from "@/lib/ask-coach-mock";
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

  useEffect(() => {
    setNotes({});
    setAskText("");
    setAskDraft("");
    setAskError(null);
    setRevealed(false);
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

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [notes, ply, phase, askText, revealed]);

  if (!askTheCoachClientEnabled(packId)) return null;

  const intro = coachIntroText(lineName, idea);
  const nextBook = ply >= 0 && ply < plies.length ? plies[ply] : null;
  const visible = Object.keys(notes)
    .map((n) => Number(n))
    .filter((n) => n >= 1 && n <= ply && notes[n])
    .sort((a, b) => a - b);

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
      {phase === "intro" ? (
        <>
          <p className="slav-notice-paragraph" data-ask-coach-intro>
            {intro}
          </p>
          <button type="button" className="ask-coach-primary" data-ask-coach-practice onClick={onPractice}>
            {t("Practice")}
          </button>
        </>
      ) : (
        <div className="ask-coach-feed" data-ask-coach-feed aria-live="polite">
          {visible.length === 0 && phase !== "done" ? (
            <p className="slav-notice-paragraph" data-ask-coach-wait>
              {mode === "test"
                ? t("Your move. The next book move stays hidden until you tap Show me.")
                : t("Your move. I will explain each one here.")}
            </p>
          ) : null}
          {visible.map((n) => (
            <p
              key={n}
              className="ask-coach-note-line"
              data-ask-coach-note={n}
              data-ask-coach-latest={n === ply ? "true" : undefined}
            >
              <span className="ask-coach-ply">{plies[n - 1]}</span> {notes[n]}
            </p>
          ))}
          {loadingPly === ply && !notes[ply] ? (
            <p className="slav-notice-paragraph">{t("Looking at this move.")}</p>
          ) : null}
        </div>
      )}
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
      {phase === "done" ? (
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
      ) : null}
    </section>
  );
}
