/**
 * CreatorOS — YouTube OAuth Start Route
 *
 * GET /api/oauth/youtube
 *
 * Requires an authenticated session. Generates a CSRF state, stores it in a
 * short-lived cookie, and redirects the browser to Google's OAuth consent
 * screen. Google then redirects back to /api/oauth/youtube/callback.
 *
 * Frontend: link the "Connect YouTube" button to this URL.
 */

import { createAPIFileRoute } from "@tanstack/react-start/api";
import { json } from "@tanstack/react-start";
import { randomBytes } from "node:crypto";
import { getSessionUser } from "~/services/auth";
import { buildGoogleAuthUrl, isGoogleOAuthConfigured } from "~/services/youtube";

export const APIRoute = createAPIFileRoute("/api/oauth/youtube")({
  GET: async ({ request }) => {
    try {
      const user = await getSessionUser(request);
      if (!user) {
        return json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      if (!isGoogleOAuthConfigured()) {
        return json(
          {
            success: false,
            error:
              "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.",
          },
          { status: 503 },
        );
      }

      const state = randomBytes(16).toString("hex");
      const authUrl = buildGoogleAuthUrl(state);

      return new Response(null, {
        status: 302,
        headers: {
          Location: authUrl,
          "Set-Cookie": `oauth_state=${state}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return json({ success: false, error: message }, { status: 500 });
    }
  },
});
