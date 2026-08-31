import { useState } from "react";
import type { OpeningLine, Pack } from "@/data/packs";

const MAX = 400;

type Props = {
  pack: Pack;
  line: OpeningLine;
};

export function LineFeedback({ pack, line }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "thanks" | "err">("idle");

  const send = async () => {
    const message = text.trim();
    if (!message || message.length > MAX) return;
    setStatus("busy");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: pack.id,
          packName: pack.name,
          lineId: line.id,
          lineName: line.name,
          message,
        }),
      });
      if (!res.ok) throw new Error("send failed");
      setStatus("thanks");
      setText("");
    } catch {
      setStatus("err");
    }
  };

  if (status === "thanks") {
    return (
      <p className="mt-4 text-center text-[0.82rem] font-semibold text-success" role="status">
        Thanks — we got it. If we confirm your move is book, you get a pack free.
      </p>
    );
  }

  return (
    <div className="mt-4">
      {!open ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mx-auto block rounded-full bg-bg-subtle px-4 py-2 text-[0.78rem] font-semibold text-fg-muted"
          >
            Wrong move?
          </button>
          <p className="mx-auto mt-2 max-w-sm text-center text-[0.75rem] leading-relaxed text-fg-muted">
            Think the book move is wrong? Send it to support. If we check it and
            your move is book, you get a pack free.
          </p>
        </>
      ) : (
        <div className="rounded-2xl border border-border bg-bg-elevated px-3 py-3">
          <p className="mb-2 text-[0.78rem] leading-relaxed text-fg-muted">
            Only the book move counts here. If you think this line is wrong, send
            it. If we confirm your move is book, you get a pack free.
          </p>
          <p className="mb-2 text-[0.78rem] text-fg-muted">
            {pack.name} · {line.name}
          </p>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX));
              if (status === "err") setStatus("idle");
            }}
            rows={3}
            maxLength={MAX}
            placeholder="What move should count, and why?"
            className="w-full resize-none rounded-xl border border-border bg-bg px-3 py-2 text-[0.88rem] text-fg outline-none"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[0.68rem] text-fg-subtle">
              {text.trim().length}/{MAX}
            </span>
            <button
              type="button"
              onClick={() => void send()}
              disabled={status === "busy" || !text.trim()}
              className="rounded-full bg-accent px-4 py-2 text-[0.78rem] font-semibold text-accent-fg disabled:opacity-50"
            >
              {status === "busy" ? "Sending…" : "Send"}
            </button>
          </div>
          {status === "err" ? (
            <p className="mt-2 text-[0.75rem] text-danger">Could not send. Try again.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
