import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/sponsorships")({
  component: SponsorshipsPage,
});

// ─── Types & Demo Data ───────────────────────────────────────────────────────

type CampaignStatus = "applied" | "available";
type SponsorshipStatus = "active" | "pending" | "completed";

interface Campaign {
  id: string;
  brand: string;
  icon: string;
  category: string;
  payout: string;
  duration: string;
  requirements: string[];
  match: number;
  color: string;
}

const CAMPAIGNS: Campaign[] = [
  {
    id: "gfuel",
    brand: "GFuel Energy",
    icon: "⚡",
    category: "Gaming Energy Drink",
    payout: "$800 - $1,500",
    duration: "30 days",
    requirements: ["FPS Streamers", "50+ CCV", "US Audience"],
    match: 94,
    color: "from-sky-500 to-blue-600",
  },
  {
    id: "steelseries",
    brand: "SteelSeries",
    icon: "🎧",
    category: "Gaming Peripherals",
    payout: "$1,200 - $2,500",
    duration: "Quarterly",
    requirements: ["FPS Streamers", "100+ CCV", "25-35 age"],
    match: 88,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "nordvpn",
    brand: "NordVPN",
    icon: "🛡️",
    category: "Privacy & Security",
    payout: "$500 - $1,000",
    duration: "Monthly",
    requirements: ["Any Category", "30+ CCV", "Global"],
    match: 82,
    color: "from-cyan-500 to-teal-500",
  },
  {
    id: "elgato",
    brand: "Elgato",
    icon: "🎥",
    category: "Streaming Gear",
    payout: "$1,000 - $2,000",
    duration: "Quarterly",
    requirements: ["Gaming", "75+ CCV", "US/EU Audience"],
    match: 79,
    color: "from-purple-500 to-indigo-600",
  },
  {
    id: "shadow",
    brand: "Shadow PC",
    icon: "☁️",
    category: "Cloud Gaming",
    payout: "$600 - $1,200",
    duration: "60 days",
    requirements: ["Gaming", "40+ CCV", "25-35 age"],
    match: 74,
    color: "from-slate-500 to-slate-700",
  },
  {
    id: "honey",
    brand: "Honey",
    icon: "🍯",
    category: "Shopping Extension",
    payout: "$400 - $900",
    duration: "Monthly",
    requirements: ["Lifestyle", "20+ CCV", "US Audience"],
    match: 65,
    color: "from-amber-400 to-yellow-600",
  },
];

const CREATOR_STATS = [
  { label: "Followers", value: "128K", icon: "👥" },
  { label: "Avg Viewers", value: "92", icon: "👁️" },
  { label: "Avg Views", value: "4.2K", icon: "▶️" },
  { label: "Engagement", value: "7.8%", icon: "💬" },
];

const CREATOR_META = [
  { label: "Games", value: "Valorant, CoD, Apex" },
  { label: "Audience", value: "72% US, 11% UK, 9% CA" },
  { label: "Age Range", value: "25-35 (64%)" },
  { label: "Schedule", value: "Mon-Sat, 6-10 PM EST" },
];

const FILTERS = ["FPS Streamers", "50 CCV", "US Audience", "25-35 Age"];

const SPONSORSHIPS: Record<SponsorshipStatus, { brand: string; icon: string; deal: string; payout: string; status: string }[]> = {
  active: [
    { brand: "SteelSeries", icon: "🎧", deal: "Arctis Nova Pro sponsorship", payout: "$2,000/quarter", status: "Live" },
    { brand: "NordVPN", icon: "🛡️", deal: "2-year promo code", payout: "$850/month", status: "Live" },
  ],
  pending: [
    { brand: "GFuel Energy", icon: "⚡", deal: "Energy tub campaign", payout: "$1,200/30 days", status: "Reviewing" },
    { brand: "Elgato", icon: "🎥", deal: "Stream Deck unboxing", payout: "$1,500/quarter", status: "Awaiting reply" },
  ],
  completed: [
    { brand: "Shadow PC", icon: "☁️", deal: "Cloud gaming showcase", payout: "$900/60 days", status: "Paid" },
    { brand: "Honey", icon: "🍯", deal: "Browser extension promo", payout: "$600/month", status: "Paid" },
  ],
};

