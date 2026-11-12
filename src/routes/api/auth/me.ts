/**
 * CreatorOS — Me API Route (current user)
 *
 * GET /api/auth/me
 * Returns the currently authenticated user, or 401 if not logged in.
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "~/services/auth";
import { errorResponse, hasDatabase, jsonResponse, MESSAGES } from "~/lib/server/env";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!hasDatabase()) {
          return jsonResponse(
            { success: false, error: MESSAGES.database, missing: ["DATABASE_URL"] },
            503,
          );
        }

        try {
          const user = await getSessionUser(request);
          if (!user) {
            return jsonResponse({ success: false, error: "Not authenticated" }, 401);
          }

          // Don't expose the password hash
          const { password_hash: _passwordHash, ...safeUser } = user;
          return jsonResponse({ success: true, user: safeUser });
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
