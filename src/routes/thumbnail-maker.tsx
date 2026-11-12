import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

export const Route = createFileRoute("/thumbnail-maker")({
  component: ThumbnailMakerPage,
});

// ─── Types & Config ──────────────────────────────────────────────────────────

type EnhanceToggle =
  | "removeBg"
  | "glow"
  | "arrows"
  | "shocked"
  | "lighting"
  | "suggestText"
  | "outline";

type StylePreset = "youtube" | "gaming" | "clean" | "bold";
type TextPosition = "top" | "middle" | "bottom";
type FontChoice = "impact" | "bebas" | "montserrat" | "oswald";

const ENHANCE_OPTIONS: { id: EnhanceToggle; label: string; icon: string; desc: string }[] = [
  { id: "removeBg", label: "Remove Background", icon: "🫥", desc: "Cut out the subject" },
  { id: "glow", label: "Add Glow", icon: "✨", desc: "Neon rim light" },
  { id: "arrows", label: "Add Arrows", icon: "➡️", desc: "Point at key details" },
  { id: "shocked", label: "Shocked Face", icon: "😱", desc: "Exaggerate expression" },
  { id: "lighting", label: "Improve Lighting", icon: "💡", desc: "Boost brightness" },
  { id: "suggestText", label: "Suggest Text", icon: "💬", desc: "AI title ideas" },
  { id: "outline", label: "Add Outline", icon: "🖊️", desc: "Subject stroke" },
];

const STYLE_PRESETS: { id: StylePreset; label: string; icon: string; gradient: string }[] = [
  { id: "youtube", label: "YouTube Style", icon: "▶️", gradient: "from-red-500 to-rose-600" },
  { id: "gaming", label: "Gaming", icon: "🎮", gradient: "from-purple-500 to-indigo-600" },
  { id: "clean", label: "Clean / Minimal", icon: "🪶", gradient: "from-slate-400 to-slate-600" },
  { id: "bold", label: "Bold / Colorful", icon: "🌈", gradient: "from-pink-500 to-amber-500" },
];

const FONTS: { id: FontChoice; label: string; family: string }[] = [
  { id: "impact", label: "Impact", family: "Impact, 'Arial Black', sans-serif" },
  { id: "bebas", label: "Bebas", family: "'Arial Narrow', 'Oswald', sans-serif" },
  { id: "montserrat", label: "Montserrat", family: "'Montserrat', 'Helvetica Neue', sans-serif" },
  { id: "oswald", label: "Oswald", family: "'Oswald', 'Arial', sans-serif" },
];

const POSITIONS: { id: TextPosition; label: string; align: "flex-start" | "flex-end" }[] = [
  { id: "top", label: "Top", align: "flex-start" },
  { id: "middle", label: "Middle", align: "flex-start" },
  { id: "bottom", label: "Bottom", align: "flex-end" },
];

const SUGGESTED_TITLES = [
  "I BEAT THE HARDEST BOSS",
  "THIS CHANGES EVERYTHING",
  "YOU WON'T BELIEVE THIS",
  "$1 vs $1000 SETUP",
];

// ─── Component ───────────────────────────────────────────────────────────────