const STATUS_TABS: { id: SponsorshipStatus; label: string; count: number }[] = [
  { id: "active", label: "Active", count: SPONSORSHIPS.active.length },
  { id: "pending", label: "Pending", count: SPONSORSHIPS.pending.length },
  { id: "completed", label: "Completed", count: SPONSORSHIPS.completed.length },
];

// ─── Component ───────────────────────────────────────────────────────────────

function SponsorshipsPage() {
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [statusTab, setStatusTab] = useState<SponsorshipStatus>("active");
  const [search, setSearch] = useState("");

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const applyTo = (id: string) => setApplied((prev) => ({ ...prev, [id]: true }));

  const filteredCampaigns = CAMPAIGNS.filter((c) => {
    const matchesSearch = c.brand.toLowerCase().includes(search.toLowerCase());
    const matchesFilters =
      activeFilters.length === 0 || activeFilters.every((f) => c.requirements.some((r) => r.toLowerCase().includes(f.toLowerCase())));
    return matchesSearch && matchesFilters;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🤝 Sponsorships</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Discover brand deals, manage campaigns, and track your sponsorships.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main: Campaign listings ───────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search + filters */}
          <div className="widget-card">
            <div className="flex flex-col gap-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search brands or categories..."
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeFilters.includes(f)
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {activeFilters.includes(f) ? "✓ " : ""}{f}
                  </button>
                ))}
                {activeFilters.length > 0 && (
                  <button onClick={() => setActiveFilters([])} className="text-xs text-red-500 hover:underline px-2">
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Campaign cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCampaigns.map((c) => (
              <div key={c.id} className="widget-card flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-2xl shrink-0`}>
                      {c.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{c.brand}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{c.category}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    {c.match}% match
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">{c.payout}</span>
                  <span className="text-xs text-gray-400">· {c.duration}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.requirements.map((r) => (
                    <span key={r} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {r}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  {applied[c.id] ? (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">✓ Application submitted</span>
                  ) : (
                    <span className="text-xs text-gray-400">Apply with your media kit</span>
                  )}
                  <button
                    onClick={() => applyTo(c.id)}
                    disabled={applied[c.id]}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      applied[c.id]
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "btn-primary !py-1.5 !px-4"
                    }`}
                  >
                    {applied[c.id] ? "Applied" : "Apply"}
                  </button>
                </div>
              </div>
            ))}
            {filteredCampaigns.length === 0 && (
              <div className="col-span-full widget-card text-center py-12 text-gray-500 dark:text-gray-400">
                No campaigns match your filters.
              </div>
            )}
          </div>

          {/* Sponsorship tracking */}
          <div className="widget-card">
            <h3 className="widget-header">📋 My Sponsorships</h3>
            <div className="flex gap-2 mb-4">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusTab === tab.id
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <div className="space-y-2.5">
              {SPONSORSHIPS[statusTab].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{s.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.brand}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.deal}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.payout}</p>
                    <p className={`text-[10px] font-medium ${
                      s.status === "Live" || s.status === "Paid"
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}>{s.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sidebar: Creator profile + Media kit ──────────────── */}
        <div className="space-y-6">
          {/* Creator profile */}
          <div className="widget-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                J
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Jake Streams</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">FPS &amp; Gaming Creator</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CREATOR_STATS.map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="text-lg">{s.icon}</div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {CREATOR_META.map((m) => (
                <div key={m.label} className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{m.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Media kit */}
          <div className="widget-card">
            <h3 className="widget-header">📁 Media Kit</h3>
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                J
              </div>
              <p className="font-bold mt-2">Jake Streams</p>
              <p className="text-xs text-white/80">Gaming · 128K Followers · 7.8% Eng.</p>
              <div className="mt-3 grid grid-cols-3 gap-1 text-center text-xs">
                <div className="bg-white/15 rounded-lg py-1.5"><p className="font-bold">92</p><p className="text-[9px] opacity-80">Avg CCV</p></div>
                <div className="bg-white/15 rounded-lg py-1.5"><p className="font-bold">4.2K</p><p className="text-[9px] opacity-80">Avg Views</p></div>
                <div className="bg-white/15 rounded-lg py-1.5"><p className="font-bold">64%</p><p className="text-[9px] opacity-80">25-35</p></div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <button className="btn-secondary w-full">👁️ View Full Media Kit</button>
              <button className="btn-secondary w-full">⬇️ Download PDF</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
