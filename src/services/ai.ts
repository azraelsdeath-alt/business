/**
 * CreatorOS — AI Service
 *
 * Provides AI-powered content generation and analytics insights using OpenAI.
 * Each function tracks usage via the `ai_generations` table.
 *
 * Falls back to mock responses when OPENAI_API_KEY is not set, so the frontend
 * can be developed without a real API key.
 */

import { sql } from "~/db";
import type { AiGeneration, GenerationType } from "~/db/types";

// ─── OpenAI Client ──────────────────────────────────────────────────────────

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  // Dynamic import so it doesn't break when the env var is absent
  // We'll use fetch directly to avoid the openai package dependency
  return { apiKey: key };
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  model = "gpt-4o",
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return mockFallback(systemPrompt, userPrompt);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "";
}

// ─── Usage Tracking ─────────────────────────────────────────────────────────

async function trackUsage(params: {
  userId: string;
  generationType: GenerationType;
  prompt: string;
  result: string;
  modelUsed: string;
}): Promise<AiGeneration> {
  const [record] = await sql()`
    INSERT INTO ai_generations (user_id, generation_type, prompt, result, model_used, tokens_used)
    VALUES (
      ${params.userId},
      ${params.generationType},
      ${params.prompt},
      ${params.result},
      ${params.modelUsed},
      ${Math.ceil(params.result.length / 4)}  -- approximate token count
    )
    RETURNING *
  `;
  return record as unknown as AiGeneration;
}

// ─── Prompt Templates ───────────────────────────────────────────────────────

const PROMPTS = {
  titles: {
    system: `You are a creative content strategist for YouTube and TikTok creators.
Generate attention-grabbing, clickable video title options. 
Return them as a JSON array of strings. Each title should be compelling and use proven patterns
(controversy, curiosity, numbers, how-to, challenge format).
Aim for 5-10 title options. Keep titles under 70 characters.`,
  },
  descriptions: {
    system: `You are a content description writer for social media creators.
Write engaging video descriptions optimized for search (SEO).
Use a hook, then 2-3 sentences of context, then a call to action.
Include relevant hashtags at the end.
Return as plain text. Keep under 300 words.`,
  },
  hashtags: {
    system: `You are a social media hashtag strategist.
Generate a JSON array of 15-20 relevant hashtags for the given content topic.
Mix popular (1M+ posts) and niche tags. Include platform-specific tags.
Return as a JSON array of strings with the # symbol.`,
  },
  thumbnail: {
    system: `You are a thumbnail design consultant for YouTube creators.
Suggest 3-5 thumbnail concepts for the given video topic.
For each concept describe: the visual composition, text overlay (if any),
color palette, and emotional hook (curiosity, shock, humor, etc.).
Return as a JSON array of objects with fields: concept, description, text_overlay, color_palette.`,
  },
  clipIdeas: {
    system: `You are a short-form content strategist specializing in repurposing long content into clips.
Suggest 5-8 short clip ideas that could be extracted from the given content.
For each clip, provide: a hook line, the clip duration (15-60 seconds),
the platform it's best suited for (YouTube Shorts, TikTok, Instagram Reels),
and why this clip would perform well.
Return as a JSON array of objects with fields: hook, duration_seconds, platform, reasoning.`,
  },
  analyticsInsight: {
    system: `You are an AI analytics expert for content creators. Analyze the provided
performance data and generate actionable insights. Be specific with numbers and comparisons.
Identify: what's working, what's not, and what to change.
Focus on patterns the creator might miss. Be direct and data-driven.
Return as a JSON object with fields: insight (main takeaway, 1-2 sentences),
evidence (specific numbers backing the insight), recommendation (actionable next step).`,
  },
  growthRecommendation: {
    system: `You are a growth strategist for content creators. Based on the provided
channel data, generate personalized growth recommendations. Cover:
optimal posting frequency, best content types to focus on, audience retention tips,
collaboration suggestions, and platform-specific strategies.
Return as a JSON object with fields: best_posting_times (array),
recommended_content_types (array), audience_tips (array),
growth_opportunities (array), and a summary string.`,
  },
  trendAnalysis: {
    system: `You are a trend analyst for content creators. Analyze current trends
relevant to the creator's niche and audience. For each trend, explain why it's relevant,
how to capitalize on it, and how long the trend window is likely open.
Return as a JSON array of objects with fields: trend_name, relevance, strategy, trend_window.`,
  },
};

// ─── Content Generation Functions ───────────────────────────────────────────

