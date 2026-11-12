import { createFileRoute } from "@tanstack/react-router";
import { getDashboardData } from "~/lib/server/dashboard";
import type { DashboardData } from "~/lib/server/dashboard";

export const Route = createFileRoute("/")({
  loader: () => getDashboardData(),
  pendingComponent: DashboardSkeleton,
  component: Dashboard,
});

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800/50 rounded-lg" />
        </div>
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="stat-card">
            <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded mt-3" />
          </div>
        ))}
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="widget-card h-64" />
        </div>
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="widget-card h-24" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const data: DashboardData = Route.useLoaderData();

  return (
    <div className="space-y-8">
      {/* ── Greeting ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {data.greeting}, Jake 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Here's your creator overview for today.
          </p>
        </div>
        <button className="btn-primary">Generate Today's Content</button>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {data.stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <p className="stat-label">{stat.label}</p>
            <p className={`stat-value mt-1 ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Today's Tasks + Widgets ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks checklist */}
        <div className="lg:col-span-1">
          <div className="widget-card">
            <h3 className="widget-header">📋 Today's Tasks</h3>
            <ul className="space-y-2 mt-4">
              {data.tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      defaultChecked={task.done}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span
                      className={`text-sm ${
                        task.done
                          ? "line-through text-gray-400 dark:text-gray-500"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {task.text}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button className="btn-secondary w-full mt-4 text-sm">+ Add Task</button>
          </div>
        </div>

        {/* Widget grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.widgets.map((widget) => (
              <WidgetCard key={widget.title} title={widget.title} value={widget.value} subtext={widget.subtext} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Trending Section ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="widget-card">
          <h3 className="widget-header">🔥 Trending Audio</h3>
          <div className="space-y-3 mt-3">
            {data.trendingAudio.map((audio) => (
              <div
                key={audio.name}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {audio.name}
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {audio.change}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="widget-card">
          <h3 className="widget-header">📌 Trending Topics</h3>
          <div className="space-y-3 mt-3">
            {data.trendingTopics.map((topic) => (
              <div
                key={topic.name}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  #{topic.name.replace(/\s+/g, "")}
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {topic.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WidgetCard({
  title,
  value,
  subtext,
}: {
  title: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="widget-card cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-indigo-300 dark:hover:ring-indigo-700 transition-all duration-200">
      <h3 className="widget-header">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>
    </div>
  );
}