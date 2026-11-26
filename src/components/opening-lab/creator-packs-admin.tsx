import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  fetchCreatorAdmin,
  reviewCreatorPack,
  type AdminPack,
  type AdminSale,
} from "@/lib/creator-packs-client";
import { formatSharePounds } from "@/lib/creator-packs-payout";
import { MakerBadge } from "./maker-badge";
import { CreatorPackStatus, CreatorPayoutBadge } from "./creator-packs-status";

export function CreatorPacksAdmin() {
  const [packs, setPacks] = useState<AdminPack[]>([]);
  const [sales, setSales] = useState<AdminSale[]>([]);
  const [ready, setReady] = useState(false);
  const [gate, setGate] = useState<string | null>(null);
  const [edits, setEdits] = useState<
    Record<string, { name: string; blurb: string; price: string; lines: { id: string; name: string; comments: string[] }[] }>
  >({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () => {
    void fetchCreatorAdmin().then((result) => {
      setReady(true);
      if (!result.ok) {
        setGate(result.error);
        setPacks([]);
        setSales([]);
        return;
      }
      setGate(null);
      setPacks(result.packs);
      setSales(result.sales);
      setEdits(
        Object.fromEntries(
          result.packs.map((pack) => [
            pack.id,
            {
              name: pack.name,
              blurb: pack.blurb,
              price: pack.finalPrice || pack.suggestedPrice,
              lines: pack.lines.map((line) => ({
                id: line.id,
                name: line.name,
                comments: [...line.comments],
              })),
            },
          ]),
        ),
      );
    });
  };

  useEffect(() => {
    load();
  }, []);

  const approve = (pack: AdminPack) => {
    const edit = edits[pack.id];
    void reviewCreatorPack({
      packId: pack.id,
      action: "approve",
      finalPrice: (edit?.price ?? pack.suggestedPrice).trim(),
      name: edit?.name,
      blurb: edit?.blurb,
      lines: edit?.lines,
    }).then((result) => {
      if (!result.ok) {
        setErrors((current) => ({ ...current, [pack.id]: result.error }));
        return;
      }
      setNotes((current) => ({ ...current, [pack.id]: "Approved. The creator can see this pack, and any change you made." }));
      setErrors((current) => ({ ...current, [pack.id]: null }));
      load();
    });
  };

  const sendBack = (pack: AdminPack) => {
    const note = (reasons[pack.id] ?? "").trim();
    void reviewCreatorPack({ packId: pack.id, action: "return", note }).then((result) => {
      if (!result.ok) {
        setErrors((current) => ({ ...current, [pack.id]: result.error }));
        return;
      }
      setNotes((current) => ({ ...current, [pack.id]: "Sent back. The creator can read your reason." }));
      load();
    });
  };

  return (
    <div data-creator-packs-admin>
      <p className="creator-packs-kicker">For Sean</p>
      <h1 className="creator-packs-title">Pack review</h1>
      <p className="creator-packs-lede">
        The creator set the price. You can edit the title, the description, the lines and the price, then approve. The creator's price is already filled in. If you change the price or the writing, they see a short note on Your packs.
      </p>
      {gate ? (
        <div className="creator-packs-form" role="alert">
          <p>{gate}</p>
          <a href="/login?next=/creator-packs/admin" className="creator-packs-primary creator-packs-primary-link">
            Sign in
          </a>
        </div>
      ) : null}
      {!ready && !gate ? <p className="creator-packs-note">Loading the review desk…</p> : null}
      {ready && !gate && packs.length === 0 ? (
        <p className="creator-packs-note">No packs are waiting.</p>
      ) : null}
      <div className="creator-packs-grid">
        {packs.map((pack) => (
          <article key={pack.id} className="creator-pack-card" data-creator-admin-pack={pack.id}>
            <div className="maker-badge-row">
              <span className="creator-pack-name">{pack.name}</span>
              <MakerBadge name={pack.creatorName} />
            </div>
            <span className="creator-pack-bio">
              {pack.creatorName} · {pack.lineCount} {pack.lineCount === 1 ? "line" : "lines"}
            </span>
            <span className="creator-pack-meta">
              <span className="creator-pack-bio">Payouts</span>
              <CreatorPayoutBadge ready={pack.payoutsReady} />
            </span>
            <label className="creator-packs-field">
              <span>Title</span>
              <input
                value={edits[pack.id]?.name ?? pack.name}
                onChange={(event) => {
                  const value = event.target.value;
                  setEdits((current) => ({
                    ...current,
                    [pack.id]: { ...current[pack.id]!, name: value },
                  }));
                }}
                data-creator-edit-title
              />
            </label>
            <label className="creator-packs-field">
              <span>Description</span>
              <textarea
                value={edits[pack.id]?.blurb ?? pack.blurb}
                rows={3}
                onChange={(event) => {
                  const value = event.target.value;
                  setEdits((current) => ({
                    ...current,
                    [pack.id]: { ...current[pack.id]!, blurb: value },
                  }));
                }}
                data-creator-edit-blurb
              />
            </label>
            <span className="creator-pack-meta">
              <span className="creator-pack-price">Creator's price {pack.suggestedPrice}</span>
              <CreatorPackStatus status={pack.status} />
            </span>
            <label className="creator-packs-field">
              <span>Price</span>
              <input
                value={edits[pack.id]?.price ?? pack.suggestedPrice}
                onChange={(event) => {
                  const value = event.target.value;
                  setEdits((current) => ({
                    ...current,
                    [pack.id]: { ...current[pack.id]!, price: value },
                  }));
                  setErrors((current) => ({ ...current, [pack.id]: null }));
                }}
                placeholder={pack.suggestedPrice}
                inputMode="decimal"
                disabled={!ready}
                data-creator-final-price
              />
            </label>
            <label className="creator-packs-field">
              <span>Reason if you send it back</span>
              <textarea
                value={reasons[pack.id] ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setReasons((current) => ({ ...current, [pack.id]: value }));
                  setErrors((current) => ({ ...current, [pack.id]: null }));
                }}
                rows={3}
                placeholder="What should the creator change?"
                data-creator-return-note
              />
            </label>
            <div data-creator-edit-lines>
              {pack.lines.map((line, lineIndex) => (
                <div key={line.id} className="creator-packs-form">
                  <label className="creator-packs-field">
                    <span>Line</span>
                    <input
                      value={edits[pack.id]?.lines[lineIndex]?.name ?? line.name}
                      onChange={(event) => {
                        const value = event.target.value;
                        setEdits((current) => {
                          const lines = current[pack.id]!.lines.map((item, index) =>
                            index === lineIndex ? { ...item, name: value } : item,
                          );
                          return { ...current, [pack.id]: { ...current[pack.id]!, lines } };
                        });
                      }}
                      data-creator-edit-line
                    />
                  </label>
                  <p className="creator-packs-note">{line.plies.join(" ")}</p>
                  {line.comments.map((_, commentIndex) => (
                    <label key={`${line.id}-${commentIndex}`} className="creator-packs-field">
                      <span>Comment {commentIndex + 1}</span>
                      <textarea
                        rows={2}
                        value={edits[pack.id]?.lines[lineIndex]?.comments[commentIndex] ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setEdits((current) => {
                            const lines = current[pack.id]!.lines.map((item, index) => {
                              if (index !== lineIndex) return item;
                              const comments = item.comments.map((comment, index) =>
                                index === commentIndex ? value : comment,
                              );
                              return { ...item, comments };
                            });
                            return { ...current, [pack.id]: { ...current[pack.id]!, lines } };
                          });
                        }}
                        data-creator-edit-comment
                      />
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <Link to="/creator-packs/pack/$packId" params={{ packId: pack.id }}>
              Open the pack
            </Link>
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
        Website sales already send a flat 70% of sales through Stripe when the buyer pays. App sales will wait here
        for a monthly transfer. Pay via Stripe on this list stays off until an app sale is waiting.
      </p>
      <div className="creator-packs-grid" data-creator-monthly-payouts>
        {sales.length === 0 ? (
          <article className="creator-pack-card" data-creator-payout-row="none">
            <span className="creator-pack-name">No sales yet</span>
            <span className="creator-pack-bio">No app sales are waiting. Website sales are not paid from this list.</span>
          </article>
        ) : (
          sales.map((row) => (
            <article key={row.creatorUserId} className="creator-pack-card" data-creator-payout-row={row.creatorUserId}>
              <span className="creator-pack-name">{row.creatorName}</span>
              <span className="creator-pack-bio">
                Website {row.webCount} {row.webCount === 1 ? "sale" : "sales"}, {formatSharePounds(row.webPence)}
              </span>
              <span className="creator-pack-price">
                Share sent {formatSharePounds(row.webSharePence)} (70% of sales)
              </span>
              {row.playWaitingCount > 0 ? (
                <>
                  <p className="creator-packs-note" data-creator-play-report>
                    App share owed {formatSharePounds(row.playWaitingPence)} from {row.playWaitingCount}{" "}
                    {row.playWaitingCount === 1 ? "sale" : "sales"}. Pay this once a month from Stripe. This desk does not send it.
                  </p>
                  <button type="button" className="creator-packs-primary" data-creator-pay-stripe disabled>
                    Pay via Stripe
                  </button>
                </>
              ) : (
                <p className="creator-packs-note">No app sales are waiting for this creator.</p>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
