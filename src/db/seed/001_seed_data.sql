-- ============================================================================
-- CreatorOS — Seed Data
-- ============================================================================
-- Provides demo data so the app has content to display after initial migration.

BEGIN;

-- Helper: INSERT OR IGNORE for idempotency
INSERT INTO users (id, email, display_name, bio, auth_provider, tier, ai_generations_daily, max_connected_platforms, max_team_members, onboarded)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'alice@creatoros.app', 'Alice Creator', 'Gaming & vlogs creator | 500K+ on YouTube', 'email', 'creator_plus', 9999, 5, 3, TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'bob@creatoros.app',   'Bob Streamer',  'Twitch Affiliate | Variety streamer', 'google', 'pro', 9999, 3, 0, TRUE),
    ('a0000000-0000-0000-0000-000000000003', 'carol@creatoros.app', 'Carol Editor',   'YouTube editor & thumbnail designer', 'email', 'free', 3, 1, TRUE),
    ('a0000000-0000-0000-0000-000000000004', 'jake@creatoros.app',   'Jake Gamer',    'Full-time variety streamer & YouTuber | 150K+ subs', 'discord', 'pro', 9999, 4, 1, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Sessions (long-lived for demo, expires in 2030)
INSERT INTO sessions (id, user_id, token, expires_at)
SELECT 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'demo-token-alice', '2030-12-31T23:59:59Z'
WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE token = 'demo-token-alice');

INSERT INTO sessions (id, user_id, token, expires_at)
SELECT 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'demo-token-bob', '2030-12-31T23:59:59Z'
WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE token = 'demo-token-bob');

INSERT INTO sessions (id, user_id, token, expires_at)
SELECT 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'demo-token-carol', '2030-12-31T23:59:59Z'
WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE token = 'demo-token-carol');

INSERT INTO sessions (id, user_id, token, expires_at)
SELECT 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'demo-token-jake', '2030-12-31T23:59:59Z'
WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE token = 'demo-token-jake');

-- Connected Platforms
INSERT INTO connected_platforms (id, user_id, platform, platform_username, platform_user_id, channel_name, subscriber_count, total_views, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'youtube', '@AliceCreates', 'UC-alice-1', 'Alice Creates', 520000, 45000000, TRUE),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'tiktok',  '@alicreates',  'tt-alice-1',  'alicecreates',  1200000, 89000000, TRUE),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'twitch',  'bob_streams',  'tw-bob-1',    'bob_streams',   25000, 1200000, TRUE),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'youtube', '@BobStreamsVODs', 'UC-bob-1', 'Bob Streams VODs', 8500, 480000, TRUE),
    ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'youtube', '@CarolEdits', 'UC-carol-1', 'Carol Edits', 12000, 890000, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Content Posts
INSERT INTO content_posts (id, user_id, platform_id, title, content_type, status, views, likes, comments, shares, engagement_rate, tags, published_at)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
     'I Tried Building a PC With NO Instructions', 'video', 'published',
     245000, 18200, 3400, 5600, 11.1, ARRAY['gaming','pc-build','challenge'],
     '2026-06-28T18:00:00Z'),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
     'Reacting to My Old Videos (cringe compilation)', 'video', 'published',
     892000, 65400, 8900, 12300, 9.7, ARRAY['reaction','cringe','funny'],
     '2026-07-01T18:00:00Z'),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
     'POV: You find an abandoned mansion #shorts', 'short', 'published',
     3400000, 285000, 12500, 45000, 10.1, ARRAY['shorts','urban','exploration'],
     '2026-07-03T14:00:00Z'),
    ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003',
     'Variety Stream #42 - Chat chooses the games!', 'stream', 'published',
     8500, 1200, 450, 89, 20.5, ARRAY['variety','chat-interactive','gaming'],
     '2026-07-02T02:00:00Z'),
    ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004',
     'Best Moments From Last Week''s Streams', 'video', 'published',
     3400, 520, 78, 145, 21.9, ARRAY['highlights','variety','vods'],
     '2026-07-04T16:00:00Z'),
    ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005',
     'How to Make Better Thumbnails in 2026', 'video', 'published',
     28000, 3400, 520, 1100, 17.9, ARRAY['tutorial','thumbnail','design'],
     '2026-06-30T15:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Analytics Snapshots (last 7 days for Alice's YouTube)
