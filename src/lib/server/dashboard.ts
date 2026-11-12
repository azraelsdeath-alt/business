/**
 * CreatorOS — Dashboard Server Functions
 *
 * Server-side data fetching for the dashboard. Each function:
 * 1. Tries to query the database (Neon Postgres via `sql()`)
 * 2. Falls back gracefully to demo data when DATABASE_URL is not set
 * 3. Coerces non-primitive types (Dates, BigInts) to strings for the client
 */

import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DashboardStat {
  label: string;
  value: string;
  accent: string;
}

export interface DashboardTask {
  id: number;
  text: string;
  done: boolean;
}

export interface TrendingItem {
  name: string;
  change: string;
}

export interface WidgetDatum {
  title: string;
  value: string;
  subtext: string;
}

export interface DashboardData {
  greeting: string;
  stats: DashboardStat[];
  tasks: DashboardTask[];
  widgets: WidgetDatum[];
  trendingAudio: TrendingItem[];
  trendingTopics: TrendingItem[];
}

// ─── Demo fallback data (matches the "Jake Gamer" seed profile) ─────────────

const DEMO_USER_ID = "a0000000-0000-0000-0000-000000000004";

const DEMO_STATS: DashboardStat[] = [
  { label: "Followers Today", value: "+847", accent: "text-green-600 dark:text-green-400" },
  { label: "Revenue Today", value: "$128.42", accent: "text-indigo-600 dark:text-indigo-400" },
  { label: "Streams This Week", value: "3", accent: "" },
  { label: "Videos Posted", value: "12", accent: "" },
  { label: "Best Platform", value: "YouTube", accent: "text-red-600 dark:text-red-400" },
  { label: "Next Sponsorship", value: "Jul 28", accent: "text-amber-600 dark:text-amber-400" },
];

const DEMO_TASKS: DashboardTask[] = [
  { id: 1, text: "Edit dance pad challenge video highlights", done: false },
  { id: 2, text: "Plan stream schedule for next week", done: false },
  { id: 3, text: "Follow up with GamerChair sponsorship", done: false },
  { id: 4, text: "Record sponsorship integration", done: false },
  { id: 5, text: "Review analytics report", done: true },
];

const DEMO_WIDGETS: WidgetDatum[] = [
  { title: "📈 Today's Followers", value: "+847", subtext: "vs +632 yesterday" },
  { title: "💰 Revenue", value: "$128.42", subtext: "from 3 sources" },
  { title: "👥 Subscribers", value: "12,847", subtext: "+124 this week" },
  { title: "⭐ Best Video", value: "Elden Ring Dance Pad", subtext: "345K views" },
  { title: "🔴 Upcoming Streams", value: "2 scheduled", subtext: "Next: Fri 8pm" },
  { title: "📅 Content Calendar", value: "3 drafts", subtext: "2 overdue" },
  { title: "💬 Recent Comments", value: "24 new", subtext: "8 need replies" },
  { title: "🤝 Sponsorship Progress", value: "1 active", subtext: "1 negotiating" },
];

const DEMO_TRENDING_AUDIO: TrendingItem[] = [
  { name: "Sunset Dreams - Lofi", change: "+24% use" },
  { name: "Upbeat Morning Vlog", change: "+18% use" },
  { name: "Chill Beats Vol. 3", change: "+12% use" },
];

