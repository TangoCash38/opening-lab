import { createFileRoute } from "@tanstack/react-router";
import { saveCreatorProfileResponse } from "@/lib/creator-packs.server";

export const Route = createFileRoute("/api/creator-packs/profile")({
  server: {
    handlers: {
      POST: ({ request }) => saveCreatorProfileResponse(request),
    },
  },
});
