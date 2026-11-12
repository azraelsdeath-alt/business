/**
 * CreatorOS — Analytics Server Functions
 *
 * Server-side data access for analytics. Queries the Postgres tables
 * (analytics_snapshots, content_posts, connected_platforms, revenue_records)
 * and feeds data to the AI insight generator.
 *
 * All functions are designed to be called from API routes or server functions.
 */

import { sql } from "~/db";
import type { AnalyticsSnapshot, ContentPost, ConnectedPlatform, RevenueRecord } from "~/db/types";
import { generateAnalyticsInsight, generateGrowthRecommendations } from "~/services/ai";

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
  const period = `${days} days`;

  // Get aggregate from analytics_snapshots
  const [aggregate] = await sql()`
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
      AND snapshot_date >= CURRENT_DATE - ${days}
      AND post_id IS NULL
  `;

  // Count published posts
  const [postCount] = await sql()`
    SELECT COUNT(*)::int AS total_posts
    FROM content_posts
    WHERE user_id = ${userId}
      AND status = 'published'
      AND published_at >= NOW() - INTERVAL '${sql().raw(`${days} days`)}'
  `;

  return {
    totalViews: Number(aggregate?.total_views ?? 0),
    totalFollowers: Number(aggregate?.total_followers ?? 0),
    totalRevenueCents: Number(aggregate?.total_revenue_cents ?? 0),
    totalPosts: Number(postCount?.total_posts ?? 0),
    totalWatchTimeMinutes: Number(aggregate?.total_watch_time_minutes ?? 0),
    engagementRate: Number(aggregate?.engagement_rate ?? 0),
    followersGained: Number(aggregate?.followers_gained ?? 0),
    period,
  };
}

// ─── Views Over Time ────────────────────────────────────────────────────────

export async function getViewsOverTime(
  userId: string,
  days: number = 30,
): Promise<ViewsOverTime[]> {
  const rows = await sql()`
    SELECT
      snapshot_date::text,
      SUM(views)::bigint AS views,
      MAX(followers)::bigint AS followers,
      SUM(estimated_revenue_cents)::int AS revenue_cents
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND snapshot_date >= CURRENT_DATE - ${days}
      AND post_id IS NULL
    GROUP BY snapshot_date
    ORDER BY snapshot_date ASC
  `;

  return (rows as Array<{
    snapshot_date: string;
    views: number;
    followers: number;
    revenue_cents: number;
  }>).map((r) => ({
    date: r.snapshot_date,
    views: Number(r.views),
    followers: Number(r.followers),
    revenue_cents: Number(r.revenue_cents),
  }));
}

// ─── Top Content ────────────────────────────────────────────────────────────

export async function getTopContent(
  userId: string,
  limit: number = 10,
  days: number = 30,
): Promise<TopContentItem[]> {
  const rows = await sql()`
    SELECT
      cp.id,
      cp.title,
      cp.content_type,
      cp.views,
      cp.likes,
      cp.comments,
      cp.engagement_rate,
      cp.published_at::text,
      cp.platform_id,
      pl.platform
    FROM content_posts cp
    LEFT JOIN connected_platforms pl ON cp.platform_id = pl.id
    WHERE cp.user_id = ${userId}
      AND cp.status = 'published'
      AND cp.published_at >= NOW() - INTERVAL '${sql().raw(`${days} days`)}'
    ORDER BY cp.views DESC
    LIMIT ${limit}
  `;

  return (rows as Array<{
    id: string;
    title: string;
    content_type: string;
    views: number;
    likes: number;
    comments: number;
    engagement_rate: number;
    published_at: string;
    platform: string | null;
  }>).map((r) => ({
    id: r.id,
    title: r.title,
    content_type: r.content_type,
    views: Number(r.views),
    likes: Number(r.likes),
    comments: Number(r.comments),
    engagement_rate: Number(r.engagement_rate),
    published_at: r.published_at,
    platform: r.platform,
  }));
}

