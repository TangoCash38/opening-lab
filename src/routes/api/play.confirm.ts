import { createFileRoute } from "@tanstack/react-router";
import { playPurchaseResponse } from "@/lib/play-billing.server";

export const Route = createFileRoute("/api/play/confirm")({
  server: {
    handlers: {
      POST: ({ request }) => playPurchaseResponse(request),
    },
  },
});
