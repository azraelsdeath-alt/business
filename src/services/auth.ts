/**
 * CreatorOS — Auth Service
 *
 * Handles session-based authentication using the `users` and `sessions` tables.
 * Provides helpers for login, signup, logout, and retrieving the current user.
 */

import { sql } from "~/db";
import type { User } from "~/db/types";

// ─── Cookie & Header Helpers ────────────────────────────────────────────────

function getTokenFromRequest(request: Request): string | null {
  // Try Authorization header first
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  // Try cookie
  const cookie = request.headers.get("Cookie");
  if (cookie) {
    const match = cookie.match(/session_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

export function setSessionCookie(token: string): string {
  // Expires in 30 days
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  return `session_token=${token}; HttpOnly; Path=/; SameSite=Lax; Expires=${expires}`;
}

export function clearSessionCookie(): string {
  return `session_token=; HttpOnly; Path=/; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// ─── Session Management ─────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  const crypto = await import("node:crypto");
  const token = crypto.randomBytes(32).toString("hex");

  await sql()`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, NOW() + INTERVAL '30 days')
  `;
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await sql()`DELETE FROM sessions WHERE token = ${token}`;
}

export async function destroyAllUserSessions(userId: string): Promise<void> {
  await sql()`DELETE FROM sessions WHERE user_id = ${userId}`;
}

// ─── User Queries ───────────────────────────────────────────────────────────

export async function getUserById(userId: string): Promise<User | null> {
  const [user] = await sql()`SELECT * FROM users WHERE id = ${userId}`;
  return (user as User) ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await sql()`SELECT * FROM users WHERE email = ${email}`;
  return (user as User) ?? null;
}

// ─── Auth Middleware ─────────────────────────────────────────────────────────

/**
 * Extracts the current user from the request session.
 * Returns null if no valid session exists.
 * Used in API routes and server functions.
 */
export async function getSessionUser(request: Request): Promise<User | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const [session] = await sql()`
    SELECT s.user_id
    FROM sessions s
    WHERE s.token = ${token}
      AND s.expires_at > NOW()
  `;
  if (!session) return null;

  return getUserById((session as { user_id: string }).user_id);
}

/**
 * Creates or retrieves a demo user for development.
 * Only works when DATABASE_URL is set.
 */
export async function getDevUser(): Promise<{ user: User | null; token: string | null }> {
  try {
    const [user] = await sql()`
      SELECT * FROM users WHERE email = 'alice@creatoros.app' LIMIT 1
    `;
    if (!user) return { user: null, token: null };

    const { createSession } = await import("./auth");
    const token = await createSession((user as User).id);
    return { user: user as User, token };
  } catch {
    return { user: null, token: null };
  }
}

// ─── Signup / Login ─────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  user?: Omit<User, "password_hash">;
  token?: string;
  error?: string;
}

export async function signupUser(params: {
  email: string;
  displayName: string;
  password: string;
}): Promise<AuthResult> {
  const { email, displayName, password } = params;

  // Validate
  if (!email || !displayName || !password) {
    return { success: false, error: "Email, display name, and password are required" };
  }
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  // Check if email already exists
  const existing = await getUserByEmail(email);
  if (existing) {
    return { success: false, error: "An account with this email already exists" };
  }

  // Hash password
  const crypto = await import("node:crypto");
  const password_hash = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  // Create user
  const [user] = await sql()`
    INSERT INTO users (email, display_name, password_hash, auth_provider, tier)
    VALUES (${email}, ${displayName}, ${password_hash}, 'email', 'free')
    RETURNING id, email, display_name, avatar_url, bio, tier, onboarded, created_at
  `;

  const userData = user as unknown as Omit<User, "password_hash">;

  // Create session
  const token = await createSession(userData.id);

  return { success: true, user: userData, token };
}

export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const { email, password } = params;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  // Find user
  const user = await getUserByEmail(email);
  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  // Verify password
  const crypto = await import("node:crypto");
  const password_hash = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  if (user.password_hash !== password_hash) {
    return { success: false, error: "Invalid email or password" };
  }

  // Create session
  const token = await createSession(user.id);

  // Return user without password_hash
  const { password_hash: _, ...safeUser } = user;

  return { success: true, user: safeUser, token };
}

export async function loginWithDemoToken(token: string): Promise<AuthResult> {
  const [session] = await sql()`
    SELECT s.user_id
    FROM sessions s
    WHERE s.token = ${token}
      AND s.expires_at > NOW()
  `;
  if (!session) {
    return { success: false, error: "Invalid demo token" };
  }
  const user = await getUserById((session as { user_id: string }).user_id);
  if (!user) {
    return { success: false, error: "User not found" };
  }
  const { password_hash: _, ...safeUser } = user;
  return { success: true, user: safeUser, token };
}