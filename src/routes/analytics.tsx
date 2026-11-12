import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

// ─── Demo Data (Jake Gamer seed profile) ─────────────────────────────────────

const DEMO_METRICS = {
  followersToday: 847,
  followersYesterday: 632,
  followersThisWeek: 5840,
  followersThisMonth: 22300,
  growthRate: 12.4,
  avgWatchTimeMinutes: 8.7,
  clickThroughRate: 14.2,
  returningViewers: 67,
};

const DEMO_POSTING_TIMES = [
  { time: "8 AM", performance: 45 },
  { time: "10 AM", performance: 72 },
  { time: "12 PM", performance: 88 },
  { time: "2 PM", performance: 65 },
  { time: "4 PM", performance: 91 },
  { time: "6 PM", performance: 78 },
  { time: "8 PM", performance: 100 },
  { time: "10 PM", performance: 83 },
  { time: "12 AM", performance: 54 },
];

const DEMO_AUDIENCE_ACTIVITY = [
  { day: "Mon", activity: 65 },
  { day: "Tue", activity: 72 },
  { day: "Wed", activity: 80 },
  { day: "Thu", activity: 88 },
  { day: "Fri", activity: 95 },
  { day: "Sat", activity: 100 },
  { day: "Sun", activity: 78 },
];

const DEMO_VIDEOS = {
  best: [
    { title: "I Beat Elden Ring Using Only a Dance Pad", views: "345K", change: "+28%", platform: "YouTube" },
    { title: "When the boss music hits different #shorts", views: "890K", change: "+42%", platform: "TikTok" },
  ],
  worst: [
    { title: "Ranking Every Souls Game From Worst to Best", views: "189K", change: "-5%", platform: "YouTube" },
  ],
};

const DEMO_AI_INSIGHTS = [
  {
    icon: "🔥",
    title: "Challenge content is your superpower",
    insight: 'Your "Elden Ring Dance Pad" video got 345K views — 3.2x your channel average. Challenge/gimmick content drives the highest engagement and shares.',
    recommendation: "Create more challenge-style gaming content. Consider: blindfolded runs, controller swaps, or viewer-suggested challenges.",
    impact: "High",
  },
  {
    icon: "📈",
    title: "Short-form is driving audience growth",
    insight: 'Your TikTok short "When the boss music hits different" reached 890K views and brought in 2,400 new followers. Short-form content is your strongest growth driver.',
    recommendation: "Post 3-4 short-form clips per week. Repurpose long-form highlights into TikTok/Shorts/Reels.",
    impact: "High",
  },
  {
    icon: "⏰",
    title: "Best posting window identified",
    insight: "Your audience is most active between 4-8 PM EST on weekdays and 10 AM-12 PM on weekends. Videos posted in these windows get 40% more initial views.",
    recommendation: "Schedule your next 3 uploads for Thursday-Saturday at 6 PM EST for maximum impact.",
    impact: "Medium",
  },
  {
    icon: "💬",
    title: "Comment engagement drives algorithm boost",
    insight: "Videos where you reply to comments within the first hour see 2.1x higher ongoing engagement. Your recent videos averaged replies within 4 hours.",
    recommendation: "Set aside 30 min after each upload to engage with comments. Pin a question to spark discussion.",
    impact: "Medium",
  },
];

const PLATFORMS = [
  { name: "YouTube", subs: "156K", growth: "+2.1%", color: "text-red-500" },
  { name: "Twitch", subs: "42K", growth: "+5.3%", color: "text-purple-500" },
  { name: "TikTok", subs: "89K", growth: "+8.7%", color: "text-pink-500" },
];

// ─── Analytics Page Component ────────────────────────────────────────────────

function AnalyticsPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState(DEMO_AI_INSIGHTS);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    // Simulate AI analysis call
    setTimeout(() => {
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Deep dive into your content performance metrics.
          </p>
        </div>
        <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary flex items-center gap-2">
          {analyzing ? (
            <>
              <Spinner />
              Analyzing...
            </>
          ) : (
            <>
              <span>🤖</span>
              Analyze My Channel
            </>
          )}
        </button>
      </div>

      {/* ── Platform Overview ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLATFORMS.map((p) => (
          <div key={p.name} className="stat-card">
            <div className="flex items-center justify-between">
              <p className="stat-label">{p.name}</p>
              <span className={`text-sm font-medium ${p.color}`}>●</span>
            </div>
            <p className="stat-value mt-1">{p.subs}</p>
            <p className={`text-xs font-medium mt-1 ${p.growth.startsWith("+") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {p.growth} this week
            </p>
          </div>
        ))}
      </div>

      {/* ── Metrics Grid ──────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard label="Followers Today" value={`+${DEMO_METRICS.followersToday}`} change="vs +632 yesterday" up />
          <MetricCard label="Followers This Week" value={`+${DEMO_METRICS.followersThisWeek.toLocaleString()}`} change="+12.4% growth rate" up />
          <MetricCard label="Followers This Month" value={`+${DEMO_METRICS.followersThisMonth.toLocaleString()}`} change="On track for 30K" up />
          <MetricCard label="Avg Watch Time" value={`${DEMO_METRICS.avgWatchTimeMinutes}m`} change="Above niche avg" up />
          <MetricCard label="Click-Through Rate" value={`${DEMO_METRICS.clickThroughRate}%`} change="+2.1% improvement" up />
          <MetricCard label="Returning Viewers" value={`${DEMO_METRICS.returningViewers}%`} change="-3% vs last month" up={false} />
        </div>
      </div>

      {/* ── Charts Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Posting Time */}
        <div className="widget-card">
          <h3 className="widget-header">⏰ Best Posting Time</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Relative engagement performance by time of day</p>
          <div className="space-y-2">
            {DEMO_POSTING_TIMES.map((t) => (
              <Bar key={t.time} label={t.time} value={t.performance} />
            ))}
          </div>
        </div>

        {/* Most Active Audience */}
        <div className="widget-card">
          <h3 className="widget-header">👥 Most Active Audience</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Audience engagement by day of week</p>
          <div className="space-y-2">
            {DEMO_AUDIENCE_ACTIVITY.map((d) => (
              <Bar key={d.day} label={d.day} value={d.activity} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Best / Worst Performing Videos ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Performing */}
        <div className="widget-card">
          <h3 className="widget-header">🏆 Best Performing Videos</h3>
          <div className="space-y-3 mt-3">
            {DEMO_VIDEOS.best.map((v) => (
              <VideoRow key={v.title} title={v.title} views={v.views} change={v.change} platform={v.platform} />
            ))}
          </div>
        </div>

        {/* Worst Performing + Most Shared Clip */}
        <div className="space-y-6">
          <div className="widget-card">
            <h3 className="widget-header">📉 Needs Improvement</h3>
            <div className="space-y-3 mt-3">
              {DEMO_VIDEOS.worst.map((v) => (
                <VideoRow key={v.title} title={v.title} views={v.views} change={v.change} platform={v.platform} />
              ))}
            </div>
          </div>
          <div className="widget-card">
            <h3 className="widget-header">📤 Most Shared Clip</h3>
            <div className="flex items-center gap-4 mt-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-2xl">
                🎬
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Dance Pad Fail Moment</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">12.4K shares across all platforms</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Insights Section ───────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">🤖 AI Explains WHY</h2>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 dark:from-indigo-900/40 dark:to-purple-900/40 dark:text-indigo-300">
            Powered by AI
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiInsights.map((insight, i) => (
            <div key={i} className="widget-card relative overflow-hidden">
              {/* Impact badge */}
              <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                insight.impact === "High" 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}>
                {insight.impact} Impact
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{insight.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 pr-16">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    {insight.insight}
                  </p>
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                    <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">💡 Recommendation</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed">
                      {insight.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({ label, value, change, up }: { label: string; value: string; change: string; up?: boolean }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value mt-1">{value}</p>
      <p className={`text-xs font-medium mt-1 ${up !== false ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
        {change}
      </p>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-12 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">{value}%</span>
    </div>
  );
}

function VideoRow({ title, views, change, platform }: { title: string; views: string; change: string; platform: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{platform} · {views} views</p>
      </div>
      <span className={`text-xs font-medium ml-3 shrink-0 ${
        change.startsWith("+") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
      }`}>
        {change}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}