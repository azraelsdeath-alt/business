/**
 * CreatorOS — Signup API Route
 *
 * POST /api/auth/signup
 * Body: { email, displayName, password }
 * Returns: { success, user, token } or { success: false, error }
 */

import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { signupUser, setSessionCookie } from "~/services/auth";

export const APIRoute = createAPIFileRoute("/api/auth/signup")({
  POST: async ({ request }) => {
    try {
      const body = await request.json() as { email: string; displayName: string; password: string };
      const result = await signupUser(body);

      if (!result.success || !result.token) {
        return json(result, { status: 400 });
      }

      // Set session cookie
      const headers = new Headers();
      headers.append("Set-Cookie", setSessionCookie(result.token));

      return json(
        { success: true, user: result.user },
        { headers, status: 201 },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return json({ success: false, error: message }, { status: 500 });
    }
  },
});