export async function generateTitles(params: {
  userId: string;
  topic: string;
  tone?: string;
  count?: number;
}): Promise<string[]> {
  const prompt = `Generate ${params.count ?? 8} video title options for content about: "${params.topic}".${params.tone ? ` Tone: ${params.tone}.` : ""}`;
  const result = await callOpenAI(PROMPTS.titles.system, prompt);
  const parsed = safeParseJson<string[]>(result, [
    `"${params.topic}" - Complete Guide`,
    `I Tried ${params.topic} So You Don't Have To`,
    `${params.topic}: The Untold Story`,
  ]);
  await trackUsage({
    userId: params.userId,
    generationType: "title",
    prompt,
    result: JSON.stringify(parsed),
    modelUsed: "gpt-4o",
  });
  return parsed;
}

export async function generateDescription(params: {
  userId: string;
  topic: string;
  keywords?: string[];
  includeHashtags?: boolean;
}): Promise<string> {
  const prompt = `Write a video description for content about: "${params.topic}".${params.keywords ? ` Target keywords: ${params.keywords.join(", ")}.` : ""}${params.includeHashtags ? " Include relevant hashtags at the end." : ""}`;
  const result = await callOpenAI(PROMPTS.descriptions.system, prompt);
  await trackUsage({
    userId: params.userId,
    generationType: "description",
    prompt,
    result,
    modelUsed: "gpt-4o",
  });
  return result;
}

export async function generateHashtags(params: {
  userId: string;
  topic: string;
  platform?: string;
}): Promise<string[]> {
  const prompt = `Generate hashtags for content about: "${params.topic}".${params.platform ? ` Platform: ${params.platform}.` : ""}`;
  const result = await callOpenAI(PROMPTS.hashtags.system, prompt);
  const parsed = safeParseJson<string[]>(result, [
    `#${params.topic.replace(/\s+/g, "")}`,
    "#viral",
    "#contentcreator",
  ]);
  await trackUsage({
    userId: params.userId,
    generationType: "hashtags",
    prompt,
    result: JSON.stringify(parsed),
    modelUsed: "gpt-4o",
  });
  return parsed;
}

export async function generateThumbnailIdeas(params: {
  userId: string;
  videoTitle: string;
  videoTopic: string;
}): Promise<
  Array<{
    concept: string;
    description: string;
    text_overlay: string;
    color_palette: string;
  }>
> {
  const prompt = `Suggest thumbnail concepts for a video titled: "${params.videoTitle}" about: "${params.videoTopic}".`;
  const result = await callOpenAI(PROMPTS.thumbnail.system, prompt);
  const parsed = safeParseJson<
    Array<{
      concept: string;
      description: string;
      text_overlay: string;
      color_palette: string;
    }>
  >(result, [
    {
      concept: "Bold Expression",
      description: `Close-up of surprised/amazed expression related to ${params.videoTopic}`,
      text_overlay: params.videoTitle.length > 40 ? "YOU WON'T BELIEVE THIS" : params.videoTitle,
      color_palette: "Warm oranges and reds for urgency",
    },
  ]);
  await trackUsage({
    userId: params.userId,
    generationType: "thumbnail",
    prompt,
    result: JSON.stringify(parsed),
    modelUsed: "gpt-4o",
  });
  return parsed;
}

export async function generateClipIdeas(params: {
  userId: string;
  contentDescription: string;
  contentType?: string;
}): Promise<
  Array<{
    hook: string;
    duration_seconds: number;
    platform: string;
    reasoning: string;
  }>
> {
  const prompt = `Suggest short clip ideas from content: "${params.contentDescription}".${params.contentType ? ` Content type: ${params.contentType}.` : ""}`;
  const result = await callOpenAI(PROMPTS.clipIdeas.system, prompt);
  const parsed = safeParseJson<
    Array<{
      hook: string;
      duration_seconds: number;
      platform: string;
      reasoning: string;
    }>
  >(result, [
    {
      hook: `The most shocking moment from ${params.contentDescription}`,
      duration_seconds: 30,
      platform: "TikTok",
      reasoning: "High engagement hook drives retention",
    },
  ]);
  await trackUsage({
    userId: params.userId,
    generationType: "clip",
    prompt,
    result: JSON.stringify(parsed),
    modelUsed: "gpt-4o",
  });
  return parsed;
}

// ─── Analytics Insight Functions ────────────────────────────────────────────

