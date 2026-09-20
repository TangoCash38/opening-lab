import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/opening-lab/legal-page";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="20 September 2026">
      <p>
        Opening Lab is a chess opening trainer run by Sean Paul in the United
        Kingdom. This page explains what we collect and why, in plain English.
      </p>

      <LegalSection title="Who we are">
        <p>
          Opening Lab is operated by Sean Paul, United Kingdom.
          <br />
          Website:{" "}
          <a href="https://www.openinglab.co.uk" className="text-accent">
            www.openinglab.co.uk
          </a>
          <br />
          Email:{" "}
          <a href="mailto:support@openinglab.co.uk" className="text-accent">
            support@openinglab.co.uk
          </a>
        </p>
      </LegalSection>

      <LegalSection title="Who may use Opening Lab">
        <p>
          Opening Lab is for people aged 13 or over. Do not create an account if
          you are under 13.
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <p>We keep this small:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Your account email, stored on our servers if you sign in.
          </li>
          <li>
            Pack unlocks on your account if you buy packs or Buy all packs on
            the website (so they follow you when you sign in).
          </li>
          <li>
            Training progress (which lines are green) stays on your device. We
            do not store that progress on our servers.
          </li>
          <li>
            Necessary cookies so you can stay signed in and the site can work.
            Vercel Analytics records page views. We do not use advertising
            cookies or an Advertising ID.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Payments">
        <p>
          Paid packs and Buy all packs (£19.99 UK) are sold on this website via
          Stripe. Card details go to Stripe, not to us. We never see your full
          card number. We store that you bought a pack or Buy all so we can
          unlock the trainer on your account.
        </p>
        <p>
          In the Google Play app, paid packs and Buy all are one-time Google
          Play purchases. There is no Lab+ subscription on sale. Google
          handles that store payment and we store only the unlock on your
          account.
        </p>
      </LegalSection>

      <LegalSection title="Why we collect it">
        <p>
          We use this information to run your account, unlock packs you paid
          for, and keep the trainer working. We do not sell your data.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Account email: while you have an account, and briefly after a
            delete request so we can finish it.
          </li>
          <li>
            Pack unlocks: while you have an account, and payment records as
            long as tax or law requires (without card numbers).
          </li>
          <li>
            Progress on your device: until you clear Opening Lab app or
            browser data.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Google Play app">
        <p>
          If you use the Opening Lab app from Google Play (uk.co.openinglab),
          the same rules apply. Sign-in email and pack unlocks are stored on
          our servers if you have an account. The app uses the same website, so
          the same cookies and analytics apply.
        </p>
      </LegalSection>

      <LegalSection title="Your rights (UK GDPR)">
        <p>
          You can ask for a copy of the data we hold, ask us to correct it, or
          ask us to delete it. To delete your account, use{" "}
          <Link to="/delete-account" className="text-accent">
            https://www.openinglab.co.uk/delete-account
          </Link>{" "}
          or Account → Delete account in the app. You can also email{" "}
          <a href="mailto:support@openinglab.co.uk" className="text-accent">
            support@openinglab.co.uk
          </a>
          . You can complain to the Information Commissioner’s Office (ICO) if
          you are unhappy with how we handle your data.
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
