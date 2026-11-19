import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import {
  DEMO_CREATORS,
  averageStars,
  demoCreator,
  demoPack,
  formatStars,
  packsForCreator,
  reviewsForCreator,
  reviewsForPack,
} from "@/data/creator-packs-demo";
import { CreatorAvatar } from "./creator-packs-frame";

export function StarReadout({
  value,
  count,
  compact = false,
}: {
  value: number;
  count: number;
  compact?: boolean;
}) {
  const filled = Math.round(value);
  const countLabel = `${count} ${count === 1 ? "review" : "reviews"}`;
  const label = compact ? `${formatStars(value)} stars` : `${formatStars(value)} from ${countLabel}`;
  return (
    <p className="creator-stars" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= filled ? "is-on" : undefined}>
          <Star
            className="size-4"
            strokeWidth={2.25}
            fill={star <= filled ? "currentColor" : "none"}
            aria-hidden
          />
        </span>
      ))}
      <span>{compact ? formatStars(value) : `${formatStars(value)} · ${countLabel}`}</span>
    </p>
  );
}

export function CreatorRatingsIndex() {
  return (
    <div data-creator-ratings-index>
      <h1 className="creator-packs-title">Ratings</h1>
      <p className="creator-packs-lede">
        Sample reviews only. Every name on this page is fictional, and nothing here was submitted by a player.
      </p>
      <div className="creator-packs-grid">
        {DEMO_CREATORS.map((creator) => {
          const reviews = reviewsForCreator(creator.id);
          return (
            <Link
              key={creator.id}
              to="/creator-packs/creator/$creatorId"
              params={{ creatorId: creator.id }}
              className="creator-pack-card"
              data-creator-rating-link={creator.id}
            >
              <span className="creator-pack-person">
                <CreatorAvatar name={creator.name} hue={creator.hue} />
                <span className="creator-pack-identity">
                  <span className="creator-pack-creator">
                    {creator.name}
                    <span className="creator-pack-sample-chip">Sample</span>
                  </span>
                  <span className="creator-pack-bio">{creator.bio}</span>
                </span>
              </span>
              <StarReadout value={averageStars(reviews)} count={reviews.length} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CreatorRatingsProfile({ creatorId }: { creatorId: string }) {
  const creator = demoCreator(creatorId);
  if (!creator) {
    return (
      <div data-creator-rating-missing>
        <h1 className="creator-packs-title">This sample creator is not in the preview</h1>
        <Link to="/creator-packs/ratings" className="creator-packs-primary creator-packs-primary-link">
          All sample ratings
        </Link>
      </div>
    );
  }

  const packs = packsForCreator(creator.id);
  const reviews = reviewsForCreator(creator.id);

  return (
    <article data-creator-rating-page={creator.id}>
      <p className="creator-packs-kicker">Creator ratings</p>
      <div className="creator-pack-person creator-pack-person--profile">
        <CreatorAvatar name={creator.name} hue={creator.hue} />
        <div className="creator-pack-identity">
          <h1 className="creator-packs-title">
            {creator.name}
            <span className="creator-pack-sample-chip">Sample</span>
          </h1>
          <p className="creator-pack-bio">{creator.bio}</p>
        </div>
      </div>
      <p className="creator-packs-about">{creator.about}</p>
      <h2 className="creator-packs-subhead">Across every pack</h2>
      <StarReadout value={averageStars(reviews)} count={reviews.length} />
      <p className="creator-packs-note">
        One rating for the creator, taken from the fictional reviews on all of their packs.
      </p>
      <h2 className="creator-packs-subhead">Each pack</h2>
      <ul className="creator-rating-packs">
        {packs.map((pack) => {
          const packReviews = reviewsForPack(pack.id);
          return (
            <li key={pack.id}>
              <Link to="/creator-packs/pack/$packId" params={{ packId: pack.id }}>
                <span className="creator-pack-name">{pack.name}</span>
                <StarReadout value={averageStars(packReviews)} count={packReviews.length} />
              </Link>
            </li>
          );
        })}
      </ul>
      <h2 className="creator-packs-subhead">What players wrote</h2>
      <ul className="creator-review-list">
        {reviews.map((review) => {
          const pack = demoPack(review.packId);
          return (
            <li key={review.id} data-creator-review={review.id}>
              <StarReadout value={review.stars} count={1} compact />
              <p className="creator-review-author">
                {review.author}
                <span className="creator-pack-sample-chip">Sample</span>
                {pack ? <span className="creator-review-pack">{pack.name}</span> : null}
              </p>
              <p className="creator-review-text">{review.text}</p>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
