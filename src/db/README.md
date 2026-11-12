# CreatorOS Database

**Stack:** Neon (serverless Postgres over HTTP)

## Schema Overview

The database consists of 12 core tables covering the full CreatorOS domain:

### 1. `users` — Core user accounts
- Auth via email/password or OAuth providers (Google, GitHub, Discord, Twitter)
- Tier system: free, pro, creator_plus, agency
- Daily AI generation limits and platform/team caps

### 2. `sessions` — Simple session-based auth
- Token-based sessions with expiry
- Created on login, deleted on logout

### 3. `connected_platforms` — OAuth-connected creator accounts
- YouTube, TikTok, Twitch, Kick, Instagram, Twitter, etc.
- Stores encrypted OAuth tokens and cached subscriber/views counts

### 4. `content_posts` — All published/scheduled/draft content
- Links to platform and stores performance metrics
- Supports: video, short, stream, image, audio, text, live, story, reel, post
- Tag-based categorization

### 5. `analytics_snapshots` — Time-series performance data
- Account-level and per-post snapshots by date
- Stores AI-generated insights ("why" explanations)
- Raw JSONB field for platform-specific metrics

### 6. `ai_generations` — AI usage tracking
- Records every AI generation (title, description, hashtags, insights, etc.)
- Tracks tokens used and cost for billing

### 7. `sponsorships` — Brand deal management
- Full campaign lifecycle: negotiating → active → completed/cancelled
- Financial tracking with contract value and paid amounts

### 8. `revenue_records` — Multi-source revenue tracking
- YouTube ads, TikTok fund, Twitch subs/bits, sponsorships, etc.
- Links to platforms and sponsorships for drill-down

### 9. `brand_kits` — Visual identity management
- Colors, fonts, logos, banners, overlay templates
- Users can have multiple brand kits

### 10. `team_members` — Collaboration and permissions
- Roles: admin, editor, viewer, custom
- Granular JSONB permissions per function area

### 11. `todo_items` — Task management
- Priority system: low, medium, high, urgent
- Status workflow: todo → in_progress → review → done
- Can be assigned to team members and linked to content

### 12. `marketplace_items` — Creator marketplace
- Overlays, emotes, presets, templates, AI prompts, sounds, fonts
- Commission-based revenue model

### 13. `content_schedules` — Cross-platform scheduling
- Links posts to platforms with publish dates
- Status tracking: scheduled → publishing → published → failed

## Migrations

Migration files live in `src/db/migrations/` and are applied in order.

```bash
bun run migrate    # Apply all pending migrations + seed data
bun run seed       # Seed demo data only
```

## Common Query Patterns

```typescript
import { sql } from "~/db";
import type { User } from "~/db";

// Get user by ID
const getUser = createServerFn().handler(async () => {
  const [user] = await sql()`SELECT * FROM users WHERE id = ${userId}`;
  return user as User;
});

// Get dashboard overview
const getOverview = createServerFn().handler(async () => {
  const [stats] = await sql()`
    SELECT
      COALESCE(SUM(views), 0) as total_views,
      COALESCE(SUM(estimated_revenue_cents), 0) as total_revenue
    FROM analytics_snapshots
    WHERE user_id = ${userId}
      AND post_id IS NULL
      AND snapshot_date >= CURRENT_DATE - 30
  `;
  return stats;
});
```

## Adding a New Migration

1. Create `src/db/migrations/002_description.sql`
2. Follow the convention: wrap in `BEGIN;` / `COMMIT;`, use `IF NOT EXISTS`
3. Run `bun run migrate`

## Seed Data

The seed file (`src/db/seed/001_seed_data.sql`) provides demo users:
- **Alice Creator** (creator_plus tier) — YouTube & TikTok creator with 520K subs
- **Bob Streamer** (pro tier) — Twitch & YouTube with 25K followers
- **Carol Editor** (free tier) — YouTube editor/designer

Each user has a demo session token for development testing.