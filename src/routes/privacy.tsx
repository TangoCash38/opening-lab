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
          <li>
            Your account email is stored on our servers if you sign in.
          </li>
          <li>
            Packs you buy and Lab+ are stored on your account so they follow
            you to another phone when you sign in.
          </li>
          <li>
            Training progress (which lines are green) stays on your device.
          </li>
          <li>
            Website payments go through Stripe. We never see your full card
            number.
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
            Packs and Lab+ on your account: while you have an account, and as
            long as we need the record for tax or legal reasons.
          </li>
          <li>
            Payments: Stripe keeps website payment records as the law requires.
            We do not store card numbers. Play purchases (when offered) are
            recorded by Google.
          </li>
          <li>
            Progress on your device: until you clear your browser or app data.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Payments">
        <p>
          Website payments go through Stripe. When you pay on the website, you
          send card details to Stripe, not to us. We never see your full card
          number. Stripe acts as a processor for that payment. See Stripe’s
          own privacy policy for how they handle card data.
        </p>
        <p>
          If you later install Opening Lab from Google Play, Google handles
          that store payment. Play purchases (when offered) are taken by
          Google, not by us.
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
