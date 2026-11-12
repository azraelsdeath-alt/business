/**
 * CreatorOS — Analytics Server Functions
 *
 * Server-side data access for analytics. Queries the Postgres tables
 * (analytics_snapshots, content_posts, connected_platforms) and feeds data to
 * the AI insight generator.
 *
 * All functions are designed to be called from API routes or server functions.
 * When DATABASE_URL is not set they raise a NotConfiguredError naming the
 * missing secret (the routes turn that into a 503 with a readable message)
 * rather than letting a raw driver error escape. When OPENAI_API_KEY is not set
 * the insight generators fall back to deterministic heuristic insights and
 * report that through `getInsightSource()`.
 */

import { sql } from "~/db";
import type { AnalyticsSnapshot, ContentPost, ConnectedPlatform, RevenueRecord } from "~/db/types";
import { MESSAGES, NotConfiguredError, hasDatabase, hasOpenAI } from "~/lib/server/env";
import { generateAnalyticsInsight, generateGrowthRecommendations } from "~/services/ai";

// Re-exported so callers can tell whether insights came from OpenAI or the
// deterministic fallback.
export { hasOpenAI };

export type InsightSource = "openai" | "heuristic";

export function getInsightSource(): InsightSource {
  return hasOpenAI() ? "openai" : "heuristic";
}

/** Neon handle, or a clear "database not connected" error. */
function db() {
  if (!hasDatabase()) throw new NotConfiguredError(["DATABASE_URL"], MESSAGES.database);
  return sql();
}

