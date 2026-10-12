/**
 * Free-text Ask the coach is off. The handler always refuses.
 */
import { createFileRoute } from "@tanstack/react-router";
import { askCoachPost } from "@/lib/ask-coach.server";

export const Route = createFileRoute("/api/ask-coach")({
  server: {
    handlers: {
      POST: askCoachPost,
    },
  },
});
