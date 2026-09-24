import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/opening-lab/legal-page";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms of Use" updated="24 September 2026">
      <p>
        These terms cover your use of Opening Lab, a strict chess opening
        trainer.
      </p>

      <LegalSection title="The product">
        <p>
          Opening Lab helps you memorise set opening lines. You play only the
          book move for the line you chose. Practice uses a green hint. Test
          has none. When the book line ends, you reset or pick another line.
          It is not rated play, not an online chess game against other
          people, and not a puzzle or social site.
        </p>
      </LegalSection>

      <LegalSection title="The catalog">
        <p>
          Scotch Gambit is available now. The other opening packs are coming
          soon with Professor Potato Pie and are not for sale until they
          relaunch. If you already own a pack, it stays unlocked. Buy all
          packs for £19.99 (UK) is not on sale while those packs are coming
          soon. Prices include VAT where it applies.
        </p>
        <p>
          When a pack is on sale in the Opening Lab app from Google Play, it
          is a one-time purchase via Google Play Billing. When a pack is on
          sale on the website, it is a one-time purchase via Stripe. There is
          no Lab+ subscription.
        </p>
      </LegalSection>

      <LegalSection title="Buy all packs">
        <p>
          Buy all packs for £19.99 is not on sale while other opening packs
          are coming soon. Purchases already made stay on your account. When
          it is on sale, it is a one-time purchase (Google Play Billing in the
          Play app, or Stripe on the website). It is not a lifetime licence
          and we do not sell lifetime access.
        </p>
        <p>
          What you get: full access on your account to every opening pack on
          the website at the time of purchase, and to packs we later add to
          that Buy all offer, for as long as we keep Opening Lab available to
          you.
        </p>
        <p>
          We guarantee that access for at least 12 months from the purchase
          date. We will try to keep the service running after that. If we stop
          the service or end that access more than 12 months after your Buy
          all purchase, no further refund is due for that purchase because of
          the stop or change, except where UK law says otherwise.
        </p>
        <p>
          Buy all does not change the 14-day cooling-off rules below. Nothing
          in these terms takes away your rights as a UK consumer.
        </p>
      </LegalSection>

      <LegalSection title="Who makes Opening Lab">
        <p>
          Opening Lab is built by a hobbyist developer with a strong interest
          in chess and software. We take care with the lines we publish, but
          Opening Lab is an educational trainer, not a guarantee of
          master-level or error-free opening theory.
        </p>
      </LegalSection>

      <LegalSection title="Opening content">
        <p>
          Some lines may contain mistakes or may not match every book or
          engine source. We reserve the right that opening content can include
          errors even when we have taken reasonable care. Nothing in this
          section takes away your rights as a UK consumer.
        </p>
      </LegalSection>

      <LegalSection title="Wrong book moves">
        <p>
          Only the book move for the line you chose counts in the trainer. If
          you think a rejected move is a real book move, or that a published
          line is wrong, report it in the app (Wrong move?) or email{" "}
          <a href="mailto:support@openinglab.co.uk" className="text-accent">
            support@openinglab.co.uk
          </a>.
        </p>
        <p>
          We will check it. If we agree the published line or rejection is
          wrong, we will fix it, refund that pack purchase (or an equivalent
          credit if you unlocked it through Buy all), and thank you for
          helping improve Opening Lab. We decide whether the move or line is
          wrong for this product.
        </p>
        <p>
          For Google Play purchases, any cash refund still follows Google
          Play’s refund process where Google must issue it; we will help with
          that when we agree the content was wrong.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          Your account is for you. You may stay signed in on up to two
          devices at once. Do not share your email or password. If you sign
          in on a third device, we sign the oldest one out. Packs you buy
          stay on your account. Training progress stays on each device, so
          it does not move when you sign in somewhere else.
        </p>
      </LegalSection>

      <LegalSection title="Payments and refunds">
        <p>
          Website purchases are charged by Stripe. For website purchases, the
          UK cooling-off rules below apply.
        </p>
        <p>
          Play app purchases are charged by Google. Refunds and cancellations
          for Google Play purchases are handled under Google Play’s refund
          rules. Deleting your Opening Lab account does not by itself refund a
          Google Play purchase.
        </p>
        <p>
          Pack unlocks stay on your Opening Lab account so you can use them
          when signed in on the website or in the app, subject to these terms.
        </p>
      </LegalSection>

      <LegalSection title="Cooling-off (UK)">
        <p>
          You have 14 days to cancel a digital purchase if you have not used
          the digital content. Once you start training a paid line, that
          14-day right ends for that purchase. For purchases made through
          Google Play, Google’s refund process applies.
        </p>
      </LegalSection>

      <LegalSection title="Google Play">
        <p>
          The Opening Lab app from Google Play is the same trainer as the
          website. In the Play app, packs and Buy all are sold as one-time
          in-app purchases via Google Play Billing. There is no Lab+
          subscription. Website purchases use Stripe.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may add, change, or remove packs and lines. Training progress
          stays on your device unless you clear it.
        </p>
      </LegalSection>

      <LegalSection title="No rated play">
        <p>
          Opening Lab does not offer rated games, rankings, or online play
          against other people.
        </p>
      </LegalSection>

      <LegalSection title="Our responsibility">
        <p>
          Nothing here takes away your rights as a UK consumer. We are
          responsible for providing the service with reasonable care. We are
          not responsible for losses we could not reasonably have expected, or
          for problems caused by your device, your internet, or a payment
          provider. If something goes wrong that is our fault, the most we
          will pay is the amount you paid us for Opening Lab in the 12 months
          before the claim (or a reasonable amount if you paid nothing). We do
          not limit liability for death or personal injury caused by our
          negligence, or for fraud.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions:{" "}
          <a href="mailto:support@openinglab.co.uk" className="text-accent">
            support@openinglab.co.uk
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
