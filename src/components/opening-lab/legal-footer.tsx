import { Link } from "@tanstack/react-router";

export function LegalFooter() {
  return (
    <footer className="mt-8 border-t border-border pt-4 text-center text-[0.75rem] text-fg-subtle">
      <Link to="/privacy" className="font-semibold text-fg-muted no-underline">
        Privacy
      </Link>
      <span className="px-2" aria-hidden>
        ·
      </span>
      <Link to="/terms" className="font-semibold text-fg-muted no-underline">
        Terms
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
