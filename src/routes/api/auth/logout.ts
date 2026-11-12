/**
 * CreatorOS — Logout API Route
 *
 * POST /api/auth/logout
 * Destroys the current session and clears the cookie.
 */

import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { destroySession, clearSessionCookie, getSessionUser } from "~/services/auth";

export const APIRoute = createAPIFileRoute("/api/auth/logout")({
  POST: async ({ request }) => {
    try {
      const cookie = request.headers.get("Cookie") ?? "";
      const match = cookie.match(/session_token=([^;]+)/);
      const token = match ? match[1] : null;

      if (token) {
        await destroySession(token);
      }

      const headers = new Headers();
      headers.append("Set-Cookie", clearSessionCookie());

      return json({ success: true }, { headers });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return json({ success: false, error: message }, { status: 500 });
    }
  },
});