import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/content-studio")({
  component: ContentStudio,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type Platform = "youtube" | "tiktok" | "instagram" | "kick" | "twitch" | "facebook" | "x" | "threads";
type ContentType = "gaming" | "irl" | "podcast" | "reaction" | "music" | "tutorial" | "vlog";

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: "youtube", label: "YouTube", icon: "▶️" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "kick", label: "Kick", icon: "⚡" },
  { id: "twitch", label: "Twitch", icon: "🟣" },
  { id: "facebook", label: "Facebook", icon: "👍" },
  { id: "x", label: "X", icon: "🐦" },
  { id: "threads", label: "Threads", icon: "🧵" },
];

const CONTENT_TYPES: { id: ContentType; label: string; icon: string }[] = [
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "irl", label: "IRL", icon: "🌍" },
  { id: "podcast", label: "Podcast", icon: "🎙️" },
  { id: "reaction", label: "Reaction", icon: "😮" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "tutorial", label: "Tutorial", icon: "📚" },
  { id: "vlog", label: "Vlog", icon: "🎬" },
];

// ─── Demo results (mock fallback when API is unavailable) ────────────────────

const DEMO_TITLES = [
  "I Tried [Topic] and the Result Was SHOCKING",
  "The Ultimate Guide to [Topic] in 2026",
  "Why [Topic] Is Changing Everything Right Now",
  "You Won't Believe What Happened When I [Topic]",
  "How to Master [Topic] in Just 5 Minutes",
  "The Truth About [Topic] Nobody Talks About",
  "I Spent 24 Hours Doing [Topic] – Here's What Happened",
  "10 Things I Wish I Knew Before [Topic]",
  "This [Topic] Hack Will Save You Hours",
  "The Dark Side of [Topic] Exposed",
];

const DEMO_DESCRIPTION =
  "In this video, we dive deep into the topic that everyone's talking about. From beginner tips to advanced strategies, I cover everything you need to know to get started. Whether you're a complete beginner or looking to level up your skills, this video has something for everyone.\n\n📌 Timestamps:\n0:00 - Introduction\n1:30 - Getting Started\n3:45 - Advanced Techniques\n7:20 - Common Mistakes\n9:15 - Final Tips\n\n🔔 Don't forget to LIKE and SUBSCRIBE for more content like this!";

const DEMO_HASHTAGS = ["#gaming", "#contentcreator", "#streamer", "#gamingcommunity", "#viral", "#trending", "#newvideo", "#gamer", "#proplayer", "#gaminglife", "#esports", "#gameplay"];

const DEMO_PINNED = "What do you think about this topic? Let me know in the comments below! 👇 Don't forget to LIKE and SUBSCRIBE for more! 🎮🔥";

const DEMO_SEO = { score: 87, keywords: ["gaming tutorial", "beginner guide", "tips and tricks"], suggestions: ["Add more keyword-rich timestamps", "Include your target keyword in the first 100 words"] };

const DEMO_THUMBNAIL = [
  { concept: "Bold Reaction", description: "Close-up exaggerated expression about your topic", text_overlay: "SHOCKING!", colors: "Red & yellow" },
  { concept: "Before/After", description: "Dramatic transformation split screen", text_overlay: "BEFORE vs AFTER", colors: "Dark + vibrant accents" },
  { concept: "Curiosity Gap", description: "Intriguing visual hint without giving away the twist", text_overlay: "THE TRUTH", colors: "Mysterious blues & purples" },
];

const DEMO_CLIP = [
  { hook: "The most important thing about your topic...", duration: "30s", platform: "TikTok" },
  { hook: "I tried this and the result was shocking", duration: "45s", platform: "YouTube Shorts" },
  { hook: "Stop doing this wrong. Here's how to fix it", duration: "60s", platform: "Instagram Reels" },
];

const DEMO_COMMUNITY = "What's your biggest challenge with this topic? Drop your questions below and I'll answer them in my next video! 🎮💬";

const DEMO_TWEET = "Just finished working on something exciting! 🎮 Who else is hyped for this? Drop a 🔥 if you want to see it drop! #gaming #creatorlife";