INSERT INTO analytics_snapshots (user_id, platform_id, post_id, snapshot_date, views, likes, comments, shares, followers, follower_change, watch_time_minutes, estimated_revenue_cents, ai_insight)
SELECT 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NULL,
       CURRENT_DATE - d, 45000 + (d*1200), 3200 + (d*85), 410 + (d*12), 720 + (d*25),
       523000 + (d*80), 80 + d*5, 32000 + (d*900), 4200 + (d*150),
       CASE WHEN d = 1 THEN 'Your "reaction" content is outperforming your gaming content by 40%. Consider more nostalgia-based reaction videos.' ELSE NULL END
FROM generate_series(0, 6) AS d
WHERE NOT EXISTS (SELECT 1 FROM analytics_snapshots WHERE user_id = 'a0000000-0000-0000-0000-000000000001' AND platform_id = 'c0000000-0000-0000-0000-000000000001' AND post_id IS NULL AND snapshot_date = CURRENT_DATE - d);

-- Per-post analytics for the "Reacting to My Old Videos" post
INSERT INTO analytics_snapshots (user_id, platform_id, post_id, snapshot_date, views, likes, comments, shares, engagement_rate)
SELECT 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
       'd0000000-0000-0000-0000-000000000002',
       CURRENT_DATE, 892000, 65400, 8900, 12300, 9.7
WHERE NOT EXISTS (SELECT 1 FROM analytics_snapshots WHERE post_id = 'd0000000-0000-0000-0000-000000000002');

-- Sponsorships
INSERT INTO sponsorships (id, user_id, brand_name, campaign_name, campaign_type, status, contract_value_cents, paid_amount_cents, start_date, end_date, deliverables)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
     'GameChairs Inc.', 'Premium Gaming Chair Review', 'flat_fee', 'active',
     250000, 125000, '2026-06-01', '2026-08-01', 'One dedicated review video + 2 social posts'),
    ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
     'EnergyDrink Co', 'Summer Tournament Sponsorship', 'commission', 'negotiating',
     500000, 0, '2026-08-01', '2026-10-01', 'Logo placement, 3 shoutouts, affiliate link'),
    ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002',
     'MicBrand Pro', 'Streamer Kit Giveaway', 'flat_fee', 'active',
     75000, 75000, '2026-06-15', '2026-07-15', '1 stream with product display + giveaway')
ON CONFLICT (id) DO NOTHING;

