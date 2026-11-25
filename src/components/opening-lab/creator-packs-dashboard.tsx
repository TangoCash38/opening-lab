import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { fetchCreatorMine, type CreatorDesk } from "@/lib/creator-packs-client";
import { formatSharePounds } from "@/lib/creator-packs-payout";
import { CreatorGetPaid } from "./creator-packs-get-paid";
import { CreatorPromoteNote } from "./creator-packs-promote";
import { CreatorPackStatus } from "./creator-packs-status";

export function CreatorPacksDashboard() {
  const [desk, setDesk] = useState<CreatorDesk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [returned, setReturned] = useState(false);

  useEffect(() => {
    setReturned(new URLSearchParams(window.location.search).get("stripe") === "return");
    let cancelled = false;
    void fetchCreatorMine().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDesk(result.desk);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div data-creator-packs-dashboard>
        <h1 className="creator-packs-title">Your packs</h1>
        <p className="creator-packs-error" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!desk) {
    return (
      <div data-creator-packs-dashboard>
        <h1 className="creator-packs-title">Your packs</h1>
        <p className="creator-packs-note">Loading your packs…</p>
      </div>
    );
  }

  if (!desk.signedIn) {
    return (
      <div data-creator-packs-dashboard>
        <h1 className="creator-packs-title">Your packs</h1>
        <p className="creator-packs-lede">Sign in with your Opening Lab account to see the packs you have submitted.</p>
        <a href="/login?next=/creator-packs/dashboard" className="creator-packs-primary creator-packs-primary-link">
          Sign in
        </a>
      </div>
    );
  }

  const sales = desk.sales;

  return (
    <div data-creator-packs-dashboard>
      <h1 className="creator-packs-title">Your packs</h1>
      <p className="creator-packs-lede">
        A pack in review is visible only to you. When Opening Lab sets it live, other players can see it too. You keep 70% of every sale.
      </p>
      {desk.profile ? <CreatorPromoteNote creatorId={desk.profile.userId} /> : <CreatorPromoteNote />}
      {!desk.profile ? (
        <p className="creator-packs-note">
          <Link to="/creator-packs/become">Add the name you want on your packs</Link> before you submit one.
        </p>
      ) : null}
      <CreatorGetPaid
        paymentsEnabled={desk.paymentsEnabled}
        payoutsReady={desk.profile?.payoutsReady === true}
        returned={returned}
      />
      {sales.count > 0 ? (
        <p className="creator-packs-note" data-creator-sales>
          Website: {sales.count} {sales.count === 1 ? "sale" : "sales"}, {formatSharePounds(sales.amountPence)}. Your share {formatSharePounds(sales.sharePence)}, sent through Stripe.
        </p>
      ) : (
        <p className="creator-packs-note" data-creator-sales>
          No website sales yet. When a player buys a live pack, your 70% is sent through Stripe.
        </p>
      )}
      <p className="creator-packs-note" data-creator-play-sales>
        {sales.playWaitingCount > 0
          ? `App sales waiting: ${sales.playWaitingCount}, share ${formatSharePounds(sales.playWaitingPence)}. Paid once a month.`
          : "No app sales are waiting. Those will be paid once a month when the Google Play shop opens."}
      </p>
      <div className="creator-packs-grid">
        {desk.packs.map((pack) => (
          <article key={pack.id} className="creator-pack-card" data-creator-own-pack={pack.id}>
            <Link to="/creator-packs/pack/$packId" params={{ packId: pack.id }} className="creator-pack-name">
              {pack.name}
            </Link>
            <span className="creator-pack-bio">
              {pack.lineCount} {pack.lineCount === 1 ? "line" : "lines"}
              {pack.status === "returned" ? ". Have another look, then submit a fresh pack." : ""}
            </span>
            <span className="creator-pack-meta">
              <span className="creator-pack-price">
                {pack.status === "live" && pack.finalPrice ? pack.finalPrice : pack.suggestedPrice}
              </span>
              <CreatorPackStatus status={pack.status} />
            </span>
            {pack.status === "review" ? <p className="creator-only-note">Visible only to you</p> : null}
            {pack.status === "returned" && pack.reviewNote ? (
              <p className="creator-packs-note" data-creator-return-reason>
                Opening Lab sent this back: {pack.reviewNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>
      {desk.packs.length === 0 ? (
        <p className="creator-packs-note">You have not submitted a pack yet.</p>
      ) : null}
      <Link to="/creator-packs/editor" className="creator-packs-primary creator-packs-primary-link">
        Open the pack editor
      </Link>
    </div>
  );
}
