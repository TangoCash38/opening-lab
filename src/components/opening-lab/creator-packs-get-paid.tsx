import { useState } from "react";
import { CONNECT_COUNTRIES } from "@/lib/creator-packs-content";
import { startCreatorConnect } from "@/lib/creator-packs-client";
import { CreatorPayoutBadge } from "./creator-packs-status";

type Props = {
  paymentsEnabled: boolean;
  payoutsReady: boolean;
  returned: boolean;
};

export function CreatorGetPaid({ paymentsEnabled, payoutsReady, returned }: Props) {
  const [country, setCountry] = useState("GB");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setup = () => {
    setBusy(true);
    setNotice(null);
    void startCreatorConnect(country).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      window.location.href = result.url;
    });
  };

  return (
    <section className="creator-packs-form" data-creator-get-paid>
      <div className="creator-pack-meta">
        <h2>Get paid with Stripe</h2>
        <CreatorPayoutBadge ready={payoutsReady} />
      </div>
      <p className="creator-packs-note">
        Players buy on Opening Lab&apos;s website or in the app. On the website, Stripe sends your share when the
        buyer pays. You keep 70% of every sale. Opening Lab keeps 30%. App sales, when that shop opens, are paid once
        a month.
      </p>
      <ol className="creator-payout-steps">
        <li>Choose your country, then tap Set up payouts.</li>
        <li>Stripe opens its own secure page where you add your name, ID and bank details. Opening Lab never sees your bank details.</li>
        <li>Once Stripe has verified you, website sales can send your 70% straight to that account.</li>
      </ol>
      <div className="creator-publish-reminder" data-creator-payout-hosted>
        <p className="creator-packs-kicker">Stripe</p>
        <h2>A secure page hosted by Stripe</h2>
        <p>
          Stripe asks for your name, ID and bank details on its own page. Opening Lab never sees them, and never
          stores them.
        </p>
      </div>
      {returned ? (
        <p className="creator-packs-note" role="status">
          Welcome back from Stripe. If your details are in, payouts show as set up.
        </p>
      ) : null}
      {!paymentsEnabled ? (
        <p className="creator-packs-note" role="status" data-creator-payout-notice>
          Payouts are not switched on in this preview yet. Opening Lab still needs its Stripe secret key, and Connect
          turned on. You can submit a pack before that is ready.
        </p>
      ) : null}
      {payoutsReady ? (
        <p className="creator-packs-note" data-creator-payout-ready>
          Payouts are set up. Website sales send your 70% through Stripe.
        </p>
      ) : (
        <>
          <label className="creator-packs-field">
            <span>Country</span>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              data-creator-connect-country
            >
              {CONNECT_COUNTRIES.map((row) => (
                <option key={row.code} value={row.code}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <p className="creator-packs-note">If your country is not listed, use Need help? and we will add it.</p>
          <button
            type="button"
            className="creator-packs-primary"
            data-creator-setup-payouts
            disabled={busy}
            onClick={setup}
          >
            {busy ? "Opening Stripe…" : "Set up payouts with Stripe"}
          </button>
        </>
      )}
      {notice ? (
        <p className="creator-packs-error" role="alert">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