-- Revenue Records
INSERT INTO revenue_records (user_id, platform_id, sponsorship_id, source, amount_cents, description, transaction_date, is_verified)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NULL, 'youtube_ads', 87500, 'June YouTube Ad Revenue (week 1)', '2026-06-07', TRUE),
    ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NULL, 'youtube_ads', 92300, 'June YouTube Ad Revenue (week 2)', '2026-06-14', TRUE),
    ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', NULL, 'tiktok_fund', 34000, 'June TikTok Creator Fund', '2026-06-15', TRUE),
    ('a0000000-0000-0000-0000-000000000001', NULL, 'f0000000-0000-0000-0000-000000000001', 'sponsorship', 125000, 'GameChairs Inc. - First payment', '2026-06-10', TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', NULL, 'twitch_subs', 56000, 'June Twitch Subscriptions', '2026-06-30', TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', NULL, 'twitch_bits', 8200, 'June Twitch Bits', '2026-06-30', TRUE),
    ('a0000000-0000-0000-0000-000000000002', NULL, 'f0000000-0000-0000-0000-000000000003', 'sponsorship', 75000, 'MicBrand Pro - Full payment', '2026-06-20', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Brand Kits
INSERT INTO brand_kits (id, user_id, name, primary_color, secondary_color, accent_color, heading_font, body_font, is_default)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Alice Gaming Brand', '#ff6b35', '#e63946', '#457b9d', 'Poppins', 'Inter', TRUE),
    ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Bob Streams', '#6441a5', '#9147ff', '#00d95a', 'Montserrat', 'Open Sans', TRUE),
    ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Carol Edits Pro', '#1a1a2e', '#16213e', '#0f3460', 'Poppins', 'Inter', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Team Members (Alice has 2 editors)
INSERT INTO team_members (id, user_id, member_email, member_name, role, permissions, status, joined_at)
VALUES
    ('g0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
     'editor1@alice.team', 'Dave Editor', 'editor',
     '{"analytics":true,"content":true,"revenue":false,"settings":false}', 'active', now()),
    ('g0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
     'editor2@alice.team', 'Eve Thumbnail', 'viewer',
     '{"analytics":true,"content":true,"revenue":false,"settings":false}', 'pending', NULL)
ON CONFLICT (id) DO NOTHING;

-- To-do Items
INSERT INTO todo_items (id, user_id, title, description, priority, status, due_date)
VALUES
    ('h0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
     'Edit Monday''s gaming video', 'Add intro, cuts, and end screen', 'high', 'in_progress', '2026-07-12'),
    ('h0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
     'Record sponsorship integration for GameChairs', 'Need to film B-roll with the chair', 'urgent', 'todo', '2026-07-10'),
    ('h0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
     'Schedule TikTok posts for next week', 'Use trending sounds from last week', 'medium', 'todo', '2026-07-13'),
    ('h0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002',
     'Set up Twitch panels for new sponsor', 'Add MicBrand Pro panel with affiliate link', 'medium', 'todo', '2026-07-11'),
    ('h0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003',
     'Design thumbnails for Carol''s next 3 videos', 'Gaming + tutorial style', 'high', 'in_progress', '2026-07-10')
ON CONFLICT (id) DO NOTHING;

-- Jake's Connected Platforms
INSERT INTO connected_platforms (id, user_id, platform, platform_username, platform_user_id, channel_name, subscriber_count, total_views, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', 'youtube', '@JakeGamer', 'UC-jake-1', 'Jake Gamer', 156000, 12800000, TRUE),
    ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'twitch',  'jakegamer_live', 'tw-jake-1', 'jakegamer_live', 42000, 3400000, TRUE),
    ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004', 'tiktok',  '@jakegamer', 'tt-jake-1', 'jakegamer', 89000, 5200000, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Jake's Content
INSERT INTO content_posts (id, user_id, platform_id, title, content_type, status, views, likes, comments, shares, engagement_rate, tags, published_at)
VALUES
    ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000006',
     'I Beat Elden Ring Using Only a Dance Pad', 'video', 'published',
     345000, 42100, 5600, 12000, 17.3, ARRAY['gaming','elden-ring','challenge'],
     '2026-07-04T17:00:00Z'),
    ('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000006',
     'Ranking Every Souls Game From Worst to Best', 'video', 'published',
     189000, 28300, 8900, 4500, 22.0, ARRAY['gaming','ranking','soulslike'],
     '2026-07-01T16:00:00Z'),
    ('d0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007',
     'Friday Night Variety Stream + Giveaway!', 'stream', 'published',
     12500, 2100, 680, 150, 23.4, ARRAY['variety','giveaway','gaming'],
     '2026-07-05T01:00:00Z'),
    ('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000008',
     'When the boss music hits different #gaming #shorts', 'short', 'published',
     890000, 125000, 3400, 28000, 17.6, ARRAY['shorts','gaming','funny'],
     '2026-07-03T19:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Jake's Analytics Snapshots (last 7 days, YouTube)
INSERT INTO analytics_snapshots (user_id, platform_id, post_id, snapshot_date, views, likes, comments, shares, followers, follower_change, watch_time_minutes, estimated_revenue_cents)
SELECT 'a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000006', NULL,
       CURRENT_DATE - d, 28000 + (d*900), 3400 + (d*70), 520 + (d*15), 890 + (d*20),
       157000 + (d*90), 90 + (d*5), 18000 + (d*600), 2800 + (d*90)
FROM generate_series(0, 6) AS d
WHERE NOT EXISTS (SELECT 1 FROM analytics_snapshots WHERE user_id = 'a0000000-0000-0000-0000-000000000004' AND platform_id = 'c0000000-0000-0000-0000-000000000006' AND post_id IS NULL AND snapshot_date = CURRENT_DATE - d);

-- Jake's AI Generations
INSERT INTO ai_generations (user_id, generation_type, prompt, result, model_used, tokens_used)
SELECT 'a0000000-0000-0000-0000-000000000004', 'title',
       'Generate 5 video titles for an Elden Ring dance pad challenge video',
       '["I Beat Elden Ring With a Dance Pad (Not Clickbait)","Dance Pad Only: Elden Ring Final Boss","The Hardest Way to Play Elden Ring","Can You Beat Elden Ring Dancing?","Dance Pad Challenge: Elden Ring Edition"]',
       'gpt-4o', 340
WHERE NOT EXISTS (SELECT 1 FROM ai_generations WHERE prompt LIKE '%Elden Ring dance pad%');

INSERT INTO ai_generations (user_id, generation_type, prompt, result, model_used, tokens_used)
SELECT 'a0000000-0000-0000-0000-000000000004', 'hashtags',
       'Generate 10 trending hashtags for a gaming channel variety stream',
       '["#gaming","#varietystreamer","#twitchstreamer","#gamingcommunity","#streamerlife","#newstreamer","#multigaming","#gamenight","#twitchaffiliate","#liveontwitch"]',
       'gpt-4o', 180
WHERE NOT EXISTS (SELECT 1 FROM ai_generations WHERE prompt LIKE '%trending hashtags for a gaming channel%');

-- Jake's Brand Kit
INSERT INTO brand_kits (id, user_id, name, primary_color, secondary_color, accent_color, heading_font, body_font, is_default)
SELECT 'e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Jake Gaming', '#ff4500', '#1a1a2e', '#00d95a', 'Poppins', 'Inter', TRUE
WHERE NOT EXISTS (SELECT 1 FROM brand_kits WHERE id = 'e0000000-0000-0000-0000-000000000004');

-- Jake's Team Members
INSERT INTO team_members (id, user_id, member_email, member_name, role, permissions, status, joined_at)
SELECT 'g0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004',
       'fiona@jake.team', 'Fiona Editor', 'editor',
       '{"analytics":true,"content":true,"revenue":false,"settings":false}', 'active', now()
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE id = 'g0000000-0000-0000-0000-000000000003');

