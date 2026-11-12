import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/growth")({
  component: GrowthPage,
});

// ─── Demo Data ───────────────────────────────────────────────────────────────

const ANALYSIS_RESULT = {
  audienceLikes: "Your audience responds best to challenge/gimmick gaming content. Videos with 'dance pad,' 'blindfolded,' or 'only using' in the title average 3.2x your normal view count.",
  thumbnailFeedback: "Thumbnails with exaggerated facial expressions and bold text overlays get 47% higher CTR. Your current thumbnails focus too much on game screenshots.",
  watchTimeInsights: "Average watch time is 8.7 minutes, but drops sharply after the 12-minute mark. Your best-performing videos are 8-12 minutes long.",
  bestPostingTimes: "Your audience is most active: Thu-Sat 6-8 PM EST (primetime). Tuesday 10 AM (surprising secondary peak). Sunday mornings underperform by 34%.",
  keywordSuggestions: "Try targeting: 'elden ring challenge,' 'gaming fails,' 'dance pad gamer,' 'soulslike boss fight,' 'controller challenge.'",
  challengeIdeas: "1. Beat a game using only one hand. 2. Complete a speedrun while narrating life tips. 3. Swap controllers with a viewer mid-game.",
};

const TRENDS = {
  games: [
    { name: "Elden Ring: Nightreign", relevance: 94, direction: "up" },
    { name: "GTA 6 Leaks", relevance: 88, direction: "up" },
    { name: "Minecraft 2.0", relevance: 82, direction: "stable" },
    { name: "Valorant Episode 10", relevance: 76, direction: "up" },
    { name: "Fortnite OG Season", relevance: 71, direction: "down" },
  ],
  music: [
    { name: "Lofi Gaming Beats Vol. 3", relevance: 91, direction: "up" },
    { name: "Epic Orchestral Covers", relevance: 78, direction: "up" },
    { name: "Chill Synthwave", relevance: 73, direction: "stable" },
    { name: "Phonk Music 2026", relevance: 69, direction: "down" },
  ],
  sounds: [
    { name: "Among Us Drip (Remix)", relevance: 85, direction: "up" },
    { name: "Metal Pipe Falling", relevance: 82, direction: "up" },
    { name: "Discord Notification ASMR", relevance: 67, direction: "stable" },
  ],
  memes: [
    { name: "NPC Streaming Template", relevance: 92, direction: "up" },
    { name: "Gamer Rage Compilation", relevance: 87, direction: "up" },
    { name: "POV: You Just Died", relevance: 79, direction: "stable" },
  ],
  hashtags: [
    { name: "#GamingChallenges", relevance: 95, direction: "up" },
    { name: "#StreamerProblems", relevance: 83, direction: "up" },
    { name: "#ControllerSmash", relevance: 74, direction: "stable" },
    { name: "#ProGamerTips", relevance: 68, direction: "down" },
  ],
  topics: [
    { name: "Soulslike Challenge Runs", relevance: 96, direction: "up" },
    { name: "Speedrun World Records", relevance: 84, direction: "up" },
    { name: "Gaming Setup Tours", relevance: 77, direction: "stable" },
  ],
  keywords: [
    { name: "dance pad challenge", relevance: 93, direction: "up" },
    { name: "boss fight no hit", relevance: 86, direction: "up" },
    { name: "controller mod", relevance: 72, direction: "stable" },
  ],
  challenges: [
    { name: "Beat Elden Ring Blindfolded", relevance: 97, direction: "up" },
    { name: "100 Days of Streaming", relevance: 81, direction: "up" },
    { name: "Only One Hand Challenge", relevance: 78, direction: "up" },
  ],
};

