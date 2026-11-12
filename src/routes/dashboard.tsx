import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";

// Server function to get the current user from session cookie
const getMe = createServerFn({ method: "GET" }).handler(async () => {
  // This won't have direct request access without TanStack context,
  // so the actual auth check is done client-side via /api/auth/me
  return null;
});

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{
    id: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
    tier: string;
    bio: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          navigate({ to: "/login" });
        }
      } catch {
        navigate({ to: "/login" });
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    navigate({ to: "/login" });
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950">
      {/* Top Navigation */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              CreatorOS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.tier === "free" ? "Free" : user.tier === "pro" ? "Pro" : user.tier === "creator_plus" ? "Creator+" : "Agency"}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Welcome back, {user.display_name} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {user.email} — {user.bio || "Creator Dashboard"}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickStatCard title="Total Views" value="—" icon="👁️" />
          <QuickStatCard title="Followers" value="—" icon="👥" />
          <QuickStatCard title="Revenue" value="—" icon="💰" />
          <QuickStatCard title="AI Generations" value="—" icon="🤖" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <QuickActionButton
                label="Generate Video Titles"
                description="AI-powered title ideas for your next video"
                emoji="🎯"
                onClick={() => navigate({ to: "/ai/titles" })}
              />
              <QuickActionButton
                label="Write Description"
                description="SEO-optimized video descriptions"
                emoji="✍️"
                onClick={() => navigate({ to: "/ai/description" })}
              />
              <QuickActionButton
                label="Get Hashtags"
                description="Trending hashtags for your content"
                emoji="#️⃣"
                onClick={() => navigate({ to: "/ai/hashtags" })}
              />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Connect your database and run <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">bun run migrate</code> to see your data here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function QuickStatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </div>
  );
}

function QuickActionButton({
  label,
  description,
  emoji,
  onClick,
}: {
  label: string;
  description: string;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
    >
      <span className="text-xl">{emoji}</span>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </button>
  );
}