const DEMO_TRENDING_TOPICS: TrendingItem[] = [
  { name: "AI in Content Creation", change: "Trending" },
  { name: "Morning Routines", change: "Trending" },
  { name: "React to This", change: "Trending" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Check if the database is available (DATABASE_URL is set).
 * We do this by trying to run a simple query.
 */
async function isDbAvailable(): Promise<boolean> {
  try {
    const db = sql();
    await db`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// ─── Server Functions ───────────────────────────────────────────────────────

/**
 * Fetch dashboard stats from the database, falling back to demo data.
 */
export const getDashboardStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardStat[]> => {
    try {
      const db = sql();
      const rows = await db`
        WITH today_snap AS (
          SELECT
            follower_change,
            estimated_revenue_cents,
            followers
          FROM analytics_snapshots
          WHERE user_id = ${DEMO_USER_ID}
            AND post_id IS NULL
            AND snapshot_date = CURRENT_DATE
          LIMIT 1
        ),
        platform_counts AS (
          SELECT
            COUNT(*) FILTER (WHERE platform = 'youtube')::int as has_youtube,
            COUNT(*)::int as total_platforms
          FROM connected_platforms
          WHERE user_id = ${DEMO_USER_ID} AND is_active = TRUE
        ),
        recent_revenue AS (
          SELECT COALESCE(SUM(amount_cents), 0) as revenue_cents
          FROM revenue_records
          WHERE user_id = ${DEMO_USER_ID}
            AND transaction_date = CURRENT_DATE
        ),
        post_counts AS (
          SELECT COUNT(*)::int as total_posts
          FROM content_posts
          WHERE user_id = ${DEMO_USER_ID}
            AND status = 'published'
        ),
        active_sponsorships AS (
          SELECT COUNT(*)::int as count
          FROM sponsorships
          WHERE user_id = ${DEMO_USER_ID}
            AND status = 'active'
        )
        SELECT
          COALESCE((SELECT follower_change FROM today_snap), 0) as follower_change,
          COALESCE((SELECT followers FROM today_snap), 0) as followers,
          COALESCE((SELECT revenue_cents FROM recent_revenue), 0) as revenue_cents,
          COALESCE((SELECT total_posts FROM post_counts), 0) as total_posts,
          CASE WHEN COALESCE((SELECT has_youtube FROM platform_counts), 0) > 0 THEN 'YouTube' ELSE 'Other' END as best_platform,
          COALESCE((SELECT count FROM active_sponsorships), 0) as active_sponsorships
      `;

      if (rows.length > 0) {
        const r = rows[0] as {
          follower_change: number;
          followers: number;
          revenue_cents: number;
          total_posts: number;
          best_platform: string;
          active_sponsorships: number;
        };

        return [
          { label: "Followers Today", value: `+${r.follower_change}`, accent: "text-green-600 dark:text-green-400" },
          { label: "Revenue Today", value: `$${(r.revenue_cents / 100).toFixed(2)}`, accent: "text-indigo-600 dark:text-indigo-400" },
          { label: "Streams This Week", value: "3", accent: "" },
          { label: "Videos Posted", value: String(r.total_posts), accent: "" },
          { label: "Best Platform", value: r.best_platform, accent: "text-red-600 dark:text-red-400" },
          { label: "Next Sponsorship", value: "Jul 28", accent: "text-amber-600 dark:text-amber-400" },
        ];
      }
      return DEMO_STATS;
    } catch {
      return DEMO_STATS;
    }
  },
);

/**
 * Fetch today's tasks from the database, falling back to demo data.
 */
export const getTodayTasks = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardTask[]> => {
    try {
      const db = sql();
      const rows = await db`
        SELECT id, title, status
        FROM todo_items
        WHERE user_id = ${DEMO_USER_ID}
          AND status IN ('todo', 'in_progress')
        ORDER BY
          CASE priority
            WHEN 'urgent' THEN 0
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END,
          due_date ASC NULLS LAST
        LIMIT 5
      `;

      if (rows.length > 0) {
        return rows.map((r: { id: string; title: string; status: string }, i: number) => ({
          id: i + 1,
          text: r.title,
          done: r.status === "done" || r.status === "review",
        }));
      }
      return DEMO_TASKS;
    } catch {
      return DEMO_TASKS;
    }
  },
);

/**
 * Fetch widget data (aggregated stats for the widget cards).
 */
export const getWidgetData = createServerFn({ method: "GET" }).handler(
  async (): Promise<WidgetDatum[]> => {
    try {
      const db = sql();
      const rows = await db`
        WITH today_snap AS (
          SELECT
            follower_change,
            followers,
            estimated_revenue_cents
          FROM analytics_snapshots
          WHERE user_id = ${DEMO_USER_ID}
            AND post_id IS NULL
            AND snapshot_date = CURRENT_DATE
          LIMIT 1
        ),
        best_post AS (
          SELECT title, views
          FROM content_posts
          WHERE user_id = ${DEMO_USER_ID} AND status = 'published'
          ORDER BY views DESC
          LIMIT 1
        ),
        upcoming_streams AS (
          SELECT COUNT(*)::int as count
          FROM content_schedules
          WHERE user_id = ${DEMO_USER_ID}
            AND status = 'scheduled'
            AND scheduled_at > NOW()
        ),
        draft_count AS (
          SELECT COUNT(*)::int as count
          FROM content_posts
          WHERE user_id = ${DEMO_USER_ID} AND status = 'draft'
        ),
        recent_comments AS (
          SELECT COALESCE(SUM(comments), 0)::int as total_comments
          FROM content_posts
          WHERE user_id = ${DEMO_USER_ID}
            AND published_at > NOW() - INTERVAL '7 days'
        ),
        sponsorship_stats AS (
          SELECT
            COUNT(*) FILTER (WHERE status = 'active')::int as active_count,
            COUNT(*) FILTER (WHERE status = 'negotiating')::int as negotiating_count
          FROM sponsorships
          WHERE user_id = ${DEMO_USER_ID}
        )
        SELECT
          COALESCE((SELECT follower_change FROM today_snap), 0) as follower_change,
          COALESCE((SELECT followers FROM today_snap), 0) as followers,
          COALESCE((SELECT estimated_revenue_cents FROM today_snap), 0) as revenue_cents,
          COALESCE((SELECT title FROM best_post), 'N/A') as best_title,
          COALESCE((SELECT views FROM best_post), 0) as best_views,
          COALESCE((SELECT count FROM upcoming_streams), 0) as upcoming_streams,
          COALESCE((SELECT count FROM draft_count), 0) as drafts,
          COALESCE((SELECT total_comments FROM recent_comments), 0) as recent_comments,
          COALESCE((SELECT active_count FROM sponsorship_stats), 0) as active_sponsorships,
          COALESCE((SELECT negotiating_count FROM sponsorship_stats), 0) as negotiating_sponsorships
      `;

      if (rows.length > 0) {
        const r = rows[0] as {
          follower_change: number;
          followers: number;
          revenue_cents: number;
          best_title: string;
          best_views: number;
          upcoming_streams: number;
          drafts: number;
          recent_comments: number;
          active_sponsorships: number;
          negotiating_sponsorships: number;
        };

        return [
          { title: "📈 Today's Followers", value: `+${r.follower_change}`, subtext: `Total: ${r.followers.toLocaleString()}` },
          { title: "💰 Revenue", value: `$${(r.revenue_cents / 100).toFixed(2)}`, subtext: "from all sources" },
          { title: "👥 Subscribers", value: r.followers.toLocaleString(), subtext: `+${r.follower_change} this week` },
          { title: "⭐ Best Video", value: r.best_title, subtext: `${r.best_views.toLocaleString()} views` },
          { title: "🔴 Upcoming Streams", value: `${r.upcoming_streams} scheduled`, subtext: "Check schedule" },
          { title: "📅 Content Calendar", value: `${r.drafts} drafts`, subtext: "Ready to publish" },
          { title: "💬 Recent Comments", value: `${r.recent_comments} new`, subtext: "Engage with audience" },
          { title: "🤝 Sponsorship Progress", value: `${r.active_sponsorships} active`, subtext: `${r.negotiating_sponsorships} negotiating` },
        ];
      }
      return DEMO_WIDGETS;
    } catch {
      return DEMO_WIDGETS;
    }
  },
);

/**
 * Fetch trending audio and topics (static demo data for now).
 */
export const getTrendingData = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ audio: TrendingItem[]; topics: TrendingItem[] }> => {
    return {
      audio: DEMO_TRENDING_AUDIO,
      topics: DEMO_TRENDING_TOPICS,
    };
  },
);

/**
 * Fetch all dashboard data at once for the route loader.
 */
export const getDashboardData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardData> => {
    const [stats, tasks, widgets, trending] = await Promise.all([
      getDashboardStats(),
      getTodayTasks(),
      getWidgetData(),
      getTrendingData(),
    ]);

    return {
      greeting: getGreeting(),
      stats,
      tasks,
      widgets,
      trendingAudio: trending.audio,
      trendingTopics: trending.topics,
    };
  },
);