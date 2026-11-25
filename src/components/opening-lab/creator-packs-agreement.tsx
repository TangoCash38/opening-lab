import { Link } from "@tanstack/react-router";
import { CREATOR_AGREEMENT_VERSION } from "@/lib/creator-packs-agreement";

export function CreatorPacksAgreement() {
  return (
    <article data-creator-agreement>
      <p className="creator-packs-kicker">Creator agreement</p>
      <h1 className="creator-packs-title">Creator agreement</h1>
      <p className="creator-packs-note" data-creator-solicitor>
        This agreement should be checked by a solicitor before creator packs open to the public. It is the working
        text for this private preview. Text dated {CREATOR_AGREEMENT_VERSION}.
      </p>
      <ul className="creator-packs-points">
        <li>
          <h2>Your share</h2>
          <p>
            You keep 70% of every sale. Opening Lab keeps 30%. The same split applies to every sale. There is no
            second rate.
          </p>
        </li>
        <li>
          <h2>Review and price</h2>
          <p>
            You set the price. Free keeps the pack open, or you choose an amount. Opening Lab reviews every pack and may adjust the price or the writing before anyone else can buy it. You can see your own pack as soon as you submit it.
          </p>
        </li>
        <li>
          <h2>Where sales happen</h2>
          <p>
            Players buy only on Opening Lab, on the website or later in the app. Do not put a website address, an
            outside checkout, or an affiliate or referral link in a pack, a name, or a comment.
          </p>
        </li>
        <li>
          <h2>Payouts</h2>
          <p>
            Website sales are paid through Stripe Connect. Stripe hosts the page where you add bank details. Opening
            Lab does not see or store those details. Your 70% is sent when the buyer pays.
          </p>
        </li>
        <li>
          <h2>App sales</h2>
          <p>
            Sales in the Google Play app, when that shop opens, are paid once a month from Opening Lab&apos;s Stripe
            account. They are not sent at the moment of sale.
          </p>
        </li>
        <li>
          <h2>Your content</h2>
          <p>
            You confirm that you own the lines and comments, or that you have permission to publish them, and that
            they are accurate to the best of your knowledge.
          </p>
        </li>
        <li>
          <h2>Removal</h2>
          <p>
            Opening Lab may send a pack back, or remove it, if it breaks this agreement or is not fit to publish.
          </p>
        </li>
        <li>
          <h2>Refunds</h2>
          <p>
            If a buyer is refunded, your share of that refund is reversed. A full refund removes the buyer&apos;s
            access to the pack.
          </p>
        </li>
        <li>
          <h2>Tax</h2>
          <p>Tax on your share is your responsibility. Opening Lab does not withhold tax for you.</p>
        </li>
      </ul>
      <p className="creator-packs-note">
        <Link to="/creator-packs/editor">Back to the pack editor</Link>
      </p>
    </article>
  );
}
