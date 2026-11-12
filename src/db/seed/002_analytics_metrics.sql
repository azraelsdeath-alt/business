-- ============================================================================
-- CreatorOS — Seed 002: Analytics Metrics (idempotent backfill)
-- ============================================================================
-- Backfills impressions / unique-viewer / returning-viewer columns on the demo
-- rows created by seed 001, so CTR and retention charts have realistic values.
-- Only touches rows where the metric is still 0 (safe to re-run).

BEGIN;

-- Content posts: impressions ≈ views / ~14% CTR
UPDATE content_posts
SET impressions = GREATEST(ROUND(views / 0.14), views)
WHERE impressions = 0
  AND views > 0;

-- Analytics snapshots: impressions ≈ views / ~12% CTR, unique ≈ 65% of views,
-- returning ≈ 40% of unique viewers.
UPDATE analytics_snapshots
SET impressions       = GREATEST(ROUND(views / 0.12), views),
    unique_viewers    = GREATEST(ROUND(views * 0.65), 0),
    returning_viewers = GREATEST(ROUND(views * 0.65 * 0.40), 0)
WHERE impressions = 0
  AND views > 0;

COMMIT;
