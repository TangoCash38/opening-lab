import { createFileRoute } from "@tanstack/react-router";
import { creatorAdminQueueResponse, reviewCreatorPackResponse } from "@/lib/creator-packs.server";

export const Route = createFileRoute("/api/creator-packs/admin")({
  server: {
    handlers: {
      GET: ({ request }) => creatorAdminQueueResponse(request),
      POST: ({ request }) => reviewCreatorPackResponse(request),
    },
  },
});
