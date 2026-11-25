import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { CreatorHue } from "@/data/creator-packs-demo";
import { fetchCreatorProfile } from "@/lib/creator-packs-client";
import { CreatorAvatar } from "./creator-packs-frame";

function hueFor(name: string): CreatorHue {
  const hues: CreatorHue[] = ["accent", "gold", "success"];
  let n = 0;
  for (const ch of name) n += ch.charCodeAt(0);
  return hues[n % hues.length]!;
}

export function CreatorPublicProfile({ creatorId }: { creatorId: string }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [packs, setPacks] = useState<
    { id: string; name: string; priceLabel: string; badge: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchCreatorProfile(creatorId).then((result) => {
      if (cancelled) return;
      setReady(true);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName(result.creator.name);
      setBio(result.creator.bio);
      setPacks(result.packs);
    });
    return () => {
      cancelled = true;
    };
  }, [creatorId]);

  if (!ready) return <p className="creator-packs-note">Loading this creator…</p>;
  if (error) {
    return (
      <div>
        <h1 className="creator-packs-title">This creator is not available</h1>
        <p className="creator-packs-lede">{error}</p>
      </div>
    );
  }

  return (
    <div data-creator-public={creatorId}>
      <div className="creator-pack-person creator-pack-person--profile">
        <CreatorAvatar name={name} hue={hueFor(name)} />
        <div className="creator-pack-identity">
          <h1 className="creator-packs-title">{name}</h1>
          {bio ? <p className="creator-pack-bio">{bio}</p> : null}
        </div>
      </div>
      <p className="creator-packs-note">Live packs only. A pack in review stays with the creator.</p>
      {packs.length === 0 ? <p className="creator-packs-note">No live packs from this creator yet.</p> : null}
      <div className="creator-packs-grid">
        {packs.map((pack) => (
          <Link
            key={pack.id}
            to="/creator-packs/pack/$packId"
            params={{ packId: pack.id }}
            className="creator-pack-card"
          >
            <span className="creator-pack-name">{pack.name}</span>
            <span className="creator-pack-meta">
              <span className="creator-pack-price">{pack.priceLabel}</span>
              <span className="creator-pack-badge">{pack.badge}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
