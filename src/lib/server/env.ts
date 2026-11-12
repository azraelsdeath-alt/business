/**
 * CreatorOS — Environment / configuration guards
 *
 * The app must build, serve and answer every route even before the owner has
 * pasted the credentials for a given integration. These helpers let routes say
 * exactly which secret is missing instead of throwing a 500.
 *
 *   DATABASE_URL          → accounts, sessions, saved connections, analytics
 *   OPENAI_API_KEY        → real AI insight generation (heuristic fallback otherwise)
 *   GOOGLE_CLIENT_ID      → YouTube connect flow
 *   GOOGLE_CLIENT_SECRET  → YouTube connect flow
 */

export const hasDatabase = (): boolean => Boolean(process.env.DATABASE_URL);

export const hasOpenAI = (): boolean => Boolean(process.env.OPENAI_API_KEY);

export const hasGoogleOAuth = (): boolean =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Which of the four expected secrets are absent right now. */
export function missingSecrets(): Array<
  "DATABASE_URL" | "OPENAI_API_KEY" | "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET"
> {
  const missing: Array<
    "DATABASE_URL" | "OPENAI_API_KEY" | "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET"
  > = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
  if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  return missing;
}

export const MESSAGES = {
  database:
    "Database is not connected. Set DATABASE_URL (Postgres connection string) to enable accounts, saved platform connections and analytics.",
  google:
    "YouTube connection is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (Google Cloud OAuth 2.0 web client) to enable it.",
  openai:
    "AI is not configured. Set OPENAI_API_KEY to generate real AI insights — deterministic heuristic insights are shown instead.",
} as const;

/** Thrown when a query needs a secret that is not set. Routes map it to HTTP 503. */
export class NotConfiguredError extends Error {
  readonly missing: string[];
  readonly hint: string;

  constructor(missing: string[], hint: string) {
    super(hint);
    this.name = "NotConfiguredError";
    this.missing = missing;
    this.hint = hint;
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Turns any thrown value into a JSON error response with a readable message. */
export function errorResponse(error: unknown, status = 500): Response {
  if (error instanceof NotConfiguredError) {
    return jsonResponse(
      { success: false, error: error.message, missing: error.missing },
      503,
    );
  }
  const message = error instanceof Error ? error.message : "Unknown error";
  // A query attempted without DATABASE_URL still reads clearly.
  if (/DATABASE_URL is not set/i.test(message)) {
    return jsonResponse(
      { success: false, error: MESSAGES.database, missing: ["DATABASE_URL"] },
      503,
    );
  }
  return jsonResponse({ success: false, error: message }, status);
}
