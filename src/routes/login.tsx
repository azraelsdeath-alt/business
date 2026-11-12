import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getSessionUser } from "~/services/auth";
import { useState } from "react";

// Server function to check if user is already logged in
const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  // For page loads, we can't access request headers directly from a server fn
  // This is handled by the /api/auth/me endpoint
  return null;
});

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        navigate({ to: "/dashboard" });
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (token: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/login?demo=${token}`);
      const data = await res.json();
      if (data.success) {
        navigate({ to: "/dashboard" });
      } else {
        setError(data.error || "Demo login failed");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your CreatorOS dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-900 dark:shadow-gray-900/50">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-offset-gray-900"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Sign up
            </Link>
          </p>
        </form>

        {/* Demo Logins */}
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900 dark:shadow-gray-900/50">
          <h2 className="mb-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
            Demo Accounts (for development)
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => handleDemoLogin("demo-token-alice")}
              disabled={loading}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              🎮 Login as Alice (Creator+)
            </button>
            <button
              onClick={() => handleDemoLogin("demo-token-bob")}
              disabled={loading}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              🎥 Login as Bob (Pro)
            </button>
            <button
              onClick={() => handleDemoLogin("demo-token-jake")}
              disabled={loading}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              🕹️ Login as Jake (Pro)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}