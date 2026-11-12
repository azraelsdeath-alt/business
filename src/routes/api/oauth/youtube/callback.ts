/**
 * CreatorOS — YouTube OAuth Callback Route
 *
 * GET /api/oauth/youtube/callback
 *
 * This is the URL Google redirects back to after the user consents (register it
 * in Google Cloud as the OAuth client's redirect URI — the start route derives
 * it from the request, or you can pin it with GOOGLE_REDIRECT_URI). It:
 *
 *   1. Verifies the CSRF `state` against the `oauth_state` cookie
 *   2. Identifies the user from their existing session cookie
 *   3. Exchanges the authorization code (+ PKCE verifier) for tokens
 *   4. Fetches the YouTube channel and persists the connection
 *   5. Redirects back to /settings with a status query
 *
 * Every failure path redirects to /settings with a readable `youtube_error`
 * instead of throwing, so a missing secret or a denied consent never 500s.
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "~/services/auth";
import {
  exchangeCodeForTokens,
  fetchYouTubeChannel,
  isGoogleOAuthConfigured,
  resolveRedirectUri,
  upsertYouTubeConnection,
} from "~/services/youtube";
import { MESSAGES, hasDatabase } from "~/lib/server/env";

const STATE_COOKIE = "oauth_state";
const PKCE_COOKIE = "oauth_pkce";
const REDIRECT_COOKIE = "oauth_redirect";

function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string, request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

function redirect(request: Request, location: string): Response {
  const response = new Response(null, { status: 302, headers: { Location: location } });
  for (const name of [STATE_COOKIE, PKCE_COOKIE, REDIRECT_COOKIE]) {
    response.headers.append("Set-Cookie", clearCookie(name, request));
  }
  return response;
}

function fail(request: Request, message: string): Response {
  return redirect(request, `/settings?youtube_error=${encodeURIComponent(message)}`);
}

export const Route = createFileRoute("/api/oauth/youtube/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const error = url.searchParams.get("error");
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        // User denied consent, or Google returned an error
        if (error) return fail(request, `Google returned: ${error}`);
        if (!code || !state) return fail(request, "Google did not return an authorization code.");

        if (!isGoogleOAuthConfigured()) return fail(request, MESSAGES.google);
        if (!hasDatabase()) return fail(request, MESSAGES.database);

        const stateCookie = readCookie(request, STATE_COOKIE);
        if (!stateCookie || stateCookie !== state) {
          return fail(
            request,
            "OAuth state check failed — start the connection again from Settings.",
          );
        }

        try {
          const user = await getSessionUser(request);
          if (!user) {
            return fail(request, "Your session expired — sign in and connect YouTube again.");
          }

          const redirectUri = readCookie(request, REDIRECT_COOKIE) ?? resolveRedirectUri(request);
          const codeVerifier = readCookie(request, PKCE_COOKIE) ?? undefined;

          const tokens = await exchangeCodeForTokens(code, { redirectUri, codeVerifier });
          const channel = await fetchYouTubeChannel(tokens.access_token);
          await upsertYouTubeConnection(user.id, tokens, channel);

          return redirect(
            request,
            `/settings?youtube_connected=1&channel=${encodeURIComponent(channel.title)}`,
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return fail(request, message);
        }
      },
    },
  },
});
