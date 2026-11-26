import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { CreatorHue } from "@/data/creator-packs-demo";
import { fetchCreatorCatalogue, type CataloguePack } from "@/lib/creator-packs-client";
import { CreatorAvatar } from "./creator-packs-frame";
import { MakerBadge } from "./maker-badge";

function hueFor(name: string): CreatorHue {
  const hues: CreatorHue[] = ["accent", "gold", "success"];
  let n = 0;
  for (const ch of name) n += ch.charCodeAt(0);
  return hues[n % hues.length]!;
}

export function CreatorPacksBrowse() {
  const [packs, setPacks] = useState<CataloguePack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchCreatorCatalogue().then((result) => {
      if (cancelled) return;
      setReady(true);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPacks(result.packs);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div data-creator-packs-browse>
      <h1 className="creator-packs-title">Creator packs</h1>
      <p className="creator-packs-lede">
        Coaches and players publish a pack under their name and set its price. Opening Lab reviews every pack before
        it goes on sale. The first line is free to try.
      </p>
      {error ? (
        <p className="creator-packs-error" role="alert">
          {error}
        </p>
      ) : null}
      {!ready && !error ? <p className="creator-packs-note">Loading packs…</p> : null}
      {ready && !error && packs.length === 0 ? (
        <p className="creator-packs-note" data-creator-packs-empty>
          No creator packs are live yet. When one is approved, it will show here.
        </p>
      ) : null}
      <div className="creator-packs-grid">
        {packs.map((pack) => (
          <article key={pack.id} className="creator-pack-card" data-creator-pack={pack.id}>
            <Link
              to="/creator-packs/creator/$creatorId"
              params={{ creatorId: pack.creatorId }}
              className="creator-pack-person"
            >
              <CreatorAvatar name={pack.creatorName} hue={hueFor(pack.creatorName)} />
              <span className="creator-pack-identity">
                <span className="creator-pack-creator">{pack.creatorName}</span>
                <span className="creator-pack-bio">{pack.bio || "Creator on Opening Lab"}</span>
              </span>
            </Link>
            <Link to="/creator-packs/pack/$packId" params={{ packId: pack.id }} className="creator-pack-open">
              <span className="maker-badge-row">
                <span className="creator-pack-name">{pack.name}</span>
                <MakerBadge name={pack.creatorName} />
              </span>
              <span className="creator-pack-meta">
                <span className="creator-pack-price">{pack.priceLabel}</span>
                <span className="creator-pack-badge">{pack.badge}</span>
              </span>
            </Link>
          </article>
        ))}
      </div>
      <Link to="/creator-packs/become" className="creator-packs-pitch" data-creator-packs-pitch>
        <span className="creator-packs-kicker">For coaches</span>
        <span className="creator-pack-name">Build a pack under your name</span>
        <span className="creator-pack-bio">You keep 70% of every sale. Players buy on Opening Lab.</span>
      </Link>
    </div>
  );
}
