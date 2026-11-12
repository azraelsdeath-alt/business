/**
 * CreatorOS — AI Generation API Route
 *
 * POST /api/ai/generate
 *
 * Body: { type: "titles" | "descriptions" | "hashtags" | "thumbnail" | "clip" | "insight" | "growth", ...params }
 *
 * Requires a valid session token in the Authorization header or session cookie.
 * Returns 503 with a readable message when DATABASE_URL is missing; when
 * OPENAI_API_KEY is missing it answers with deterministic sample output and
 * `meta.ai = "heuristic"` so the UI can label it.
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "~/services/auth";
import {
  generateTitles,
  generateDescription,
  generateHashtags,
  generateThumbnailIdeas,
  generateClipIdeas,
  generateAnalyticsInsight,
  generateGrowthRecommendations,
} from "~/services/ai";
import {
  MESSAGES,
  errorResponse,
  hasDatabase,
  hasOpenAI,
  jsonResponse,
} from "~/lib/server/env";

type GenerateRequest = {
  type: "titles" | "descriptions" | "hashtags" | "thumbnail" | "clip" | "insight" | "growth";
  [key: string]: unknown;
};

export const Route = createFileRoute("/api/ai/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!hasDatabase()) {
          return jsonResponse(
            { success: false, error: MESSAGES.database, missing: ["DATABASE_URL"] },
            503,
          );
        }

        try {
          const user = await getSessionUser(request);
          if (!user) {
            return jsonResponse(
              { success: false, error: "Unauthorized", signIn: "/login" },
              401,
            );
          }

          const body = (await request.json()) as GenerateRequest;

          if (!body.type) {
            return jsonResponse({ success: false, error: "Missing generation type" }, 400);
          }

          let result: unknown;

          switch (body.type) {
            case "titles":
              result = await generateTitles({
                userId: user.id,
                topic: body.topic as string,
                tone: body.tone as string | undefined,
                count: body.count as number | undefined,
              });
              break;

            case "descriptions":
              result = await generateDescription({
                userId: user.id,
                topic: body.topic as string,
                keywords: body.keywords as string[] | undefined,
                includeHashtags: body.includeHashtags as boolean | undefined,
              });
              break;

            case "hashtags":
              result = await generateHashtags({
                userId: user.id,
                topic: body.topic as string,
                platform: body.platform as string | undefined,
              });
              break;

            case "thumbnail":
              result = await generateThumbnailIdeas({
                userId: user.id,
                videoTitle: body.videoTitle as string,
                videoTopic: body.videoTopic as string,
              });
              break;

            case "clip":
              result = await generateClipIdeas({
                userId: user.id,
                contentDescription: body.contentDescription as string,
                contentType: body.contentType as string | undefined,
              });
              break;

            case "insight":
              result = await generateAnalyticsInsight({
                userId: user.id,
                channelData: body
                  .channelData as Parameters<typeof generateAnalyticsInsight>[0]["channelData"],
              });
              break;

            case "growth":
              result = await generateGrowthRecommendations({
                userId: user.id,
                channelData: body
                  .channelData as Parameters<typeof generateGrowthRecommendations>[0]["channelData"],
              });
              break;

            default:
              return jsonResponse(
                { success: false, error: `Unknown generation type: ${body.type}` },
                400,
              );
          }

          return jsonResponse({
            success: true,
            data: result,
            meta: hasOpenAI() ? {} : { ai: "heuristic", notice: MESSAGES.openai },
          });
        } catch (error) {
          return errorResponse(error);
        }
      },
    },
  },
});
