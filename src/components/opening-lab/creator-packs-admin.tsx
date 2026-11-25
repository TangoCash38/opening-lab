import { useEffect, useState } from "react";
import { MONTHLY_PAYOUTS, payoutReadyFor, useCreatorPayout } from "@/lib/creator-packs-payout";
import { formatPackPrice, useReviewPacks, type StoredPack } from "@/lib/creator-packs-review";
import { CreatorPackStatus, CreatorPayoutBadge } from "./creator-packs-status";

export function CreatorPacksAdmin() {
  const [packs, replace, ready] = useReviewPacks();
  const { youReady, paidIds, markPaid } = useCreatorPayout();
  const [payNotes, setPayNotes] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      for (const pack of packs) {
        if (next[pack.id] === undefined) {
          next[pack.id] = pack.finalPrice || (pack.suggestedPrice === "Free" ? "" : pack.suggestedPrice);
        }
      }
      return next;
    });
  }, [packs]);

  const patch = (id: string, update: Partial<StoredPack>, note: string) => {
    replace(packs.map((pack) => (pack.id === id ? { ...pack, ...update } : pack)));
    setNotes((current) => ({ ...current, [id]: note }));
    setErrors((current) => ({ ...current, [id]: null }));
  };

  const approve = (pack: StoredPack) => {
    const raw = (drafts[pack.id] ?? "").trim();
    const finalPrice = raw ? formatPackPrice(raw) : pack.suggestedPrice;
    if (!finalPrice) {
      setErrors((current) => ({ ...current, [pack.id]: "Enter a price such as 2.50, or leave the field blank to keep the suggestion." }));
      return;
    }
    patch(pack.id, { status: "live", finalPrice }, "Approved. The pack would show as live at this price.");
  };

  const sendBack = (pack: StoredPack) => {
    patch(pack.id, { status: "returned" }, "Sent back to the creator.");
  };

  return (
    <div data-creator-packs-admin>
      <p className="creator-packs-kicker">For Sean</p>
      <h1 className="creator-packs-title">Pack review</h1>
      <p className="creator-packs-lede">
        Each card shows the price the creator suggested. Set the final price, then approve the pack or send it back.
        This sample only changes what is saved on this device.
      </p>
      <div className="creator-packs-grid">
        {packs.map((pack) => (
          <article key={pack.id} className="creator-pack-card" data-creator-admin-pack={pack.id}>
            <span className="creator-pack-name">{pack.name}</span>
            <span className="creator-pack-bio">
              {pack.creatorName} · {pack.lineCount} {pack.lineCount === 1 ? "line" : "lines"}
            </span>
            <span className="creator-pack-meta">
              <span className="creator-pack-bio">Payouts</span>
              <CreatorPayoutBadge ready={payoutReadyFor(pack.creatorName, youReady)} />
            </span>
            <span className="creator-pack-meta">
              <span className="creator-pack-price">Suggested {pack.suggestedPrice}</span>
              <CreatorPackStatus status={pack.status} />
            </span>
            <label className="creator-packs-field">
              <span>Final price</span>
              <input
                value={drafts[pack.id] ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setDrafts((current) => ({ ...current, [pack.id]: value }));
                  setErrors((current) => ({ ...current, [pack.id]: null }));
                }}
                placeholder={pack.suggestedPrice === "Free" ? "Free, or a price" : pack.suggestedPrice}
                inputMode="decimal"
                disabled={!ready}
                data-creator-final-price
              />
            </label>
            {errors[pack.id] ? (
              <p className="creator-packs-error" role="alert">
                {errors[pack.id]}
              </p>
            ) : null}
            <div className="creator-editor-actions">
              <button type="button" onClick={() => sendBack(pack)} disabled={!ready} data-creator-send-back>
                Send back
              </button>
              <button
                type="button"
                className="creator-packs-primary"
                onClick={() => approve(pack)}
                disabled={!ready}
                data-creator-approve
              >
                Approve
              </button>
            </div>
            {notes[pack.id] ? (
              <p className="creator-packs-note" role="status">
                {notes[pack.id]}
              </p>
            ) : null}
          </article>
        ))}
      </div>
      <h2 className="creator-packs-subhead">Monthly payouts</h2>
      <p className="creator-packs-lede">
        Players buy on Opening Lab&apos;s website or in the app. You pay creators from Opening Lab&apos;s Stripe account, once a month.
        The share is a flat 70% of sales. This list is a sample on this device.
      </p>
      <div className="creator-packs-grid" data-creator-monthly-payouts>
        {MONTHLY_PAYOUTS.map((row) => {
          const ready = payoutReadyFor(row.creatorName, youReady);
          const paid = paidIds.includes(row.id);
          return (
            <article key={row.id} className="creator-pack-card" data-creator-payout-row={row.id}>
              <div className="creator-pack-meta">
                <span className="creator-pack-name">{row.creatorName}</span>
                <CreatorPayoutBadge ready={ready} />
              </div>
              <span className="creator-pack-bio">Sales {row.salesLabel}</span>
              <span className="creator-pack-price">Share owed {row.shareLabel} (70% of sales)</span>
              {paid ? (
                <p className="creator-packs-note" role="status">
                  Marked as paid on this device. Nothing was sent.
                </p>
              ) : (
                <button
                  type="button"
                  className="creator-packs-primary"
                  data-creator-pay-stripe
                  onClick={() => {
                    if (!ready) {
                      setPayNotes((current) => ({
                        ...current,
                        [row.id]: "Set up payouts first. Nothing was sent.",
                      }));
                      return;
                    }
                    markPaid(row.id);
                    setPayNotes((current) => ({ ...current, [row.id]: "" }));
                  }}
                >
                  Pay via Stripe
                </button>
              )}
              {payNotes[row.id] ? (
                <p className="creator-packs-note" role="status">
                  {payNotes[row.id]}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
