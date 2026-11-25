import { createFileRoute } from "@tanstack/react-router";
import { refreshCreatorConnectResponse } from "@/lib/creator-packs.server";

export const Route = createFileRoute("/api/creator-packs/connect/refresh")({
  server: {
    handlers: {
      GET: ({ request }) => refreshCreatorConnectResponse(request),
    },
  },
});
