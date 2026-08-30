import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/opening-lab/legal-page";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Opening Lab is a chess opening trainer run by Sean Paul in the United
        Kingdom. This page explains what we collect and why, in plain English.
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
          <li>
            Your account email is stored on our servers if you sign in.
          </li>
          <li>
            Training progress (which lines are green) stays on your device.
          </li>
          <li>
            If you later buy a pack on the website, that unlock is stored on
            your account so it follows you when you sign in. Website payments
            go through Stripe. We never see your full card number.
          </li>
          <li>
            If you later install from Google Play, Google handles that store
            payment. Play purchases (when offered) are taken by Google.
          </li>
          <li>
            Necessary cookies so you can stay signed in and the site can work.
            Vercel Analytics records page views. We do not use advertising
            cookies.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Why we collect it">
        <p>
          We use this information to run your account and keep the trainer
          working. If you pay on the website, we use it to record that
          purchase. We do not sell your data.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Account email: while you have an account, and for a short time
            after if you ask us to delete it so we can finish the request.
          </li>
          <li>
            Paid unlocks on your account (if you buy later): while you have an
            account, and as long as we need the record for tax or legal
            reasons.
          </li>
          <li>
            Payments: Stripe keeps website payment records as the law
            requires. We do not store card numbers. Play purchases (when
            offered) are recorded by Google.
          </li>
          <li>
            Progress on your device: until you clear your browser or app data.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Payments">
        <p>
          Packs are currently free. If you later pay on the website, card
          details go to Stripe, not to us. We never see your full card number.
          Stripe acts as a processor for that payment. See Stripe’s own
          privacy policy for how they handle card data.
        </p>
        <p>
          If you later install Opening Lab from Google Play, Google handles
          that store payment. Play purchases (when offered) are taken by
          Google, not by us. There is no Lab+ subscription and no pack billing
          through Google Play at the moment.
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
