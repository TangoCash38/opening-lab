import { useEffect, useState } from "react";
import { formatPackPrice, useReviewPacks, type StoredPack } from "@/lib/creator-packs-review";
import { CreatorPackStatus } from "./creator-packs-status";

export function CreatorPacksAdmin() {
  const [packs, replace, ready] = useReviewPacks();
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
    </div>
  );
}
