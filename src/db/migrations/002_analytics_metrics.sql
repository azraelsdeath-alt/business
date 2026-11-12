-- ============================================================================
-- CreatorOS — Migration 002: Analytics Metrics
-- ============================================================================
-- Adds impression / viewer-retention columns so the analytics layer can
-- surface click-through rate (CTR) and returning-viewer metrics. These were
-- not present in the initial schema but are required by the analytics page.

BEGIN;

-- Account/post-level snapshot metrics (NULL post_id = account-level snapshot)
ALTER TABLE analytics_snapshots
    ADD COLUMN IF NOT EXISTS impressions       BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unique_viewers    BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS returning_viewers BIGINT DEFAULT 0;

-- Per-post impressions (used for CTR: views / impressions)
ALTER TABLE content_posts
    ADD COLUMN IF NOT EXISTS impressions BIGINT DEFAULT 0;

COMMIT;
