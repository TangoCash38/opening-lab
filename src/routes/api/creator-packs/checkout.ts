import { createFileRoute } from "@tanstack/react-router";
import { createCreatorCheckoutResponse } from "@/lib/creator-packs.server";

export const Route = createFileRoute("/api/creator-packs/checkout")({
  server: {
    handlers: {
      POST: ({ request }) => createCreatorCheckoutResponse(request),
    },
  },
});