function sinceDate(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

function sinceTimestamp(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OverviewStats {
  totalViews: number;
  totalFollowers: number;
  totalRevenueCents: number;
  totalPosts: number;
  totalWatchTimeMinutes: number;
  engagementRate: number;
  followersGained: number;
  period: string;
}

export interface ViewsOverTime {
  date: string;
  views: number;
  followers: number;
  revenue_cents: number;
}

export interface TopContentItem {
  id: string;
  title: string;
  content_type: string;
  views: number;
  likes: number;
  comments: number;
  engagement_rate: number;
  published_at: string;
  platform: string | null;
}

export interface PlatformBreakdown {
  platform: string;
  views: number;
  followers: number;
  revenue_cents: number;
  posts: number;
}

export interface AnalyticsInsight {
  insight: string;
  evidence: string;
  recommendation: string;
  generatedAt: string;
  source?: InsightSource;
}

export interface FollowersBreakdown {
  today: number;
  yesterday: number;
  thisWeek: number;
  thisMonth: number;
}

export interface GrowthRate {
  /** Percentage change (e.g. 12.4) */
  rate: number;
  period: string;
  followersGained: number;
  followersAtStart: number;
  followersAtEnd: number;
}

export interface AverageWatchTime {
  avgWatchTimeMinutes: number;
  totalWatchTimeMinutes: number;
  totalViews: number;
}

export interface ClickThroughRate {
  /** Percentage (e.g. 14.2) */
  ctr: number;
  impressions: number;
  clicks: number;
}

export interface ReturningViewers {
  returningViewers: number;
  uniqueViewers: number;
  /** Percentage of unique viewers who returned (e.g. 67) */
  percent: number;
}

export interface ContentPerformance {
  best: TopContentItem[];
  worst: TopContentItem[];
}

export interface MostSharedClip {
  id: string;
  title: string;
  shares: number;
  platform: string | null;
  content_type: string;
}

export interface PostingTimeSlot {
  /** e.g. "6 PM" */
  time: string;
  /** Normalized 0-100 relative performance */
  performance: number;
}

export interface AudienceActivitySlot {
  /** e.g. "Mon" */
  day: string;
  /** Normalized 0-100 relative activity */
  activity: number;
}

export interface KeyMetrics {
  followers: FollowersBreakdown;
  growthRate: GrowthRate;
  avgWatchTime: AverageWatchTime;
  clickThroughRate: ClickThroughRate;
  returningViewers: ReturningViewers;
}

export interface AnalyticsDashboard {
  overview: OverviewStats;
  viewsOverTime: ViewsOverTime[];
  topContent: TopContentItem[];
  platformBreakdown: PlatformBreakdown[];
  insights: AnalyticsInsight[];
  growthRecommendations: AnalyticsInsight[];
  keyMetrics?: KeyMetrics;
  postingTime?: PostingTimeSlot[];
  audienceActivity?: AudienceActivitySlot[];
  bestAndWorst?: ContentPerformance;
  mostSharedClip?: MostSharedClip | null;
}

// ─── Overview ───────────────────────────────────────────────────────────────

export async function getOverviewStats(
  userId: string,
  days: number = 30,
): Promise<OverviewStats> {
  const [aggregate] = await db()`
    SELECT
      COALESCE(SUM(views), 0)::bigint AS total_views,
      COALESCE(MAX(followers), 0)::bigint AS total_followers,
      COALESCE(SUM(estimated_revenue_cents), 0)::int AS total_revenue_cents,
      COALESCE(SUM(watch_time_minutes), 0)::real AS total_watch_time_minutes,
      COALESCE(AVG(
        CASE WHEN views > 0
          THEN ((likes + comments + shares)::real / views) * 100
          ELSE 0
        END
      ), 0)::real AS engagement_rate,
      COALESCE(SUM(follower_change), 0)::int AS followers_gained
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND snapshot_date >= ${sinceDate(days)}::date
      AND post_id IS NULL
  `;

  const [postCount] = await db()`
    SELECT COUNT(*)::int AS total_posts
    FROM content_posts
    WHERE user_id = ${userId}
      AND status = 'published'
      AND published_at >= ${sinceTimestamp(days)}::timestamptz
  `;

  return {
    totalViews: Number(aggregate?.total_views ?? 0),
    totalFollowers: Number(aggregate?.total_followers ?? 0),
    totalRevenueCents: Number(aggregate?.total_revenue_cents ?? 0),
    totalPosts: Number(postCount?.total_posts ?? 0),
    totalWatchTimeMinutes: Number(aggregate?.total_watch_time_minutes ?? 0),
    engagementRate: Number(aggregate?.engagement_rate ?? 0),
    followersGained: Number(aggregate?.followers_gained ?? 0),
    period: `${days} days`,
  };
}

// ─── Views Over Time ────────────────────────────────────────────────────────

export async function getViewsOverTime(
  userId: string,
  days: number = 30,
): Promise<ViewsOverTime[]> {
  const rows = await db()`
    SELECT
      snapshot_date::text AS snapshot_date,
      SUM(views)::bigint AS views,
      MAX(followers)::bigint AS followers,
      SUM(estimated_revenue_cents)::int AS revenue_cents
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND snapshot_date >= ${sinceDate(days)}::date
      AND post_id IS NULL
    GROUP BY snapshot_date
    ORDER BY snapshot_date ASC
  `;

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    date: String(r.snapshot_date),
    views: Number(r.views ?? 0),
    followers: Number(r.followers ?? 0),
    revenue_cents: Number(r.revenue_cents ?? 0),
  }));
}

// ─── Top Content ────────────────────────────────────────────────────────────

function mapContentRow(r: Record<string, unknown>): TopContentItem {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    content_type: String(r.content_type ?? ""),
    views: Number(r.views ?? 0),
    likes: Number(r.likes ?? 0),
    comments: Number(r.comments ?? 0),
    engagement_rate: Number(r.engagement_rate ?? 0),
    published_at: String(r.published_at ?? ""),
    platform: r.platform ? String(r.platform) : null,
  };
}

