/**
 * CreatorOS — Signup API Route
 *
 * POST /api/auth/signup
 * Body: { email, displayName, password }
 * Returns: { success, user, token } or { success: false, error }
 */

import { createFileRoute } from "@tanstack/react-router";
import { setSessionCookie, signupUser } from "~/services/auth";
import { errorResponse, hasDatabase, jsonResponse, MESSAGES } from "~/lib/server/env";

export const Route = createFileRoute("/api/auth/signup")({
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
          const body = (await request.json()) as {
            email: string;
            displayName: string;
            password: string;
          };
          const result = await signupUser(body);

          if (!result.success || !result.token) {
            return jsonResponse(result, 400);
          }

          const response = jsonResponse({ success: true, user: result.user }, 201);
          response.headers.append("Set-Cookie", setSessionCookie(result.token));
          return response;
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
