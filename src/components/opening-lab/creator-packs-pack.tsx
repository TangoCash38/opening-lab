import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import {
  creatorForPack,
  demoPack,
  formatDemoPlies,
} from "@/data/creator-packs-demo";
import { useT } from "@/lib/i18n";
import { CreatorAvatar } from "./creator-packs-frame";

export function CreatorPacksPack({ packId }: { packId: string }) {
  const t = useT();
  const pack = demoPack(packId);
  const [previewNote, setPreviewNote] = useState(false);

  if (!pack) {
    return (
      <div data-creator-pack-missing>
        <h1 className="creator-packs-title">This sample is not in the preview</h1>
        <p className="creator-packs-lede">The fictional catalogue has three packs.</p>
        <Link to="/creator-packs" className="creator-packs-primary creator-packs-primary-link">
          Back to creator packs
        </Link>
      </div>
    );
  }

  const creator = creatorForPack(pack);

  return (
    <article data-creator-pack-page={pack.id}>
      <p className="creator-packs-kicker">Creator pack</p>
      <h1 className="creator-packs-title">{pack.name}</h1>
      <div className="creator-pack-person creator-pack-person--profile">
        <CreatorAvatar name={creator.name} hue={creator.hue} />
        <div className="creator-pack-identity">
          <p className="creator-pack-creator">
            {creator.name}
            <span className="creator-pack-sample-chip">Sample</span>
          </p>
          <p className="creator-pack-bio">{creator.bio}</p>
        </div>
      </div>
      <p className="creator-packs-about">{creator.about}</p>
      <p className="creator-packs-lede">{pack.blurb}</p>
      <div className="creator-pack-buybox">
        <div className="creator-pack-meta">
          <span className="creator-pack-price">{pack.price}</span>
          <span className="creator-pack-badge">10 lines</span>
        </div>
        <button
          type="button"
          className="creator-packs-primary"
          data-creator-buy
          onClick={() => setPreviewNote(true)}
        >
          Preview only
        </button>
        {previewNote ? (
          <p className="creator-packs-note" role="status" data-creator-preview-note>
            Purchases are switched off in this preview. No payment is taken.
          </p>
        ) : (
          <p className="creator-packs-note">
            Line 1 is free to read. Lines 2 to 10 stay locked, as they would after a real purchase screen.
          </p>
        )}
      </div>
      <h2 className="creator-packs-subhead">The 10 lines</h2>
      <ol className="creator-line-list">
        {pack.lines.map((line, index) => {
          const locked = index > 0;
          return (
            <li
              key={line.name}
              className={`creator-line${locked ? " is-locked" : ""}`}
              data-creator-line={index + 1}
              data-locked={locked ? "true" : "false"}
            >
              <span className={`creator-line-index${locked ? " is-locked" : ""}`}>{index + 1}</span>
              <span className="creator-line-body">
                <span className="creator-line-name">
                  {line.name}
                  {locked ? (
                    <span className="creator-line-lock">
                      <Lock className="size-3" strokeWidth={2.5} aria-hidden />
                      {t("Locked")}
                    </span>
                  ) : (
                    <span className="creator-line-free">{t("Free")}</span>
                  )}
                </span>
                {!locked && line.plies ? (
                  <span className="creator-line-moves">{formatDemoPlies(line.plies)}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