export async function generateAnalyticsInsight(params: {
  userId: string;
  channelData: {
    totalViews: number;
    avgViewsPerVideo: number;
    subscriberCount: number;
    engagementRate: number;
    recentVideoViews: Array<{ title: string; views: number; likes: number; comments: number; publishedAt: string }>;
    topPerformingTags: string[];
    period: string;
  };
}): Promise<{
  insight: string;
  evidence: string;
  recommendation: string;
}> {
  const { channelData } = params;
  const prompt = `Analyze this creator's channel data for the period "${channelData.period}":
- Total views: ${channelData.totalViews}
- Avg views per video: ${channelData.avgViewsPerVideo}
- Subscribers: ${channelData.subscriberCount}
- Engagement rate: ${channelData.engagementRate}%
- Top performing tags: ${channelData.topPerformingTags.join(", ")}

Recent videos:
${channelData.recentVideoViews.map((v) => `  - "${v.title}": ${v.views} views, ${v.likes} likes, ${v.comments} comments (published ${v.publishedAt})`).join("\n")}

Generate a data-driven analytics insight.`;
  const result = await callOpenAI(PROMPTS.analyticsInsight.system, prompt);
  const parsed = safeParseJson<{ insight: string; evidence: string; recommendation: string }>(
    result,
    {
      insight: `Your ${channelData.period} performance shows ${channelData.avgViewsPerVideo > 10000 ? "strong" : "room for improvement"} with an average of ${channelData.avgViewsPerVideo.toLocaleString()} views per video.`,
      evidence: `Channel averaged ${channelData.avgViewsPerVideo.toLocaleString()} views with ${channelData.engagementRate}% engagement rate across ${channelData.recentVideoViews.length} videos.`,
      recommendation: channelData.avgViewsPerVideo > 50000
        ? "Continue your current content strategy. Consider increasing posting frequency to capitalize on momentum."
        : "Test more clickable titles and thumbnails. Analyze your top 3 performing videos for patterns to replicate.",
    },
  );
  await trackUsage({
    userId: params.userId,
    generationType: "insight",
    prompt,
    result: JSON.stringify(parsed),
    modelUsed: "gpt-4o",
  });
  return parsed;
}

