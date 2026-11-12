/**
 * CreatorOS — Me API Route (current user)
 *
 * GET /api/auth/me
 * Returns the currently authenticated user, or 401 if not logged in.
 */

import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getSessionUser } from "~/services/auth";

export const APIRoute = createAPIFileRoute("/api/auth/me")({
  GET: async ({ request }) => {
    try {
      const user = await getSessionUser(request);
      if (!user) {
        return json({ success: false, error: "Not authenticated" }, { status: 401 });
      }

      // Don't expose password hash
      const { password_hash, ...safeUser } = user;
      return json({ success: true, user: safeUser });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return json({ success: false, error: message }, { status: 500 });
    }
  },
});