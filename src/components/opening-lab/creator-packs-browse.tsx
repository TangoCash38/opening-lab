import { Link } from "@tanstack/react-router";
import { DEMO_PACKS, creatorForPack } from "@/data/creator-packs-demo";
import { CreatorAvatar } from "./creator-packs-frame";

export function CreatorPacksBrowse() {
  return (
    <div data-creator-packs-browse>
      <h1 className="creator-packs-title">Creator packs</h1>
      <p className="creator-packs-lede">
        Coaches, titled players and chess YouTubers build an opening pack, a puzzle, or any part of a game.
        Players study it under that name. The first line is free.
      </p>
      <div className="creator-packs-grid">
        {DEMO_PACKS.map((pack) => {
          const creator = creatorForPack(pack);
          return (
            <article key={pack.id} className="creator-pack-card" data-creator-pack={pack.id}>
              <Link
                to="/creator-packs/creator/$creatorId"
                params={{ creatorId: creator.id }}
                className="creator-pack-person"
              >
                <CreatorAvatar name={creator.name} hue={creator.hue} />
                <span className="creator-pack-identity">
                  <span className="creator-pack-creator">
                    {creator.name}
                    <span className="creator-pack-sample-chip">Sample</span>
                  </span>
                  <span className="creator-pack-bio">{creator.bio}</span>
                </span>
              </Link>
              <Link
                to="/creator-packs/pack/$packId"
                params={{ packId: pack.id }}
                className="creator-pack-open"
              >
                <span className="creator-pack-name">{pack.name}</span>
                <span className="creator-pack-meta">
                  <span className="creator-pack-price">{pack.price}</span>
                  <span className="creator-pack-badge">{pack.badge}</span>
                </span>
              </Link>
            </article>
          );
        })}
      </div>
      <Link to="/creator-packs/become" className="creator-packs-pitch" data-creator-packs-pitch>
        <span className="creator-packs-kicker">For coaches</span>
        <span className="creator-pack-name">Build a pack under your name</span>
        <span className="creator-pack-bio">
          You keep 70% of the sale. A link you share pays a better split.
        </span>
      </Link>
    </div>
  );
}
