import { createFileRoute } from "@tanstack/react-router";
import { deleteAccountResponse } from "@/lib/account-delete.server";

export const Route = createFileRoute("/api/account/delete")({
  server: {
    handlers: {
      POST: ({ request }) => deleteAccountResponse(request),
    },
  },
});
