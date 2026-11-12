/**
 * CreatorOS — Logout API Route
 *
 * POST /api/auth/logout
 * Destroys the current session and clears the cookie.
 */

import { createFileRoute } from "@tanstack/react-router";
import { clearSessionCookie, destroySession } from "~/services/auth";
import { errorResponse, hasDatabase, jsonResponse, MESSAGES } from "~/lib/server/env";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const cookie = request.headers.get("Cookie") ?? "";
          const match = cookie.match(/session_token=([^;]+)/);
          const token = match ? match[1] : null;

          if (token && hasDatabase()) {
            await destroySession(token);
          }

          const response = jsonResponse({ success: true });
          response.headers.append("Set-Cookie", clearSessionCookie());
          return response;
        } catch (error) {
          if (!hasDatabase()) {
            return jsonResponse({ success: false, error: MESSAGES.database }, 503);
          }
          return errorResponse(error);
        }
      },
    },
  },
});
