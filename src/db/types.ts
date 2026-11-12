/**
 * CreatorOS — Database Model Types
 *
 * These types correspond 1:1 to the Postgres tables defined in
 * src/db/migrations/001_initial_schema.sql. They're used across server
 * functions and API routes for type-safe database interactions.
 */

// ─── Users ───────────────────────────────────────────────────────────────────
export type UserTier = "free" | "pro" | "creator_plus" | "agency";
export type AuthProvider = "email" | "google" | "github" | "discord" | "twitter";

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  password_hash: string | null;
  auth_provider: AuthProvider;
  auth_provider_id: string | null;
  tier: UserTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  ai_generations_daily: number;
  max_connected_platforms: number;
  max_team_members: number;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Sessions ────────────────────────────────────────────────────────────────
export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// ─── Connected Platforms ────────────────────────────────────────────────────
export type PlatformName =
  | "youtube"
  | "tiktok"
  | "twitch"
  | "kick"
  | "instagram"
  | "twitter"
  | "facebook"
  | "linkedin";

export interface ConnectedPlatform {
  id: string;
  user_id: string;
  platform: PlatformName;
  platform_username: string;
  platform_user_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  channel_id: string | null;
  channel_name: string | null;
  subscriber_count: number;
  total_views: number;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Content / Posts ─────────────────────────────────────────────────────────
export type ContentType =
  | "video"
  | "short"
  | "stream"
  | "image"
  | "audio"
  | "text"
  | "live"
  | "story"
  | "reel"
  | "post";

export type ContentStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived"
  | "failed";

export interface ContentPost {
  id: string;
  user_id: string;
  platform_id: string | null;
  platform_post_id: string | null;
  title: string;
  description: string;
  content_type: ContentType;
  url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  status: ContentStatus;
  published_at: string | null;
  scheduled_at: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  impressions: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ─── Analytics Snapshots ────────────────────────────────────────────────────
export interface AnalyticsSnapshot {
  id: string;
  user_id: string;
  platform_id: string | null;
  post_id: string | null;
  snapshot_date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  follower_change: number;
  watch_time_minutes: number;
  estimated_revenue_cents: number;
  impressions: number;
  unique_viewers: number;
  returning_viewers: number;
  ai_insight: string | null;
  ai_insight_generated_at: string | null;
  raw_metrics: Record<string, unknown>;
  created_at: string;
}

// ─── AI Generations ─────────────────────────────────────────────────────────
export type GenerationType =
  | "title"
  | "description"
  | "hashtags"
  | "thumbnail"
  | "clip"
  | "insight"
  | "trend"
  | "growth_recommendation";

export interface AiGeneration {
  id: string;
  user_id: string;
  generation_type: GenerationType;
  prompt: string;
  result: string;
  model_used: string;
  tokens_used: number;
  cost_cents: number;
  created_at: string;
}

// ─── Sponsorships ───────────────────────────────────────────────────────────
export type CampaignType =
  | "flat_fee"
  | "commission"
  | "free_product"
  | "revenue_share"
  | "other";

export type SponsorshipStatus =
  | "negotiating"
  | "active"
  | "completed"
  | "cancelled"
  | "declined";

export interface Sponsorship {
  id: string;
  user_id: string;
  brand_name: string;
  brand_logo_url: string | null;
  contact_email: string | null;
  campaign_name: string;
  campaign_type: CampaignType;
  status: SponsorshipStatus;
  contract_value_cents: number;
  paid_amount_cents: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  deliverables: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Revenue Records ────────────────────────────────────────────────────────
export type RevenueSource =
  | "youtube_ads"
  | "tiktok_fund"
  | "twitch_subs"
  | "twitch_bits"
  | "kick_subs"
  | "instagram_bonus"
  | "sponsorship"
  | "merchandise"
  | "affiliate"
  | "donation"
  | "other";

export interface RevenueRecord {
  id: string;
  user_id: string;
  platform_id: string | null;
  sponsorship_id: string | null;
  source: RevenueSource;
  amount_cents: number;
  currency: string;
  description: string | null;
  transaction_date: string;
  is_verified: boolean;
  created_at: string;
}

// ─── Brand Kits ─────────────────────────────────────────────────────────────
export interface BrandKit {
  id: string;
  user_id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  heading_font: string;
  body_font: string;
  logo_url: string | null;
  favicon_url: string | null;
  banner_url: string | null;
  watermark_url: string | null;
  overlay_templates: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Team Members ───────────────────────────────────────────────────────────
export type TeamRole = "admin" | "editor" | "viewer" | "custom";
export type TeamMemberStatus = "pending" | "active" | "declined" | "removed";

export interface TeamMember {
  id: string;
  user_id: string;
  member_email: string;
  member_name: string | null;
  member_user_id: string | null;
  role: TeamRole;
  permissions: Record<string, boolean>;
  status: TeamMemberStatus;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── To-do Items ────────────────────────────────────────────────────────────
export type TodoPriority = "low" | "medium" | "high" | "urgent";
export type TodoStatus = "todo" | "in_progress" | "review" | "done";

export interface TodoItem {
  id: string;
  user_id: string;
  assignee_id: string | null;
  post_id: string | null;
  title: string;
  description: string;
  priority: TodoPriority;
  status: TodoStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Content Schedules ──────────────────────────────────────────────────────
export type ScheduleStatus =
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export interface ContentSchedule {
  id: string;
  user_id: string;
  post_id: string | null;
  platform_id: string | null;
  scheduled_at: string;
  published_at: string | null;
  status: ScheduleStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Marketplace Items ──────────────────────────────────────────────────────
export type MarketplaceItemType =
  | "overlay"
  | "emote"
  | "preset"
  | "template"
  | "ai_prompt"
  | "sound"
  | "font";

export interface MarketplaceItem {
  id: string;
  creator_id: string;
  item_type: MarketplaceItemType;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  file_url: string;
  preview_url: string | null;
  tags: string[];
  is_published: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Dashboard Aggregates (computed types, not direct table mappings) ───────

export interface DashboardOverview {
  totalViews: number;
  totalFollowers: number;
  totalRevenueCents: number;
  totalPosts: number;
  engagementRate: number;
  topPerformingPost: ContentPost | null;
  recentInsights: string[];
  connectedPlatforms: number;
  activeSponsorships: number;
  pendingTasks: number;
}

export interface RevenueOverview {
  totalRevenueCents: number;
  revenueBySource: Record<string, number>;
  revenueByMonth: Array<{ month: string; amount_cents: number }>;
  activeSponsorships: Sponsorship[];
  pendingPayouts: number;
}

export interface AnalyticsOverview {
  viewsOverTime: Array<{ date: string; views: number }>;
  followerGrowth: Array<{ date: string; followers: number }>;
  topContent: ContentPost[];
  insights: Array<{ postId: string; insight: string }>;
}