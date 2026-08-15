import { createFileRoute } from "@tanstack/react-router";
import { getCheckoutSession } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/checkout/session")({
  server: {
    handlers: {
      GET: ({ request }) => getCheckoutSession(request),
    },
  },
});