-- Jake's To-do Items
INSERT INTO todo_items (id, user_id, title, description, priority, status, due_date)
SELECT 'h0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004',
       'Edit dance pad challenge video highlights', 'Trim intro and add facecam reactions', 'high', 'in_progress', '2026-07-11'
WHERE NOT EXISTS (SELECT 1 FROM todo_items WHERE id = 'h0000000-0000-0000-0000-000000000006');

INSERT INTO todo_items (id, user_id, title, description, priority, status, due_date)
SELECT 'h0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004',
       'Plan stream schedule for next week', 'Coordinate with Fiona for thumbnail prep', 'medium', 'todo', '2026-07-13'
WHERE NOT EXISTS (SELECT 1 FROM todo_items WHERE id = 'h0000000-0000-0000-0000-000000000007');

INSERT INTO todo_items (id, user_id, title, description, priority, status, due_date)
SELECT 'h0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004',
       'Follow up with GamerChair sponsorship', 'Send media kit and rate card', 'urgent', 'todo', '2026-07-10'
WHERE NOT EXISTS (SELECT 1 FROM todo_items WHERE id = 'h0000000-0000-0000-0000-000000000008');

-- Jake's Sponsorships
INSERT INTO sponsorships (id, user_id, brand_name, campaign_name, campaign_type, status, contract_value_cents, paid_amount_cents, start_date, end_date, deliverables)
SELECT 'f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004',
       'GamerChair Pro', 'July Stream Sponsorship', 'flat_fee', 'negotiating',
       200000, 0, '2026-07-15', '2026-08-15', '1 dedicated stream + logo on stream overlay'