export async function getTopContent(
  userId: string,
  limit: number = 10,
  days: number = 30,
): Promise<TopContentItem[]> {
  const rows = await db()`
    SELECT
      cp.id, cp.title, cp.content_type, cp.views, cp.likes, cp.comments,
      cp.engagement_rate, cp.published_at::text, pl.platform
    FROM content_posts cp
    LEFT JOIN connected_platforms pl ON cp.platform_id = pl.id
    WHERE cp.user_id = ${userId}
      AND cp.status = 'published'
      AND cp.published_at >= ${sinceTimestamp(days)}::timestamptz
    ORDER BY cp.views DESC
    LIMIT ${limit}
  `;

  return (rows as Array<Record<string, unknown>>).map(mapContentRow);
}

// ─── Platform Breakdown ─────────────────────────────────────────────────────

export async function getPlatformBreakdown(
  userId: string,
  days: number = 30,
): Promise<PlatformBreakdown[]> {
  const rows = await db()`
    SELECT
      pl.platform,
      COALESCE(SUM(a.views), 0)::bigint AS views,
      COALESCE(MAX(a.followers), 0)::bigint AS followers,
      COALESCE(SUM(a.estimated_revenue_cents), 0)::int AS revenue_cents,
      COUNT(DISTINCT cp.id)::int AS posts
    FROM connected_platforms pl
    LEFT JOIN content_posts cp ON cp.platform_id = pl.id AND cp.status = 'published'
    LEFT JOIN analytics_snapshots a ON a.platform_id = pl.id AND a.post_id IS NULL
      AND a.snapshot_date >= ${sinceDate(days)}::date
    WHERE pl.user_id = ${userId}
      AND pl.is_active = true
    GROUP BY pl.platform
    ORDER BY views DESC
  `;

  // bigint columns arrive as strings over the Neon HTTP driver — coerce them.
  return (rows as Array<Record<string, unknown>>).map((r) => ({
    platform: String(r.platform ?? ""),
    views: Number(r.views ?? 0),
    followers: Number(r.followers ?? 0),
    revenue_cents: Number(r.revenue_cents ?? 0),
    posts: Number(r.posts ?? 0),
  }));
}

// ─── AI-Powered Insights ────────────────────────────────────────────────────

export async function getAiInsights(
  userId: string,
  days: number = 30,
): Promise<AnalyticsInsight[]> {
  // Return insights cached on the snapshot rows within the last 24 hours.
  const existingInsights = await db()`
    SELECT ai_insight, ai_insight_generated_at::text
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND ai_insight IS NOT NULL
      AND ai_insight_generated_at >= NOW() - INTERVAL '24 hours'
    ORDER BY ai_insight_generated_at DESC
    LIMIT 3
  `;

  if (existingInsights.length > 0) {
    return (existingInsights as Array<Record<string, unknown>>).map((r) => {
      const raw = String(r.ai_insight ?? "");
      try {
        const parsed = JSON.parse(raw) as Partial<AnalyticsInsight>;
        return {
          insight: parsed.insight ?? raw,
          evidence: parsed.evidence ?? "",
          recommendation: parsed.recommendation ?? "",
          generatedAt: String(r.ai_insight_generated_at ?? ""),
          source: parsed.source ?? getInsightSource(),
        };
      } catch {
        return {
          insight: raw,
          evidence: "",
          recommendation: "",
          generatedAt: String(r.ai_insight_generated_at ?? ""),
          source: getInsightSource(),
        };
      }
    });
  }

  const overview = await getOverviewStats(userId, days);

  const recentVideos = await db()`
    SELECT title, views, likes, comments, published_at::text
    FROM content_posts
    WHERE user_id = ${userId}
      AND status = 'published'
      AND published_at >= ${sinceTimestamp(days)}::timestamptz
    ORDER BY published_at DESC
    LIMIT 10
  `;

  const tagRows = await db()`
    SELECT tag, COUNT(*)::int AS uses
    FROM content_posts cp, unnest(cp.tags) AS tag
    WHERE cp.user_id = ${userId}
      AND cp.status = 'published'
      AND cp.published_at >= ${sinceTimestamp(days)}::timestamptz
    GROUP BY tag
    ORDER BY uses DESC
    LIMIT 5
  `;
  const topTags = (tagRows as Array<Record<string, unknown>>).map((r) => String(r.tag));

  const source = getInsightSource();
  const heuristic = heuristicInsight(overview, days);

  try {
    const insight = await generateAnalyticsInsight({
      userId,
      channelData: {
        totalViews: overview.totalViews,
        avgViewsPerVideo:
          overview.totalPosts > 0
            ? Math.round(overview.totalViews / overview.totalPosts)
            : 0,
        subscriberCount: overview.totalFollowers,
        engagementRate: overview.engagementRate,
        recentVideoViews: (recentVideos as Array<Record<string, unknown>>).map((v) => ({
          title: String(v.title ?? ""),
          views: Number(v.views ?? 0),
          likes: Number(v.likes ?? 0),
          comments: Number(v.comments ?? 0),
          publishedAt: String(v.published_at ?? ""),
        })),
        topPerformingTags: topTags,
        period: `${days} days`,
      },
    });

    return [
      {
        insight: insight.insight,
        evidence: insight.evidence,
        recommendation: insight.recommendation,
        generatedAt: new Date().toISOString(),
        source,
      },
    ];
  } catch (error) {
    // Never fail the dashboard because the model call failed.
    return [
      {
        ...heuristic,
        evidence: `${heuristic.evidence} (AI call failed: ${
          error instanceof Error ? error.message : "unknown error"
        })`,
        generatedAt: new Date().toISOString(),
        source: "heuristic",
      },
    ];
  }
}

