import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/opening-lab/legal-page";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        These terms cover your use of Opening Lab, a strict chess opening
        memory trainer.
      </p>

      <LegalSection title="The product">
        <p>
          Opening Lab helps you memorise set opening lines. You play only the
          book moves for the line you chose. It is not rated play, not a chess
          engine, and not a social or puzzle site.
        </p>
      </LegalSection>

      <LegalSection title="Prices (GBP)">
        <ul className="list-disc space-y-1 pl-5">
          <li>Scotch is free.</li>
          <li>
            Other packs are £1 or £1.99, one-time. They stay on your account.
          </li>
          <li>
            Opening Lab+ is £4.99 a month or £29.99 a year and unlocks every
            pack while the plan is active.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Opening Lab+">
        <p>
          You can cancel Lab+ at any time. When a plan ends, Lab+ access ends
          and packs you have not bought lock again. Packs you already bought
          stay unlocked on your account.
        </p>
      </LegalSection>

      <LegalSection title="Google Play">
        <p>
          In the Opening Lab app from Google Play, Lab+ is a yearly
          subscription billed by Google. It auto-renews until you cancel in
          Google Play. Packs are sold on the website only. Website Lab+ and
          pack purchases use Stripe, not Google Play.
        </p>
      </LegalSection>

      <LegalSection title="Pay as you go packs">
        <p>
          A pack is a one-time digital purchase. It stays on your account, so
          it follows you to another phone when you sign in. If Lab+ ends,
          those packs still stay.
        </p>
      </LegalSection>

      <LegalSection title="Cooling-off (UK)">
        <p>
          You have 14 days to cancel a digital purchase if you have not used
          the digital content. Once you start training a paid line, that
          14-day right ends for that purchase.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may add, change, or remove packs and lines. We will not take away
          a pack you already paid for on your account, except where we must
          for legal reasons.
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
          for problems caused by your device, your internet, or Stripe’s
          payment systems. If something goes wrong that is our fault, the most
          we will pay is the amount you paid us for Opening Lab in the 12
          months before the claim (or a reasonable amount if you paid
          nothing). We do not limit liability for death or personal injury
          caused by our negligence, or for fraud.
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