WHERE NOT EXISTS (SELECT 1 FROM sponsorships WHERE id = 'f0000000-0000-0000-0000-000000000004');

-- Jake's Revenue Records
INSERT INTO revenue_records (id, user_id, platform_id, sponsorship_id, source, amount_cents, description, transaction_date, is_verified)
SELECT 'f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004',
       'c0000000-0000-0000-0000-000000000006', NULL, 'youtube_ads', 42000, 'June YouTube Ad Revenue', '2026-06-30', TRUE
WHERE NOT EXISTS (SELECT 1 FROM revenue_records WHERE id = 'f0000000-0000-0000-0000-000000000005');

INSERT INTO revenue_records (id, user_id, platform_id, sponsorship_id, source, amount_cents, description, transaction_date, is_verified)
SELECT 'f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004',
       'c0000000-0000-0000-0000-000000000007', NULL, 'twitch_subs', 28000, 'June Twitch Subscriptions', '2026-06-30', TRUE
WHERE NOT EXISTS (SELECT 1 FROM revenue_records WHERE id = 'f0000000-0000-0000-0000-000000000006');

INSERT INTO revenue_records (id, user_id, platform_id, sponsorship_id, source, amount_cents, description, transaction_date, is_verified)
SELECT 'f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004',
       NULL, NULL, 'donation', 15000, 'Stream donations (June)', '2026-06-30', TRUE
WHERE NOT EXISTS (SELECT 1 FROM revenue_records WHERE id = 'f0000000-0000-0000-0000-000000000007');

-- Jake's Content Schedule
INSERT INTO content_schedules (id, user_id, post_id, platform_id, scheduled_at, status)
SELECT 'i0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004',
       'd0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000006',
       '2026-07-04T17:00:00Z', 'published'
WHERE NOT EXISTS (SELECT 1 FROM content_schedules WHERE id = 'i0000000-0000-0000-0000-000000000004');

-- AI Generations (sample usage)
INSERT INTO ai_generations (user_id, generation_type, prompt, result, model_used, tokens_used)
SELECT 'a0000000-0000-0000-0000-000000000001', 'title',
       'Generate 5 video titles about building a PC with no instructions',
       '["I Built a PC Blindfolded (almost)","Building a PC with ZERO Instructions","The WORST Way to Build a PC","Can You Build a PC Without Looking?","No Instructions PC Build Challenge"]',
       'gpt-4o', 320
WHERE NOT EXISTS (SELECT 1 FROM ai_generations WHERE prompt LIKE '%building a PC with no instructions%');

INSERT INTO ai_generations (user_id, generation_type, prompt, result, model_used, tokens_used)
SELECT 'a0000000-0000-0000-0000-000000000001', 'insight',
       'Analyze why my reaction video got 892K views compared to my average of 200K',
       'Nostalgia-driven reaction content resonates strongly with your audience. Your "Reacting to My Old Videos" video performed 4.5x above your channel average because: (1) the title taps into a trending "old content" format, (2) retention is higher due to personal storytelling, and (3) the cringe factor drives comments and shares. Consider making this a recurring series.',
       'gpt-4o', 450
WHERE NOT EXISTS (SELECT 1 FROM ai_generations WHERE prompt LIKE '%reaction video got 892K%');

COMMIT;