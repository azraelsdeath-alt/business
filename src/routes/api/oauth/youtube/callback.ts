/**
 * CreatorOS — YouTube OAuth Callback Route
 *
 * GET /api/oauth/youtube/callback
 *
 * This is the `GOOGLE_REDIRECT_URI` that Google redirects back to after the
 * user consents. It:
 *   1. Verifies the CSRF `state` against the `oauth_state` cookie
 *   2. Identifies the user from their existing session cookie
 *   3. Exchanges the authorization code for tokens
 *   4. Fetches the YouTube channel and persists the connection
 *   5. Redirects back to /settings with a status query
 */

import { createAPIFileRoute } from "@tanstack/react-start/api";
import { json } from "@tanstack/react-start";
import { getSessionUser } from "~/services/auth";
import {
  exchangeCodeForTokens,
  fetchYouTubeChannel,
  upsertYouTubeConnection,
} from "~/services/youtube";

function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function redirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      // Clear the one-time state cookie regardless of outcome
      "Set-Cookie": "oauth_state=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
    },
  });
}

export const APIRoute = createAPIFileRoute("/api/oauth/youtube/callback")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const error = url.searchParams.get("error");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    try {
      // User denied consent or Google returned an error
      if (error) {
        return redirect(`/settings?youtube_error=${encodeURIComponent(error)}`);
      }

      if (!code || !state) {
        return redirect("/settings?youtube_error=missing_code_or_state");
      }

      // Verify CSRF state
      const stateCookie = getCookie(request, "oauth_state");
      if (!stateCookie || stateCookie !== state) {
        return json({ success: false, error: "Invalid OAuth state" }, { status: 400 });
      }

      // Identify the user from their session cookie
      const user = await getSessionUser(request);
      if (!user) {
        return json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      // Exchange code → tokens, fetch channel, persist connection
      const tokens = await exchangeCodeForTokens(code);
      const channel = await fetchYouTubeChannel(tokens.access_token);
      await upsertYouTubeConnection(user.id, tokens, channel);

      return redirect(
        `/settings?youtube_connected=1&channel=${encodeURIComponent(channel.title)}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return redirect(`/settings?youtube_error=${encodeURIComponent(message)}`);
    }
  },
});
