/**
 * CreatorOS — Analytics Insights API Route
 *
 * GET /api/analytics/insights
 *
 * Query params:
 *   scope  - "dashboard" (default, full dashboard), "overview", "top-content",
 *            "trends", "platforms", "ai-insights", "growth"
 *   days   - Number of days to look back (default 30, max 365)
 *   limit  - Max items for top-content (default 10, max 50)
 *
 * Authentication: Required via session cookie or Bearer token.
 *
 * Example:
 *   GET /api/analytics/insights?scope=overview&days=7
 *   GET /api/analytics/insights?scope=top-content&limit=5
 *   GET /api/analytics/insights (full dashboard, 30 days)
 */

import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getSessionUser } from "~/services/auth";
import {
  getFullAnalyticsDashboard,
  getOverviewStats,
  getTopContent,
  getViewsOverTime,
  getPlatformBreakdown,
  getAiInsights,
  getGrowthRecommendations,
  getFollowersBreakdown,
  getGrowthRate,
  getAverageWatchTime,
  getClickThroughRate,
  getReturningViewers,
  getBestAndWorstContent,
  getMostSharedClip,
  getBestPostingTime,
  getMostActiveAudienceTime,
  getKeyMetrics,
} from "~/lib/server/analytics";

export const APIRoute = createAPIFileRoute("/api/analytics/insights")({
  GET: async ({ request }) => {
    try {
      // Authenticate
      const user = await getSessionUser(request);
      if (!user) {
        return json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(request.url);
      const scope = url.searchParams.get("scope") || "dashboard";
      const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 1), 365);
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 10, 1), 50);

      switch (scope) {
        case "overview": {
          const data = await getOverviewStats(user.id, days);
          return json({ success: true, data });
        }

        case "top-content": {
          const data = await getTopContent(user.id, limit, days);
          return json({ success: true, data });
        }

        case "trends": {
          const data = await getViewsOverTime(user.id, days);
          return json({ success: true, data });
        }

        case "platforms": {
          const data = await getPlatformBreakdown(user.id, days);
          return json({ success: true, data });
        }

        case "ai-insights": {
          const data = await getAiInsights(user.id, days);
          return json({ success: true, data });
        }

        case "growth": {
          const data = await getGrowthRecommendations(user.id);
          return json({ success: true, data });
        }

        case "followers": {
          const data = await getFollowersBreakdown(user.id);
          return json({ success: true, data });
        }

        case "growth-rate": {
          const data = await getGrowthRate(user.id);
          return json({ success: true, data });
        }

        case "watch-time": {
          const data = await getAverageWatchTime(user.id, days);
          return json({ success: true, data });
        }

        case "ctr": {
          const data = await getClickThroughRate(user.id, days);
          return json({ success: true, data });
        }

        case "returning-viewers": {
          const data = await getReturningViewers(user.id, days);
          return json({ success: true, data });
        }

        case "best-worst": {
          const data = await getBestAndWorstContent(user.id, days, limit);
          return json({ success: true, data });
        }

        case "most-shared": {
          const data = await getMostSharedClip(user.id, days);
          return json({ success: true, data });
        }

        case "posting-time": {
          const data = await getBestPostingTime(user.id, days);
          return json({ success: true, data });
        }

        case "audience-activity": {
          const data = await getMostActiveAudienceTime(user.id, days);
          return json({ success: true, data });
        }

        case "key-metrics": {
          const data = await getKeyMetrics(user.id, days);
          return json({ success: true, data });
        }

        case "dashboard":
        default: {
          const data = await getFullAnalyticsDashboard(user.id, days);
          return json({ success: true, data });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return json({ success: false, error: message }, { status: 500 });
    }
  },
});