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
        trainer.
      </p>

      <LegalSection title="The product">
        <p>
          Opening Lab helps you memorise set opening lines. You play only the
          book move for the line you chose. Practice uses a yellow hint. Test
          has none. After Practice or Test you can Play on from that setup
          against a weak engine at a strength you pick (about 800, 1200, or
          1800). It is not rated play, not an online chess game against other
          people, and not a puzzle or social site.
        </p>
      </LegalSection>

      <LegalSection title="The catalog">
        <p>
          There are twenty opening packs. Caro-Kann for Black is the home
          sample. The other packs sit under More packs. Packs are currently
          free. There is no subscription, and the app does not bill through
          Google Play.
        </p>
      </LegalSection>

      <LegalSection title="If we add paid packs">
        <p>
          If we later sell packs, they will be one-time purchases on this
          website. They stay on your account when you sign in. We will not
          take away a pack you already paid for, except where we must for
          legal reasons.
        </p>
      </LegalSection>

      <LegalSection title="Cooling-off (UK)">
        <p>
          You have 14 days to cancel a digital purchase if you have not used
          the digital content. Once you start training a paid line, that
          14-day right ends for that purchase.
        </p>
      </LegalSection>

      <LegalSection title="Google Play">
        <p>
          The Opening Lab app from Google Play is the same trainer as the
          website. There is no in-app subscription and no pack billing through
          Google Play at the moment.
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
