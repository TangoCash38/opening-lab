import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/opening-lab/legal-page";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Opening Lab is a chess opening memory trainer run by Sean Paul in the
        United Kingdom. This page explains what we collect and why, in plain
        English.
      </p>

      <LegalSection title="Who we are">
        <p>
          Opening Lab is operated by Sean Paul, United Kingdom. Website:{" "}
          <a href="https://www.openinglab.co.uk" className="text-accent">
            www.openinglab.co.uk
          </a>
          . Email:{" "}
          <a href="mailto:support@openinglab.co.uk" className="text-accent">
            support@openinglab.co.uk
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <p>We keep this small:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your account email, if you sign in.</li>
          <li>
            Payment is handled by Stripe. We never see your full card number.
          </li>
          <li>
            Training progress (lines you have learned, streaks, and unlocks)
            stays on your device.
          </li>
          <li>
            Necessary cookies so the site can stay signed in and work properly.
            We do not use advertising cookies.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Why we collect it">
        <p>
          We use this information to run your account, take payment, unlock the
          packs you buy, and keep the trainer working. We do not sell your
          data.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Account email: while you have an account, and for a short time
            after if you ask us to delete it so we can finish the request.
          </li>
          <li>
            Payments: Stripe keeps payment records as the law requires. We do
            not store card numbers.
          </li>
          <li>
            Progress on your device: until you clear your browser data.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Stripe">
        <p>
          Stripe is our payment processor. When you pay, you send card details
          to Stripe, not to us. Stripe acts as a processor for that payment.
          See Stripe’s own privacy policy for how they handle card data.
        </p>
      </LegalSection>

      <LegalSection title="Your rights (UK GDPR)">
        <p>
          You can ask us for a copy of the data we hold, ask us to correct it,
          or ask us to delete it. You can also complain to the Information
          Commissioner’s Office (ICO) if you are unhappy with how we handle
          your data.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Email{" "}
          <a href="mailto:support@openinglab.co.uk" className="text-accent">
            support@openinglab.co.uk
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