// ─── Platform Breakdown ─────────────────────────────────────────────────────

export async function getPlatformBreakdown(
  userId: string,
  days: number = 30,
): Promise<PlatformBreakdown[]> {
  const rows = await sql()`
    SELECT
      pl.platform,
      COALESCE(SUM(a.views), 0)::bigint AS views,
      COALESCE(MAX(a.followers), 0)::bigint AS followers,
      COALESCE(SUM(a.estimated_revenue_cents), 0)::int AS revenue_cents,
      COUNT(DISTINCT cp.id)::int AS posts
    FROM connected_platforms pl
    LEFT JOIN content_posts cp ON cp.platform_id = pl.id AND cp.status = 'published'
    LEFT JOIN analytics_snapshots a ON a.platform_id = pl.id AND a.post_id IS NULL
      AND a.snapshot_date >= CURRENT_DATE - ${days}
    WHERE pl.user_id = ${userId}
      AND pl.is_active = true
    GROUP BY pl.platform
    ORDER BY views DESC
  `;

  return rows as PlatformBreakdown[];
}

// ─── AI-Powered Insights ────────────────────────────────────────────────────

export async function getAiInsights(
  userId: string,
  days: number = 30,
): Promise<AnalyticsInsight[]> {
  // Get existing AI insights from analytics_snapshots
  const existingInsights = await sql()`
    SELECT ai_insight, ai_insight_generated_at
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND ai_insight IS NOT NULL
      AND ai_insight_generated_at >= NOW() - INTERVAL '24 hours'
    ORDER BY ai_insight_generated_at DESC
    LIMIT 3
  `;

  if (existingInsights.length > 0) {
    // Return cached insights (regenerated daily)
    return (existingInsights as Array<{
      ai_insight: string;
      ai_insight_generated_at: string;
    }>).map((r) => {
      try {
        return JSON.parse(r.ai_insight) as AnalyticsInsight;
      } catch {
        return {
          insight: r.ai_insight,
          evidence: "",
          recommendation: "",
          generatedAt: r.ai_insight_generated_at,
        };
      }
    });
  }

  // Generate fresh insights from current data
  const overview = await getOverviewStats(userId, days);
  const topContent = await getTopContent(userId, 5, days);
  const platforms = await getPlatformBreakdown(userId, days);

  // Get recent video data for the AI
  const recentVideos = await sql()`
    SELECT title, views, likes, comments, published_at::text
    FROM content_posts
    WHERE user_id = ${userId}
      AND status = 'published'
      AND published_at >= NOW() - INTERVAL '${sql().raw(`${days} days`)}'
    ORDER BY published_at DESC
    LIMIT 10
  `;

  // Get top performing tags
  const [tagsResult] = await sql()`
    SELECT unnest(tags) AS tag, COUNT(*) AS cnt
    FROM content_posts
    WHERE user_id = ${userId}
      AND status = 'published'
      AND published_at >= NOW() - INTERVAL '${sql().raw(`${days} days`)}'
    GROUP BY tag
    ORDER BY cnt DESC
    LIMIT 5
  `;

  const topTags = tagsResult ? Object.values(tagsResult as Record<string, unknown>).slice(0, 5).map(String) : [];

  // Generate insight using AI
  const insight = await generateAnalyticsInsight({
    userId,
    channelData: {
      totalViews: overview.totalViews,
      avgViewsPerVideo: overview.totalPosts > 0 ? Math.round(overview.totalViews / overview.totalPosts) : 0,
      subscriberCount: overview.totalFollowers,
      engagementRate: overview.engagementRate,
      recentVideoViews: (recentVideos as Array<{
        title: string;
        views: number;
        likes: number;
        comments: number;
        published_at: string;
      }>).map((v) => ({
        title: v.title,
        views: Number(v.views),
        likes: Number(v.likes),
        comments: Number(v.comments),
        publishedAt: v.published_at,
      })),
      topPerformingTags: topTags,
      period: `${days} days`,
    },
  });

  const result: AnalyticsInsight = {
    ...insight,
    generatedAt: new Date().toISOString(),
  };

  return [result];
}