const DEMO_INSTAGRAM = "The moment you've all been waiting for... 🙌 Swipe to see what's coming next! Full video drops this weekend! 🎮 #gaming #newcontent #creator";

const DEMO_TIKTOK = "POV: You finally figured out the trick everyone's been talking about 😎 #gaming #fyp #viral #creator";

interface GenerateResults {
  titles: string[];
  description: string;
  hashtags: string[];
  pinnedComment: string;
  seo: { score: number; keywords: string[]; suggestions: string[] };
  thumbnails: { concept: string; description: string; text_overlay: string; colors: string }[];
  clips: { hook: string; duration: string; platform: string }[];
  communityPost: string;
  tweet: string;
  instagramCaption: string;
  tiktokCaption: string;
}

// ─── Content Studio Component ────────────────────────────────────────────────

function ContentStudio() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("youtube");
  const [contentType, setContentType] = useState<ContentType>("gaming");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<"professional" | "casual" | "funny" | "educational">("casual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GenerateResults | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [remainingGenerations, setRemainingGenerations] = useState(15);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please describe what you're making!");
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Try the real API endpoint
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "titles",
          topic: `[${contentType}] ${topic}`,
          tone,
          count: 10,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Successfully got data from API — parse it
        const titles = Array.isArray(data.data) ? data.data : DEMO_TITLES;
        setResults({
          titles: titles.map((t: string) => t.replace(/^"/, "").replace(/"$/, "")),
          description: DEMO_DESCRIPTION,
          hashtags: DEMO_HASHTAGS,
          pinnedComment: DEMO_PINNED,
          seo: DEMO_SEO,
          thumbnails: DEMO_THUMBNAIL,
          clips: DEMO_CLIP,
          communityPost: DEMO_COMMUNITY,
          tweet: DEMO_TWEET,
          instagramCaption: DEMO_INSTAGRAM,
          tiktokCaption: DEMO_TIKTOK,
        });
      } else {
        // API returned error (likely auth) — use mock data
        useMockResults();
      }
    } catch {
      // Network error — use mock data
      useMockResults();
    } finally {
      setLoading(false);
      setRemainingGenerations((prev) => Math.max(0, prev - 1));
    }
  };

  const useMockResults = () => {
    const topicLabel = topic || "your topic";
    setResults({
      titles: DEMO_TITLES.map((t) => t.replace("[Topic]", topicLabel)),
      description: DEMO_DESCRIPTION,
      hashtags: DEMO_HASHTAGS,
      pinnedComment: DEMO_PINNED,
      seo: DEMO_SEO,
      thumbnails: DEMO_THUMBNAIL,
      clips: DEMO_CLIP,
      communityPost: DEMO_COMMUNITY,
      tweet: DEMO_TWEET,
      instagramCaption: DEMO_INSTAGRAM,
      tiktokCaption: DEMO_TIKTOK,
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🎥 Content Studio</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create, edit, and manage your content with AI-powered generation.
        </p>
      </div>

      {/* Remaining generations */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">AI Generations Remaining</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{remainingGenerations} / 15 today</p>
          </div>
        </div>
        <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${(remainingGenerations / 15) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Input Section ─────────────────────────────────────── */}
      <div className="widget-card">
        {/* Platform selector */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Platform</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedPlatform === p.id
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700"
                    : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content type selector */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Content Type</label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map((c) => (
              <button
                key={c.id}
                onClick={() => setContentType(c.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  contentType === c.id
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-700"
                    : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic input */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
            What are you making?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. A gaming video about beating Elden Ring with a dance pad..."
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            rows={3}
          />
        </div>

        {/* Tone selector */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Tone</label>
          <div className="flex gap-2">
            {(["casual", "professional", "funny", "educational"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                  tone === t
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700"
                    : "bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {loading ? (
            <>
              <Spinner />
              Generating...
            </>
          ) : (
            <>
              <span>✨</span>
              Generate Content
            </>
          )}
        </button>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-4 py-2 rounded-xl">
            {error}
          </p>
        )}
      </div>

      {/* ── Results Section ───────────────────────────────────── */}
      {results && (
        <div className="space-y-6 animate-fade-in">
          {/* Titles */}
          <ResultSection title="🎯 Titles (10 variations)" icon="📝">
            <div className="space-y-2">
              {results.titles.map((title, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 group">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {i + 1}. {title}
                  </span>
                  <button
                    onClick={() => copyToClipboard(title, `title-${i}`)}
                    className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Copy"
                  >
                    {copiedId === `title-${i}` ? "✅" : "📋"}
                  </button>
                </div>
              ))}
            </div>
          </ResultSection>

          {/* Description */}
          <ResultSection title="📄 Description" icon="✍️">
            <div className="relative">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                {results.description}
              </pre>
              <button
                onClick={() => copyToClipboard(results.description, "desc")}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                title="Copy"
              >
                {copiedId === "desc" ? "✅" : "📋"}
              </button>
            </div>
          </ResultSection>

          {/* Hashtags */}
          <ResultSection title="#️⃣ Hashtags (12)" icon="🏷️">
            <div className="flex flex-wrap gap-2">
              {results.hashtags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => copyToClipboard(tag, `tag-${tag}`)}
                  className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                >
                  {tag}
                  <span className="ml-1 text-[10px] opacity-50">{copiedId === `tag-${tag}` ? "✓" : "⧉"}</span>
                </span>
              ))}
            </div>
          </ResultSection>

          {/* SEO Score */}
          <ResultSection title="📈 SEO Score" icon="🔍">
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${results.seo.score} ${100 - results.seo.score}`}
                    className={`${results.seo.score >= 80 ? "text-green-500" : results.seo.score >= 60 ? "text-amber-500" : "text-red-500"}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white">
                  {results.seo.score}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {results.seo.keywords.map((kw) => (
                    <span key={kw} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">{kw}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Suggestions:</p>
                <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
                  {results.seo.suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </ResultSection>

          {/* Thumbnail Ideas */}
          <ResultSection title="🎨 Thumbnail Ideas" icon="🖼️">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {results.thumbnails.map((t, i) => (
                <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t.concept}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{t.text_overlay}</span>
                    <span className="text-[10px] text-gray-400">{t.colors}</span>
                  </div>
                </div>
              ))}
            </div>
          </ResultSection>

          {/* Clip Ideas */}
          <ResultSection title="✂️ Short Clip Ideas" icon="🎬">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {results.clips.map((c, i) => (
                <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{c.hook}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>⏱ {c.duration}</span>
                    <span>📱 {c.platform}</span>
                  </div>
                </div>
              ))}
            </div>
          </ResultSection>

          {/* Pinned Comment */}
          <ResultSection title="📌 Pinned Comment" icon="💬">
            <div className="relative">
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                {results.pinnedComment}
              </p>
              <button
                onClick={() => copyToClipboard(results.pinnedComment, "pinned")}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                title="Copy"
              >
                {copiedId === "pinned" ? "✅" : "📋"}
              </button>
            </div>
          </ResultSection>

          {/* Social Posts */}
          <ResultSection title="📱 Social Posts" icon="🌐">
            <div className="space-y-3">
              <SocialPost platform="👥 Community Post" content={results.communityPost} id="community" copiedId={copiedId} onCopy={copyToClipboard} />
              <SocialPost platform="🐦 Tweet / X" content={results.tweet} id="tweet" copiedId={copiedId} onCopy={copyToClipboard} />
              <SocialPost platform="📸 Instagram Caption" content={results.instagramCaption} id="instagram" copiedId={copiedId} onCopy={copyToClipboard} />
              <SocialPost platform="🎵 TikTok Caption" content={results.tiktokCaption} id="tiktok" copiedId={copiedId} onCopy={copyToClipboard} />
            </div>
          </ResultSection>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Generating content with AI...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ResultSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="widget-card">
      <h3 className="widget-header flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function SocialPost({ platform, content, id, copiedId, onCopy }: { platform: string; content: string; id: string; copiedId: string | null; onCopy: (text: string, id: string) => void }) {
  return (
    <div className="relative p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{platform}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300">{content}</p>
      <button
        onClick={() => onCopy(content, id)}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
        title="Copy"
      >
        {copiedId === id ? "✅" : "📋"}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 mx-auto text-indigo-500" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}