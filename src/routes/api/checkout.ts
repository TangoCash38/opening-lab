import { createFileRoute } from "@tanstack/react-router";
import { createCheckoutSession } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: ({ request }) => createCheckoutSession(request),
    },
  },
});
