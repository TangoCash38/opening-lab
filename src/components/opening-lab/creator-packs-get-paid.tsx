import { useState } from "react";
import { useCreatorPayout } from "@/lib/creator-packs-payout";
import { CreatorPayoutBadge } from "./creator-packs-status";

export function CreatorGetPaid() {
  const { youReady, hydrated, markReady } = useCreatorPayout();
  const [hosted, setHosted] = useState(false);

  const setup = () => {
    markReady();
    setHosted(true);
  };

  return (
    <section className="creator-packs-form" data-creator-get-paid>
      <div className="creator-pack-meta">
        <h2>Get paid with Stripe</h2>
        <CreatorPayoutBadge ready={youReady} />
      </div>
      <p className="creator-packs-note">
        Players buy on Opening Lab&apos;s website or in the app. Opening Lab pays your share from its Stripe account, once a month.
      </p>
      <ol className="creator-payout-steps">
        <li>Tap Set up payouts.</li>
        <li>
          Stripe opens its own secure page where you add your name, ID and bank details. Opening Lab never sees your bank details.
        </li>
        <li>
          Once Stripe has verified you, you are ready. You keep 70% of every sale, paid to your bank each month.
        </li>
      </ol>
      {hosted ? (
        <div className="creator-publish-reminder" data-creator-payout-hosted role="status">
          <p className="creator-packs-kicker">Stripe</p>
          <h2>A secure page hosted by Stripe</h2>
          <p>
            This preview stands in for the page Stripe hosts. Stripe would ask for your name, ID and bank details
            here. Opening Lab never sees them.
          </p>
          <p>Payouts are marked set up on this device. Nothing was sent.</p>
        </div>
      ) : null}
      {youReady && !hosted ? (
        <p className="creator-packs-note" data-creator-payout-ready>
          Payouts are set up. Your share would go to your bank each month.
        </p>
      ) : null}
      {!youReady ? (
        <button
          type="button"
          className="creator-packs-primary"
          data-creator-setup-payouts
          disabled={!hydrated}
          onClick={setup}
        >
          Set up payouts with Stripe
        </button>
      ) : null}
    </section>
  );
}
