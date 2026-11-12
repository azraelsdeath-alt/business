/**
 * CreatorOS — YouTube / Google OAuth 2.0 Service
 *
 * Implements the Google OAuth 2.0 web-server flow (with PKCE) for connecting a
 * creator's YouTube channel:
 *
 *   1. Redirect the browser to Google's consent screen (authorize URL)
 *   2. Google redirects back to the callback with a `code`
 *   3. Exchange the code (+ PKCE verifier) for access + refresh tokens
 *   4. Fetch the channel via YouTube Data API v3 (`mine=true`)
 *   5. Upsert the connection + tokens into `connected_platforms`
 *
 * Credentials (environment):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET  — required
 *   GOOGLE_REDIRECT_URI                     — optional; derived from the request
 *                                             origin when unset
 *
 * Every function that needs credentials raises a NotConfiguredError with a
 * message naming the missing secret, so routes answer with a clear 503 instead
 * of crashing.
 */

import { createHash, randomBytes } from "node:crypto";
import { sql } from "~/db";
import { MESSAGES, NotConfiguredError, hasDatabase, hasGoogleOAuth } from "~/lib/server/env";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";

const YOUTUBE_SCOPES = [
  // Read channel metadata + statistics (enough for the dashboard for now)
  "https://www.googleapis.com/auth/youtube.readonly",
];

const GOOGLE_MISSING = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];

// ─── Credentials ────────────────────────────────────────────────────────────

export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
}

export function getGoogleCredentials(): GoogleCredentials | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isGoogleOAuthConfigured(): boolean {
  return hasGoogleOAuth();
}

function requireCredentials(): GoogleCredentials {
  const creds = getGoogleCredentials();
  if (!creds) throw new NotConfiguredError(GOOGLE_MISSING, MESSAGES.google);
  return creds;
}

// ─── Redirect URI ───────────────────────────────────────────────────────────

/**
 * The callback URL registered in Google Cloud. `GOOGLE_REDIRECT_URI` wins when
 * set; otherwise it is derived from the request so the published site works
 * without a third secret. The published site sits behind a reverse proxy, so
 * X-Forwarded-Proto / X-Forwarded-Host are honoured before the request origin.
 */
export function resolveRedirectUri(request: Request): string {
  const configured = process.env.GOOGLE_REDIRECT_URI;
  if (configured) return configured;

  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || url.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || url.host;

  return `${proto}://${host}/api/oauth/youtube/callback`;
}

// ─── PKCE ───────────────────────────────────────────────────────────────────

export interface PkcePair {
  verifier: string;
  challenge: string;
}

export function createPkcePair(): PkcePair {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function createState(): string {
  return randomBytes(16).toString("hex");
}

// ─── Authorize URL ──────────────────────────────────────────────────────────

export function buildGoogleAuthUrl(opts: {
  state: string;
  redirectUri: string;
  codeChallenge?: string;
}): string {
  const creds = requireCredentials();

  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: YOUTUBE_SCOPES.join(" "),
    access_type: "offline", // ask for a refresh token
    prompt: "consent",
    include_granted_scopes: "true",
    state: opts.state,
  });
  if (opts.codeChallenge) {
    params.set("code_challenge", opts.codeChallenge);
    params.set("code_challenge_method", "S256");
  }

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

// ─── Token Exchange ─────────────────────────────────────────────────────────

export interface GoogleTokens {
  access_token: string;
  refresh_token: string | null;
  expires_in: number;
}

function parseTokenResponse(data: Record<string, unknown>): GoogleTokens {
  return {
    access_token: String(data.access_token ?? ""),
    refresh_token: data.refresh_token ? String(data.refresh_token) : null,
    expires_in: Number(data.expires_in ?? 3600),
  };
}

export async function exchangeCodeForTokens(
  code: string,
  opts: { redirectUri: string; codeVerifier?: string },
): Promise<GoogleTokens> {
  const creds = requireCredentials();

  const body = new URLSearchParams({
    code,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
  });
  if (opts.codeVerifier) body.set("code_verifier", opts.codeVerifier);

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const detail = data.error_description ?? data.error ?? JSON.stringify(data);
    throw new Error(`Google token exchange failed: ${String(detail)}`);
  }
  return parseTokenResponse(data);
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const creds = requireCredentials();

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
    const detail = data.error_description ?? data.error ?? JSON.stringify(data);
    throw new Error(`Google token refresh failed: ${String(detail)}`);
  }
  return parseTokenResponse(data);
}

// ─── YouTube Data API v3 ────────────────────────────────────────────────────

export interface YouTubeChannel {
  id: string;
  title: string;
  handle: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
}

