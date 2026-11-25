import { createFileRoute } from "@tanstack/react-router";
import { confirmCreatorCheckoutResponse } from "@/lib/creator-packs.server";

export const Route = createFileRoute("/api/creator-packs/checkout/session")({
  server: {
    handlers: {
      GET: ({ request }) => confirmCreatorCheckoutResponse(request),
    },
  },
});
