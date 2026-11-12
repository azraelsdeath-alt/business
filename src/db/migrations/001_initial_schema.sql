-- ============================================================================
-- CreatorOS — Initial Database Schema (Migration 001)
-- ============================================================================
-- Tables are created with IF NOT EXISTS and dropped in reverse dependency order
-- at the top so the file is idempotent when run fresh.

BEGIN;

-- 1. Users & Auth ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL,
    avatar_url      TEXT,
    bio             TEXT DEFAULT '',
    -- Auth
    password_hash   TEXT,  -- NULL if OAuth-only; bcrypt hash
    auth_provider   TEXT DEFAULT 'email' CHECK (auth_provider IN ('email','google','github','discord','twitter')),
    auth_provider_id TEXT, -- external OAuth ID
    -- Subscription
    tier            TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro','creator_plus','agency')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    -- Limits (derived from tier)
    ai_generations_daily INTEGER NOT NULL DEFAULT 3,
    max_connected_platforms INTEGER NOT NULL DEFAULT 1,
    max_team_members INTEGER NOT NULL DEFAULT 0,
    -- Timestamps
    onboarded       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Sessions (simple session-based auth) ------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 3. Connected Platforms -----------------------------------------------------
CREATE TABLE IF NOT EXISTS connected_platforms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform        TEXT NOT NULL CHECK (platform IN ('youtube','tiktok','twitch','kick','instagram','twitter','facebook','linkedin')),
    platform_username TEXT NOT NULL,
    platform_user_id  TEXT,
    -- OAuth tokens (encrypted at rest in production)
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires_at TIMESTAMPTZ,
    -- Platform-specific
    channel_id      TEXT,       -- YouTube channel ID / Twitch broadcaster ID
    channel_name    TEXT,
    subscriber_count BIGINT DEFAULT 0,
    total_views      BIGINT DEFAULT 0,
    -- Metadata
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, platform, platform_username)
);
CREATE INDEX IF NOT EXISTS idx_connected_platforms_user ON connected_platforms(user_id);