// ─── Growth Recommendations ─────────────────────────────────────────────────

export async function getGrowthRecommendations(
  userId: string,
): Promise<AnalyticsInsight[]> {
  const platforms = await sql()`
    SELECT platform, subscriber_count, total_views
    FROM connected_platforms
    WHERE user_id = ${userId} AND is_active = true
  `;

  const latestPost = await sql()`
    SELECT content_type
    FROM content_posts
    WHERE user_id = ${userId} AND status = 'published'
    ORDER BY published_at DESC
    LIMIT 1
  `;

  const topContentTypes = await sql()`
    SELECT content_type, COUNT(*)::int AS cnt
    FROM content_posts
    WHERE user_id = ${userId} AND status = 'published'
    GROUP BY content_type
    ORDER BY cnt DESC
    LIMIT 3
  `;

  const [user] = await sql()`
    SELECT display_name, created_at
    FROM users
    WHERE id = ${userId}
  `;

  const rec = await generateGrowthRecommendations({
    userId,
    channelData: {
      niche: "content creation",
      subscriberCount: platforms.reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.subscriber_count ?? 0), 0),
      avgViews: 0,
      postingFrequency: "regular",
      topContentTypes: (topContentTypes as Array<{ content_type: string }>).map((r) => r.content_type),
      platforms: (platforms as Array<{ platform: string }>).map((r) => r.platform),
    },
  });

  return [
    {
      insight: rec.summary,
      evidence: `Based on analysis of ${platforms.length} connected platform(s) and ${topContentTypes.length} content type(s).`,
      recommendation: rec.growth_opportunities.join(". "),
      generatedAt: new Date().toISOString(),
    },
  ];
}

// ─── Followers Breakdown ────────────────────────────────────────────────────

export async function getFollowersBreakdown(userId: string): Promise<FollowersBreakdown> {
  const [row] = await sql()`
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
  const [current] = await sql()`
    SELECT MAX(followers)::bigint AS followers
    FROM analytics_snapshots
    WHERE user_id = ${userId} AND post_id IS NULL
  `;
  const [weekAgo] = await sql()`
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
  const [row] = await sql()`
    SELECT
      COALESCE(SUM(watch_time_minutes), 0)::real AS total_watch_time_minutes,
      COALESCE(SUM(views), 0)::bigint AS total_views
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND post_id IS NULL
      AND snapshot_date >= CURRENT_DATE - ${days}
  `;

  const totalWatchTimeMinutes = Number(row?.total_watch_time_minutes ?? 0);
  const totalViews = Number(row?.total_views ?? 0);

  return {
    avgWatchTimeMinutes: totalViews > 0 ? Number((totalWatchTimeMinutes / totalViews).toFixed(1)) : 0,
    totalWatchTimeMinutes,
    totalViews,
  };
}

// ─── Click-Through Rate ─────────────────────────────────────────────────────