/** Deterministic insight used when OPENAI_API_KEY is absent or the call fails. */
function heuristicInsight(
  overview: OverviewStats,
  days: number,
): Omit<AnalyticsInsight, "generatedAt"> {
  const avgViews =
    overview.totalPosts > 0 ? Math.round(overview.totalViews / overview.totalPosts) : 0;
  const engagement = Number(overview.engagementRate.toFixed(1));

  const insight =
    overview.totalPosts === 0
      ? `No published posts in the last ${days} days, so there is nothing to compare yet.`
      : `Across the last ${days} days you published ${overview.totalPosts} posts averaging ${avgViews.toLocaleString()} views each, with a ${engagement}% engagement rate.`;

  const evidence = `Totals: ${overview.totalViews.toLocaleString()} views, ${overview.followersGained.toLocaleString()} followers gained, ${overview.totalWatchTimeMinutes.toLocaleString()} watch minutes.`;

  const recommendation =
    overview.totalPosts === 0
      ? "Publish or connect a platform so insights can be generated from real numbers."
      : engagement < 3
        ? "Engagement is below 3% — test a stronger hook in the first 3 seconds and ask one clear question in the pinned comment."
        : avgViews > 10000
          ? "Momentum is strong — repeat the format of your best post and raise posting frequency while it holds."
          : "Test more clickable titles and thumbnails, and compare your top 3 posts for the pattern to repeat.";

  return { insight, evidence, recommendation, source: "heuristic" };
}

// ─── Growth Recommendations ─────────────────────────────────────────────────