export async function fetchYouTubeChannel(accessToken: string): Promise<YouTubeChannel> {
  const res = await fetch(
    `${YOUTUBE_CHANNELS_URL}?part=snippet,statistics&mine=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const data = (await res.json()) as {
    items?: Array<{
      id?: string;
      snippet?: { title?: string; customUrl?: string };
      statistics?: {
        subscriberCount?: string;
        viewCount?: string;
        videoCount?: string;
      };
    }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(
      `YouTube channel fetch failed: ${data.error?.message ?? JSON.stringify(data)}`,
    );
  }

  const item = data.items?.[0];
  if (!item) {
    throw new Error(
      "No YouTube channel found for this Google account. Sign in with the Google account that owns the channel.",
    );
  }

  return {
    id: String(item.id ?? ""),
    title: String(item.snippet?.title ?? ""),
    handle: String(item.snippet?.customUrl ?? item.snippet?.title ?? item.id ?? ""),
    subscriberCount: Number(item.statistics?.subscriberCount ?? 0),
    viewCount: Number(item.statistics?.viewCount ?? 0),
    videoCount: Number(item.statistics?.videoCount ?? 0),
  };
}

// ─── Persistence ────────────────────────────────────────────────────────────

function requireDatabase(): void {
  if (!hasDatabase()) {
    throw new NotConfiguredError(["DATABASE_URL"], MESSAGES.database);
  }
}

function expiryIso(expiresInSeconds: number): string {
  return new Date(Date.now() + Math.max(expiresInSeconds, 60) * 1000).toISOString();
}

export async function upsertYouTubeConnection(
  userId: string,
  tokens: GoogleTokens,
  channel: YouTubeChannel,
): Promise<void> {
  requireDatabase();

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
      ${tokens.access_token}, ${tokens.refresh_token}, ${expiryIso(tokens.expires_in)}::timestamptz,
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

export interface YouTubeConnection {
  id: string;
  platformUsername: string;
  channelId: string | null;
  channelName: string | null;
  subscriberCount: number;
  totalViews: number;
  tokenExpiresAt: string | null;
  lastSyncedAt: string | null;
}

export async function getYouTubeConnection(
  userId: string,
): Promise<YouTubeConnection | null> {
  requireDatabase();

  const [row] = await sql()`
    SELECT id, platform_username, channel_id, channel_name,
           subscriber_count, total_views, token_expires_at::text, last_synced_at::text
    FROM connected_platforms
    WHERE user_id = ${userId} AND platform = 'youtube' AND is_active = TRUE
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  if (!row) return null;

  const r = row as Record<string, unknown>;
  return {
    id: String(r.id),
    platformUsername: String(r.platform_username ?? ""),
    channelId: r.channel_id ? String(r.channel_id) : null,
    channelName: r.channel_name ? String(r.channel_name) : null,
    subscriberCount: Number(r.subscriber_count ?? 0),
    totalViews: Number(r.total_views ?? 0),
    tokenExpiresAt: r.token_expires_at ? String(r.token_expires_at) : null,
    lastSyncedAt: r.last_synced_at ? String(r.last_synced_at) : null,
  };
}

/**
 * Returns a usable access token for the user's connected channel, refreshing it
 * (and persisting the new token) when it has expired. Returns null when the
 * user has no YouTube connection.
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  requireDatabase();

  const [row] = await sql()`
    SELECT id, access_token, refresh_token, token_expires_at
    FROM connected_platforms
    WHERE user_id = ${userId} AND platform = 'youtube' AND is_active = TRUE
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  if (!row) return null;

  const r = row as Record<string, unknown>;
  const accessToken = r.access_token ? String(r.access_token) : null;
  const refreshToken = r.refresh_token ? String(r.refresh_token) : null;
  const expiresAt = r.token_expires_at ? new Date(String(r.token_expires_at)) : null;

  const stillValid = accessToken && expiresAt && expiresAt.getTime() - Date.now() > 60_000;
  if (stillValid) return accessToken;
  if (!refreshToken) return accessToken;

  const refreshed = await refreshAccessToken(refreshToken);
  await sql()`
    UPDATE connected_platforms
    SET access_token = ${refreshed.access_token},
        refresh_token = COALESCE(${refreshed.refresh_token}, refresh_token),
        token_expires_at = ${expiryIso(refreshed.expires_in)}::timestamptz,
        updated_at = NOW()
    WHERE id = ${String(r.id)}
  `;
  return refreshed.access_token;
}

/** Pulls fresh channel statistics and stores them on the connection. */
export async function syncYouTubeChannel(userId: string): Promise<YouTubeChannel | null> {
  const token = await getValidAccessToken(userId);
  if (!token) return null;

  const channel = await fetchYouTubeChannel(token);
  await sql()`
    UPDATE connected_platforms
    SET subscriber_count = ${channel.subscriberCount},
        total_views = ${channel.viewCount},
        channel_name = ${channel.title},
        channel_id = ${channel.id},
        last_synced_at = NOW(),
        updated_at = NOW()
    WHERE user_id = ${userId} AND platform = 'youtube'
  `;
  return channel;
}

/** Revokes the Google grant and deactivates the stored connection. */
export async function disconnectYouTube(userId: string): Promise<void> {
  requireDatabase();

  const [row] = await sql()`
    SELECT access_token, refresh_token
    FROM connected_platforms
    WHERE user_id = ${userId} AND platform = 'youtube'
    LIMIT 1
  `;
  const token = row
    ? String((row as Record<string, unknown>).refresh_token ?? (row as Record<string, unknown>).access_token ?? "")
    : "";

  if (token) {
    try {
      await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST" });
    } catch {
      // Revoking is best-effort; the local connection is cleared regardless.
    }
  }

  await sql()`
    UPDATE connected_platforms
    SET is_active = FALSE, access_token = NULL, refresh_token = NULL, updated_at = NOW()
    WHERE user_id = ${userId} AND platform = 'youtube'
  `;
}