export async function generateGrowthRecommendations(params: {
  userId: string;
  channelData: {
    niche: string;
    subscriberCount: number;
    avgViews: number;
    postingFrequency: string;
    topContentTypes: string[];
    audienceAgeRange?: string;
    platforms: string[];
  };
}): Promise<{
  best_posting_times: string[];
  recommended_content_types: string[];
  audience_tips: string[];
  growth_opportunities: string[];
  summary: string;
}> {
  const { channelData } = params;
  const prompt = `Generate growth recommendations for a ${channelData.niche} creator with:
- ${channelData.subscriberCount} subscribers
- Avg ${channelData.avgViews} views per video
- Posting ${channelData.postingFrequency}
- Content types: ${channelData.topContentTypes.join(", ")}
- Platforms: ${channelData.platforms.join(", ")}`;
  const result = await callOpenAI(PROMPTS.growthRecommendation.system, prompt);
  const parsed = safeParseJson<{
    best_posting_times: string[];
    recommended_content_types: string[];
    audience_tips: string[];
    growth_opportunities: string[];
    summary: string;
  }>(result, {
    best_posting_times: ["2-4 PM EST on weekdays", "10-11 AM EST on weekends"],
    recommended_content_types: channelData.topContentTypes,
    audience_tips: ["Reply to comments within first hour of posting", "Create community polls"],
    growth_opportunities: [`Cross-promote on ${channelData.platforms.filter(p => p !== "youtube").join(" and ")}`],
    summary: `Focus on ${channelData.topContentTypes[0] ?? "your best-performing content type"} to accelerate growth.`,
  });
  await trackUsage({
    userId: params.userId,
    generationType: "growth_recommendation",
    prompt,
    result: JSON.stringify(parsed),
    modelUsed: "gpt-4o",
  });
  return parsed;
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function safeParseJson<T>(text: string, fallback: T): T {
  // Try to find JSON in the response (it might be wrapped in markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const toParse = jsonMatch ? jsonMatch[1] : text;
  try {
    return JSON.parse(toParse) as T;
  } catch {
    return fallback;
  }
}

function mockFallback(systemPrompt: string, userPrompt: string): string {
  // Generate realistic mock responses for development without an API key
  const topic = userPrompt.replace(/.*?"([^"]+)".*/s, "$1").slice(0, 40);

  if (systemPrompt.includes("creative content strategist")) {
    return JSON.stringify([
      `${topic} - You NEED to See This`,
      `I Tried ${topic} For 30 Days`,
      `The Truth About ${topic} Nobody Talks About`,
      `${topic} Explained in 5 Minutes`,
      `Why ${topic} Is Better Than You Think`,
      `The Ultimate ${topic} Guide (2026)`,
      `This ${topic} Hack Changed Everything`,
      `${topic} vs. ${topic}: Which is Better?`,
    ]);
  }

  if (systemPrompt.includes("description writer")) {
    return `In this video, we dive deep into ${topic}. Whether you're a beginner or an expert, there's something here for everyone.

📌 What you'll learn:
• The fundamentals of ${topic}
• Advanced tips and tricks
• Common mistakes to avoid

👍 If you found this helpful, please LIKE and SUBSCRIBE for more content like this!

#${topic.replace(/\s+/g, "")} #tutorial #tips #guide #2026`;
  }

  if (systemPrompt.includes("hashtag strategist")) {
    return JSON.stringify([
      `#${topic.replace(/\s+/g, "")}`,
      "#viral",
      "#trending",
      "#contentcreator",
      "#growyourchannel",
      "#creatoros",
      "#socialmedia",
      "#tipsandtricks",
      "#mustwatch",
      "#fyp",
      "#foryou",
      "#viralvideo",
      "#contentcreation",
      "#creatorcommunity",
      "#learning",
      "#howto",
      "#tutorial",
      "#protips",
      "#newvideo",
    ]);
  }

  if (systemPrompt.includes("thumbnail consultant")) {
    return JSON.stringify([
      {
        concept: "Bold Reaction",
        description: `Close-up reaction shot with exaggerated expression about ${topic}`,
        text_overlay: topic.length > 30 ? "SHOCKING" : topic.toUpperCase(),
        color_palette: "Red and yellow for urgency",
      },
      {
        concept: "Before/After",
        description: `Split screen showing dramatic transformation related to ${topic}`,
        text_overlay: "BEFORE vs AFTER",
        color_palette: "Dark background with vibrant accent colors",
      },
      {
        concept: "Curiosity Gap",
        description: `Intriguing visual hint about ${topic} without giving everything away`,
        text_overlay: "THE TRUTH ABOUT THIS",
        color_palette: "Mysterious dark blues and purples",
      },
    ]);
  }

  if (systemPrompt.includes("short-form content strategist")) {
    return JSON.stringify([
      {
        hook: `The most important thing about ${topic}...`,
        duration_seconds: 30,
        platform: "TikTok",
        reasoning: "Short attention-grabbing hook optimized for TikTok's algorithm",
      },
      {
        hook: `I tried ${topic} and the result was shocking`,
        duration_seconds: 45,
        platform: "YouTube Shorts",
        reasoning: "Curiosity gap drives high click-through rates on Shorts",
      },
      {
        hook: `Stop doing ${topic} wrong. Here's how to fix it`,
        duration_seconds: 60,
        platform: "Instagram Reels",
        reasoning: "Educational content performs well on Reels with longer watch time",
      },
    ]);
  }

  if (systemPrompt.includes("analytics expert")) {
    return JSON.stringify({
      insight: `Your content about "${topic}" is performing above average. The engagement rate suggests strong audience connection.`,
      evidence: `Recent videos related to ${topic} averaged 15-25% higher engagement than your channel baseline.`,
      recommendation: `Double down on ${topic} content. Create a series around this topic to capitalize on momentum.`,
    });
  }

  if (systemPrompt.includes("growth strategist")) {
    return JSON.stringify({
      best_posting_times: ["2-4 PM EST on weekdays", "10-11 AM EST on weekends"],
      recommended_content_types: ["Tutorials", "Behind-the-scenes", "Educational content"],
      audience_tips: [
        "Reply to comments within the first hour",
        "Post consistently 3-4 times per week",
        "Use community posts to engage between uploads",
      ],
      growth_opportunities: [
        "Collaborate with creators in similar niches",
        "Create shareable short-form versions of long content",
        "Optimize video titles for search discoverability",
      ],
      summary: `Focus on ${topic} content with a consistent posting schedule to maximize growth. Your audience responds best to educational, value-driven content.`,
    });
  }

  if (systemPrompt.includes("trend analyst")) {
    return JSON.stringify([
      {
        trend_name: `${topic} Challenges`,
        relevance: `High - ${topic} challenge content is currently trending across platforms`,
        strategy: "Create your unique take on the challenge with a personal twist",
        trend_window: "2-4 weeks",
      },
      {
        trend_name: `${topic} Tutorials`,
        relevance: "Medium - Educational content has consistent long-tail search demand",
        strategy: "Create comprehensive tutorials that will rank in search for months",
        trend_window: "6+ months",
      },
    ]);
  }

  return "Mock response";
}

// ─── Exported Types ─────────────────────────────────────────────────────────

export type AiServiceResult<T> = { success: true; data: T } | { success: false; error: string };