export async function getGrowthRecommendations(
  userId: string,
): Promise<AnalyticsInsight[]> {
  const platforms = await db()`
    SELECT platform, subscriber_count, total_views
    FROM connected_platforms
    WHERE user_id = ${userId} AND is_active = true
  `;

  const topContentTypes = await db()`
    SELECT content_type, COUNT(*)::int AS uses
    FROM content_posts
    WHERE user_id = ${userId} AND status = 'published'
    GROUP BY content_type
    ORDER BY uses DESC
    LIMIT 3
  `;

  const [aggregate] = await db()`
    SELECT
      COUNT(*)::int AS posts,
      COALESCE(AVG(views), 0)::int AS avg_views
    FROM content_posts
    WHERE user_id = ${userId} AND status = 'published'
  `;

  const platformRows = platforms as Array<Record<string, unknown>>;
  const contentTypes = (topContentTypes as Array<Record<string, unknown>>).map((r) =>
    String(r.content_type),
  );
  const subscriberCount = platformRows.reduce(
    (sum, p) => sum + Number(p.subscriber_count ?? 0),
    0,
  );
  const avgViews = Number(aggregate?.avg_views ?? 0);
  const posts = Number(aggregate?.posts ?? 0);
  const source = getInsightSource();

  try {
    const rec = await generateGrowthRecommendations({
      userId,
      channelData: {
        niche: "content creation",
        subscriberCount,
        avgViews,
        postingFrequency: posts > 12 ? "frequent" : posts > 0 ? "occasional" : "none yet",
        topContentTypes: contentTypes,
        platforms: platformRows.map((p) => String(p.platform)),
      },
    });

    return [
      {
        insight: rec.summary,
        evidence: `Based on ${platformRows.length} connected platform(s), ${posts} published post(s) and ${contentTypes.length} content type(s).`,
        recommendation: rec.growth_opportunities.join(". "),
        generatedAt: new Date().toISOString(),
        source,
      },
    ];
  } catch (error) {
    return [
      {
        insight:
          platformRows.length === 0
            ? "Connect a platform to unlock growth recommendations."
            : `You are averaging ${avgViews.toLocaleString()} views per published post.`,
        evidence: `Growth model call failed: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
        recommendation:
          "Fix the AI configuration (OPENAI_API_KEY) or keep publishing consistently while data accumulates.",
        generatedAt: new Date().toISOString(),
        source: "heuristic",
      },
    ];
  }
}

// ─── Followers Breakdown ────────────────────────────────────────────────────

export async function getFollowersBreakdown(userId: string): Promise<FollowersBreakdown> {
  const [row] = await db()`
    SELECT
      COALESCE(SUM(CASE WHEN snapshot_date = CURRENT_DATE THEN follower_change ELSE 0 END), 0)::int AS today,
      COALESCE(SUM(CASE WHEN snapshot_date = CURRENT_DATE - 1 THEN follower_change ELSE 0 END), 0)::int AS yesterday,
      COALESCE(SUM(CASE WHEN snapshot_date >= date_trunc('week', CURRENT_DATE)::date THEN follower_change ELSE 0 END), 0)::int AS this_week,
      COALESCE(SUM(CASE WHEN snapshot_date >= date_trunc('month', CURRENT_DATE)::date THEN follower_change ELSE 0 END), 0)::int AS this_month
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND post_id IS NULL
  `;

  return {
    today: Number(row?.today ?? 0),
    yesterday: Number(row?.yesterday ?? 0),
    thisWeek: Number(row?.this_week ?? 0),
    thisMonth: Number(row?.this_month ?? 0),
  };
}

// ─── Growth Rate ────────────────────────────────────────────────────────────

export async function getGrowthRate(userId: string): Promise<GrowthRate> {
  const [current] = await db()`
    SELECT MAX(followers)::bigint AS followers
    FROM analytics_snapshots
    WHERE user_id = ${userId} AND post_id IS NULL
  `;
  const [weekAgo] = await db()`
    SELECT MAX(followers)::bigint AS followers
    FROM analytics_snapshots
    WHERE user_id = ${userId} AND post_id IS NULL
      AND snapshot_date <= CURRENT_DATE - 7
  `;

  const followersAtEnd = Number(current?.followers ?? 0);
  const followersAtStart = Number(weekAgo?.followers ?? 0);
  const gained = followersAtEnd - followersAtStart;
  const rate = followersAtStart > 0 ? (gained / followersAtStart) * 100 : 0;

  return {
    rate: Number(rate.toFixed(1)),
    period: "weekly",
    followersGained: gained,
    followersAtStart,
    followersAtEnd,
  };
}

// ─── Average Watch Time ─────────────────────────────────────────────────────

export async function getAverageWatchTime(
  userId: string,
  days: number = 30,
): Promise<AverageWatchTime> {
  const [row] = await db()`
    SELECT
      COALESCE(SUM(watch_time_minutes), 0)::real AS total_watch_time_minutes,
      COALESCE(SUM(views), 0)::bigint AS total_views
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND post_id IS NULL
      AND snapshot_date >= ${sinceDate(days)}::date
  `;

  const totalWatchTimeMinutes = Number(row?.total_watch_time_minutes ?? 0);
  const totalViews = Number(row?.total_views ?? 0);

  return {
    avgWatchTimeMinutes:
      totalViews > 0 ? Number((totalWatchTimeMinutes / totalViews).toFixed(1)) : 0,
    totalWatchTimeMinutes,
    totalViews,
  };
}

// ─── Click-Through Rate ─────────────────────────────────────────────────────

export async function getClickThroughRate(
  userId: string,
  days: number = 30,
): Promise<ClickThroughRate> {
  const [row] = await db()`
    SELECT
      COALESCE(SUM(impressions), 0)::bigint AS impressions,
      COALESCE(SUM(views), 0)::bigint AS clicks
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND post_id IS NULL
      AND snapshot_date >= ${sinceDate(days)}::date
  `;

  const impressions = Number(row?.impressions ?? 0);
  const clicks = Number(row?.clicks ?? 0);

  return {
    ctr: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(1)) : 0,
    impressions,
    clicks,
  };
}

// ─── Returning Viewers ──────────────────────────────────────────────────────

export async function getReturningViewers(
  userId: string,
  days: number = 30,
): Promise<ReturningViewers> {
  const [row] = await db()`
    SELECT
      COALESCE(SUM(returning_viewers), 0)::bigint AS returning_viewers,
      COALESCE(SUM(unique_viewers), 0)::bigint AS unique_viewers
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND post_id IS NULL
      AND snapshot_date >= ${sinceDate(days)}::date
  `;

  const returningViewers = Number(row?.returning_viewers ?? 0);
  const uniqueViewers = Number(row?.unique_viewers ?? 0);

  return {
    returningViewers,
    uniqueViewers,
    percent:
      uniqueViewers > 0 ? Number(((returningViewers / uniqueViewers) * 100).toFixed(1)) : 0,
  };
}

// ─── Best & Worst Content ───────────────────────────────────────────────────

export async function getBestAndWorstContent(
  userId: string,
  days: number = 30,
  limit: number = 3,
): Promise<ContentPerformance> {
  const best = await getTopContent(userId, limit, days);

  const rows = await db()`
    SELECT
      cp.id, cp.title, cp.content_type, cp.views, cp.likes, cp.comments,
      cp.engagement_rate, cp.published_at::text, pl.platform
    FROM content_posts cp
    LEFT JOIN connected_platforms pl ON cp.platform_id = pl.id
    WHERE cp.user_id = ${userId}
      AND cp.status = 'published'
      AND cp.published_at >= ${sinceTimestamp(days)}::timestamptz
      AND cp.views > 0
    ORDER BY cp.views ASC
    LIMIT ${limit}
  `;

  const worst = (rows as Array<Record<string, unknown>>).map(mapContentRow);

  return { best, worst };
}

// ─── Most Shared Clip ───────────────────────────────────────────────────────

export async function getMostSharedClip(
  userId: string,
  days: number = 90,
): Promise<MostSharedClip | null> {
  const [row] = await db()`
    SELECT cp.id, cp.title, cp.content_type, cp.shares, pl.platform
    FROM content_posts cp
    LEFT JOIN connected_platforms pl ON cp.platform_id = pl.id
    WHERE cp.user_id = ${userId}
      AND cp.status = 'published'
      AND cp.published_at >= ${sinceTimestamp(days)}::timestamptz
    ORDER BY cp.shares DESC
    LIMIT 1
  `;

  if (!row) return null;

  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    content_type: String(row.content_type ?? ""),
    shares: Number(row.shares ?? 0),
    platform: row.platform ? String(row.platform) : null,
  };
}

// ─── Best Posting Time ──────────────────────────────────────────────────────

function formatHour(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${suffix}`;
}

export async function getBestPostingTime(
  userId: string,
  days: number = 90,
): Promise<PostingTimeSlot[]> {
  const rows = await db()`
    SELECT
      EXTRACT(HOUR FROM published_at)::int AS hour,
      AVG(views)::real AS avg_views
    FROM content_posts
    WHERE user_id = ${userId}
      AND status = 'published'
      AND published_at IS NOT NULL
      AND published_at >= ${sinceTimestamp(days)}::timestamptz
    GROUP BY hour
    ORDER BY hour ASC
  `;

  const byHour = new Map<number, number>();
  for (const r of rows as Array<Record<string, unknown>>) {
    byHour.set(Number(r.hour), Number(r.avg_views ?? 0));
  }
  const max = Math.max(1, ...Array.from(byHour.values()));

  const slots: PostingTimeSlot[] = [];
  for (let h = 0; h < 24; h++) {
    slots.push({
      time: formatHour(h),
      performance: byHour.has(h) ? Math.round(((byHour.get(h) ?? 0) / max) * 100) : 0,
    });
  }
  return slots;
}

// ─── Most Active Audience Time ──────────────────────────────────────────────

export async function getMostActiveAudienceTime(
  userId: string,
  days: number = 90,
): Promise<AudienceActivitySlot[]> {
  const rows = await db()`
    SELECT
      EXTRACT(ISODOW FROM published_at)::int AS dow,
      AVG(likes + comments + shares)::real AS avg_engagement
    FROM content_posts
    WHERE user_id = ${userId}
      AND status = 'published'
      AND published_at IS NOT NULL
      AND published_at >= ${sinceTimestamp(days)}::timestamptz
    GROUP BY dow
    ORDER BY dow ASC
  `;

  const byDow = new Map<number, number>();
  for (const r of rows as Array<Record<string, unknown>>) {
    byDow.set(Number(r.dow), Number(r.avg_engagement ?? 0));
  }
  const max = Math.max(1, ...Array.from(byDow.values()));

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((day, i) => {
    const dow = i + 1; // ISODOW: 1 = Mon .. 7 = Sun
    const val = byDow.get(dow) ?? 0;
    return { day, activity: Math.round((val / max) * 100) };
  });
}

// ─── Key Metrics (combined card view) ───────────────────────────────────────

export async function getKeyMetrics(userId: string, days: number = 30): Promise<KeyMetrics> {
  const [followers, growthRate, avgWatchTime, clickThroughRate, returningViewers] =
    await Promise.all([
      getFollowersBreakdown(userId),
      getGrowthRate(userId),
      getAverageWatchTime(userId, days),
      getClickThroughRate(userId, days),
      getReturningViewers(userId, days),
    ]);

  return { followers, growthRate, avgWatchTime, clickThroughRate, returningViewers };
}

// ─── Full Dashboard ─────────────────────────────────────────────────────────

export async function getFullAnalyticsDashboard(
  userId: string,
  days: number = 30,
): Promise<AnalyticsDashboard> {
  const [
    overview,
    viewsOverTime,
    topContent,
    platformBreakdown,
    insights,
    growthRecommendations,
    keyMetrics,
    postingTime,
    audienceActivity,
    bestAndWorst,
    mostSharedClip,
  ] = await Promise.all([
    getOverviewStats(userId, days),
    getViewsOverTime(userId, days),
    getTopContent(userId, 10, days),
    getPlatformBreakdown(userId, days),
    getAiInsights(userId, days),
    getGrowthRecommendations(userId),
    getKeyMetrics(userId, days),
    getBestPostingTime(userId, days),
    getMostActiveAudienceTime(userId, days),
    getBestAndWorstContent(userId, days, 3),
    getMostSharedClip(userId, days),
  ]);

  return {
    overview,
    viewsOverTime,
    topContent,
    platformBreakdown,
    insights,
    growthRecommendations,
    keyMetrics,
    postingTime,
    audienceActivity,
    bestAndWorst,
    mostSharedClip,
  };
}

// Kept for callers that type against the raw row shapes.
export type { AnalyticsSnapshot, ContentPost, ConnectedPlatform, RevenueRecord };
