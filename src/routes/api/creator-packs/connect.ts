import { createFileRoute } from "@tanstack/react-router";
import { startCreatorConnectResponse } from "@/lib/creator-packs.server";

export const Route = createFileRoute("/api/creator-packs/connect")({
  server: {
    handlers: {
      POST: ({ request }) => startCreatorConnectResponse(request),
    },
  },
});