export async function getClickThroughRate(
  userId: string,
  days: number = 30,
): Promise<ClickThroughRate> {
  const [row] = await sql()`
    SELECT
      COALESCE(SUM(impressions), 0)::bigint AS impressions,
      COALESCE(SUM(views), 0)::bigint AS clicks
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND post_id IS NULL
      AND snapshot_date >= CURRENT_DATE - ${days}
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
  const [row] = await sql()`
    SELECT
      COALESCE(SUM(returning_viewers), 0)::bigint AS returning_viewers,
      COALESCE(SUM(unique_viewers), 0)::bigint AS unique_viewers
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND post_id IS NULL
      AND snapshot_date >= CURRENT_DATE - ${days}
  `;

  const returningViewers = Number(row?.returning_viewers ?? 0);
  const uniqueViewers = Number(row?.unique_viewers ?? 0);

  return {
    returningViewers,
    uniqueViewers,
    percent: uniqueViewers > 0 ? Number(((returningViewers / uniqueViewers) * 100).toFixed(1)) : 0,
  };
}

// ─── Best & Worst Content ───────────────────────────────────────────────────

function mapContentRow(r: {
  id: string;
  title: string;
  content_type: string;
  views: number;
  likes: number;
  comments: number;
  engagement_rate: number;
  published_at: string;
  platform: string | null;
}): TopContentItem {
  return {
    id: r.id,
    title: r.title,
    content_type: r.content_type,
    views: Number(r.views),
    likes: Number(r.likes),
    comments: Number(r.comments),
    engagement_rate: Number(r.engagement_rate),
    published_at: r.published_at,
    platform: r.platform,
  };
}

export async function getBestAndWorstContent(
  userId: string,
  days: number = 30,
  limit: number = 3,
): Promise<ContentPerformance> {
  const best = await getTopContent(userId, limit, days);

  const rows = await sql()`
    SELECT
      cp.id,
      cp.title,
      cp.content_type,
      cp.views,
      cp.likes,
      cp.comments,
      cp.engagement_rate,
      cp.published_at::text,
      pl.platform
    FROM content_posts cp
    LEFT JOIN connected_platforms pl ON cp.platform_id = pl.id
    WHERE cp.user_id = ${userId}
      AND cp.status = 'published'
      AND cp.published_at >= NOW() - INTERVAL '${sql().raw(`${days} days`)}'
      AND cp.views > 0
    ORDER BY cp.views ASC
    LIMIT ${limit}
  `;

  const worst = (rows as Array<{
    id: string;
    title: string;
    content_type: string;
    views: number;
    likes: number;
    comments: number;
    engagement_rate: number;
    published_at: string;
    platform: string | null;
  }>).map(mapContentRow);

  return { best, worst };
}

// ─── Most Shared Clip ───────────────────────────────────────────────────────

export async function getMostSharedClip(
  userId: string,
  days: number = 90,
): Promise<MostSharedClip | null> {
  const [row] = await sql()`
    SELECT cp.id, cp.title, cp.content_type, cp.shares, pl.platform
    FROM content_posts cp
    LEFT JOIN connected_platforms pl ON cp.platform_id = pl.id
    WHERE cp.user_id = ${userId}
      AND cp.status = 'published'
      AND cp.published_at >= NOW() - INTERVAL '${sql().raw(`${days} days`)}'
    ORDER BY cp.shares DESC
    LIMIT 1
  `;

  if (!row) return null;

  return {
    id: String(row.id),
    title: String(row.title),
    content_type: String(row.content_type),
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
  const rows = await sql()`
    SELECT
      EXTRACT(HOUR FROM published_at)::int AS hour,
      AVG(views)::real AS avg_views
    FROM content_posts
    WHERE user_id = ${userId}
      AND status = 'published'
      AND published_at IS NOT NULL
      AND published_at >= NOW() - INTERVAL '${sql().raw(`${days} days`)}'
    GROUP BY hour
    ORDER BY hour ASC
  `;

  const byHour = new Map<number, number>();
  for (const r of rows as Array<{ hour: number; avg_views: number }>) {
    byHour.set(r.hour, Number(r.avg_views));
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
  const rows = await sql()`
    SELECT
      EXTRACT(ISODOW FROM published_at)::int AS dow,
      AVG(likes + comments + shares)::real AS avg_engagement
    FROM content_posts
    WHERE user_id = ${userId}
      AND status = 'published'
      AND published_at IS NOT NULL
      AND published_at >= NOW() - INTERVAL '${sql().raw(`${days} days`)}'
    GROUP BY dow
    ORDER BY dow ASC
  `;

  const byDow = new Map<number, number>();
  for (const r of rows as Array<{ dow: number; avg_engagement: number }>) {
    byDow.set(r.dow, Number(r.avg_engagement));
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