/**
 * CreatorOS — Login API Route
 *
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { success, user, token } or { success: false, error }
 *
 * GET /api/auth/login?demo=<token>
 * Demo user login bypass using seed data tokens
 *
 * Returns 503 with a clear message when DATABASE_URL is not set.
 */

import { createFileRoute } from "@tanstack/react-router";
import { loginUser, loginWithDemoToken, setSessionCookie } from "~/services/auth";
import { errorResponse, hasDatabase, jsonResponse, MESSAGES } from "~/lib/server/env";

function sessionResponse(
  body: unknown,
  token: string,
  status: number,
): Response {
  const response = jsonResponse(body, status);
  response.headers.append("Set-Cookie", setSessionCookie(token));
  return response;
}

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!hasDatabase()) {
          return jsonResponse(
            { success: false, error: MESSAGES.database, missing: ["DATABASE_URL"] },
            503,
          );
        }

        try {
          const body = (await request.json()) as { email: string; password: string };
          const result = await loginUser(body);

          if (!result.success || !result.token) {
            return jsonResponse(result, 401);
          }

          return sessionResponse({ success: true, user: result.user }, result.token, 200);
        } catch (error) {
          return errorResponse(error);
        }
      },

      // Demo login via query param
      GET: async ({ request }) => {
        if (!hasDatabase()) {
          return jsonResponse(
            { success: false, error: MESSAGES.database, missing: ["DATABASE_URL"] },
            503,
          );
        }

        try {
          const url = new URL(request.url);
          const demoToken = url.searchParams.get("demo");

          if (demoToken) {
            const result = await loginWithDemoToken(demoToken);
            if (result.success && result.token) {
              return sessionResponse(
                { success: true, user: result.user },
                result.token,
                200,
              );
            }
          }

          return jsonResponse({ success: false, error: "Not authenticated" }, 401);
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
