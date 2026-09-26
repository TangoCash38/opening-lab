import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { openLegalDocument } from "@/lib/legal-nav";

export function LegalFooter() {
  return (
    <footer className="mt-8 border-t border-border pt-4 text-center text-[0.75rem] text-fg-subtle">
      <Link
        to="/privacy"
        className="font-semibold text-fg-muted no-underline"
        data-legal-privacy
        onClick={openLegalDocument}
      >
        Privacy
      </Link>
      <span className="px-2" aria-hidden>
        ·
      </span>
      <Link
        to="/terms"
        className="font-semibold text-fg-muted no-underline"
        data-legal-terms
        onClick={openLegalDocument}
      >
        Terms
      </Link>
      <span className="px-2" aria-hidden>
        ·
      </span>
      <Link
        to="/delete-account"
        className="font-semibold text-fg-muted no-underline"
      >
        Delete account
      </Link>
      <span className="px-2" aria-hidden>
        ·
      </span>
      <a
        href="mailto:support@openinglab.co.uk"
        className="font-semibold text-fg-muted no-underline"
      >
        support@openinglab.co.uk
      </a>
    </footer>
  );
}

/** Terms and Privacy on the pack checkout sheet (website Stripe and Play). */
export function CheckoutLegalLinks() {
  const t = useT();
  return (
    <p className="m-0 pt-1 text-center text-[0.75rem] text-fg-subtle">
      <Link
        to="/terms"
        className="font-semibold text-fg-muted no-underline"
        data-checkout-terms
        onClick={openLegalDocument}
      >
        {t("Terms")}
      </Link>
      <span className="px-2" aria-hidden>
        ·
      </span>
      <Link
        to="/privacy"
        className="font-semibold text-fg-muted no-underline"
        data-checkout-privacy
        onClick={openLegalDocument}
      >
        {t("Privacy Policy")}
      </Link>
    </p>
  );
}
