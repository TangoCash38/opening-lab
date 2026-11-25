import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { modeLabel } from "@/data/creator-packs-demo";
import type { CreatorHue } from "@/data/creator-packs-demo";
import {
  confirmCreatorCheckout,
  fetchPlayablePack,
  openCreatorPackCheckout,
  type PlayablePack,
} from "@/lib/creator-packs-client";
import { useT } from "@/lib/i18n";
import { CreatorAvatar } from "./creator-packs-frame";
import { CreatorPackStatus } from "./creator-packs-status";
import { CreatorPackStudy } from "./creator-packs-study";

function hueFor(name: string): CreatorHue {
  const hues: CreatorHue[] = ["accent", "gold", "success"];
  let n = 0;
  for (const ch of name) n += ch.charCodeAt(0);
  return hues[n % hues.length]!;
}

export function CreatorPacksPack({ packId }: { packId: string }) {
  const t = useT();
  const [pack, setPack] = useState<PlayablePack | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyNote, setBuyNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);

  const load = () => {
    void fetchPlayablePack(packId).then((result) => {
      if (!result.ok) {
        setMissing(true);
        setError(result.error);
        setPack(null);
        return;
      }
      setMissing(false);
      setError(null);
      setPack(result.pack);
    });
  };

  useEffect(() => {
    let cancelled = false;
    void fetchPlayablePack(packId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setMissing(true);
        setError(result.error);
        return;
      }
      setPack(result.pack);
    });
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (params.get("paid") === "1" && sessionId) {
      void confirmCreatorCheckout(sessionId).then((result) => {
        if (cancelled) return;
        setBuyNote(result.ok ? "Payment received. This pack is unlocked." : result.error);
        window.history.replaceState(null, "", window.location.pathname);
        if (result.ok) load();
      });
    }
    return () => {
      cancelled = true;
    };
    // load is recreated each render; the effect should follow packId only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId]);

  if (missing) {
    return (
      <div data-creator-pack-missing>
        <h1 className="creator-packs-title">This pack is not available</h1>
        <p className="creator-packs-lede">{error || "It may still be in review, or the address is wrong."}</p>
        <Link to="/creator-packs" className="creator-packs-primary creator-packs-primary-link">
          Back to creator packs
        </Link>
      </div>
    );
  }

  if (!pack) {
    return <p className="creator-packs-note">Loading this pack…</p>;
  }

  const active = pack.lines[lineIndex] ?? pack.lines[0];
  const freePack = pack.pricePence <= 0 && pack.status === "live";
  const canBuy = pack.status === "live" && pack.pricePence > 0 && !pack.isOwner && !pack.unlocked;

  const buy = () => {
    if (!pack.paymentsEnabled) {
      setBuyNote("Payments are not switched on in this preview yet. No payment is taken.");
      return;
    }
    if (!pack.payoutsReady) {
      setBuyNote("This creator is still setting up payouts. You cannot buy this pack yet.");
      return;
    }
    setBusy(true);
    setBuyNote(null);
    void openCreatorPackCheckout(pack.id).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setBuyNote(result.error);
        if (result.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent(`/creator-packs/pack/${pack.id}`)}`;
        }
        return;
      }
      window.location.href = result.url;
    });
  };

  return (
    <article data-creator-pack-page={pack.id}>
      <p className="creator-packs-kicker">Creator pack</p>
      <h1 className="creator-packs-title">{pack.name}</h1>
      <div className="creator-pack-person creator-pack-person--profile">
        <CreatorAvatar name={pack.creatorName} hue={hueFor(pack.creatorName)} />
        <div className="creator-pack-identity">
          <p className="creator-pack-creator">
            <Link to="/creator-packs/creator/$creatorId" params={{ creatorId: pack.creatorId }}>
              {pack.creatorName}
            </Link>
          </p>
          {pack.bio ? <p className="creator-pack-bio">{pack.bio}</p> : null}
        </div>
      </div>
      {pack.status !== "live" ? (
        <p className="creator-only-note">
          <CreatorPackStatus status={pack.status} /> Visible only to you until Opening Lab approves it.
        </p>
      ) : null}
      {pack.reviewNote ? <p className="creator-packs-note">{pack.reviewNote}</p> : null}
      {active && !active.locked ? (
        <CreatorPackStudy
          title={active.name}
          mode={active.mode}
          plies={active.plies}
          comments={active.comments}
          fen={active.fen}
          side={active.fen.split(" ")[1] === "b" ? "b" : "w"}
        />
      ) : (
        <p className="creator-packs-note">Buy the pack to open this line in the trainer.</p>
      )}
      {pack.blurb ? <p className="creator-packs-lede">{pack.blurb}</p> : null}
      <div className="creator-pack-buybox">
        <div className="creator-pack-meta">
          <span className="creator-pack-price">{pack.priceLabel}</span>
          <span className="creator-pack-badge">
            {pack.lines.length === 1 ? "1 line" : `${pack.lines.length} lines`}
          </span>
        </div>
        {canBuy ? (
          <button
            type="button"
            className="creator-packs-primary"
            data-creator-buy
            disabled={busy}
            onClick={buy}
          >
            {busy ? "Opening checkout…" : "Buy this pack"}
          </button>
        ) : null}
        {buyNote ? (
          <p className="creator-packs-note" role="status" data-creator-preview-note>
            {buyNote}
          </p>
        ) : null}
        {!pack.paymentsEnabled && canBuy ? (
          <p className="creator-packs-note">
            Payments are not switched on in this preview yet. No payment is taken.
          </p>
        ) : null}
        {freePack ? <p className="creator-packs-note">This pack is free. Every line is open.</p> : null}
        {pack.unlocked && !pack.isOwner && !freePack ? (
          <p className="creator-packs-note">You have this pack. Every line is open.</p>
        ) : null}
        {!freePack && !pack.unlocked ? (
          <p className="creator-packs-note">
            {pack.lines.length > 1
              ? "Line 1 is free to try. The other lines stay locked until you buy the pack."
              : "Buy the pack to train this line."}
          </p>
        ) : null}
      </div>
      <h2 className="creator-packs-subhead">{pack.lines.length === 1 ? "The line" : "The lines"}</h2>
      <ol className="creator-line-list">
        {pack.lines.map((line, index) => {
          const locked = index > 0 && line.locked;
          return (
            <li
              key={line.id}
              className={`creator-line${locked ? " is-locked" : ""}`}
              data-creator-line={index + 1}
              data-locked={locked ? "true" : "false"}
              data-creator-line-mode={line.mode}
            >
              <button type="button" className="creator-line-open" onClick={() => {
                  if (locked) {
                    setBuyNote("Buy the pack to open this line.");
                    return;
                  }
                  setLineIndex(index);
                }}
              >
                <span className={`creator-line-index${locked ? " is-locked" : ""}`}>{index + 1}</span>
                <span className="creator-line-body">
                  <span className="creator-line-name">
                  {line.name}
                  <span className="creator-line-mode">{modeLabel(line.mode)}</span>
                  {locked ? (
                    <span className="creator-line-lock">
                      <Lock className="size-3" strokeWidth={2.5} aria-hidden />
                      {t("Locked")}
                    </span>
                  ) : (
                    <span className="creator-line-free">{index === 0 && !pack.unlocked && !freePack ? t("Free") : "Open"}</span>
                  )}
                </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
