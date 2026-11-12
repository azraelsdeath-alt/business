/**
 * CreatorOS — Analytics Insights API Route
 *
 * GET /api/analytics/insights
 *
 * Query params:
 *   scope  - "dashboard" (default, full dashboard), "overview", "top-content",
 *            "trends", "platforms", "ai-insights", "growth", "followers",
 *            "growth-rate", "watch-time", "ctr", "returning-viewers",
 *            "best-worst", "most-shared", "posting-time",
 *            "audience-activity", "key-metrics", "health"
 *   days   - Number of days to look back (default 30, max 365)
 *   limit  - Max items for top-content / best-worst (default 10, max 50)
 *
 * Authentication: Required via session cookie or Bearer token
 * (`scope=health` is public so the app can report what still needs credentials).
 *
 * Every response carries `meta` describing where the data came from, so the UI
 * can say "heuristic insights — add OPENAI_API_KEY for real AI" instead of
 * silently showing placeholder text.
 *
 * Example:
 *   GET /api/analytics/insights?scope=overview&days=7
 *   GET /api/analytics/insights?scope=top-content&limit=5
 *   GET /api/analytics/insights (full dashboard, 30 days)
 *   GET /api/analytics/insights?scope=health
 */

import { createFileRoute } from "@tanstack/react-router";
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
  getInsightSource,
} from "~/lib/server/analytics";
import {
  MESSAGES,
  errorResponse,
  hasDatabase,
  hasOpenAI,
  jsonResponse,
  missingSecrets,
} from "~/lib/server/env";

export const Route = createFileRoute("/api/analytics/insights")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const scope = url.searchParams.get("scope") || "dashboard";
        const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 1), 365);
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 10, 1), 50);

        // Public config probe — says which secret unblocks which feature.
        if (scope === "health") {
          return jsonResponse({
            success: true,
            data: {
              database: hasDatabase() ? "connected" : "missing",
              ai: hasOpenAI() ? "openai" : "heuristic",
              insightsSource: getInsightSource(),
            },
            meta: {
              missingSecrets: missingSecrets(),
              notes: {
                DATABASE_URL: MESSAGES.database,
                OPENAI_API_KEY: MESSAGES.openai,
                GOOGLE_CLIENT_ID: MESSAGES.google,
                GOOGLE_CLIENT_SECRET: MESSAGES.google,
              },
            },
          });
        }

        if (!hasDatabase()) {
          return jsonResponse(
            { success: false, error: MESSAGES.database, missing: ["DATABASE_URL"] },
            503,
          );
        }

        const meta = {
          scope,
          days,
          limit,
          insightsSource: getInsightSource(),
          ...(hasOpenAI() ? {} : { notice: MESSAGES.openai }),
        };

        try {
          const user = await getSessionUser(request);
          if (!user) {
            return jsonResponse(
              { success: false, error: "Unauthorized", signIn: "/login" },
              401,
            );
          }

          switch (scope) {
            case "overview":
              return jsonResponse({
                success: true,
                data: await getOverviewStats(user.id, days),
                meta,
              });

            case "top-content":
              return jsonResponse({
                success: true,
                data: await getTopContent(user.id, limit, days),
                meta,
              });

            case "trends":
              return jsonResponse({
                success: true,
                data: await getViewsOverTime(user.id, days),
                meta,
              });

            case "platforms":
              return jsonResponse({
                success: true,
                data: await getPlatformBreakdown(user.id, days),
                meta,
              });

            case "ai-insights":
              return jsonResponse({
                success: true,
                data: await getAiInsights(user.id, days),
                meta,
              });

            case "growth":
              return jsonResponse({
                success: true,
                data: await getGrowthRecommendations(user.id),
                meta,
              });

            case "followers":
              return jsonResponse({
                success: true,
                data: await getFollowersBreakdown(user.id),
                meta,
              });

            case "growth-rate":
              return jsonResponse({
                success: true,
                data: await getGrowthRate(user.id),
                meta,
              });

            case "watch-time":
              return jsonResponse({
                success: true,
                data: await getAverageWatchTime(user.id, days),
                meta,
              });

            case "ctr":
              return jsonResponse({
                success: true,
                data: await getClickThroughRate(user.id, days),
                meta,
              });

            case "returning-viewers":
              return jsonResponse({
                success: true,
                data: await getReturningViewers(user.id, days),
                meta,
              });

            case "best-worst":
              return jsonResponse({
                success: true,
                data: await getBestAndWorstContent(user.id, days, limit),
                meta,
              });

            case "most-shared":
              return jsonResponse({
                success: true,
                data: await getMostSharedClip(user.id, days),
                meta,
              });

            case "posting-time":
              return jsonResponse({
                success: true,
                data: await getBestPostingTime(user.id, days),
                meta,
              });

            case "audience-activity":
              return jsonResponse({
                success: true,
                data: await getMostActiveAudienceTime(user.id, days),
                meta,
              });

            case "key-metrics":
              return jsonResponse({
                success: true,
                data: await getKeyMetrics(user.id, days),
                meta,
              });

            case "dashboard":
            default:
              return jsonResponse({
                success: true,
                data: await getFullAnalyticsDashboard(user.id, days),
                meta,
              });
          }
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
