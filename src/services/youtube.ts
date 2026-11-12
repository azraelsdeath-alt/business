/**
 * CreatorOS — YouTube / Google OAuth Service
 *
 * Implements the Google OAuth 2.0 web-server flow for connecting a creator's
 * YouTube channel:
 *
 *   1. Redirect the browser to Google's consent screen (authorize URL)
 *   2. Google redirects back to the callback with a `code`
 *   3. Exchange the code for access + refresh tokens
 *   4. Fetch the channel via YouTube Data API v3 (`mine=true`)
 *   5. Upsert the connection + tokens into `connected_platforms`
 *
 * Credentials are read from the environment:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
 *
 * All functions fail loudly if credentials are missing, so the routes can
 * return a helpful "not configured" message instead of crashing the server.
 */

import { sql } from "~/db";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";

const YOUTUBE_SCOPES = [
  // Read channel metadata + statistics (enough for the dashboard for now)
  "https://www.googleapis.com/auth/youtube.readonly",
];

// ─── Credentials ────────────────────────────────────────────────────────────

interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

function getCredentials(): GoogleCredentials | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function isGoogleOAuthConfigured(): boolean {
  return getCredentials() !== null;
}

// ─── Authorize URL ──────────────────────────────────────────────────────────

export function buildGoogleAuthUrl(state: string): string {
  const creds = getCredentials();
  if (!creds) {
    throw new Error(
      "Google OAuth is not configured — set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.",
    );
  }

  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: creds.redirectUri,
    response_type: "code",
    scope: YOUTUBE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

// ─── Token Exchange ─────────────────────────────────────────────────────────

export interface GoogleTokens {
  access_token: string;
  refresh_token: string | null;
  expires_in: number;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const creds = getCredentials();
  if (!creds) {
    throw new Error(
      "Google OAuth is not configured — set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.",
    );
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uri: creds.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${JSON.stringify(data)}`);
  }

  return {
    access_token: String(data.access_token ?? ""),
    refresh_token: data.refresh_token ? String(data.refresh_token) : null,
    expires_in: Number(data.expires_in ?? 3600),
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const creds = getCredentials();
  if (!creds) {
    throw new Error(
      "Google OAuth is not configured — set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.",
    );
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${JSON.stringify(data)}`);
  }

  return {
    access_token: String(data.access_token ?? ""),
    refresh_token: data.refresh_token ? String(data.refresh_token) : null,
    expires_in: Number(data.expires_in ?? 3600),
  };
}

// ─── YouTube Data API v3 ────────────────────────────────────────────────────

export interface YouTubeChannel {
  id: string;
  title: string;
  handle: string;
  subscriberCount: number;
  viewCount: number;
}

export async function fetchYouTubeChannel(accessToken: string): Promise<YouTubeChannel> {
  const res = await fetch(`${YOUTUBE_CHANNELS_URL}?part=snippet,statistics&mine=true`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = (await res.json()) as {
    items?: Array<{
      id?: string;
      snippet?: { title?: string; customUrl?: string };
      statistics?: { subscriberCount?: string; viewCount?: string };
    }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(`YouTube channel fetch failed: ${data.error?.message ?? JSON.stringify(data)}`);
  }

  const item = data.items?.[0];
  if (!item) {
    throw new Error("No YouTube channel found for this Google account.");
  }

  return {
    id: String(item.id ?? ""),
    title: String(item.snippet?.title ?? ""),
    handle: String(item.snippet?.customUrl ?? item.snippet?.title ?? item.id ?? ""),
    subscriberCount: Number(item.statistics?.subscriberCount ?? 0),
    viewCount: Number(item.statistics?.viewCount ?? 0),
  };
}

// ─── Persistence ────────────────────────────────────────────────────────────

export async function upsertYouTubeConnection(
  userId: string,
  tokens: GoogleTokens,
  channel: YouTubeChannel,
): Promise<void> {
  await sql()`
    INSERT INTO connected_platforms (
      user_id, platform, platform_username, platform_user_id,
      channel_id, channel_name, subscriber_count, total_views,
      access_token, refresh_token, token_expires_at,
      is_active, last_synced_at
    )
    VALUES (
      ${userId}, 'youtube', ${channel.handle || channel.id}, ${channel.id},
      ${channel.id}, ${channel.title}, ${channel.subscriberCount}, ${channel.viewCount},
      ${tokens.access_token}, ${tokens.refresh_token},
      NOW() + make_interval(secs => ${tokens.expires_in}),
      TRUE, NOW()
    )
    ON CONFLICT (user_id, platform, platform_username)
    DO UPDATE SET
      platform_user_id   = EXCLUDED.platform_user_id,
      channel_id         = EXCLUDED.channel_id,
      channel_name       = EXCLUDED.channel_name,
      subscriber_count   = EXCLUDED.subscriber_count,
      total_views        = EXCLUDED.total_views,
      access_token       = EXCLUDED.access_token,
      refresh_token      = COALESCE(EXCLUDED.refresh_token, connected_platforms.refresh_token),
      token_expires_at   = EXCLUDED.token_expires_at,
      is_active          = TRUE,
      last_synced_at     = NOW(),
      updated_at         = NOW()
  `;
}
