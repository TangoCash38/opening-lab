import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Star } from "lucide-react";
import {
  averageStars,
  creatorForPack,
  demoPack,
  formatDemoPlies,
  formatStars,
  modeLabel,
  reviewsForPack,
} from "@/data/creator-packs-demo";
import { useT } from "@/lib/i18n";
import { CreatorAvatar } from "./creator-packs-frame";
import { StarReadout } from "./creator-packs-ratings";
import { CreatorPackStudy } from "./creator-packs-study";

export function CreatorPacksPack({ packId }: { packId: string }) {
  const t = useT();
  const pack = demoPack(packId);
  const [previewNote, setPreviewNote] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [rated, setRated] = useState(false);

  if (!pack) {
    return (
      <div data-creator-pack-missing>
        <h1 className="creator-packs-title">This sample is not in the preview</h1>
        <p className="creator-packs-lede">The fictional catalogue is a short one.</p>
        <Link to="/creator-packs" className="creator-packs-primary creator-packs-primary-link">
          Back to creator packs
        </Link>
      </div>
    );
  }

  const creator = creatorForPack(pack);
  const openLine = pack.lines[0];
  const reviews = reviewsForPack(pack.id);
  const score = averageStars(reviews);

  return (
    <article data-creator-pack-page={pack.id}>
      <p className="creator-packs-kicker">Creator pack</p>
      <h1 className="creator-packs-title">{pack.name}</h1>
      <div className="creator-pack-person creator-pack-person--profile">
        <CreatorAvatar name={creator.name} hue={creator.hue} />
        <div className="creator-pack-identity">
          <p className="creator-pack-creator">
            <Link to="/creator-packs/creator/$creatorId" params={{ creatorId: creator.id }}>
              {creator.name}
            </Link>
            <span className="creator-pack-sample-chip">Sample</span>
          </p>
          <p className="creator-pack-bio">{creator.bio}</p>
        </div>
      </div>
      {openLine?.plies ? (
        <CreatorPackStudy
          title={openLine.name}
          mode={openLine.mode}
          plies={openLine.plies}
          comments={openLine.comments ?? []}
          fen={openLine.fen}
          side={openLine.fen?.split(" ")[1] === "b" ? "b" : "w"}
        />
      ) : null}
      <p className="creator-packs-lede">{pack.blurb}</p>
      <div className="creator-pack-buybox">
        <div className="creator-pack-meta">
          <span className="creator-pack-price">{pack.price}</span>
          <span className="creator-pack-badge">{pack.badge}</span>
        </div>
        <StarReadout value={score} count={reviews.length} />
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
            {pack.lines.length > 1
              ? "Line 1 is free to try. The other lines stay locked."
              : "This sample is free to try."}
          </p>
        )}
      </div>
      <h2 className="creator-packs-subhead">
        {pack.lines.length === 10 ? "The 10 lines" : "In this sample"}
      </h2>
      <ol className="creator-line-list">
        {pack.lines.map((line, index) => {
          const locked = index > 0;
          return (
            <li
              key={line.name}
              className={`creator-line${locked ? " is-locked" : ""}`}
              data-creator-line={index + 1}
              data-locked={locked ? "true" : "false"}
              data-creator-line-mode={line.mode}
            >
              <span className={`creator-line-index${locked ? " is-locked" : ""}`}>{index + 1}</span>
              <span className="creator-line-body">
                <span className="creator-line-name">
                  {line.name}
                  <span className="creator-line-mode">{modeLabel(line.mode)}</span>
                  {line.fen && !line.fen.startsWith("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR") ? (
                    <span className="creator-line-mode">Own position</span>
                  ) : null}
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
                  <span className="creator-line-moves">{formatDemoPlies(line.plies, line.fen)}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>

      <h2 className="creator-packs-subhead">Reviews</h2>
      <p className="creator-packs-note">
        {formatStars(score)} from fictional players.{" "}
        <Link to="/creator-packs/creator/$creatorId" params={{ creatorId: creator.id }}>
          All of {creator.name}&apos;s ratings
        </Link>
      </p>
      <ul className="creator-review-list">
        {reviews.map((review) => (
          <li key={review.id}>
            <p className="creator-review-author">
              {review.author}
              <span className="creator-pack-sample-chip">Sample</span>
            </p>
            <p className="creator-review-text">{review.text}</p>
          </li>
        ))}
      </ul>

      <form
        className="creator-packs-form"
        data-creator-rate
        onSubmit={(event) => {
          event.preventDefault();
          if (stars < 1) return;
          setRated(true);
        }}
      >
        <h2>Rate this pack</h2>
        <p className="creator-packs-note">A sample form. Your stars and comment stay on this screen.</p>
        <div className="creator-rate-stars" role="group" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={star <= stars ? "is-on" : undefined}
              aria-pressed={star <= stars}
              aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
              data-creator-star={star}
              onClick={() => setStars(star)}
            >
              <Star className="size-5" strokeWidth={2.25} fill={star <= stars ? "currentColor" : "none"} aria-hidden />
            </button>
          ))}
        </div>
        <label className="creator-packs-field">
          <span>Comment</span>
          <textarea
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            data-creator-rate-comment
          />
        </label>
        {rated ? (
          <p className="creator-packs-note" role="status" data-creator-rated>
            Thank you. This preview has not stored your rating.
          </p>
        ) : (
          <button type="submit" className="creator-packs-primary" disabled={stars < 1}>
            Send rating
          </button>
        )}
      </form>
    </article>
  );
}
