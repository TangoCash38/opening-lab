import { createFileRoute } from "@tanstack/react-router";
import { handleStripeWebhook } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => handleStripeWebhook(request),
    },
  },
});
