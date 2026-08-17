import { createFileRoute } from "@tanstack/react-router";
import { unlocksClaimResponse } from "@/lib/purchases.server";

export const Route = createFileRoute("/api/unlocks/claim")({
  server: {
    handlers: {
      POST: ({ request }) => unlocksClaimResponse(request),
    },
  },
});
