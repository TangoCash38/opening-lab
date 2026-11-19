import { Link } from "@tanstack/react-router";
import { useReviewPacks, type StoredPack } from "@/lib/creator-packs-review";
import { CreatorGetPaid } from "./creator-packs-get-paid";
import { CreatorPackStatus } from "./creator-packs-status";

function priceLabel(pack: StoredPack): string {
  if (pack.status === "live" && pack.finalPrice) return pack.finalPrice;
  return pack.suggestedPrice;
}

export function CreatorPacksDashboard() {
  const [packs] = useReviewPacks();
  const mine = packs.filter((pack) => pack.creatorName === "You");

  return (
    <div data-creator-packs-dashboard>
      <h1 className="creator-packs-title">Your packs</h1>
      <p className="creator-packs-lede">
        A pack in review is visible only to you. When Opening Lab sets it live, other players can see it too. This
        list stays on this device.
      </p>
      <CreatorGetPaid />
      <div className="creator-packs-grid">
        {mine.map((pack) => (
          <article key={pack.id} className="creator-pack-card" data-creator-own-pack={pack.id}>
            <span className="creator-pack-name">{pack.name}</span>
            <span className="creator-pack-bio">
              {pack.lineCount} {pack.lineCount === 1 ? "line" : "lines"}
              {pack.status === "returned" ? ". Have another look, then submit it again." : ""}
            </span>
            <span className="creator-pack-meta">
              <span className="creator-pack-price">{priceLabel(pack)}</span>
              <CreatorPackStatus status={pack.status} />
            </span>
            {pack.status === "review" ? (
              <p className="creator-only-note">Visible only to you</p>
            ) : null}
          </article>
        ))}
      </div>
      <Link to="/creator-packs/editor" className="creator-packs-primary creator-packs-primary-link">
        Open the pack editor
      </Link>
    </div>
  );
}
