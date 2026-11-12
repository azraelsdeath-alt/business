/**
 * CreatorOS — YouTube OAuth Start Route
 *
 * GET /api/oauth/youtube
 *
 * Requires an authenticated session. Creates a CSRF state + PKCE pair, stores
 * them in short-lived cookies, and redirects the browser to Google's OAuth
 * consent screen. Google then redirects back to /api/oauth/youtube/callback.
 *
 * Add `?format=json` (or send `Accept: application/json`) to get the authorize
 * URL as JSON instead of a redirect — useful for a "Connect YouTube" button
 * that wants to open a popup.
 *
 * Degrades with a clear message when GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET or
 * DATABASE_URL are not set, instead of throwing.
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "~/services/auth";
import {
  buildGoogleAuthUrl,
  createPkcePair,
  createState,
  isGoogleOAuthConfigured,
  resolveRedirectUri,
} from "~/services/youtube";
import {
  MESSAGES,
  errorResponse,
  hasDatabase,
  jsonResponse,
} from "~/lib/server/env";

const STATE_COOKIE = "oauth_state";
const PKCE_COOKIE = "oauth_pkce";
const REDIRECT_COOKIE = "oauth_redirect";
const COOKIE_MAX_AGE = 600; // 10 minutes — one consent round trip

function oauthCookie(name: string, value: string, request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export const Route = createFileRoute("/api/oauth/youtube")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const wantsJson =
          url.searchParams.get("format") === "json" ||
          (request.headers.get("accept") ?? "").includes("application/json");

        if (!isGoogleOAuthConfigured()) {
          return jsonResponse(
            {
              success: false,
              error: MESSAGES.google,
              missing: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
            },
            503,
          );
        }

        if (!hasDatabase()) {
          return jsonResponse(
            { success: false, error: MESSAGES.database, missing: ["DATABASE_URL"] },
            503,
          );
        }

        try {
          const user = await getSessionUser(request);
          if (!user) {
            return jsonResponse(
              {
                success: false,
                error: "Sign in before connecting a YouTube channel.",
                signIn: "/login",
              },
              401,
            );
          }

          const state = createState();
          const pkce = createPkcePair();
          const redirectUri = resolveRedirectUri(request);
          const authUrl = buildGoogleAuthUrl({
            state,
            redirectUri,
            codeChallenge: pkce.challenge,
          });

          const response = wantsJson
            ? jsonResponse({ success: true, authUrl, redirectUri })
            : new Response(null, { status: 302, headers: { Location: authUrl } });

          response.headers.append("Set-Cookie", oauthCookie(STATE_COOKIE, state, request));
          response.headers.append("Set-Cookie", oauthCookie(PKCE_COOKIE, pkce.verifier, request));
          response.headers.append(
            "Set-Cookie",
            oauthCookie(REDIRECT_COOKIE, redirectUri, request),
          );

          return response;
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
