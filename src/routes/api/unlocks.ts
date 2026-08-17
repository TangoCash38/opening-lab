import { createFileRoute } from "@tanstack/react-router";
import { unlocksGetResponse } from "@/lib/purchases.server";

export const Route = createFileRoute("/api/unlocks")({
  server: {
    handlers: {
      GET: ({ request }) => unlocksGetResponse(request),
    },
  },
});