function ThumbnailMakerPage() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const [toggles, setToggles] = useState<Record<EnhanceToggle, boolean>>({
    removeBg: false,
    glow: false,
    arrows: true,
    shocked: false,
    lighting: true,
    suggestText: false,
    outline: false,
  });
  const [style, setStyle] = useState<StylePreset>("youtube");
  const [title, setTitle] = useState("THIS CHANGES EVERYTHING");
  const [font, setFont] = useState<FontChoice>("impact");
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState<TextPosition>("middle");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [slider, setSlider] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const toggleEnhance = (id: EnhanceToggle) =>
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    setFileName(file.name);
    setGenerated(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);
    setGenerated(false);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setGenerating(false);
          setGenerated(true);
          setSlider(50);
          return 100;
        }
        return prev + 4;
      });
    }, 90);
  };

  // Draw the enhanced thumbnail to canvas and trigger a real PNG download.
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const W = 1280;
      const H = 720;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      // Cover-fit the image
      const scale = Math.max(W / img.width, H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

      // Lighting boost
      if (toggles.lighting) ctx.filter = "brightness(1.15) contrast(1.12) saturate(1.2)";
      else ctx.filter = "none";
      // (re-draw top half with filter — simple full re-draw is fine for demo)
      if (toggles.lighting) {
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      }

      // Outline / glow frame
      if (toggles.outline || toggles.glow) {
        ctx.strokeStyle = toggles.glow ? "#a855f7" : "#000000";
        ctx.lineWidth = toggles.glow ? 18 : 8;
        ctx.shadowColor = toggles.glow ? "#a855f7" : "transparent";
        ctx.shadowBlur = toggles.glow ? 40 : 0;
        ctx.strokeRect(0, 0, W, H);
        ctx.shadowBlur = 0;
      }

      // Arrows
      if (toggles.arrows) {
        ctx.fillStyle = "#ff3b3b";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 6;
        drawArrow(ctx, W * 0.72, H * 0.42, W * 0.72, H * 0.68);
      }

      // Text overlay
      if (title.trim()) {
        ctx.font = `bold ${Math.round(H * 0.13)}px ${FONTS.find((f) => f.id === font)!.family}`;
        ctx.textAlign = "center";
        ctx.lineWidth = 10;
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        const y = position === "top" ? H * 0.2 : position === "bottom" ? H * 0.85 : H * 0.5;
        ctx.strokeText(title, W / 2, y);
        ctx.fillStyle = color;
        ctx.fillText(title, W / 2, y);
      }

      const a = document.createElement("a");
      a.download = "creatoros-thumbnail.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = image;
  };

  const enhancedStyle: React.CSSProperties = {
    filter: toggles.lighting
      ? "brightness(1.15) contrast(1.12) saturate(1.2)"
      : "none",
    boxShadow: toggles.glow
      ? "0 0 0 4px #a855f7, 0 0 40px #a855f7"
      : toggles.outline
        ? "0 0 0 4px #000"
        : undefined,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🎨 Thumbnail Maker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Design eye-catching thumbnails with AI-powered enhancements.
          </p>
        </div>
        {generated && (
          <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
            ⬇️ Download Thumbnail
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Editor controls ─────────────────────────────── */}
        <div className="space-y-6 lg:col-span-1">
          {/* Upload */}
          <div className="widget-card">
            <h3 className="widget-header">🖼️ Source Image</h3>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                dragging
                  ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-gray-50 dark:bg-gray-800/30"
              }`}
            >
              {image ? (
                <div className="text-center">
                  <img src={image} alt="Uploaded" className="w-full h-28 object-cover rounded-xl mb-2" />
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[16rem]">{fileName}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Click to replace</p>
                </div>
              ) : (
                <>
                  <div className="text-3xl mb-2">📤</div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Drop image here</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">or click to browse (PNG, JPG)</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>

          {/* Style presets */}
          <div className="widget-card">
            <h3 className="widget-header">🎭 AI Style Preset</h3>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    style === s.id
                      ? `bg-gradient-to-br ${s.gradient} text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-purple-400`
                      : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  <p className="text-xs font-medium mt-1">{s.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Enhance toggles */}
          <div className="widget-card">
            <h3 className="widget-header">✨ Auto-Enhance</h3>
            <div className="space-y-2">
              {ENHANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleEnhance(opt.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                    toggles[opt.id]
                      ? "bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-200 dark:ring-indigo-700"
                      : "bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-left">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">{opt.label}</span>
                      <span className="block text-[11px] text-gray-400">{opt.desc}</span>
                    </span>
                  </span>
                  <span
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                      toggles[opt.id] ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                        toggles[opt.id] ? "left-[18px]" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Text overlay editor */}
          <div className="widget-card">
            <h3 className="widget-header">✍️ Text Overlay</h3>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add title text..."
                className="w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {toggles.suggestText && (
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_TITLES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTitle(t)}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Font</span>
                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value as FontChoice)}
                    className="mt-1 w-full px-2 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {FONTS.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Color</span>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 w-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{color}</span>
                  </div>
                </label>
              </div>
              <div>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Position</span>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {POSITIONS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPosition(p.id)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        position === p.id
                          ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300"
                          : "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={generating || !image}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <><Spinner /> Generating...</>
            ) : (
              <><span>🎨</span> {generated ? "Regenerate Thumbnail" : "Generate Thumbnail"}</>
            )}
          </button>
        </div>

        {/* ── Right: Preview ────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          <div className="widget-card">
            <h3 className="widget-header">👁️ Preview</h3>
            {!image ? (
              <div className="flex items-center justify-center py-24 text-center">
                <div>
                  <div className="text-5xl mb-3">🖼️</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Upload an image to start designing</p>
                </div>
              </div>
            ) : (
              <>
                {generating ? (
                  <div className="py-16">
                    <div className="flex items-center justify-between mb-3 max-w-md mx-auto">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI enhancing...</span>
                      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{progress}%</span>
                    </div>
                    <div className="max-w-md mx-auto w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-3 text-center">
                      {progress < 40 ? "Analyzing composition..." : progress < 80 ? "Applying enhancements..." : "Rendering final thumbnail..."}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Before/After slider */}
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden select-none">
                      {/* After (enhanced) layer */}
                      <div className="absolute inset-0">
                        <img src={image} alt="After" className="w-full h-full object-cover" style={enhancedStyle} />
                        {toggles.arrows && <ArrowsOverlay />}
                        {title.trim() && (
                          <div
                            className={`absolute inset-x-0 px-6 flex ${POSITIONS.find((p) => p.id === position)!.align} ${position === "middle" ? "justify-center" : "justify-center"}`}
                            style={{
                              top: position === "top" ? "10%" : undefined,
                              bottom: position === "bottom" ? "10%" : undefined,
                            }}
                          >
                            <span
                              className="text-center leading-none"
                              style={{
                                fontFamily: FONTS.find((f) => f.id === font)!.family,
                                color,
                                fontSize: "clamp(1.5rem, 7vw, 5rem)",
                                fontWeight: 900,
                                WebkitTextStroke: "3px rgba(0,0,0,0.85)",
                                textShadow: "0 4px 14px rgba(0,0,0,0.6)",
                              }}
                            >
                              {title}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Before (original) layer, clipped */}
                      <div
                        className="absolute inset-0"
                        style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
                      >
                        <img src={image} alt="Before" className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">
                          BEFORE
                        </span>
                      </div>
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-semibold">
                        AFTER
                      </span>
                      {/* Divider handle */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)]"
                        style={{ left: `${slider}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 text-sm">
                          ⇄
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={slider}
                        onChange={(e) => setSlider(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                        aria-label="Before/after slider"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">Drag the handle to compare before &amp; after</p>
                  </>
                )}
              </>
            )}
          </div>

          {/* Hidden canvas for download */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Tips */}
          <div className="widget-card">
            <h3 className="widget-header">💡 Thumbnail Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-2"><span>✅</span> Use 3-5 bold words max in your text overlay</li>
              <li className="flex gap-2"><span>✅</span> High contrast faces + bright colors boost CTR 47%</li>
              <li className="flex gap-2"><span>✅</span> Keep a consistent style across your channel</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ArrowsOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute" style={{ left: "70%", top: "40%" }}>
        <span className="text-5xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">⬇️</span>
      </div>
    </div>
  );
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const headLen = 28;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