-- 4. Content / Posts ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id     UUID REFERENCES connected_platforms(id) ON DELETE SET NULL,
    platform_post_id TEXT,     -- Native ID on the external platform
    -- Content
    title           TEXT NOT NULL,
    description     TEXT DEFAULT '',
    content_type    TEXT NOT NULL CHECK (content_type IN ('video','short','stream','image','audio','text','live','story','reel','post')),
    url             TEXT,       -- External link / watch URL
    thumbnail_url   TEXT,
    duration_seconds INTEGER,
    -- Status
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived','failed')),
    published_at    TIMESTAMPTZ,
    scheduled_at    TIMESTAMPTZ,
    -- Performance (cached from latest analytics)
    views           BIGINT DEFAULT 0,
    likes           BIGINT DEFAULT 0,
    comments        BIGINT DEFAULT 0,
    shares          BIGINT DEFAULT 0,
    engagement_rate REAL DEFAULT 0,
    -- Tags
    tags            TEXT[] DEFAULT '{}',
    -- Metadata
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_content_posts_user ON content_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_platform ON content_posts(platform_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_status ON content_posts(status);
CREATE INDEX IF NOT EXISTS idx_content_posts_published ON content_posts(published_at);

-- 5. Analytics Snapshots -----------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id     UUID REFERENCES connected_platforms(id) ON DELETE CASCADE,
    post_id         UUID REFERENCES content_posts(id) ON DELETE CASCADE,
    -- NULL post_id = account-level snapshot
    snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Metrics
    views           BIGINT DEFAULT 0,
    likes           BIGINT DEFAULT 0,
    comments        BIGINT DEFAULT 0,
    shares          BIGINT DEFAULT 0,
    followers       BIGINT DEFAULT 0,
    follower_change BIGINT DEFAULT 0,  -- net change since last snapshot
    watch_time_minutes REAL DEFAULT 0,
    estimated_revenue_cents INTEGER DEFAULT 0,
    -- AI-generated insights (stored after computation)
    ai_insight      TEXT,               -- "Why did views drop 20%?"
    ai_insight_generated_at TIMESTAMPTZ,
    -- Raw data JSON for extensibility
    raw_metrics     JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_date ON analytics_snapshots(user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_post ON analytics_snapshots(post_id);

-- 6. AI Generations (usage tracking) ----------------------------------------
CREATE TABLE IF NOT EXISTS ai_generations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generation_type TEXT NOT NULL CHECK (generation_type IN (
        'title','description','hashtags','thumbnail','clip','insight','trend','growth_recommendation'
    )),
    prompt          TEXT NOT NULL,
    result          TEXT NOT NULL,      -- The generated output
    model_used      TEXT DEFAULT 'gpt-4o',
    tokens_used     INTEGER DEFAULT 0,
    cost_cents      REAL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type ON ai_generations(generation_type);

-- 7. Sponsorships / Campaigns ------------------------------------------------
CREATE TABLE IF NOT EXISTS sponsorships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand_name      TEXT NOT NULL,
    brand_logo_url  TEXT,
    contact_email   TEXT,
    -- Campaign details
    campaign_name   TEXT NOT NULL,
    campaign_type   TEXT NOT NULL CHECK (campaign_type IN ('flat_fee','commission','free_product','revenue_share','other')),
    status          TEXT NOT NULL DEFAULT 'negotiating' CHECK (status IN ('negotiating','active','completed','cancelled','declined')),
    -- Financials
    contract_value_cents INTEGER DEFAULT 0,
    paid_amount_cents     INTEGER DEFAULT 0,
    currency        TEXT DEFAULT 'USD',
    -- Dates
    start_date      DATE,
    end_date        DATE,
    -- Deliverables
    deliverables    TEXT,               -- Description of what creator owes
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sponsorships_user ON sponsorships(user_id);

-- 8. Revenue Records ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS revenue_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id     UUID REFERENCES connected_platforms(id) ON DELETE SET NULL,
    sponsorship_id  UUID REFERENCES sponsorships(id) ON DELETE SET NULL,
    source          TEXT NOT NULL CHECK (source IN (
        'youtube_ads','tiktok_fund','twitch_subs','twitch_bits',
        'kick_subs','instagram_bonus','sponsorship','merchandise',
        'affiliate','donation','other'
    )),
    amount_cents    INTEGER NOT NULL,
    currency        TEXT DEFAULT 'USD',
    description     TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_revenue_records_user ON revenue_records(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_records_date ON revenue_records(transaction_date DESC);

-- 9. Brand Kits --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brand_kits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL DEFAULT 'Default Brand Kit',
    -- Colors
    primary_color   TEXT DEFAULT '#6366f1',
    secondary_color TEXT DEFAULT '#8b5cf6',
    accent_color    TEXT DEFAULT '#06b6d4',
    -- Fonts
    heading_font    TEXT DEFAULT 'Inter',
    body_font       TEXT DEFAULT 'Inter',
    -- Assets (URLs)
    logo_url        TEXT,
    favicon_url     TEXT,
    banner_url      TEXT,
    watermark_url   TEXT,
    -- Overlay templates
    overlay_templates JSONB DEFAULT '{}',
    -- Metadata
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brand_kits_user ON brand_kits(user_id);

-- 10. Team Members -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- The user who OWNS this team
    member_email    TEXT NOT NULL,
    member_name     TEXT,
    member_user_id  UUID REFERENCES users(id) ON DELETE SET NULL, -- Link if they have an account
    role            TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin','editor','viewer','custom')),
    permissions     JSONB DEFAULT '{"analytics":true,"content":true,"revenue":false,"settings":false}',
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','declined','removed')),
    invited_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    joined_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, member_email)
);
CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(user_id);

-- 11. To-do Items / Tasks ----------------------------------------------------
CREATE TABLE IF NOT EXISTS todo_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignee_id     UUID REFERENCES team_members(id) ON DELETE SET NULL,
    post_id         UUID REFERENCES content_posts(id) ON DELETE SET NULL,
    title           TEXT NOT NULL,
    description     TEXT DEFAULT '',
    priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
    status          TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done')),
    due_date        DATE,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_todo_items_user ON todo_items(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_status ON todo_items(status);

-- 12. Marketplace Items (for the marketplace revenue model) ------------------
CREATE TABLE IF NOT EXISTS marketplace_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type       TEXT NOT NULL CHECK (item_type IN ('overlay','emote','preset','template','ai_prompt','sound','font')),
    name            TEXT NOT NULL,
    description     TEXT DEFAULT '',
    price_cents     INTEGER NOT NULL,
    currency        TEXT DEFAULT 'USD',
    file_url        TEXT NOT NULL,
    preview_url     TEXT,
    tags            TEXT[] DEFAULT '{}',
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    download_count  INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_creator ON marketplace_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_type ON marketplace_items(item_type);

-- 13. Platform-specific content schedules ------------------------------------
CREATE TABLE IF NOT EXISTS content_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         UUID REFERENCES content_posts(id) ON DELETE CASCADE,
    platform_id     UUID REFERENCES connected_platforms(id) ON DELETE CASCADE,
    scheduled_at    TIMESTAMPTZ NOT NULL,
    published_at    TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','publishing','published','failed')),
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_content_schedules_user ON content_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_content_schedules_date ON content_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_schedules_status ON content_schedules(status);

-- Enable auto-update for updated_at columns ----------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'users','connected_platforms','content_posts','sponsorships',
        'brand_kits','team_members','todo_items','marketplace_items',
        'content_schedules'
    ]) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = 'trg_' || tbl || '_updated_at'
        ) THEN
            EXECUTE format(
                'CREATE TRIGGER trg_%I_updated_at
                 BEFORE UPDATE ON %I
                 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
                tbl, tbl
            );
        END IF;
    END LOOP;
END $$;

COMMIT;