const RECOMMENDATIONS = [
  {
    icon: "🎯",
    title: "Double down on challenge content",
    desc: "Your challenge/gimmick videos outperformed standard content by 3.2x. Create a weekly challenge series to capitalize on this momentum.",
    impact: "High",
  },
  {
    icon: "📱",
    title: "Post short-form clips daily",
    desc: "Short-form content is driving 68% of new subscriber growth. Repurpose each long-form video into 3-4 short clips for TikTok/Shorts/Reels.",
    impact: "High",
  },
  {
    icon: "🤝",
    title: "Collaborate with similar creators",
    desc: "Creators in the 'gaming challenge' niche are growing 2x faster. Collab with 2-3 creators in this space over the next month.",
    impact: "Medium",
  },
];

function GrowthPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [activeTrend, setActiveTrend] = useState("games");

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📈 Growth</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your channel growth with AI-powered insights and trend discovery.
          </p>
        </div>
        <button onClick={handleAnalyze} disabled={analyzing} className={`btn-primary flex items-center gap-2 ${analyzed ? "opacity-60" : ""}`}>
          {analyzing ? (
            <><Spinner /> Analyzing...</>
          ) : analyzed ? (
            <><span>✅</span> Re-analyze</>
          ) : (
            <><span>🤖</span> Analyze My Channel</>
          )}
        </button>
      </div>

      {/* ── Analysis Results ──────────────────────────────────── */}
      {analyzing && (
        <div className="widget-card flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-3xl animate-pulse">
              🤖
            </div>
            <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">Analyzing your channel...</p>
            <p className="text-xs text-gray-400 mt-1">Scanning content, engagement, and growth patterns</p>
          </div>
        </div>
      )}

      {analyzed && !analyzing && (
        <>
          {/* Analysis Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnalysisCard icon="❤️" title="Audience Likes" text={ANALYSIS_RESULT.audienceLikes} />
            <AnalysisCard icon="🖼️" title="Thumbnail Feedback" text={ANALYSIS_RESULT.thumbnailFeedback} />
            <AnalysisCard icon="⏱️" title="Watch Time Insights" text={ANALYSIS_RESULT.watchTimeInsights} />
            <AnalysisCard icon="⏰" title="Best Posting Times" text={ANALYSIS_RESULT.bestPostingTimes} />
            <AnalysisCard icon="🔑" title="Keyword Suggestions" text={ANALYSIS_RESULT.keywordSuggestions} />
            <AnalysisCard icon="🏆" title="Challenge Ideas" text={ANALYSIS_RESULT.challengeIdeas} />
          </div>

          {/* ── Trend Finder ──────────────────────────────────── */}
          <div className="widget-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="widget-header">📊 Trend Finder</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Updates every hour
                </p>
              </div>
            </div>

            {/* Trend category tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(TRENDS).map(([key, _]) => (
                <button
                  key={key}
                  onClick={() => setActiveTrend(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                    activeTrend === key
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 ring-1 ring-indigo-300"
                      : "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {key === "keywords" ? "Keywords" : key}
                </button>
              ))}
            </div>

            {/* Trend items */}
            <div className="space-y-3">
              {TRENDS[activeTrend as keyof typeof TRENDS].map((trend) => (
                <div key={trend.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 group hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`text-sm ${trend.direction === "up" ? "text-green-500" : trend.direction === "down" ? "text-red-500" : "text-gray-400"}`}>
                      {trend.direction === "up" ? "📈" : trend.direction === "down" ? "📉" : "➡️"}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{trend.name}</span>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${trend.relevance}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[2.5rem] text-right">{trend.relevance}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Recommendations ──────────────────────────────── */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">💡 AI-Powered Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {RECOMMENDATIONS.map((rec) => (
                <div key={rec.title} className="widget-card relative">
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {rec.impact} Impact
                  </span>
                  <div className="text-2xl mb-3">{rec.icon}</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 pr-16">{rec.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{rec.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!analyzed && !analyzing && (
        <div className="widget-card flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready to grow your channel?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Click "Analyze My Channel" to get AI-powered insights about your content, discover trending topics, and receive personalized growth recommendations.
            </p>
            <button onClick={handleAnalyze} className="btn-primary">
              🤖 Analyze My Channel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="widget-card">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h4>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{text}</p>
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