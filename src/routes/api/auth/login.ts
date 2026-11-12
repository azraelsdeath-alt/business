/**
 * CreatorOS — Login API Route
 *
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { success, user, token } or { success: false, error }
 *
 * GET /api/auth/login?demo=<token>
 * Demo user login bypass using seed data tokens
 */

import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { loginUser, loginWithDemoToken, setSessionCookie } from "~/services/auth";

export const APIRoute = createAPIFileRoute("/api/auth/login")({
  POST: async ({ request }) => {
    try {
      const body = await request.json() as { email: string; password: string };
      const result = await loginUser(body);

      if (!result.success || !result.token) {
        return json(result, { status: 401 });
      }

      const headers = new Headers();
      headers.append("Set-Cookie", setSessionCookie(result.token));

      return json(
        { success: true, user: result.user },
        { headers },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return json({ success: false, error: message }, { status: 500 });
    }
  },

  // Demo login via query param
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const demoToken = url.searchParams.get("demo");

    if (demoToken) {
      const result = await loginWithDemoToken(demoToken);
      if (result.success && result.token) {
        const headers = new Headers();
        headers.append("Set-Cookie", setSessionCookie(result.token));
        return json(
          { success: true, user: result.user },
          { headers },
        );
      }
    }

    return json({ success: false, error: "Not authenticated" }, { status: 401 });
  },
});