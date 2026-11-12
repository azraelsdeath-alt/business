/**
 * CreatorOS — AI Generation API Route
 *
 * POST /api/ai/generate
 *
 * Body: { type: "titles" | "descriptions" | "hashtags" | "thumbnail" | "clip" | "insight" | "growth", ...params }
 *
 * Requires a valid session token in the Authorization header or session cookie.
 */

import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
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

type GenerateRequest = {
  type: "titles" | "descriptions" | "hashtags" | "thumbnail" | "clip" | "insight" | "growth";
  [key: string]: unknown;
};

export const APIRoute = createAPIFileRoute("/api/ai/generate")({
  POST: async ({ request }) => {
    try {
      // Authenticate
      const user = await getSessionUser(request);
      if (!user) {
        return json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const body = (await request.json()) as GenerateRequest;

      if (!body.type) {
        return json({ success: false, error: "Missing generation type" }, { status: 400 });
      }

      let result: unknown;

      switch (body.type) {
        case "titles": {
          result = await generateTitles({
            userId: user.id,
            topic: body.topic as string,
            tone: body.tone as string | undefined,
            count: body.count as number | undefined,
          });
          break;
        }

        case "descriptions": {
          result = await generateDescription({
            userId: user.id,
            topic: body.topic as string,
            keywords: body.keywords as string[] | undefined,
            includeHashtags: body.includeHashtags as boolean | undefined,
          });
          break;
        }

        case "hashtags": {
          result = await generateHashtags({
            userId: user.id,
            topic: body.topic as string,
            platform: body.platform as string | undefined,
          });
          break;
        }

        case "thumbnail": {
          result = await generateThumbnailIdeas({
            userId: user.id,
            videoTitle: body.videoTitle as string,
            videoTopic: body.videoTopic as string,
          });
          break;
        }

        case "clip": {
          result = await generateClipIdeas({
            userId: user.id,
            contentDescription: body.contentDescription as string,
            contentType: body.contentType as string | undefined,
          });
          break;
        }

        case "insight": {
          result = await generateAnalyticsInsight({
            userId: user.id,
            channelData: body.channelData as Parameters<typeof generateAnalyticsInsight>[0]["channelData"],
          });
          break;
        }

        case "growth": {
          result = await generateGrowthRecommendations({
            userId: user.id,
            channelData: body.channelData as Parameters<typeof generateGrowthRecommendations>[0]["channelData"],
          });
          break;
        }

        default:
          return json(
            { success: false, error: `Unknown generation type: ${body.type}` },
            { status: 400 },
          );
      }

      return json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return json({ success: false, error: message }, { status: 500 });
    }
  },
});