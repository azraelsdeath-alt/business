import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

export const Route = createFileRoute("/brand-kit")({
  component: BrandKitPage,
});

// ─── Types & Config ──────────────────────────────────────────────────────────

const HEADING_FONTS = [
  { id: "montserrat", label: "Montserrat", family: "'Montserrat', 'Helvetica Neue', sans-serif" },
  { id: "poppins", label: "Poppins", family: "'Poppins', 'Helvetica Neue', sans-serif" },
  { id: "bebas", label: "Bebas Neue", family: "'Bebas Neue', 'Arial Narrow', sans-serif" },
  { id: "oswald", label: "Oswald", family: "'Oswald', 'Arial', sans-serif" },
];

const BODY_FONTS = [
  { id: "inter", label: "Inter", family: "'Inter', 'Helvetica Neue', sans-serif" },
  { id: "lato", label: "Lato", family: "'Lato', 'Arial', sans-serif" },
  { id: "source", label: "Source Sans", family: "'Source Sans Pro', 'Arial', sans-serif" },
  { id: "roboto", label: "Roboto", family: "'Roboto', 'Arial', sans-serif" },
];

const EXPORT_ITEMS = [
  { id: "media", label: "Media Kit", icon: "📁", desc: "One-page creator overview" },
  { id: "banner", label: "Profile Banner", icon: "🖼️", desc: "Twitter / YouTube header" },
  { id: "panels", label: "Stream Panels", icon: "🖥️", desc: "Twitch panel set" },
  { id: "card", label: "Business Card", icon: "💳", desc: "Printable contact card" },
  { id: "sponsor", label: "Sponsor PDF", icon: "🤝", desc: "Brand partnership deck" },
  { id: "email", label: "Email Signature", icon: "✉️", desc: "Branded sign-off" },
];

// ─── Component ───────────────────────────────────────────────────────────────

function BrandKitPage() {
  const [logo, setLogo] = useState<string | null>(null);
  const [logoName, setLogoName] = useState("");
  const [primary, setPrimary] = useState("#6366f1");
  const [secondary, setSecondary] = useState("#a855f7");
  const [accent, setAccent] = useState("#f59e0b");
  const [headingFont, setHeadingFont] = useState("montserrat");
  const [bodyFont, setBodyFont] = useState("inter");
  const [brandName, setBrandName] = useState("Jake Streams");
  const [tagline, setTagline] = useState("Gaming · FPS · Entertainment");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const headingFamily = HEADING_FONTS.find((f) => f.id === headingFont)!.family;
  const bodyFamily = BODY_FONTS.find((f) => f.id === bodyFont)!.family;

  const handleLogo = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setLogo(URL.createObjectURL(file));
    setLogoName(file.name);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1800);
  };

  const autoGenerate = () => {
    setPrimary("#7c3aed");
    setSecondary("#ec4899");
    setAccent("#f97316");
    setHeadingFont("bebas");
    setBodyFont("inter");
    setBrandName("Jake Streams");
    setTagline("High-energy gaming content");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📁 Brand Kit</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your brand identity — logo, colors, and fonts — and export everywhere.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={autoGenerate} className="btn-secondary">
            ✨ Auto-generate
          </button>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary flex items-center gap-2">
            {generating ? <><Spinner /> Generating...</> : <><span>🎨</span> {generated ? "Regenerate Brand Kit" : "Generate Brand Kit"}</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Editor ───────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="widget-card">
            <h3 className="widget-header">🖼️ Logo</h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer bg-gray-50 dark:bg-gray-800/30 transition-all"
            >
              <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl text-gray-400">🏷️</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {logoName || "Upload your logo"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">PNG, JPG, or SVG — click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="widget-card">
            <h3 className="widget-header">🎨 Color Palette</h3>
            <div className="space-y-3">
              {[
                { label: "Primary", value: primary, set: setPrimary },
                { label: "Secondary", value: secondary, set: setSecondary },
                { label: "Accent", value: accent, set: setAccent },
              ].map((c) => (
                <div key={c.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={c.value}
                      onChange={(e) => c.set(e.target.value)}
                      className="h-10 w-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{c.label}</span>
                  </div>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{c.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fonts */}
          <div className="widget-card">
            <h3 className="widget-header">🔤 Fonts</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Heading Font</span>
                <select
                  value={headingFont}
                  onChange={(e) => setHeadingFont(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {HEADING_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Body Font</span>
                <select
                  value={bodyFont}
                  onChange={(e) => setBodyFont(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {BODY_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Brand details */}
          <div className="widget-card">
            <h3 className="widget-header">📝 Brand Details</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Brand Name</span>
                <input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Tagline</span>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* ── Right: Preview + Export ───────────────────────────── */}
        <div className="space-y-6">
          {/* Live preview */}
          <div className="widget-card">
            <h3 className="widget-header">👁️ Live Preview</h3>
            <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
              {/* Banner */}
              <div
                className="p-6 text-white"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden text-lg font-bold">
                    {logo ? <img src={logo} alt="" className="w-full h-full object-contain" /> : brandName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xl font-black" style={{ fontFamily: headingFamily }}>{brandName}</p>
                    <p className="text-xs opacity-90" style={{ fontFamily: bodyFamily }}>{tagline}</p>
                  </div>
                </div>
              </div>
              {/* Body sample */}
              <div className="p-6 bg-white dark:bg-gray-900">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white" style={{ fontFamily: headingFamily }}>
                  Sample Heading
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" style={{ fontFamily: bodyFamily }}>
                  The quick brown fox jumps over the lazy dog. This is how your body copy will look across the brand kit.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: primary }}>Primary Button</span>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: accent }}>Accent</span>
                </div>
                {/* Palette swatches */}
                <div className="mt-4 flex gap-2">
                  {[primary, secondary, accent].map((c) => (
                    <div key={c} className="flex-1">
                      <div className="h-8 rounded-lg" style={{ background: c }} />
                      <p className="text-[10px] font-mono text-gray-400 mt-1 text-center">{c}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="widget-card">
            <h3 className="widget-header">📦 Export</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EXPORT_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-all group"
                >
                  <span className="text-xl block mb-1">{item.icon}</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white block">{item.label}</span>
                  <span className="text-[10px] text-gray-400 block">{item.desc}</span>
                </button>
              ))}
            </div>
            {generated && (
              <div className="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs flex items-center gap-2">
                <span>✅</span> Brand kit generated — all 6 export assets are ready.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
