import { createFileRoute } from "@tanstack/react-router";
import { paymentsStatusResponse } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/payments")({
  server: {
    handlers: {
      GET: () => paymentsStatusResponse(),
    },
  },
});
