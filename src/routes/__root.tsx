import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  useLocation,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";

import appCss from "~/styles/app.css?url";

// ── Navigation items ──────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "🏠", label: "Dashboard", path: "/" },
  { icon: "📊", label: "Analytics", path: "/analytics" },
  { icon: "📅", label: "Scheduler", path: "/scheduler" },
  { icon: "🎥", label: "Content Studio", path: "/content-studio" },
  { icon: "✂️", label: "AI Clipper", path: "/ai-clipper" },
  { icon: "🎨", label: "Thumbnail Maker", path: "/thumbnail-maker" },
  { icon: "✍️", label: "AI Writer", path: "/ai-writer" },
  { icon: "📈", label: "Growth", path: "/growth" },
  { icon: "🤝", label: "Sponsorships", path: "/sponsorships" },
  { icon: "💰", label: "Revenue", path: "/revenue" },
  { icon: "📁", label: "Brand Kit", path: "/brand-kit" },
  { icon: "📩", label: "Inbox", path: "/inbox" },
  { icon: "👥", label: "Community", path: "/community" },
  { icon: "⚙️", label: "Settings", path: "/settings" },
];

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CreatorOS" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Page not found</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    </div>
  ),
  component: RootComponent,
});

function RootComponent() {
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage / system preference
  useEffect(() => {
    const stored = localStorage.getItem("creatoros-theme");
    if (stored === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else if (stored === "light") {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("creatoros-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("creatoros-theme", "light");
      }
      return next;
    });
  };

  return (
    <RootDocument>
      <div className="flex h-dvh overflow-hidden">
        {/* Sidebar */}
        <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Sidebar({
  darkMode,
  toggleDarkMode,
}: {
  darkMode: boolean;
  toggleDarkMode: () => void;
}) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          CO
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">
            CreatorOS
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${
                isActive ? "active" : ""
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleDarkMode}
          className={`sidebar-item w-full flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`}
          title={collapsed ? (darkMode ? "Light mode" : "Dark mode") : undefined}
        >
          <span className="text-lg shrink-0">{darkMode ? "☀️" : "🌙"}</span>
          {!collapsed && <span className="text-sm">{darkMode ? "Light mode" : "Dark mode"}</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`sidebar-item w-full flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"}`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="text-lg shrink-0">{collapsed ? "➡️" : "⬅️"}</span>
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}