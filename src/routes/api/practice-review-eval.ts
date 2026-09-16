import { createFileRoute } from "@tanstack/react-router";
import { practiceReviewEvalPost } from "@/lib/practice-review-eval.server";

export const Route = createFileRoute("/api/practice-review-eval")({
  server: {
    handlers: {
      POST: practiceReviewEvalPost,
    },
  },
});
