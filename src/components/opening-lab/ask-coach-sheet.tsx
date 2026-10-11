import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useOverlayHistory } from "@/hooks/use-overlay-history";
import { askTheCoachClientEnabled } from "@/lib/ask-coach-flag";
import { useT } from "@/lib/i18n";

type Mode = "practice" | "test";
type Question = "rundown" | "plan" | "why" | "alternative" | "free";

type Props = {
  packId: string;
  lineId: string;
  lineName: string;
  plies: readonly string[];
  ply: number;
  mode: Mode;
  surface: "line" | "finish";
  block?: boolean;
};

const answerCache = new Map<string, string>();

function cacheKey(
  lineId: string,
  ply: number,
  mode: Mode,
  question: Question,
  text: string,
  showBook: boolean,
): string {
  return `${lineId}|${ply}|${mode}|${question}|${showBook ? 1 : 0}|${text}`;
}

const CHIPS: { id: Exclude<Question, "rundown" | "free">; label: string }[] = [
  { id: "plan", label: "What's the plan?" },
  { id: "why", label: "Why this move?" },
  { id: "alternative", label: "What if they play something else?" },
];

function limitCopy(): string {
  return "That's today's limit. Visitors get 5 questions a day. A Scotch buyer has a safety cap of 50.";
}

export function AskCoachButton({
  packId,
  lineId,
  lineName,
  plies,
  ply,
  mode,
  surface,
  block = false,
}: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const inflight = useRef<string | null>(null);
  const close = () => setOpen(false);
  useOverlayHistory(open, close, "ask-coach");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setRevealed(false);
  }, [lineId, ply, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function ask(question: Question, text: string, signal?: AbortSignal, showBook = false) {
    const key = cacheKey(lineId, ply, mode, question, text, showBook);
    const hit = question === "free" ? undefined : answerCache.get(key);
    if (hit) {
      setAnswer(hit);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    if (question === "rundown") setAnswer("");
    try {
      const res = await fetch("/api/ask-coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal,
        body: JSON.stringify({
          packId,
          lineId,
          ply,
          mode,
          surface,
          question,
          text,
          showBook,
        }),
      });
      const left = res.headers.get("x-ask-coach-remaining");
      if (left != null && left !== "") setRemaining(Number(left));
      if (!res.ok) {
        let message = "The coach could not answer.";
        try {
          const data = (await res.json()) as { error?: string };
          if (res.status === 429) message = limitCopy();
          else if (typeof data.error === "string") message = data.error;
        } catch {
          if (res.status === 429) message = limitCopy();
        }
        if (!signal?.aborted) {
          setError(message);
          setLoading(false);
        }
        return;
      }
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let acc = "";
      if (reader) {
        for (;;) {
          const step = await reader.read();
          if (step.done) break;
          acc += dec.decode(step.value, { stream: true });
          if (!signal?.aborted) setAnswer(acc);
        }
      } else {
        acc = await res.text();
      }
      acc += dec.decode();
      if (signal?.aborted) return;
      setAnswer(acc);
      if (question !== "free") answerCache.set(key, acc);
      setLoading(false);
    } catch {
      if (signal?.aborted) return;
      setError("The coach could not answer.");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const key = cacheKey(lineId, ply, mode, "rundown", "", false);
    const hit = answerCache.get(key);
    if (hit) {
      setAnswer(hit);
      setError(null);
      setLoading(false);
      return;
    }
    if (inflight.current === key) return;
    inflight.current = key;
    const ac = new AbortController();
    void ask("rundown", "", ac.signal).finally(() => {
      if (inflight.current === key) inflight.current = null;
    });
    return () => ac.abort();
    // ask is recreated each render; the key is the position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lineId, ply, mode, packId, surface]);

  if (!askTheCoachClientEnabled(packId)) return null;

  const nextBook = ply >= 0 && ply < plies.length ? plies[ply] : null;
  const sheet =
    open && mounted
      ? createPortal(
          <div
            className="ask-coach-overlay"
            role="presentation"
            onClick={close}
          >
            <div
              className="ask-coach-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ask-coach-title"
              data-ask-coach-sheet
              data-ask-coach-mode={mode}
              data-ask-coach-surface={surface}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="ask-coach-sheet-head">
                <div>
                  <p className="slav-notice-kicker">{t("Ask the coach")}</p>
                  <h2 id="ask-coach-title" className="slav-notice-title">
                    {lineName}
                  </h2>
                </div>
                <button type="button" className="ask-coach-close" onClick={close} aria-label={t("Close")}>
                  {t("Close")}
                </button>
              </div>
              {mode === "test" ? (
                <p className="ask-coach-note" data-ask-coach-test-note>
                  {t("Test mode. The next book move stays hidden until you tap Show me.")}
                </p>
              ) : null}
              <div className="ask-coach-answer" data-ask-coach-answer aria-live="polite">
                {error ? <p className="ask-coach-error">{error}</p> : null}
                {answer ? <p className="slav-notice-paragraph">{answer}</p> : null}
                {loading && !answer ? (
                  <p className="slav-notice-paragraph">{t("Looking at this position.")}</p>
                ) : null}
              </div>
              {mode === "test" && nextBook ? (
                revealed ? (
                  <p className="ask-coach-book" data-ask-coach-book>
                    {t("The book move from here is {san}.", { san: nextBook })}
                  </p>
                ) : (
                  <button
                    type="button"
                    className="ask-coach-show"
                    data-ask-coach-show
                    onClick={() => setRevealed(true)}
                  >
                    {t("Show me")}
                  </button>
                )
              ) : null}
              <div className="ask-coach-chips" role="group" aria-label={t("Ask the coach")}>
                {CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className="ask-coach-chip"
                    data-ask-coach-chip={chip.id}
                    disabled={loading}
                    onClick={() => void ask(chip.id, "", undefined, revealed && mode === "test")}
                  >
                    {t(chip.label)}
                  </button>
                ))}
              </div>
              <form
                className="ask-coach-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const text = draft.trim();
                  if (!text || loading) return;
                  setDraft("");
                  void ask("free", text, undefined, revealed && mode === "test");
                }}
              >
                <input
                  className="ask-coach-input"
                  data-ask-coach-input
                  value={draft}
                  maxLength={240}
                  placeholder={t("Ask about this position")}
                  aria-label={t("Ask about this position")}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" className="ask-coach-send" data-ask-coach-send disabled={loading || !draft.trim()}>
                  {t("Send")}
                </button>
              </form>
              {remaining != null ? (
                <p className="ask-coach-remaining" data-ask-coach-remaining>
                  {t("{n} left today", { n: remaining })}
                </p>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className={block ? "ask-coach-btn ask-coach-btn--block" : "ask-coach-btn"}
        data-ask-coach-open
        data-ask-coach-surface={surface}
        onClick={() => setOpen(true)}
      >
        {t("Ask the coach")}
      </button>
      {sheet}
    </>
  );
}
